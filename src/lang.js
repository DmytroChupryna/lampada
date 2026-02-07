/**
 * Safe translate wrapper — returns key if Lang is unavailable
 */
export function t(key) {
    if (Lampa.Lang && Lampa.Lang.translate) return Lampa.Lang.translate(key);
    return key;
}

/**
 * Language strings for the Lampada plugin
 */
export function initLang() {
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
