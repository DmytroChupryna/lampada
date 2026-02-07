/**
 * Lampada — Lampa Plugin Entry Point
 *
 * Modular BWA-style plugin for online video sources.
 * Currently supports: Ashdi (UKR)
 */
import { initLang }                    from './lang.js';
import { initCSS }                     from './css.js';
import { initTemplates }               from './templates.js';
import { initSettings }                from './settings.js';
import { initManifest, addMenuButton } from './manifest.js';
import { MOD_VERSION }                 from './component.js';

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
