/**
 * Lampa template registrations
 */
export function initTemplates() {
    Lampa.Template.add('lampada_item', '<div class="selector lampada-item">\
        <div class="lampada-item__body">\
            <div class="lampada-item__title">{title}</div>\
            <div class="lampada-item__quality">{quality}</div>\
            <div class="lampada-item__info">{info}</div>\
        </div>\
    </div>');
}
