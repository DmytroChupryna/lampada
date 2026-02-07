/**
 * Collaps Balancer — via api.delivembd.ws / api.namy.ws
 * No API key needed, works internationally (no geo-block)
 * Returns HTML embed page with makePlayer({...}) containing HLS/DASH streams
 * Supports movies and series with multiple audio tracks and subtitles
 */
import { BaseBalancer } from './base.js';
import { t } from '../lang.js';

var DEFAULT_HOST = 'https://api.delivembd.ws';

// --------------- Debug helper ---------------
var DEBUG = true; // set to false to disable on-screen debug messages

function dbg(msg) {
    if (!DEBUG) return;
    console.log('[Lampada Collaps]', msg);
    try { Lampa.Noty.show('[DBG] ' + msg, { time: 8000 }); } catch (e) {}
}

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
 * Format audio info string: Ukrainian tracks first, marked with flag
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

CollapsBalancer.prototype.search = function (_object, ids) {
    var self = this;
    this.object = _object;
    this.select_title = _object.search || (_object.movie && (_object.movie.title || _object.movie.name)) || '';

    dbg('IDs: kp=' + (ids.kp || 'none') + ' imdb=' + (ids.imdb || 'none'));

    // Build list of URLs to try: KP ID first, then IMDB ID
    var urls = [];
    if (ids.kp) urls.push(getHost() + '/embed/kp/' + ids.kp);
    if (ids.imdb) urls.push(getHost() + '/embed/imdb/' + ids.imdb);

    if (urls.length === 0) {
        dbg('No KP or IMDB ID found!');
        this.component.emptyForQuery(this.select_title);
        return;
    }

    dbg('Trying: ' + urls[0]);
    this.component.loading(true);
    this._tryUrls(urls, 0);
};

/**
 * Try URLs one by one until we find content
 */
CollapsBalancer.prototype._tryUrls = function (urls, index) {
    var self = this;

    if (index >= urls.length) {
        dbg('All URLs exhausted, nothing found');
        this.component.loading(false);
        this.component.emptyForQuery(this.select_title);
        return;
    }

    this.network.clear();
    this.network.timeout(15000);
    this.network.silent(
        urls[index],
        function (response) {
            var str = typeof response === 'string' ? response : '';
            dbg('Response len=' + str.length + ' hasMakePlayer=' + (str.indexOf('makePlayer') !== -1));

            if (str && str.indexOf('makePlayer') !== -1) {
                self.component.loading(false);
                self._processHTML(str);
            } else if (index + 1 < urls.length) {
                dbg('No makePlayer, trying next URL: ' + urls[index + 1]);
                self._tryUrls(urls, index + 1);
            } else {
                self.component.loading(false);
                self.component.emptyForQuery(self.select_title);
            }
        },
        function (a, c) {
            var status = a && a.status ? a.status : '?';
            dbg('Network error (status=' + status + ') on ' + urls[index]);
            if (index + 1 < urls.length) {
                self._tryUrls(urls, index + 1);
            } else {
                self.component.loading(false);
                self.component.emptyForQuery(self.select_title);
            }
        },
        false,
        { dataType: 'text' }
    );
};

// --------------- Parse HTML ---------------

CollapsBalancer.prototype._processHTML = function (html) {
    var config = this._extractConfig(html);
    if (!config) {
        dbg('Failed to extract config from HTML');
        this.component.emptyForQuery(this.select_title);
        return;
    }

    // Determine movie vs series
    if (config.playlist && config.playlist.seasons) {
        dbg('Series found: ' + config.playlist.seasons.length + ' seasons');
        this._processSeries(config);
    } else if (config.source) {
        var hlsUrl = config.source.hls || '';
        dbg('Movie found, HLS URL: ' + hlsUrl.substring(0, 80) + '...');
        this._processMovie(config);
    } else {
        dbg('No source and no playlist in config');
        this.component.emptyForQuery(this.select_title);
    }
};

/**
 * Extract makePlayer({...}) config from Collaps HTML
 * Uses eval like online_mod for reliable parsing
 */
CollapsBalancer.prototype._extractConfig = function (html) {
    try {
        var str = (html || '').replace(/\n/g, '');

        // Use same regex as online_mod
        var find = str.match(/makePlayer\(({.*?})\);/);
        if (!find) {
            dbg('Regex: makePlayer not matched');
            return null;
        }

        dbg('makePlayer matched, len=' + find[1].length);

        var json;
        try {
            // eval the config as JS object — same approach as online_mod
            json = (0, eval)('"use strict"; (' + find[1] + ')');
        } catch (e) {
            dbg('eval failed: ' + e.message);
            return null;
        }

        if (!json) {
            dbg('eval returned null');
            return null;
        }

        if (json.blocked) {
            dbg('Content is blocked');
            return null;
        }

        dbg('Config parsed OK, title=' + (json.title || '?') +
            ', hasSource=' + !!json.source +
            ', hasPlaylist=' + !!(json.playlist && json.playlist.seasons));

        return json;
    } catch (e) {
        dbg('extractConfig error: ' + e.message);
        return null;
    }
};

