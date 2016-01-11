// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

var APP_NAME = 'neonscope',
    PROCESS_PARTICLES_INTERVAL_MS = 10000, // 10 seconds
    REFRESH_TOKEN_INTERVAL_MS = 1000 * 60 * 10, // 10 minutes
    SCRIPTS = {
        INJECT: 'js/inject.js',
        JQUERY: 'js/lib/jquery-2.2.0.min.js'
    },
    EXTENSION_STATES = {
    DEAD: 'dead',
    PULSE: 'pulse',
    ALIVE: 'alive'
    }
    RIPENESS_STATE = {
        RAW: 'W',
        FRESH: 'F',
        COOKED: 'C',
        STALE: 'S',
        ROTTEN: 'R'
    },
    CLASSES = {
        BASE: 'neonscope-',
        HERO: '-hero'
    },
    TYPES = {
        FOREGROUND: 'foreground',
        BACKGROUND: 'background'
    },
    CAROUSEL_STATE = {
        ON: 'on',
        OFF: 'off'
    },
    BASE_URL = 'neon-images.com',
    VID_REGULAR_EXPRESSION = 'neonvid_(.*)[.]',
    TEXT_NODE = 3,
    FADE_TIME = 500,
    AUTH_BASE = 'https://auth.neon-lab.com/api/v2/',
    API_BASE = 'http://services.neon-lab.com/api/v2/',
    ROOT_ELEMENT = 'body',
    HTML_ATTRIBUTES = {
        MID: 'data-' + CLASSES.BASE + 'mid',
        PID: 'data-' + CLASSES.BASE + 'pid',
        VID: 'data-' + CLASSES.BASE + 'vid',
        TID: 'data-' + CLASSES.BASE + 'tid',
        RIPENESS: 'data-' + CLASSES.BASE + 'ripeness',
        CAROUSEL_TOGGLE: 'data-' + CLASSES.BASE + 'carousel-toggle'
    },
    JQUERY_SELECTORS = {
        FOREGROUND: 'img[src*="' + BASE_URL + '"], img[data-original*="' + BASE_URL + '"]',
        BACKGROUND: '*[style*="' + BASE_URL + '"], *[data-background-image*="' + BASE_URL + '"]',
        MID: '*[' + HTML_ATTRIBUTES.MID + ']',
        PID: '*[' + HTML_ATTRIBUTES.PID + ']',
        // {{ winning_selector }} is replaced laters
        WINNING_FOREGROUND: 'img[src*="{{ winning_selector }}"]',
        WINNING_BACKGROUND: '*[style*="{{ winning_selector }}"]',
        WINNING_MASK: CLASSES.BASE + 'winning-mask'
    },
    beacon = function(msg) {
        console.log('[' + APP_NAME + ']', msg);
    },
    getRandomIntInclusive = function(min, max) {
        // Returns a random integer between min (included) and max (included)
        // Using Math.round() will give you a non-uniform distribution!
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
