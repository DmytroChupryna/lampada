/**
 * Collaps Balancer — via api.delivembd.ws
 * No API key needed, works internationally (no geo-block)
 * Returns HTML embed page with makePlayer({...}) containing HLS/DASH streams
 * Supports movies and series with multiple audio tracks and subtitles
 */
import { BaseBalancer } from './base.js';
import { t } from '../lang.js';

var DEFAULT_HOST = 'https://api.delivembd.ws';

// Keywords to identify Ukrainian audio tracks
var UA_KEYWORDS = [
    'укр', 'ukr', 'українськ',
    'так треба', 'нло-тв', 'нло тв',
    '1+1', 'новий канал', 'ictv', 'стб',
    'інтер', 'uateam', 'ua team',
    'тоніс', 'мегого', 'sweet.tv'
];

/**
 * Check if an audio track name is Ukrainian
 */
function isUkrainianTrack(name) {
    if (!name) return false;
    var lower = name.toLowerCase();
    for (var i = 0; i < UA_KEYWORDS.length; i++) {
        if (lower.indexOf(UA_KEYWORDS[i]) !== -1) return true;
    }
    return false;
}

/**
 * Format audio info string: Ukrainian tracks first, marked with [UKR]
 */
function formatVoicesInfo(voices, maxShow) {
    if (!voices || !voices.length) return 'Collaps';
    maxShow = maxShow || 4;

    var ukr = [];
    var other = [];

    for (var i = 0; i < voices.length; i++) {
        var name = voices[i];
        if (!name || name === 'delete') continue;
        if (isUkrainianTrack(name)) {
            ukr.push(name);
        } else {
            other.push(name);
        }
    }

    var parts = [];

    // Ukrainian tracks first, marked
    for (var j = 0; j < ukr.length && parts.length < maxShow; j++) {
        parts.push('\uD83C\uDDFA\uD83C\uDDE6 ' + ukr[j]);
    }

    // Then other tracks
    for (var k = 0; k < other.length && parts.length < maxShow; k++) {
        parts.push(other[k]);
    }

    var total = ukr.length + other.length;
    if (total > maxShow) {
        parts.push('+' + (total - maxShow));
    }

    return parts.join(', ');
}

function getHost() {
    var h = Lampa.Storage.get('collaps_host', '');
    return h || DEFAULT_HOST;
}

// --------------- Constructor ---------------

export function CollapsBalancer(component, object) {
    BaseBalancer.call(this, component, object);

    this.data         = null;   // parsed result
    this.choice       = { season: 0, voice: 0 };
    this.filter_items = {};
    this.items_list   = [];
    this.voices       = [];     // audio track names
}

CollapsBalancer.prototype = Object.create(BaseBalancer.prototype);
CollapsBalancer.prototype.constructor = CollapsBalancer;

// --------------- Search ---------------

CollapsBalancer.prototype.search = function (_object, kpId) {
    var self = this;
    this.object = _object;
    this.select_title = _object.search || (_object.movie && (_object.movie.title || _object.movie.name)) || '';

    if (!kpId) {
        this.component.emptyForQuery(this.select_title);
        return;
    }

    this.component.loading(true);

    var url = getHost() + '/embed/kp/' + kpId;

    this.network.clear();
    this.network.timeout(15000);
    this.network.silent(
        url,
        function (response) {
            self.component.loading(false);
            var str = typeof response === 'string' ? response : '';
            if (!str) {
                self.component.emptyForQuery(self.select_title);
                return;
            }
            self._processHTML(str);
        },
        function () {
            self.component.loading(false);
            self.component.emptyForQuery(self.select_title);
        },
        false,
        { dataType: 'text' }
    );
};

// --------------- Parse HTML ---------------

CollapsBalancer.prototype._processHTML = function (html) {
    var config = this._extractConfig(html);
    if (!config) {
        this.component.emptyForQuery(this.select_title);
        return;
    }

    // Determine movie vs series
    if (config.playlist && config.playlist.seasons) {
        this._processSeries(config);
    } else if (config.source) {
        this._processMovie(config);
    } else {
        this.component.emptyForQuery(this.select_title);
    }
};

/**
 * Extract makePlayer({...}) config from Collaps HTML
 */
