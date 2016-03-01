// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

var APP_NAME = 'neonscope',
	NEONSCORE_NAME = 'NeonScore',
	UNKNOWN_STRING = '?',
    PROCESS_PARTICLES_INTERVAL_MS = 10000, // 10 seconds
    REFRESH_TOKEN_INTERVAL_MS = 1000 * 60 * 10, // 10 minutes
    SCRIPTS = {
        INJECT: 'js/inject.js'
    },
    EXTENSION_STATE = {
	    DEAD: 'dead',
	    PULSE: 'pulse',
	    ALIVE: 'alive'
    }
    THUMBNAIL_STATE = {
	    ENABLED: 'enabled', // 1
	    THINKING: 'thinking',
	    DISABLED: 'disabled' // 0
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
    ELEMENT_SELECTORS = {
        FOREGROUND: 'img[src*="' + BASE_URL + '"], img[data-original*="' + BASE_URL + '"]',
        BACKGROUND: '*[style*="' + BASE_URL + '"], *[data-background-image*="' + BASE_URL + '"]',
        MID: '*[' + HTML_ATTRIBUTES.MID + ']',
        PID: '*[' + HTML_ATTRIBUTES.PID + ']',
        // {{ winning_selector }} is replaced laters
        WINNING_FOREGROUND: 'img[src*="{{ winning_selector }}"]',
        WINNING_BACKGROUND: '*[style*="{{ winning_selector }}"]',
        WINNING_MASK: CLASSES.BASE + 'winning-mask'
    },
	NEONSCORES = [0.0, 0.155, 0.194, 0.222, 0.247, 0.269, 0.289, 0.31, 0.328, 0.347, 0.363, 0.381, 0.396, 0.41, 0.424, 0.438, 0.452, 0.465, 0.479, 0.492, 0.504, 0.517, 0.531, 0.543, 0.555, 0.567, 0.579, 0.59, 0.602, 0.613, 0.624, 0.635, 0.647, 0.658, 0.67, 0.681, 0.693, 0.704, 0.715, 0.727, 0.739, 0.751, 0.763, 0.776, 0.79, 0.801, 0.813, 0.826, 0.837, 0.85, 0.863, 0.876, 0.889, 0.901, 0.915, 0.928, 0.943, 0.957, 0.972, 0.986, 1.002, 1.017, 1.032, 1.047, 1.064, 1.08, 1.096, 1.115, 1.132, 1.151, 1.17, 1.191, 1.212, 1.233, 1.255, 1.277, 1.301, 1.324, 1.35, 1.376, 1.402, 1.432, 1.461, 1.494, 1.529, 1.566, 1.604, 1.646, 1.69, 1.741, 1.792, 1.847, 1.917, 1.991, 2.08, 2.187, 2.315, 2.474, 2.703, 3.131],
    beacon = function(msg) {
        console.log('[' + APP_NAME + ']', msg);
    }
;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
