(function () {
    'use strict';

    // =======================================================
    //  Ashdi (UKR) — Lampa Plugin v1.0.0
    //  Ukrainian content via base.ashdi.vip
    //  Uses PlayerJS embed format (HLS streams)
    //  No backend required — works client-side with CORS proxy
    // =======================================================

    var MOD_VERSION = '1.0.0';
    var PLUGIN_NAME = 'Ashdi (UKR)';
    var COMP_NAME   = 'online_ashdi';

    // --------------- Default configuration ---------------
    var DEFAULT_HOST = 'https://base.ashdi.vip';
    var CORS_PROXIES = [
        'https://cors.nb557.workers.dev/',
        'https://cors557.deno.dev/'
    ];

    // =======================================================
    //  Helper Functions
    // =======================================================

    /**
     * Get the configured Ashdi host
     */
    function getHost() {
        var h = Lampa.Storage.get('ashdi_host', '');
        return h || DEFAULT_HOST;
    }

    /**
     * Check if CORS proxy is enabled
     */
    function proxyEnabled() {
        return Lampa.Storage.field('ashdi_use_proxy') !== false;
    }

    /**
     * Get the CORS proxy URL (user-configured or auto-rotated default)
     */
    function getProxy() {
        var custom = Lampa.Storage.get('ashdi_proxy_url', '');
        if (custom) return custom.replace(/\/+$/, '') + '/';
        return CORS_PROXIES[new Date().getMinutes() % CORS_PROXIES.length];
    }

    /**
     * Wrap URL with CORS proxy if enabled
     */
    function applyProxy(url) {
        if (!proxyEnabled() || !url) return url;
        return getProxy() + url;
    }

    // =======================================================
    //  PlayerJS Parsing
    // =======================================================

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

            // JSON array → series/playlist
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

            // Direct URL → movie
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

        // Has folder → seasons with nested episodes
        if (arr[0].folder) {
            return { type: 'series', seasons: arr };
        }

        // Flat episode list → wrap in single "season"
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

    // =======================================================
    //  Language Strings
    // =======================================================

    Lampa.Lang.add({
        ashdi_title_full:       { uk: 'Ashdi (UKR)',                            en: 'Ashdi (UKR)',              ru: 'Ashdi (UKR)' },
        ashdi_watch:            { uk: 'Дивитися в Ashdi',                       en: 'Watch on Ashdi',           ru: 'Смотреть в Ashdi' },
        ashdi_nolink:           { uk: 'Посилання на відео не знайдено',          en: 'Video link not found',     ru: 'Ссылка на видео не найдена' },
        ashdi_empty:            { uk: 'Нічого не знайдено',                     en: 'Nothing found',            ru: 'Ничего не найдено' },
        ashdi_no_kpid:          { uk: 'Необхідний ID Кінопошуку',               en: 'Kinopoisk ID required',    ru: 'Необходим ID Кинопоиска' },
        ashdi_season:           { uk: 'Сезон',                                  en: 'Season',                   ru: 'Сезон' },
        ashdi_episode:          { uk: 'Серія',                                  en: 'Episode',                  ru: 'Серия' },
        ashdi_loading:          { uk: 'Завантаження...',                        en: 'Loading...',               ru: 'Загрузка...' },
        ashdi_settings_header:  { uk: 'Налаштування Ashdi',                     en: 'Ashdi Settings',           ru: 'Настройки Ashdi' },
        ashdi_settings_host:    { uk: 'Хост Ashdi',                             en: 'Ashdi Host',               ru: 'Хост Ashdi' },
        ashdi_settings_proxy:   { uk: 'Використовувати CORS-проксі',            en: 'Use CORS proxy',           ru: 'Использовать CORS-прокси' },
        ashdi_settings_proxy_url: { uk: 'URL CORS-проксі (пусто = авто)',       en: 'CORS proxy URL (empty = auto)', ru: 'URL CORS-прокси (пусто = авто)' }
    });

    // =======================================================
    //  CSS
    // =======================================================

    var PLUGIN_CSS = '\
    .ashdi-plugin { position: relative; }\
    .ashdi-plugin .ashdi-head {\
        display: flex;\
        flex-wrap: wrap;\
        padding: 0.8em 1.5em 0.3em;\
    }\
    .ashdi-plugin .ashdi-head__btn {\
        padding: 0.4em 1.2em;\
        margin: 0.2em 0.3em;\
        border-radius: 0.6em;\
        background: rgba(255,255,255,0.08);\
        font-size: 1.05em;\
        white-space: nowrap;\
        cursor: pointer;\
        transition: background 0.15s, color 0.15s;\
    }\
    .ashdi-plugin .ashdi-head__btn.selected {\
        background: rgba(255,255,255,0.22);\
    }\
    .ashdi-plugin .ashdi-head__btn.focus {\
        background: #fff;\
        color: #000;\
    }\
    .ashdi-plugin .ashdi-item {\
        padding: 1em 1.5em;\
        position: relative;\
        cursor: pointer;\
        transition: background 0.15s;\
    }\
    .ashdi-plugin .ashdi-item.focus {\
        background: rgba(255,255,255,0.1);\
    }\
    .ashdi-plugin .ashdi-item__body {\
        display: flex;\
        align-items: center;\
    }\
    .ashdi-plugin .ashdi-item__title {\
        flex-grow: 1;\
        font-size: 1.2em;\
        min-width: 0;\
        overflow: hidden;\
        text-overflow: ellipsis;\
        white-space: nowrap;\
    }\
    .ashdi-plugin .ashdi-item__quality {\
        font-size: 0.9em;\
        color: rgba(255,255,255,0.5);\
        padding: 0 0.8em;\
        white-space: nowrap;\
    }\
    .ashdi-plugin .ashdi-item__info {\
        font-size: 0.9em;\
        color: rgba(255,255,255,0.4);\
        white-space: nowrap;\
    }\
    .ashdi-plugin .ashdi-empty {\
        padding: 3em 1.5em;\
        text-align: center;\
        font-size: 1.2em;\
        color: rgba(255,255,255,0.3);\
    }\
    ';

    $('head').append('<style>' + PLUGIN_CSS + '</style>');

    // =======================================================
    //  Template
    // =======================================================

    Lampa.Template.add('ashdi_item', '<div class="selector ashdi-item">\
        <div class="ashdi-item__body">\
            <div class="ashdi-item__title">{title}</div>\
            <div class="ashdi-item__quality">{quality}</div>\
            <div class="ashdi-item__info">{info}</div>\
        </div>\
    </div>');

    // =======================================================
    //  Component
    // =======================================================

    function component(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true, step: 250 });

        var html = $('<div class="ashdi-plugin"></div>');
        var head = $('<div class="ashdi-head"></div>');
        var body = $('<div class="ashdi-body"></div>');

        var select_title = object.search || object.search_one || '';
        if (!select_title && object.movie) {
            select_title = object.movie.title || object.movie.name || '';
        }

        var data       = null;          // parsed content data
        var choice     = { season: 0 }; // current filter state
        var items_list = [];            // elements for playlist building
        var last       = false;         // last focused DOM element

        // --------------- IDs ---------------

        function kpId() {
            return (object.movie && (object.movie.id || object.movie.kinopoisk_id)) || '';
        }

        // --------------- Network: fetch embed page ---------------

        function fetchEmbed() {
            var id = kpId();
            if (!id) {
                showEmpty(Lampa.Lang.translate('ashdi_no_kpid'));
                return;
            }

            showLoading();

            var url = getHost() + '/vod/' + id;

            network.clear();
            network.timeout(15000);
            network.silent(
                applyProxy(url),
                function (response) {
                    var str = typeof response === 'string' ? response : '';
                    if (!str) {
                        showEmpty(Lampa.Lang.translate('ashdi_empty') + ': ' + select_title);
                        return;
                    }
                    processHTML(str);
                },
                function () {
                    showEmpty(Lampa.Lang.translate('ashdi_empty') + ': ' + select_title);
                },
                false,
                { dataType: 'text' }
            );
        }

        // --------------- Parse response ---------------

        function processHTML(html_str) {
            var config = extractPlayerjs(html_str);
            if (!config || !config.file) {
                showEmpty(Lampa.Lang.translate('ashdi_empty') + ': ' + select_title);
                return;
            }

            data = parseFileParam(config.file);
            if (!data) {
                showEmpty(Lampa.Lang.translate('ashdi_empty') + ': ' + select_title);
                return;
            }

            // Restore saved filter state
            var saved = Lampa.Storage.get('ashdi_ch_' + kpId(), {});
            if (typeof saved.season === 'number') choice.season = saved.season;

            if (data.type === 'series') {
                if (choice.season >= data.seasons.length) choice.season = 0;
                buildFilter();
                renderEpisodes(choice.season);
            } else {
                renderMovie();
            }
        }

        // --------------- Season filter bar ---------------

        function buildFilter() {
            head.empty();
            if (!data || data.type !== 'series' || data.seasons.length <= 1) return;

            data.seasons.forEach(function (season, i) {
                var label = season.title || (Lampa.Lang.translate('ashdi_season') + ' ' + (i + 1));
                var el = $('<div class="selector ashdi-head__btn' + (i === choice.season ? ' selected' : '') + '">' + label + '</div>');

                el.on('hover:enter', function () {
                    if (choice.season === i) return;

                    choice.season = i;
                    Lampa.Storage.set('ashdi_ch_' + kpId(), choice);

                    head.find('.ashdi-head__btn').removeClass('selected');
                    el.addClass('selected');

                    renderEpisodes(i);
                });

                el.on('hover:focus', function () {
                    last = el[0];
                    scroll.update(el);
                });

                head.append(el);
            });
        }

        // --------------- Render movie ---------------

        function renderMovie() {
            resetBody();
            if (!data || data.type !== 'movie') return;

            var qKeys = Object.keys(data.qualities || {});
            var qualityText = qKeys.length ? qKeys.join(', ') : 'HLS';

            appendItem({
                title: select_title,
                quality: qualityText,
                info: 'Ashdi \u2022 UKR',
                url: data.url,
                qualities: data.qualities || {}
            });

            activateContent();
        }

        // --------------- Render episodes ---------------

        function renderEpisodes(seasonIndex) {
            resetBody();

            var season = data.seasons[seasonIndex];
            if (!season || !season.folder || !season.folder.length) {
                showEmpty(Lampa.Lang.translate('ashdi_empty'));
                return;
            }

            season.folder.forEach(function (ep, i) {
                var parsed = parseEpisodeFile(ep.file);
                var qKeys  = Object.keys(parsed.qualities || {});

                appendItem({
                    title:     ep.title || (Lampa.Lang.translate('ashdi_episode') + ' ' + (i + 1)),
                    quality:   qKeys.length ? qKeys.join(', ') : 'HLS',
                    info:      'Ashdi \u2022 UKR',
                    url:       parsed.url,
                    qualities: parsed.qualities,
                    season:    seasonIndex + 1,
                    episode:   i + 1
                });
            });

            activateContent();
        }

        // --------------- Append item to list ---------------

        function appendItem(element) {
            var movie = object.movie || {};
            var orig  = movie.original_title || movie.title || movie.name || '';

            // Hash for watch-progress (timeline)
            var tHash = Lampa.Utils.hash(
                element.season
                    ? [element.season, element.episode, orig].join('_')
                    : orig
            );

            // Hash for "viewed" tracking
            var vHash = Lampa.Utils.hash(
                element.season
                    ? [element.season, element.episode, orig, 'ashdi'].join('_')
                    : orig + '_ashdi'
            );

            var timeline = Lampa.Timeline.view(tHash);
            var viewed   = Lampa.Storage.cache('online_view', 5000, []);

            // Build DOM from template
            var item = Lampa.Template.get('ashdi_item', {
                title:   element.title,
                quality: element.quality,
                info:    element.info
            });

            element.timeline = timeline;
            element.viewHash = vHash;

            // Timeline progress bar
            item.append(Lampa.Timeline.render(timeline));

            // Timeline remaining time label
            if (Lampa.Timeline.details) {
                item.find('.ashdi-item__quality').append(Lampa.Timeline.details(timeline, ' / '));
            }

            // "Viewed" star icon
            if (viewed.indexOf(vHash) !== -1) {
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
            }

            // Click → play video
            item.on('hover:enter', function () {
                playVideo(element, item, viewed);
            });

            // Focus → scroll follow
            item.on('hover:focus', function () {
                last = item[0];
                scroll.update(item);
            });

            items_list.push(element);
            body.append(item);
        }

        // --------------- Play video ---------------

        function playVideo(element, item, viewed) {
            // Add movie to watch history
            if (object.movie && object.movie.id) {
                Lampa.Favorite.add('history', object.movie, 100);
            }

            if (!element.url) {
                Lampa.Noty.show(Lampa.Lang.translate('ashdi_nolink'));
                return;
            }

            // First item for player
            var first = {
                url:      element.url,
                quality:  element.qualities || {},
                timeline: element.timeline,
                title:    element.season
                    ? element.title
                    : select_title + (element.title !== select_title ? ' / ' + element.title : '')
            };

            // Build playlist
            var playlist = [];

            if (element.season) {
                // All episodes in current season
                items_list.forEach(function (el) {
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

            // Launch player
            Lampa.Player.play(first);
            Lampa.Player.playlist(playlist);

            // Mark as viewed
            if (viewed.indexOf(element.viewHash) === -1) {
                viewed.push(element.viewHash);
                Lampa.Storage.set('online_view', viewed);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
            }
        }

        // --------------- UI helpers ---------------

        function resetBody() {
            body.empty();
            items_list = [];
        }

        function showLoading() {
            body.html('<div class="ashdi-empty">' + Lampa.Lang.translate('ashdi_loading') + '</div>');
        }

        function showEmpty(msg) {
            resetBody();
            body.html('<div class="ashdi-empty">' + msg + '</div>');
            activateContent();
        }

        // --------------- Controller / Navigation ---------------

        function activateContent() {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last, scroll.render());
                },
                left: function () {
                    Lampa.Controller.toggle('menu');
                },
                right: function () {
                    // no action
                },
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

        /**
         * Move focus up/down in the selector list
         * @param {number} dir  -1 = up, +1 = down
         */
        function navigateList(dir) {
            var all     = scroll.render().find('.selector');
            var focused = all.filter('.focus');

            if (!focused.length && all.length) {
                // Nothing focused → focus first
                Lampa.Controller.collectionFocus(all.first(), scroll.render());
                return;
            }

            var idx    = all.index(focused);
            var newIdx = idx + dir;

            if (newIdx >= 0 && newIdx < all.length) {
                Lampa.Controller.collectionFocus(all.eq(newIdx), scroll.render());
            }
        }

        // --------------- Component lifecycle ---------------

        this.create = function () {
            scroll.render().addClass('layer--wheight');

            // Place head (filter bar) above the scrollable body
            html.append(head);
            html.append(scroll.render());

            // Body (items container) lives inside scroll
            scroll.append(body);

            // Start loading content
            fetchEmbed();
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
            scroll.destroy();
            html.remove();
            items_list = [];
            data = null;
        };
    }

    // =======================================================
    //  Registration
    // =======================================================

    Lampa.Component.add(COMP_NAME, component);

    // =======================================================
    //  Manifest (makes plugin appear in video sources)
    // =======================================================

    Lampa.Manifest.plugins = {
        type: 'video',
        version: MOD_VERSION,
        name: PLUGIN_NAME + ' - ' + MOD_VERSION,
        description: Lampa.Lang.translate('ashdi_watch'),
        component: COMP_NAME,
        onContextMenu: function (obj) {
            return {
                name: Lampa.Lang.translate('ashdi_watch'),
                description: ''
            };
        },
        onContextLauch: function (obj) {
            Lampa.Activity.push({
                url: '',
                title: PLUGIN_NAME,
                component: COMP_NAME,
                search: obj.title || obj.name,
                search_one: obj.title,
                search_two: obj.original_title,
                movie: obj,
                page: 1
            });
        }
    };

    // =======================================================
    //  Settings
    // =======================================================

    function initSettings() {
        // Settings component group
        Lampa.SettingsApi.addParam({
            component: 'ashdi',
            param: {
                name: 'ashdi_use_proxy',
                type: 'trigger',
                default: true
            },
            field: {
                name: Lampa.Lang.translate('ashdi_settings_proxy'),
                description: ''
            },
            onChange: function (val) {
                Lampa.Storage.set('ashdi_use_proxy', val);
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'ashdi',
            param: {
                name: 'ashdi_proxy_url',
                type: 'input',
                values: '',
                default: ''
            },
            field: {
                name: Lampa.Lang.translate('ashdi_settings_proxy_url'),
                description: 'cors.nb557.workers.dev / cors557.deno.dev'
            },
            onChange: function (val) {
                Lampa.Storage.set('ashdi_proxy_url', val);
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'ashdi',
            param: {
                name: 'ashdi_host',
                type: 'input',
                values: '',
                default: DEFAULT_HOST
            },
            field: {
                name: Lampa.Lang.translate('ashdi_settings_host'),
                description: DEFAULT_HOST
            },
            onChange: function (val) {
                Lampa.Storage.set('ashdi_host', val);
            }
        });
    }

    // =======================================================
    //  Menu integration (adds "Ashdi" button to Lampa menu)
    // =======================================================

    function addMenuButton() {
        var item = $('<li class="menu__item selector" data-action="ashdi">\
            <div class="menu__ico">\
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">\
                    <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15l3.5-4.5 2.5 3.01L16.5 10l3.5 4.5H4z"/>\
                </svg>\
            </div>\
            <div class="menu__text">Ashdi</div>\
        </li>');

        item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: PLUGIN_NAME,
                component: COMP_NAME,
                page: 1
            });
        });

        // Add after the "TV" menu item (or at the end)
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

    // =======================================================
    //  Initialization
    // =======================================================

    function startPlugin() {
        initSettings();
        addMenuButton();

        // Log for debugging
        console.log('Ashdi (UKR) plugin v' + MOD_VERSION + ' loaded');
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();