// --------------- Movie ---------------

CollapsBalancer.prototype._processMovie = function (config) {
    this.data = { type: 'movie', config: config };
    this.items_list = [];
    this.component.reset();

    var voices = (config.source.audio && config.source.audio.names) || [];
    var audioTracks = voices.map(function (name) { return { language: name }; });
    var info = formatVoicesInfo(voices);

    var hlsUrl = config.source.hls || '';

    this._appendItem({
        title:       config.title || this.select_title,
        quality:     'HLS',
        info:        info,
        url:         hlsUrl,
        qualities:   {},
        audio_tracks: audioTracks.length ? audioTracks : false
    });

    this.component.start(true);
};

// --------------- Series ---------------

CollapsBalancer.prototype._processSeries = function (config) {
    this.data = { type: 'series', config: config };
    this.items_list = [];

    // Sort seasons
    if (config.playlist && config.playlist.seasons) {
        config.playlist.seasons.sort(function (a, b) {
            return a.season - b.season;
        });
    }

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
        dbg('No episodes in season ' + seasonIndex);
        this.component.emptyForQuery(this.select_title);
        return;
    }

    dbg('Season ' + season.season + ': ' + season.episodes.length + ' episodes');

    season.episodes.forEach(function (ep) {
        var voices = (ep.audio && ep.audio.names) ? ep.audio.names : [];
        var audioTracks = voices.map(function (name) { return { language: name }; });
        var info   = formatVoicesInfo(voices);

        self._appendItem({
            title:       t('lampada_episode') + ' ' + ep.episode,
            quality:     'HLS',
            info:        info,
            url:         ep.hls || '',
            dash:        ep.dash || '',
            qualities:   {},
            season:      season.season,
            episode:     parseInt(ep.episode) || 0,
            audio_tracks: audioTracks.length ? audioTracks : false
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
    var self   = this;
    var object = this.object;

    if (object.movie && object.movie.id) {
        Lampa.Favorite.add('history', object.movie, 100);
    }

    if (!element.url) {
        dbg('PLAY: no url!');
        Lampa.Noty.show(t('lampada_nolink'));
        return;
    }

    var url = element.url;

    // Detect platform
    var isAndroid = false;
    try { isAndroid = Lampa.Platform.is('android'); } catch (e) {}

    var isTizen = false;
    try { isTizen = Lampa.Platform.is('tizen'); } catch (e) {}

    var isWebos = false;
    try { isWebos = Lampa.Platform.is('webos'); } catch (e) {}

    dbg('PLAY: android=' + isAndroid + ' tizen=' + isTizen + ' webos=' + isWebos);
    dbg('URL: ' + url.substring(0, 120));

    // Pre-flight: test if TV can reach the m3u8 manifest (debug only)
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 8000;
        xhr.onload = function () {
            var body = (xhr.responseText || '').substring(0, 60);
            dbg('XHR: s=' + xhr.status + ' len=' + (xhr.responseText || '').length + ' body=' + body);
        };
        xhr.onerror = function () {
            dbg('XHR: NETWORK ERROR');
        };
        xhr.ontimeout = function () {
            dbg('XHR: TIMEOUT');
        };
        xhr.send();
    } catch (e) {
        dbg('XHR err: ' + e.message);
    }

    // Headers for native player on Android
    var playerHeaders = {};
    if (isAndroid) {
        playerHeaders = {
            'User-Agent': 'Mozilla/5.0',
            'Origin': getHost(),
            'Referer': getHost() + '/'
        };
    }

    var first = {
        url:       url,
        quality:   element.qualities || {},
        timeline:  element.timeline,
        title:     element.season
            ? element.title
            : this.select_title + (element.title !== this.select_title ? ' / ' + element.title : ''),
        headers:   playerHeaders
    };

    // Pass audio tracks to player (like online_mod does)
    if (element.audio_tracks) {
        first.translate = { tracks: element.audio_tracks };
    }

    var playlist = [];

    if (element.season) {
        this.items_list.forEach(function (el) {
            var cell = {
                url:       el.url,
                quality:   el.qualities || {},
                timeline:  el.timeline,
                title:     el.title,
                headers:   playerHeaders
            };
            if (el.audio_tracks) {
                cell.translate = { tracks: el.audio_tracks };
            }
            playlist.push(cell);
        });
    } else {
        playlist.push(first);
    }

    if (playlist.length > 1) first.playlist = playlist;

    // On Android, try native player to bypass HLS.js issues
    if (isAndroid) {
        dbg('Using android native player');
        try { Lampa.Player.runas('android'); } catch (e) {}
    }

    dbg('Player.play(' + playlist.length + ' items)');

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
CollapsBalancer.imdb       = true;
CollapsBalancer.searchable = false;
CollapsBalancer.disabled   = false;
