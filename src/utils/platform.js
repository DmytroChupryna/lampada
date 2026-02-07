/**
 * Platform detection helpers
 */

/**
 * Check if running on Android
 */
export function isAndroid() {
    return !!window.cordova || navigator.userAgent.indexOf('Android') !== -1;
}

/**
 * Check if running in a webview (not a full browser)
 */
export function isWebview() {
    return !!window.cordova;
}
