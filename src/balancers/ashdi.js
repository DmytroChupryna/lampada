/**
 * Ashdi Balancer — Ukrainian content via base.ashdi.vip
 * Uses PlayerJS embed format with HLS streams
 */
import { BaseBalancer } from './base.js';
import { extractPlayerjs, parseFileParam, parseEpisodeFile } from '../utils/playerjs.js';
import { applyProxy } from '../utils/proxy.js';
import { t } from '../lang.js';

var DEFAULT_HOST = 'https://base.ashdi.vip';

function getHost() {
    var h = Lampa.Storage.get('ashdi_host', '');
    return h || DEFAULT_HOST;
}

// --------------- Constructor ---------------

export function AshdiBalancer(component, object) {
    BaseBalancer.call(this, component, object);

    this.data   = null;
    this.choice = { season: 0 };
    this.filter_items = {};
    this.items_list   = [];
}

// Inherit from BaseBalancer
AshdiBalancer.prototype = Object.create(BaseBalancer.prototype);
AshdiBalancer.prototype.constructor = AshdiBalancer;

// --------------- Search ---------------

AshdiBalancer.prototype.search = function (_object, kpId) {
    var self = this;
    this.object = _object;
    this.select_title = _object.search || (_object.movie && (_object.movie.title || _object.movie.name)) || '';

    if (!kpId) {
        this.component.emptyForQuery(this.select_title);
        return;
    }

    this.component.loading(true);

    var url = getHost() + '/vod/' + kpId;

    this.network.clear();
    this.network.timeout(15000);
    this.network.silent(
        applyProxy(url),
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

// --------------- Parse ---------------

AshdiBalancer.prototype._processHTML = function (html_str) {
    var config = extractPlayerjs(html_str);
    if (!config || !config.file) {
        this.component.emptyForQuery(this.select_title);
        return;
    }

    this.data = parseFileParam(config.file);
    if (!this.data) {
        this.component.emptyForQuery(this.select_title);
        return;
    }

    // Restore saved choice
    var kpId = this._kpId();
    var saved = Lampa.Storage.get('lampada_ch_ashdi_' + kpId, {});
    if (typeof saved.season === 'number') this.choice.season = saved.season;

    if (this.data.type === 'series') {
        if (this.choice.season >= this.data.seasons.length) this.choice.season = 0;
        this._buildFilter();
        this._renderEpisodes(this.choice.season);
    } else {
        this._renderMovie();
    }
};

// --------------- Filter ---------------

AshdiBalancer.prototype._buildFilter = function () {
    this.filter_items = { season: [] };

    if (!this.data || this.data.type !== 'series' || this.data.seasons.length <= 1) {
        this.component.filter(this.filter_items, this.choice);
        return;
    }

    var self = this;
    this.data.seasons.forEach(function (season, i) {
        self.filter_items.season.push(
            season.title || (t('lampada_season') + ' ' + (i + 1))
        );
    });

    this.component.filter(this.filter_items, this.choice);
};

AshdiBalancer.prototype.filter = function (type, a, b) {
    if (a.stype === 'season') {
        this.choice.season = b.index;
        this.component.reset();
        this._buildFilter();
        this._renderEpisodes(this.choice.season);
        this.component.saveChoice(this.choice);
    }
};

AshdiBalancer.prototype.reset = function () {
    this.component.reset();
    this.choice = { season: 0 };
    this._buildFilter();
    if (this.data && this.data.type === 'series') {
        this._renderEpisodes(0);
    } else if (this.data) {
        this._renderMovie();
    }
    this.component.saveChoice(this.choice);
};

AshdiBalancer.prototype.extendChoice = function (saved) {
    Lampa.Arrays.extend(this.choice, saved, true);
};

AshdiBalancer.prototype.destroy = function () {
    this.network.clear();
    this.data = null;
    this.items_list = [];
};

// --------------- Render Movie ---------------

AshdiBalancer.prototype._renderMovie = function () {
    var self = this;
    this.items_list = [];
    this.component.reset();

    if (!this.data || this.data.type !== 'movie') return;

    var qKeys = Object.keys(this.data.qualities || {});
    var qualityText = qKeys.length ? qKeys.join(', ') : 'HLS';

    this._appendItem({
        title:     this.select_title,
        quality:   qualityText,
        info:      'Ashdi \u2022 UKR',
        url:       this.data.url,
        qualities: this.data.qualities || {}
    });

    this.component.start(true);
};

// --------------- Render Episodes ---------------

AshdiBalancer.prototype._renderEpisodes = function (seasonIndex) {
    var self = this;
    this.items_list = [];
    this.component.reset();

    var season = this.data.seasons[seasonIndex];
    if (!season || !season.folder || !season.folder.length) {
        this.component.emptyForQuery(this.select_title);
        return;
    }

    season.folder.forEach(function (ep, i) {
        var parsed = parseEpisodeFile(ep.file);
        var qKeys  = Object.keys(parsed.qualities || {});

        self._appendItem({
            title:     ep.title || (t('lampada_episode') + ' ' + (i + 1)),
            quality:   qKeys.length ? qKeys.join(', ') : 'HLS',
            info:      'Ashdi \u2022 UKR',
            url:       parsed.url,
            qualities: parsed.qualities,
            season:    seasonIndex + 1,
            episode:   i + 1
        });
    });

    this.component.start(true);
};

// --------------- Append Item ---------------

AshdiBalancer.prototype._appendItem = function (element) {
    var self   = this;
    var object = this.object;
    var movie  = object.movie || {};
    var orig   = movie.original_title || movie.title || movie.name || '';

    // Timeline hash
    var tHash = Lampa.Utils.hash(
        element.season
            ? [element.season, element.episode, orig].join('_')
            : orig
    );
    // Viewed hash
    var vHash = Lampa.Utils.hash(
        element.season
            ? [element.season, element.episode, orig, 'ashdi'].join('_')
            : orig + '_ashdi'
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

AshdiBalancer.prototype._playVideo = function (element, item, viewed) {
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

AshdiBalancer.prototype._kpId = function () {
    return (this.object.movie && (this.object.movie.id || this.object.movie.kinopoisk_id)) || '';
};

// --------------- Static metadata ---------------

AshdiBalancer.title      = 'Ashdi';
AshdiBalancer.balanser   = 'ashdi';
AshdiBalancer.kp         = true;
AshdiBalancer.imdb       = false;
AshdiBalancer.searchable = false;
AshdiBalancer.disabled   = false;
