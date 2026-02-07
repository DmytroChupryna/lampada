/**
 * Manifest registration, movie card button, and menu button
 */
import { component, MOD_VERSION, PLUGIN_NAME, COMP_NAME } from './component.js';
import { t } from './lang.js';

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

export function initManifest() {
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

export function addMenuButton() {
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
