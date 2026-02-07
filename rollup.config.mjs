export default {
    input: 'src/index.js',
    output: {
        file: 'dist/lampada.js',
        format: 'iife',
        name: 'LampadaPlugin',
        esModule: false,
        strict: true     // adds 'use strict' inside the IIFE
    },
    onwarn(warning, warn) {
        // Suppress "this is undefined" warnings from IIFE format
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        warn(warning);
    }
};
