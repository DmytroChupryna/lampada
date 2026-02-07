(function () {
    'use strict';

    /**
     * Safe translate wrapper — returns key if Lang is unavailable
     */
    function t(key) {
        if (Lampa.Lang && Lampa.Lang.translate) return Lampa.Lang.translate(key);
        return key;
    }

    /**
     * Language strings for the Lampada plugin
     */
    function initLang() {
        if (!Lampa.Lang || !Lampa.Lang.add) return;

        Lampa.Lang.add({
            // General
            lampada_title:            { uk: 'Lampada',                                en: 'Lampada',                  ru: 'Lampada' },
            lampada_watch:            { uk: 'Дивитися онлайн',                        en: 'Watch online',             ru: 'Смотреть онлайн' },
            lampada_nolink:           { uk: 'Посилання на відео не знайдено',          en: 'Video link not found',     ru: 'Ссылка на видео не найдена' },
            lampada_empty:            { uk: 'Нічого не знайдено',                     en: 'Nothing found',            ru: 'Ничего не найдено' },
            lampada_loading:          { uk: 'Завантаження...',                        en: 'Loading...',               ru: 'Загрузка...' },
            lampada_season:           { uk: 'Сезон',                                  en: 'Season',                   ru: 'Сезон' },
            lampada_episode:          { uk: 'Серія',                                  en: 'Episode',                  ru: 'Серия' },
            lampada_source:           { uk: 'Джерело',                                en: 'Source',                   ru: 'Источник' },

            // Ashdi
            ashdi_title_full:         { uk: 'Ashdi (UKR)',                            en: 'Ashdi (UKR)',              ru: 'Ashdi (UKR)' },

            // Collaps
            collaps_title_full:       { uk: 'Collaps',                               en: 'Collaps',                  ru: 'Collaps' },

            // Settings
            lampada_settings_header:  { uk: 'Налаштування Lampada',                   en: 'Lampada Settings',         ru: 'Настройки Lampada' },
            lampada_settings_proxy:   { uk: 'Використовувати CORS-проксі',            en: 'Use CORS proxy',           ru: 'Использовать CORS-прокси' },
            lampada_settings_proxy_url: { uk: 'URL CORS-проксі (пусто = авто)',       en: 'CORS proxy URL (empty = auto)', ru: 'URL CORS-прокси (пусто = авто)' },

            // Ashdi settings
            ashdi_settings_host:      { uk: 'Хост Ashdi',                             en: 'Ashdi Host',               ru: 'Хост Ashdi' },

            // Collaps settings
            collaps_settings_host:    { uk: 'Хост Collaps',                           en: 'Collaps Host',             ru: 'Хост Collaps' }
        });
    }

    /**
     * Plugin CSS — injected into <head> on load
     */
    function initCSS() {
        var css = '\
    .lampada-plugin { position: relative; }\
    .lampada-plugin .lampada-head {\
        display: flex;\
        flex-wrap: wrap;\
        padding: 0.8em 1.5em 0.3em;\
    }\
    .lampada-plugin .lampada-head__btn {\
        padding: 0.4em 1.2em;\
        margin: 0.2em 0.3em;\
        border-radius: 0.6em;\
        background: rgba(255,255,255,0.08);\
        font-size: 1.05em;\
        white-space: nowrap;\
        cursor: pointer;\
        transition: background 0.15s, color 0.15s;\
    }\
    .lampada-plugin .lampada-head__btn.selected {\
        background: rgba(255,255,255,0.22);\
    }\
    .lampada-plugin .lampada-head__btn.focus {\
        background: #fff;\
        color: #000;\
    }\
    .lampada-plugin .lampada-item {\
        padding: 1em 1.5em;\
        position: relative;\
        cursor: pointer;\
        transition: background 0.15s;\
    }\
    .lampada-plugin .lampada-item.focus {\
        background: rgba(255,255,255,0.1);\
    }\
    .lampada-plugin .lampada-item__body {\
        display: flex;\
        align-items: center;\
    }\
    .lampada-plugin .lampada-item__title {\
        flex-grow: 1;\
        font-size: 1.2em;\
        min-width: 0;\
        overflow: hidden;\
        text-overflow: ellipsis;\
        white-space: nowrap;\
    }\
    .lampada-plugin .lampada-item__quality {\
        font-size: 0.9em;\
        color: rgba(255,255,255,0.5);\
        padding: 0 0.8em;\
        white-space: nowrap;\
    }\
    .lampada-plugin .lampada-item__info {\
        font-size: 0.9em;\
        color: rgba(255,255,255,0.4);\
        white-space: nowrap;\
    }\
    .lampada-plugin .lampada-empty {\
        padding: 3em 1.5em;\
        text-align: center;\
        font-size: 1.2em;\
        color: rgba(255,255,255,0.3);\
    }\
    ';

        $('head').append('<style>' + css + '</style>');
    }

    /**
     * Lampa template registrations
     */
    function initTemplates() {
        Lampa.Template.add('lampada_item', '<div class="selector lampada-item">\
        <div class="lampada-item__body">\
            <div class="lampada-item__title">{title}</div>\
            <div class="lampada-item__quality">{quality}</div>\
            <div class="lampada-item__info">{info}</div>\
        </div>\
    </div>');
    }

    /**
     * Settings registration for the Lampada plugin
     */

    function initSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;

        // --- General proxy settings ---
        Lampa.SettingsApi.addParam({
            component: 'lampada',
            param: {
                name: 'lampada_use_proxy',
                type: 'trigger',
                default: false
            },
            field: {
                name: t('lampada_settings_proxy'),
                description: ''
            },
            onChange: function (val) {
                Lampa.Storage.set('lampada_use_proxy', val);
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'lampada',
            param: {
                name: 'lampada_proxy_url',
                type: 'input',
                values: '',
                default: ''
            },
            field: {
                name: t('lampada_settings_proxy_url'),
                description: 'cors.nb557.workers.dev / cors557.deno.dev'
            },
            onChange: function (val) {
                Lampa.Storage.set('lampada_proxy_url', val);
            }
        });

        // --- Ashdi settings ---
        Lampa.SettingsApi.addParam({
            component: 'lampada',
            param: {
                name: 'ashdi_host',
                type: 'input',
                values: '',
                default: 'https://ashdi.vip'
            },
            field: {
                name: t('ashdi_settings_host'),
                description: 'https://ashdi.vip'
            },
            onChange: function (val) {
                Lampa.Storage.set('ashdi_host', val);
            }
        });

        // --- Collaps settings ---
        Lampa.SettingsApi.addParam({
            component: 'lampada',
            param: {
                name: 'collaps_host',
                type: 'input',
                values: '',
                default: 'https://api.delivembd.ws'
            },
            field: {
                name: t('collaps_settings_host'),
                description: 'https://api.delivembd.ws'
            },
            onChange: function (val) {
                Lampa.Storage.set('collaps_host', val);
            }
        });
    }

    /**
     * BaseBalancer — standard interface for all video source balancers.
     *
     * Every balancer must implement:
     *   search(object, kpId, data)  — fetch & display video items
     *   extendChoice(saved)         — restore saved filter state
     *   reset()                     — reset filters, re-render
     *   filter(type, a, b)          — apply a filter selection
     *   destroy()                   — cleanup (abort network, etc.)
     */
    function BaseBalancer(component, object) {
        this.component = component;
        this.object    = object;
        this.network   = new Lampa.Reguest();

        this.select_title = object.search || object.search_one || '';
        if (!this.select_title && object.movie) {
            this.select_title = object.movie.title || object.movie.name || '';
        }
    }

    BaseBalancer.prototype.search = function (/* object, kpId, data */) {
        throw new Error('Balancer must implement search()');
    };

    BaseBalancer.prototype.extendChoice = function (saved) {
        if (this.choice && saved) {
            Lampa.Arrays.extend(this.choice, saved, true);
        }
    };

    BaseBalancer.prototype.reset = function () {
        this.component.reset();
        if (this.choice) {
            for (var k in this.choice) this.choice[k] = 0;
        }
    };

    BaseBalancer.prototype.filter = function (/* type, a, b */) {
        // Override in subclass
    };

    BaseBalancer.prototype.destroy = function () {
        this.network.clear();
    };

    /**
     * PlayerJS embed parser
     * Extracts video data from HTML pages using PlayerJS player
     * Handles movies (single URL), quality variants, and series (season/episode playlists)
     */

    /**
     * Extract Playerjs config object from HTML embed page.
     * Handles: new Playerjs({...}), file:'...' and file:"..."
     * @param {string} html - Raw HTML string
     * @returns {Object|null} config with .file property
     */
    function extractPlayerjs(html) {
        if (!html) return null;

        var str = html.replace(/\r?\n/g, ' ');

        // Pattern 1: new Playerjs({id:"player", file:"..."})
        var m = str.match(/new\s+Playerjs\s*\(\s*(\{[\s\S]*?\})\s*\)/);
        if (m) {
            try {
                return (0, eval)('"use strict"; (' + m[1] + ')');
            } catch (e) {
                // Fall through to simpler extraction
            }
        }

        // Pattern 2: Extract file param as JSON array
        var fm = str.match(/file\s*:\s*'(\[[\s\S]*?\])'/);
        if (!fm) fm = str.match(/file\s*:\s*"(\[[\s\S]*?\])"/);

        // Pattern 3: Extract file param as URL string
        if (!fm) fm = str.match(/file\s*:\s*['"]([^'"]+)['"]/);

        if (fm) return { file: fm[1] };

        return null;
    }

    /**
     * Parse the file parameter from PlayerJS config.
     * Determines if content is a movie or series.
     * @param {string|Array} file
     * @returns {Object|null} { type: 'movie'|'series', ... }
     */
    function parseFileParam(file) {
        if (!file) return null;

        if (typeof file === 'string') {
            file = file.trim();

            // JSON array -> series/playlist
            if (file.charAt(0) === '[') {
                try {
                    var arr = JSON.parse(file);
                    return normalizePlaylist(arr);
                } catch (e) { /* not JSON */ }
            }

            // Quality markers: [1080p]url,[720p]url,[480p]url
            if (/^\[\d+p?\]/.test(file)) {
                return parseQualityString(file);
            }

            // Direct URL -> movie
            if (/^https?:\/\//.test(file)) {
                return { type: 'movie', url: file, qualities: {} };
            }
        }

        // Already-parsed array
        if (Array.isArray(file)) {
            return normalizePlaylist(file);
        }

        return null;
    }

    /**
     * Normalize a playlist array into { type: 'series', seasons: [...] }
     */
    function normalizePlaylist(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return null;

        // Has folder -> seasons with nested episodes
        if (arr[0].folder) {
            return { type: 'series', seasons: arr };
        }

        // Flat episode list -> wrap in single "season"
        return { type: 'series', seasons: [{ title: '', folder: arr }] };
    }

    /**
     * Parse quality string: [1080p]url,[720p]url,...
     * @returns {{ type: 'movie', url: string, qualities: Object }|null}
     */
    function parseQualityString(str) {
        var qualities = {};
        var best = '';
        var bestNum = 0;

        str.split(/,(?=\s*\[)/).forEach(function (part) {
            var m = part.match(/\[(\d+)p?\]\s*(https?:\/\/[^\s,]+)/);
            if (m) {
                var q = parseInt(m[1]);
                qualities[q + 'p'] = m[2];
                if (q > bestNum) {
                    bestNum = q;
                    best = m[2];
                }
            }
        });

        return best ? { type: 'movie', url: best, qualities: qualities } : null;
    }

    /**
     * Parse an individual episode's file field (may contain quality markers)
     * @returns {{ url: string, qualities: Object }}
     */
    function parseEpisodeFile(file) {
        if (!file) return { url: '', qualities: {} };
        if (typeof file !== 'string') return { url: '', qualities: {} };

        var trimmed = file.trim();

        // Quality markers
        if (/^\[\d+p?\]/.test(trimmed)) {
            var result = parseQualityString(trimmed);
            return result
                ? { url: result.url, qualities: result.qualities }
                : { url: '', qualities: {} };
        }

        return { url: trimmed, qualities: {} };
    }

    /**
     * CORS Proxy utilities
     * Manages proxy configuration, rotation, and URL wrapping
     */

    var CORS_PROXIES = [
        'https://cors.nb557.workers.dev/',
        'https://cors557.deno.dev/'
    ];

    /**
     * Check if CORS proxy is enabled in settings
     */
    function proxyEnabled() {
        return Lampa.Storage.field('lampada_use_proxy') === true;
    }

    /**
     * Get the CORS proxy URL (user-configured or auto-rotated default)
     */
    function getProxy() {
        var custom = Lampa.Storage.get('lampada_proxy_url', '');
        if (custom) return custom.replace(/\/+$/, '') + '/';
        return CORS_PROXIES[new Date().getMinutes() % CORS_PROXIES.length];
    }

    /**
     * Wrap a URL with CORS proxy if enabled
     * @param {string} url - Target URL
     * @returns {string} Proxied or original URL
     */
    function applyProxy(url) {
        if (!proxyEnabled() || !url) return url;
        return getProxy() + url;
    }

    /**
     * Ashdi Balancer — Ukrainian content via base.ashdi.vip
     * Uses PlayerJS embed format with HLS streams
     */

    var DEFAULT_HOST$1 = 'https://ashdi.vip';

    function getHost$1() {
        var h = Lampa.Storage.get('ashdi_host', '');
        return h || DEFAULT_HOST$1;
    }

    // --------------- Constructor ---------------

    function AshdiBalancer(component, object) {
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

    AshdiBalancer.prototype.search = function (_object, ids) {
        var self = this;
        this.object = _object;
        this.select_title = _object.search || (_object.movie && (_object.movie.title || _object.movie.name)) || '';

        // Ashdi only supports KP ID
        var kpId = ids.kp || '';
        if (!kpId) {
            this.component.emptyForQuery(this.select_title);
            return;
        }

        this.component.loading(true);

        var url = getHost$1() + '/vod/' + kpId;

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

    /**
     * Collaps Balancer — via api.delivembd.ws
     * No API key needed, works internationally (no geo-block)
     * Returns HTML embed page with makePlayer({...}) containing HLS/DASH streams
     * Supports movies and series with multiple audio tracks and subtitles
     */

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

    function CollapsBalancer(component, object) {
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
        this.object = _object;
        this.select_title = _object.search || (_object.movie && (_object.movie.title || _object.movie.name)) || '';

        // Build list of URLs to try: KP ID first, then IMDB ID
        var urls = [];
        if (ids.kp) urls.push(getHost() + '/embed/kp/' + ids.kp);
        if (ids.imdb) urls.push(getHost() + '/embed/imdb/' + ids.imdb);

        if (urls.length === 0) {
            this.component.emptyForQuery(this.select_title);
            return;
        }

        this.component.loading(true);
        this._tryUrls(urls, 0);
    };

    /**
     * Try URLs one by one until we find content
     */
    CollapsBalancer.prototype._tryUrls = function (urls, index) {
        var self = this;

        if (index >= urls.length) {
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
                // Check if response has actual content (not just empty HTML shell)
                if (str && str.indexOf('makePlayer') !== -1) {
                    self.component.loading(false);
                    self._processHTML(str);
                } else if (index + 1 < urls.length) {
                    // Try next URL
                    self._tryUrls(urls, index + 1);
                } else {
                    self.component.loading(false);
                    self.component.emptyForQuery(self.select_title);
                }
            },
            function () {
                // Network error — try next URL
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

        var playerHeaders = {
            'Referer': getHost() + '/'
        };

        var first = {
            url:      element.url,
            quality:  element.qualities || {},
            timeline: element.timeline,
            title:    element.season
                ? element.title
                : this.select_title + (element.title !== this.select_title ? ' / ' + element.title : ''),
            headers:  playerHeaders
        };

        var playlist = [];

        if (element.season) {
            this.items_list.forEach(function (el) {
                playlist.push({
                    url:      el.url,
                    quality:  el.qualities || {},
                    timeline: el.timeline,
                    title:    el.title,
                    headers:  playerHeaders
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
    CollapsBalancer.imdb       = true;
    CollapsBalancer.searchable = false;
    CollapsBalancer.disabled   = false;

    /**
     * Component — main orchestrator for the Lampada plugin.
     *
     * Manages balancers, filter UI, source switching, item rendering,
     * scroll, and Lampa Controller navigation.
     *
     * Mirrors the online_mod/BWA pattern.
     */

    // All available balancer constructors
    var BALANCER_LIST = [
        CollapsBalancer,
        AshdiBalancer
        // Future: RezkaBalancer, KodikBalancer, ...
    ];

    var MOD_VERSION  = '1.0.0';
    var PLUGIN_NAME  = 'Lampada';
    var COMP_NAME    = 'online_lampada';

    function component(object) {
        var comp = this;
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true, step: 250 });

        var html = $('<div class="lampada-plugin"></div>');
        var head = $('<div class="lampada-head"></div>');
        var body = $('<div class="lampada-body"></div>');

        var select_title = object.search || object.search_one || '';
        if (!select_title && object.movie) {
            select_title = object.movie.title || object.movie.name || '';
        }
        var last       = false;

        // ===== Balancer management =====

        var all_sources = [];
        var sources     = {};
        var filter_sources = [];

        var default_balanser = Lampa.Storage.get('lampada_balanser', 'collaps');
        var balanser = default_balanser;

        // Register balancers
        BALANCER_LIST.forEach(function (Ctor) {
            var entry = {
                name:     Ctor.balanser,
                title:    Ctor.title,
                source:   new Ctor(comp, object),
                kp:       Ctor.kp,
                imdb:     Ctor.imdb,
                search:   Ctor.searchable,
                disabled: Ctor.disabled
            };
            all_sources.push(entry);
        });

        var obj_filter_sources = all_sources.filter(function (s) { return !s.disabled; });
        filter_sources = obj_filter_sources.map(function (s) { return s.name; });
        obj_filter_sources.forEach(function (s) { sources[s.name] = s.source; });
        obj_filter_sources.filter(function (s) { return s.kp; }).map(function (s) { return s.name; });
        obj_filter_sources.filter(function (s) { return s.imdb; }).map(function (s) { return s.name; });
        obj_filter_sources.filter(function (s) { return s.search; }).map(function (s) { return s.name; });

        // Validate chosen balancer
        if (!sources[balanser]) {
            balanser = filter_sources[0] || 'ashdi';
        }

        // ===== Component API (exposed to balancers) =====

        /**
         * Append a DOM item to the scrollable list
         */
        this.append = function (item) {
            item.on('hover:focus', function () {
                last = item[0];
                scroll.update(item);
            });
            body.append(item);
        };

        /**
         * Show or hide loading state
         */
        this.loading = function (show) {
            if (show) {
                body.html('<div class="lampada-empty">' + t('lampada_loading') + '</div>');
            }
        };

        /**
         * Show empty state
         */
        this.empty = function () {
            this.reset();
            body.html('<div class="lampada-empty">' + t('lampada_empty') + '</div>');
            activateContent();
        };

        /**
         * Show empty state for a specific query
         */
        this.emptyForQuery = function (query) {
            this.reset();
            body.html('<div class="lampada-empty">' + t('lampada_empty') + ': ' + query + '</div>');
            activateContent();
        };

        /**
         * Reset body (clear items)
         */
        this.reset = function () {
            body.empty();
        };

        /**
         * Update filter UI with items and current choice
         */
        this.filter = function (filter_items, choice) {
            head.empty();

            // Source filter (only if multiple balancers)
            if (filter_sources.length > 1) {
                var sourceFilter = $('<div class="selector lampada-head__btn selected">' + (sources[balanser] ? getSourceTitle(balanser) : balanser) + '</div>');
                sourceFilter.on('hover:enter', function () {
                    showSourceSelect();
                });
                sourceFilter.on('hover:focus', function () {
                    last = sourceFilter[0];
                    scroll.update(sourceFilter);
                });
                head.append(sourceFilter);
            }

            // Season filter
            if (filter_items.season && filter_items.season.length > 1) {
                filter_items.season.forEach(function (name, index) {
                    var btn = $('<div class="selector lampada-head__btn' + (index === choice.season ? ' selected' : '') + '">' + name + '</div>');
                    btn.on('hover:enter', function () {
                        if (sources[balanser]) {
                            sources[balanser].filter('select', { stype: 'season' }, { index: index });
                        }
                    });
                    btn.on('hover:focus', function () {
                        last = btn[0];
                        scroll.update(btn);
                    });
                    head.append(btn);
                });
            }
        };

        /**
         * Save filter choice for current movie + balancer
         */
        this.saveChoice = function (choice) {
            var key = contentKey();
            if (key) {
                Lampa.Storage.set('lampada_ch_' + balanser + '_' + key, choice);
            }
        };

        /**
         * Get proxy URL for a balancer
         */
        this.proxy = function (/* name */) {
            // Delegates to proxy utility — balancers use applyProxy() directly
            return '';
        };

        /**
         * Called by balancer after appending all items — activates navigation
         */
        this.start = function (afterAppend) {
            if (afterAppend) {
                activateContent();
            }
        };

        // ===== Source switching =====

        function getSourceTitle(name) {
            for (var i = 0; i < all_sources.length; i++) {
                if (all_sources[i].name === name) return all_sources[i].title;
            }
            return name;
        }

        function changeBalanser(name) {
            if (!sources[name]) return;
            balanser = name;
            Lampa.Storage.set('lampada_balanser', name);
            startSearch();
        }

        function showSourceSelect() {
            var items = filter_sources.map(function (name) {
                return {
                    title: getSourceTitle(name),
                    selected: name === balanser
                };
            });

            Lampa.Select.show({
                title: t('lampada_source'),
                items: items,
                onBack: function () {
                    Lampa.Controller.toggle('content');
                },
                onSelect: function (item) {
                    changeBalanser(filter_sources[item.index]);
                }
            });
        }

        // ===== Search logic =====

        function kpIdFromObject() {
            var m = object.movie;
            if (!m) return '';
            // kinopoisk_id is explicit KP ID; only use .id if it's clearly a KP source
            return m.kinopoisk_id || m.kp_id || '';
        }

        function imdbIdFromObject() {
            var m = object.movie;
            if (!m) return '';
            return m.imdb_id || '';
        }

        function tmdbIdFromObject() {
            var m = object.movie;
            if (!m) return '';
            // In the full Lampa app, .id is typically the TMDB ID
            return m.id || '';
        }

        /**
         * Get a unique content key for saving choices/state
         */
        function contentKey() {
            return kpIdFromObject() || imdbIdFromObject() || tmdbIdFromObject() || '';
        }

        function startSearch() {
            comp.reset();
            comp.loading(true);

            var active = sources[balanser];
            if (!active) {
                comp.empty();
                return;
            }

            // Restore saved choice
            var key = contentKey();
            var saved = key ? Lampa.Storage.get('lampada_ch_' + balanser + '_' + key, {}) : {};
            active.extendChoice(saved);

            // Pass all available IDs to the balancer — it decides which to use
            var ids = {
                kp:   kpIdFromObject(),
                imdb: imdbIdFromObject(),
                tmdb: tmdbIdFromObject()
            };

            active.search(object, ids);
        }

        // ===== Navigation =====

        function activateContent() {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last, scroll.render());
                },
                left: function () {
                    Lampa.Controller.toggle('menu');
                },
                right: function () {},
                up: function () {
                    navigateList(-1);
                },
                down: function () {
                    navigateList(1);
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        }

        function navigateList(dir) {
            var all     = scroll.render().find('.selector');
            var focused = all.filter('.focus');

            if (!focused.length && all.length) {
                Lampa.Controller.collectionFocus(all.first(), scroll.render());
                return;
            }

            var idx    = all.index(focused);
            var newIdx = idx + dir;

            if (newIdx >= 0 && newIdx < all.length) {
                Lampa.Controller.collectionFocus(all.eq(newIdx), scroll.render());
            }
        }

        // ===== Component lifecycle =====

        this.create = function () {
            scroll.render().addClass('layer--wheight');

            html.append(head);
            html.append(scroll.render());
            scroll.append(body);

            startSearch();
        };

        this.start = function () {
            if (Lampa.Activity.active() && Lampa.Activity.active().component === COMP_NAME) {
                activateContent();
            }
        };

        this.pause = function () {};
        this.stop  = function () {};

        this.render = function () {
            return html;
        };

        this.destroy = function () {
            network.clear();
            // Destroy all balancers
            for (var name in sources) {
                if (sources[name] && sources[name].destroy) {
                    sources[name].destroy();
                }
            }
            scroll.destroy();
            html.remove();
        };
    }

    /**
     * Manifest registration, movie card button, and menu button
     */

    /**
     * Launch Lampada for a given movie object
     */
    function loadOnline(movie) {
        Lampa.Activity.push({
            url: '',
            title: PLUGIN_NAME,
            component: COMP_NAME,
            search: movie.title || movie.name,
            search_one: movie.title,
            search_two: movie.original_title,
            movie: movie,
            page: 1
        });
    }

    function initManifest() {
        // Register component
        Lampa.Component.add(COMP_NAME, component);

        // Register manifest (makes plugin appear in video sources via context menu)
        if (Lampa.Manifest) {
            Lampa.Manifest.plugins = {
                type: 'video',
                version: MOD_VERSION,
                name: PLUGIN_NAME + ' - ' + MOD_VERSION,
                description: t('lampada_watch'),
                component: COMP_NAME,
                onContextMenu: function (obj) {
                    return {
                        name: t('lampada_watch'),
                        description: ''
                    };
                },
                onContextLauch: function (obj) {
                    loadOnline(obj);
                }
            };
        }

        // Add button on movie card page (full view)
        // This is the primary way video sources appear in the full Lampa app
        var buttonHTML = '<div class="full-start__button selector view--' + COMP_NAME + '" data-subtitle="' + PLUGIN_NAME + ' ' + MOD_VERSION + '">\
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 244 260" fill="currentColor">\
            <g>\
                <path d="M242,88v170H10V88h41l-38,38h37.1l38-38h38.4l-38,38h38.4l38-38h38.3l-38,38H204L242,88L242,88z M228.9,2l8,37.7l0,0 L191.2,10L228.9,2z M160.6,56l-45.8-29.7l38-8.1l45.8,29.7L160.6,56z M84.5,72.1L38.8,42.4l38-8.1l45.8,29.7L84.5,72.1z M10,88 L2,50.2L47.8,80L10,88z"/>\
            </g>\
        </svg>\
        <span>' + PLUGIN_NAME + '</span>\
    </div>';

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                var btn = $(buttonHTML);

                btn.on('hover:enter', function () {
                    loadOnline(e.data.movie);
                });

                // Insert after torrent button, or after other online buttons, or at the end
                var torrentBtn = e.object.activity.render().find('.view--torrent');
                if (torrentBtn.length) {
                    torrentBtn.after(btn);
                } else {
                    e.object.activity.render().find('.full-start__button').last().after(btn);
                }
            }
        });
    }

    function addMenuButton() {
        var item = $('<li class="menu__item selector" data-action="lampada">\
        <div class="menu__ico">\
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">\
                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15l3.5-4.5 2.5 3.01L16.5 10l3.5 4.5H4z"/>\
            </svg>\
        </div>\
        <div class="menu__text">' + PLUGIN_NAME + '</div>\
    </li>');

        item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: PLUGIN_NAME,
                component: COMP_NAME,
                page: 1
            });
        });

        var menu = Lampa.Menu ? Lampa.Menu.render() : null;
        if (menu) {
            var tv = menu.find('[data-action="tv"]');
            if (tv.length) {
                tv.after(item);
            } else {
                menu.append(item);
            }
        }
    }

    /**
     * Lampada — Lampa Plugin Entry Point
     *
     * Modular BWA-style plugin for online video sources.
     * Currently supports: Ashdi (UKR)
     */

    function startPlugin() {
        initLang();
        initCSS();
        initTemplates();
        initManifest();
        initSettings();
        addMenuButton();

        console.log('Lampada plugin v' + MOD_VERSION + ' loaded');
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();
