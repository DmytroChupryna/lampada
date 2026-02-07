/**
 * PlayerJS embed parser
 * Extracts video data from HTML pages using PlayerJS player
 * Handles movies (single URL), quality variants, and series (season/episode playlists)
 */

/**
 * Extract Playerjs config object from HTML embed page.
 * Handles: new Playerjs({...}), file:'...' and file:"..."
 * @param {string} html - Raw HTML string
 * @returns {Object|null} config with .file property
 */
export function extractPlayerjs(html) {
    if (!html) return null;

    var str = html.replace(/\r?\n/g, ' ');

    // Pattern 1: new Playerjs({id:"player", file:"..."})
    var m = str.match(/new\s+Playerjs\s*\(\s*(\{[\s\S]*?\})\s*\)/);
    if (m) {
        try {
            return (0, eval)('"use strict"; (' + m[1] + ')');
        } catch (e) {
            // Fall through to simpler extraction
        }
    }

    // Pattern 2: Extract file param as JSON array
    var fm = str.match(/file\s*:\s*'(\[[\s\S]*?\])'/);
    if (!fm) fm = str.match(/file\s*:\s*"(\[[\s\S]*?\])"/);

    // Pattern 3: Extract file param as URL string
    if (!fm) fm = str.match(/file\s*:\s*['"]([^'"]+)['"]/);

    if (fm) return { file: fm[1] };

    return null;
}

/**
 * Parse the file parameter from PlayerJS config.
 * Determines if content is a movie or series.
 * @param {string|Array} file
 * @returns {Object|null} { type: 'movie'|'series', ... }
 */
export function parseFileParam(file) {
    if (!file) return null;

    if (typeof file === 'string') {
        file = file.trim();

        // JSON array -> series/playlist
        if (file.charAt(0) === '[') {
            try {
                var arr = JSON.parse(file);
                return normalizePlaylist(arr);
            } catch (e) { /* not JSON */ }
        }

        // Quality markers: [1080p]url,[720p]url,[480p]url
        if (/^\[\d+p?\]/.test(file)) {
            return parseQualityString(file);
        }

        // Direct URL -> movie
        if (/^https?:\/\//.test(file)) {
            return { type: 'movie', url: file, qualities: {} };
        }
    }

    // Already-parsed array
    if (Array.isArray(file)) {
        return normalizePlaylist(file);
    }

    return null;
}

/**
 * Normalize a playlist array into { type: 'series', seasons: [...] }
 */
function normalizePlaylist(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;

    // Has folder -> seasons with nested episodes
    if (arr[0].folder) {
        return { type: 'series', seasons: arr };
    }

    // Flat episode list -> wrap in single "season"
    return { type: 'series', seasons: [{ title: '', folder: arr }] };
}

/**
 * Parse quality string: [1080p]url,[720p]url,...
 * @returns {{ type: 'movie', url: string, qualities: Object }|null}
 */
export function parseQualityString(str) {
    var qualities = {};
    var best = '';
    var bestNum = 0;

    str.split(/,(?=\s*\[)/).forEach(function (part) {
        var m = part.match(/\[(\d+)p?\]\s*(https?:\/\/[^\s,]+)/);
        if (m) {
            var q = parseInt(m[1]);
            qualities[q + 'p'] = m[2];
            if (q > bestNum) {
                bestNum = q;
                best = m[2];
            }
        }
    });

    return best ? { type: 'movie', url: best, qualities: qualities } : null;
}

/**
 * Parse an individual episode's file field (may contain quality markers)
 * @returns {{ url: string, qualities: Object }}
 */
export function parseEpisodeFile(file) {
    if (!file) return { url: '', qualities: {} };
    if (typeof file !== 'string') return { url: '', qualities: {} };

    var trimmed = file.trim();

    // Quality markers
    if (/^\[\d+p?\]/.test(trimmed)) {
        var result = parseQualityString(trimmed);
        return result
            ? { url: result.url, qualities: result.qualities }
            : { url: '', qualities: {} };
    }

    return { url: trimmed, qualities: {} };
}