CollapsBalancer.prototype._extractConfig = function (html) {
    try {
        var str = html.replace(/\r?\n/g, ' ');

        // Find makePlayer({...}) block
        var match = str.match(/makePlayer\s*\(\s*(\{[\s\S]*?\})\s*\)\s*;/);
        if (!match) return null;

        // The config contains JS (functions, etc.), so we can't JSON.parse it
        // Instead, extract specific fields with regex

        var configStr = match[1];
        var result = { source: null, playlist: null };

        // Check if blocked
        if (/blocked\s*:\s*true/.test(configStr)) return null;

        // Extract source (movie)
        var hlsMatch = configStr.match(/hls\s*:\s*"([^"]+)"/);
        var dashMatch = configStr.match(/dash\s*:\s*"([^"]+)"/);
        var audioMatch = configStr.match(/audio\s*:\s*(\{[^}]*"names"\s*:\s*\[[^\]]*\][^}]*\})/);
        var titleMatch = configStr.match(/title\s*:\s*"([^"]+)"/);

        // Extract playlist (series)
        var seasonsMatch = configStr.match(/seasons\s*:\s*(\[[\s\S]*?\])\s*,?\s*(?:current|onPlaylistChange|qualityByWidth)/);

        if (seasonsMatch) {
            try {
                var seasons = (0, eval)('"use strict"; (' + seasonsMatch[1] + ')');
                var audioNames = [];
                if (audioMatch) {
                    var namesM = audioMatch[1].match(/"names"\s*:\s*(\[[^\]]*\])/);
                    if (namesM) audioNames = JSON.parse(namesM[1]);
                }
                result.playlist = {
                    seasons: seasons,
                    audioNames: audioNames
                };
            } catch (e) {
                // fallback: can't parse seasons
            }
        } else if (hlsMatch) {
            var audioNames2 = [];
            if (audioMatch) {
                var namesM2 = audioMatch[1].match(/"names"\s*:\s*(\[[^\]]*\])/);
                if (namesM2) audioNames2 = JSON.parse(namesM2[1]);
            }
            result.source = {
                hls: hlsMatch ? hlsMatch[1] : '',
                dash: dashMatch ? dashMatch[1] : '',
                audioNames: audioNames2
            };
        }

        result.title = titleMatch ? titleMatch[1] : '';

        return (result.source || result.playlist) ? result : null;
    } catch (e) {
        return null;
    }
};

// --------------- Movie ---------------

CollapsBalancer.prototype._processMovie = function (config) {
    this.data = { type: 'movie', config: config };
    this.items_list = [];
    this.component.reset();

    var voices = config.source.audioNames || [];
    var info = formatVoicesInfo(voices);

    this._appendItem({
        title:     config.title || this.select_title,
        quality:   'HLS',
        info:      info,
        url:       config.source.hls,
        qualities: {}
    });

    this.component.start(true);
};

// --------------- Series ---------------

CollapsBalancer.prototype._processSeries = function (config) {
    this.data = { type: 'series', config: config };
    this.items_list = [];

    // Restore saved choice
    var kpId = this._kpId();
    var saved = Lampa.Storage.get('lampada_ch_collaps_' + kpId, {});
    if (typeof saved.season === 'number') this.choice.season = saved.season;

    var seasons = config.playlist.seasons;
    if (this.choice.season >= seasons.length) this.choice.season = 0;

    this._buildFilter();
    this._renderEpisodes(this.choice.season);
};

CollapsBalancer.prototype._buildFilter = function () {
    this.filter_items = { season: [] };

    if (!this.data || this.data.type !== 'series') {
        this.component.filter(this.filter_items, this.choice);
        return;
    }

    var seasons = this.data.config.playlist.seasons;
    if (seasons.length <= 1) {
        this.component.filter(this.filter_items, this.choice);
        return;
    }

    for (var i = 0; i < seasons.length; i++) {
        this.filter_items.season.push(t('lampada_season') + ' ' + seasons[i].season);
    }

    this.component.filter(this.filter_items, this.choice);
};

CollapsBalancer.prototype._renderEpisodes = function (seasonIndex) {
    var self = this;
    this.items_list = [];
    this.component.reset();

    var seasons = this.data.config.playlist.seasons;
    var season  = seasons[seasonIndex];

    if (!season || !season.episodes || !season.episodes.length) {
        this.component.emptyForQuery(this.select_title);
        return;
    }

    season.episodes.forEach(function (ep) {
        var voices = (ep.audio && ep.audio.names) ? ep.audio.names : [];
        var info   = formatVoicesInfo(voices);

        self._appendItem({
            title:     t('lampada_episode') + ' ' + ep.episode,
            quality:   'HLS',
            info:      info,
            url:       ep.hls || '',
            dash:      ep.dash || '',
            qualities: {},
            season:    season.season,
            episode:   parseInt(ep.episode) || 0,
            audio:     voices
        });
    });

    this.component.start(true);
};

