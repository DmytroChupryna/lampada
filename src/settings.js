/**
 * Settings registration for the Lampada plugin
 */
export function initSettings() {
    // --- General proxy settings ---
    Lampa.SettingsApi.addParam({
        component: 'lampada',
        param: {
            name: 'lampada_use_proxy',
            type: 'trigger',
            default: true
        },
        field: {
            name: Lampa.Lang.translate('lampada_settings_proxy'),
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
            name: Lampa.Lang.translate('lampada_settings_proxy_url'),
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
            default: 'https://base.ashdi.vip'
        },
        field: {
            name: Lampa.Lang.translate('ashdi_settings_host'),
            description: 'https://base.ashdi.vip'
        },
        onChange: function (val) {
            Lampa.Storage.set('ashdi_host', val);
        }
    });
}
