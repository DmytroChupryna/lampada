/**
 * Plugin CSS — injected into <head> on load
 */
export function initCSS() {
    var css = '\
    .lampada-plugin { position: relative; }\
    .lampada-plugin .lampada-head {\
        display: flex;\
        flex-wrap: wrap;\
        padding: 0.8em 1.5em 0.3em;\
    }\
    .lampada-plugin .lampada-head__btn {\
        padding: 0.4em 1.2em;\
        margin: 0.2em 0.3em;\
        border-radius: 0.6em;\
        background: rgba(255,255,255,0.08);\
        font-size: 1.05em;\
        white-space: nowrap;\
        cursor: pointer;\
        transition: background 0.15s, color 0.15s;\
    }\
    .lampada-plugin .lampada-head__btn.selected {\
        background: rgba(255,255,255,0.22);\
    }\
    .lampada-plugin .lampada-head__btn.focus {\
        background: #fff;\
        color: #000;\
    }\
    .lampada-plugin .lampada-item {\
        padding: 1em 1.5em;\
        position: relative;\
        cursor: pointer;\
        transition: background 0.15s;\
    }\
    .lampada-plugin .lampada-item.focus {\
        background: rgba(255,255,255,0.1);\
    }\
    .lampada-plugin .lampada-item__body {\
        display: flex;\
        align-items: center;\
    }\
    .lampada-plugin .lampada-item__title {\
        flex-grow: 1;\
        font-size: 1.2em;\
        min-width: 0;\
        overflow: hidden;\
        text-overflow: ellipsis;\
        white-space: nowrap;\
    }\
    .lampada-plugin .lampada-item__quality {\
        font-size: 0.9em;\
        color: rgba(255,255,255,0.5);\
        padding: 0 0.8em;\
        white-space: nowrap;\
    }\
    .lampada-plugin .lampada-item__info {\
        font-size: 0.9em;\
        color: rgba(255,255,255,0.4);\
        white-space: nowrap;\
    }\
    .lampada-plugin .lampada-empty {\
        padding: 3em 1.5em;\
        text-align: center;\
        font-size: 1.2em;\
        color: rgba(255,255,255,0.3);\
    }\
    ';

    $('head').append('<style>' + css + '</style>');
}