// --------------- Filter ---------------

CollapsBalancer.prototype.filter = function (type, a, b) {
    if (a.stype === 'season') {
        this.choice.season = b.index;
        this.component.reset();
        this._buildFilter();
        this._renderEpisodes(this.choice.season);
        this.component.saveChoice(this.choice);
    }
};

CollapsBalancer.prototype.reset = function () {
    this.component.reset();
    this.choice = { season: 0, voice: 0 };
    this._buildFilter();
    if (this.data && this.data.type === 'series') {
        this._renderEpisodes(0);
    } else if (this.data) {
        this._processMovie(this.data.config);
    }
    this.component.saveChoice(this.choice);
};

CollapsBalancer.prototype.extendChoice = function (saved) {
    Lampa.Arrays.extend(this.choice, saved, true);
};

CollapsBalancer.prototype.destroy = function () {
    this.network.clear();
    this.data = null;
    this.items_list = [];
};

// --------------- Append Item ---------------

CollapsBalancer.prototype._appendItem = function (element) {
    var self   = this;
    var object = this.object;
    var movie  = object.movie || {};
    var orig   = movie.original_title || movie.title || movie.name || '';

    var tHash = Lampa.Utils.hash(
        element.season
            ? [element.season, element.episode, orig].join('_')
            : orig
    );

    var vHash = Lampa.Utils.hash(
        element.season
            ? [element.season, element.episode, orig, 'collaps'].join('_')
            : orig + '_collaps'
    );

    var timeline = Lampa.Timeline.view(tHash);
    var viewed   = Lampa.Storage.cache('online_view', 5000, []);

    var item = Lampa.Template.get('lampada_item', {
        title:   element.title,
        quality: element.quality,
        info:    element.info
    });

    element.timeline = timeline;
    element.viewHash = vHash;

    item.append(Lampa.Timeline.render(timeline));

    if (Lampa.Timeline.details) {
        item.find('.lampada-item__quality').append(Lampa.Timeline.details(timeline, ' / '));
    }

    if (viewed.indexOf(vHash) !== -1) {
        item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
    }

    item.on('hover:enter', function () {
        self._playVideo(element, item, viewed);
    });

    this.items_list.push(element);
    this.component.append(item);
};

// --------------- Play ---------------

CollapsBalancer.prototype._playVideo = function (element, item, viewed) {
    var object = this.object;

    if (object.movie && object.movie.id) {
        Lampa.Favorite.add('history', object.movie, 100);
    }

    if (!element.url) {
        Lampa.Noty.show(t('lampada_nolink'));
        return;
    }

    var first = {
        url:      element.url,
        quality:  element.qualities || {},
        timeline: element.timeline,
        title:    element.season
            ? element.title
            : this.select_title + (element.title !== this.select_title ? ' / ' + element.title : '')
    };

    var playlist = [];

    if (element.season) {
        this.items_list.forEach(function (el) {
            playlist.push({
                url:      el.url,
                quality:  el.qualities || {},
                timeline: el.timeline,
                title:    el.title
            });
        });
    } else {
        playlist.push(first);
    }

    if (playlist.length > 1) first.playlist = playlist;

    Lampa.Player.play(first);
    Lampa.Player.playlist(playlist);

    if (viewed.indexOf(element.viewHash) === -1) {
        viewed.push(element.viewHash);
        Lampa.Storage.set('online_view', viewed);
        item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
    }
};

// --------------- Helpers ---------------

CollapsBalancer.prototype._kpId = function () {
    return (this.object.movie && (this.object.movie.id || this.object.movie.kinopoisk_id)) || '';
};

// --------------- Static metadata ---------------

CollapsBalancer.title      = 'Collaps';
CollapsBalancer.balanser   = 'collaps';
CollapsBalancer.kp         = true;
CollapsBalancer.imdb       = false;
CollapsBalancer.searchable = false;
CollapsBalancer.disabled   = false;
