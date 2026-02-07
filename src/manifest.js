/**
 * Manifest registration and menu button
 */
import { component, MOD_VERSION, PLUGIN_NAME, COMP_NAME } from './component.js';
import { t } from './lang.js';

export function initManifest() {
    // Register component
    Lampa.Component.add(COMP_NAME, component);

    // Register manifest (makes plugin appear in video sources)
    if (!Lampa.Manifest) return;

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
