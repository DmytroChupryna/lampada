/**
 * Component — main orchestrator for the Lampada plugin.
 *
 * Manages balancers, filter UI, source switching, item rendering,
 * scroll, and Lampa Controller navigation.
 *
 * Mirrors the online_mod/BWA pattern.
 */
import { AshdiBalancer } from './balancers/ashdi.js';

// All available balancer constructors
var BALANCER_LIST = [
    AshdiBalancer
    // Future: RezkaBalancer, CollapsBalancer, KodikBalancer, ...
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

    var default_balanser = Lampa.Storage.get('lampada_balanser', 'ashdi');
    var balanser = default_balanser;

    // Register balancers
    BALANCER_LIST.forEach(function (Ctor) {
        var entry = {
            name:     Ctor.name,
            title:    Ctor.title,
            source:   new Ctor(comp, object),
            kp:       Ctor.kp,
            imdb:     Ctor.imdb,
            search:   Ctor.search,
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
            body.html('<div class="lampada-empty">' + Lampa.Lang.translate('lampada_loading') + '</div>');
        }
    };

    /**
     * Show empty state
     */
    this.empty = function () {
        this.reset();
        body.html('<div class="lampada-empty">' + Lampa.Lang.translate('lampada_empty') + '</div>');
        activateContent();
    };

    /**
     * Show empty state for a specific query
     */
    this.emptyForQuery = function (query) {
        this.reset();
        body.html('<div class="lampada-empty">' + Lampa.Lang.translate('lampada_empty') + ': ' + query + '</div>');
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
        var kpId = kpIdFromObject();
        if (kpId) {
            Lampa.Storage.set('lampada_ch_' + balanser + '_' + kpId, choice);
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
            title: Lampa.Lang.translate('lampada_source'),
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
        return (object.movie && (object.movie.id || object.movie.kinopoisk_id)) || '';
    }

    function imdbIdFromObject() {
        return (object.movie && object.movie.imdb_id) || '';
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
        var kpId = kpIdFromObject();
        var saved = kpId ? Lampa.Storage.get('lampada_ch_' + balanser + '_' + kpId, {}) : {};
        active.extendChoice(saved);

        // Determine which ID to use
        var id = '';
        if (kp_sources.indexOf(balanser) !== -1 && kpId) {
            id = kpId;
        } else if (imdb_sources.indexOf(balanser) !== -1 && imdbIdFromObject()) {
            id = imdbIdFromObject();
        }

        active.search(object, id);
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
