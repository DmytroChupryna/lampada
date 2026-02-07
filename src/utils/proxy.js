/**
 * CORS Proxy utilities
 * Manages proxy configuration, rotation, and URL wrapping
 */

var CORS_PROXIES = [
    'https://cors.nb557.workers.dev/',
    'https://cors557.deno.dev/'
];

/**
 * Check if CORS proxy is enabled in settings
 */
export function proxyEnabled() {
    return Lampa.Storage.field('lampada_use_proxy') === true;
}

/**
 * Get the CORS proxy URL (user-configured or auto-rotated default)
 */
export function getProxy() {
    var custom = Lampa.Storage.get('lampada_proxy_url', '');
    if (custom) return custom.replace(/\/+$/, '') + '/';
    return CORS_PROXIES[new Date().getMinutes() % CORS_PROXIES.length];
}

/**
 * Wrap a URL with CORS proxy if enabled
 * @param {string} url - Target URL
 * @returns {string} Proxied or original URL
 */
export function applyProxy(url) {
    if (!proxyEnabled() || !url) return url;
    return getProxy() + url;
}
