// LiquidGlassTizen launcher: every constant in one place.
window.LiquidGlass = window.LiquidGlass || {};

LiquidGlass.config = {
  APP_ID: 'LqGlass001.Home',
  SERVICE_ID: 'LqGlass001.Watcher',
  SERVICE_URL: 'http://127.0.0.1:47791',

  STORAGE_KEY: 'lgtizen.settings.v1',
  LEGACY_STORAGE_KEYS: ['hearth.home.v1', 'declutter.home.v5'],

  // Remote control key codes (Tizen TV).
  KEY: { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, ESC: 27, IME_DONE: 65376, IME_CANCEL: 65385 },

  // Apps placed on the home grid the first time, by name prefix, in this order.
  DEFAULT_HOME_APPS: ['youtube', 'netflix', 'prime video', 'stremio', 'spotify'],

  // Real user apps: Samsung-store packages (10-char ids) plus the preinstalled streamers,
  // which the TV's local API knows by their store ids. getAppsInfo() returns ~470 entries;
  // everything else is firmware plumbing.
  STORE_PACKAGE: /^[A-Za-z0-9]{10}$/,
  PRELOADED_APPS: { 'org.tizen.netflix-app': '3201907018807', 'org.tizen.primevideo': '3201910019365' },
  // Firmware apps worth a tile anyway, matched by name: the TV's own antenna/live TV viewer.
  // Samsung TV Plus is left out on purpose; it is a separate streaming app.
  TV_APP_NAMES: /terrestre|televisi[oó]n en directo|live tv|^tv$|antena|antenna|tdt/i,
  NOT_TV_APP_NAMES: /tv\s*plus/i,
  HIDDEN_APPS: /service|emanual|companion|dummy|widget|LqGlass001|DclHome001/i,
  STORE_APP_IDS: ['org.volt.apps', 'com.samsung.tv.store'],

  FIREPLACE_ID: '__fire',
  FIREPLACE_VIDEO: 'WuHSBSLK3_A',

  GRID_COLUMNS: 3,
  LONG_PRESS_MS: 600,
  SPEED: { MIN: 0.25, MAX: 3, STEP: 0.25 },

  DEFAULTS: {
    home: [],
    background: 'liquid',
    glass: 'auto',
    speed: 1,
    tempUnit: 'auto',
    dateFormat: 'weekday',
    timeFormat: '12',
    inputNames: {}
  }
};
