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

function checkBlockedOrigin() {
    try {
        var host = window.location.hostname || '';
        // CDN interkh.com blocks Origin: https://lampa.mx with 423 Locked
        if (host === 'lampa.mx' || host === 'www.lampa.mx') {
            console.warn('[Lampada] lampa.mx is blocked by stream CDN!');
            setTimeout(function () {
                try {
                    Lampa.Noty.show('Lampada: lampa.mx заблоковано CDN. Використовуйте app.lampa.stream або cub.red', { time: 15000 });
                } catch (e) {}
            }, 3000);
        }
    } catch (e) {}
}

function startPlugin() {
    initLang();
    initCSS();
    initTemplates();
    initManifest();
    initSettings();
    addMenuButton();
    checkBlockedOrigin();

    console.log('Lampada plugin v' + MOD_VERSION + ' loaded');
}

if (window.appready) {
    startPlugin();
} else {
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
    });
}
