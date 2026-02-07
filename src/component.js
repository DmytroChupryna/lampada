/**
 * Component — main orchestrator for the Lampada plugin.
 *
 * Manages balancers, filter UI, source switching, item rendering,
 * scroll, and Lampa Controller navigation.
 *
 * Mirrors the online_mod/BWA pattern.
 */
import { AshdiBalancer } from './balancers/ashdi.js';
import { CollapsBalancer } from './balancers/collaps.js';
import { t } from './lang.js';

// All available balancer constructors
var BALANCER_LIST = [
    CollapsBalancer,
    AshdiBalancer
    // Future: RezkaBalancer, KodikBalancer, ...
];

export var MOD_VERSION  = '1.0.0';
export var PLUGIN_NAME  = 'Lampada';
export var COMP_NAME    = 'online_lampada';

export function component(object) {
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

    var items_list = [];
    var last       = false;

    // ===== Balancer management =====

    var all_sources = [];
    var sources     = {};
    var filter_sources = [];
    var kp_sources  = [];
    var imdb_sources = [];
    var search_sources = [];

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
    kp_sources   = obj_filter_sources.filter(function (s) { return s.kp; }).map(function (s) { return s.name; });
    imdb_sources = obj_filter_sources.filter(function (s) { return s.imdb; }).map(function (s) { return s.name; });
    search_sources = obj_filter_sources.filter(function (s) { return s.search; }).map(function (s) { return s.name; });

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
        items_list = [];
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
        items_list = [];
    };
}
