// The launcher runs on Samsung's Tizen web runtime (Chromium-based, but older models lag),
// so it is plain ES5-style scripts sharing one namespace, with no build step.
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['launcher/js/logos.js'] },
  js.configs.recommended,
  {
    rules: {
      // ES5 has no optional catch binding, so `catch (e) {}` is the idiom.
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    files: ['launcher/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',
      globals: {
        ...globals.browser, AeroTizen: 'writable', tizen: 'readonly', webapis: 'readonly',
        Uint8Array: 'readonly', Uint8ClampedArray: 'readonly'
      }
    },
    rules: {
      eqeqeq: 'error',
      curly: 'error',
      'no-var': 'off'
    }
  },
  {
    files: ['launcher/service/**/*.js'],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'commonjs',
      globals: { ...globals.node, tizen: 'readonly' }
    }
  }
];
