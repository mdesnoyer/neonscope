// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

var NEONSCOPE = NEONSCOPE || (function() {

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Constants
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    var PROCESS_PARTICLES_INTERVAL_MS = 10000, // 10s
        REFRESH_TOKEN_INTERVAL_MS = 1000 * 60 * 10, // 10 minutes
        JAVASCRIPT = 'js/inject.js',
        JQUERY = 'js/lib/jquery-2.1.4.min.js',
        EXTENSION_STATES = {
            DEAD: 'dead',
            PULSE: 'pulse',
            ALIVE: 'alive'
        }
    ;

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Private Variables
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    var _state = EXTENSION_STATES.DEAD,
        _intervalId,
        _particles = {},
        _tabLockId,
        _accessToken = '',
        _refreshToken = ''
    ;

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Utility functions
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _getParticleCount() {
        var returnValue = Object.keys(_particles).length;
        console.log('_getParticleCount: ' + returnValue);
        return returnValue;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _setIcon(icon) {
        console.log('_setIcon: ' + icon);
        chrome.browserAction.setIcon({
            path: 'icons/icon-' + icon + '.png'
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    function _setIconCount() {
        console.log('_setIconCount');
        _setIconText(_getParticleCount().toString());
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    function _setIconText(text) {
        console.log('_setIconText: ' + text);
        chrome.browserAction.setBadgeText({
            text: text
        });
    }
    
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _injectedMethod(method, args, callback) {
        console.log('_injectedMethod: ' + method);
        if (_tabLockId === undefined) {
            debugger;
        }
        chrome.tabs.executeScript(_tabLockId, { file: JQUERY }, function() {
            chrome.tabs.executeScript(_tabLockId, { file: JAVASCRIPT }, function() {
                chrome.tabs.sendMessage(_tabLockId, { method: method, args: args }, callback);
            });
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _setExtensionState(state) {
        console.log('_setExtensionState: ' + state);
        _state = state;
        switch (state) {
            case EXTENSION_STATES.DEAD:
                _setIconText('');
                _setIcon('dead');
                _injectedMethod('render', { power: false }, function(injectedResponse) {
                    _particles = injectedResponse.data.particles;
                    _tabLockId = undefined;
                    clearInterval(_intervalId);
                });
                break;
            case EXTENSION_STATES.PULSE:
                _setIconText('...');
                _setIcon(EXTENSION_STATES.PULSE);
                if (_accessToken === '') {
                    _injectedMethod('loginRequest', {}, function(injectedResponse) {
                        // TODO
                    });
                }
                else {
                    _setExtensionState(EXTENSION_STATES.ALIVE);
                }
                break;
            case EXTENSION_STATES.ALIVE:
                _injectedMethod('render', { power: true, accessToken: _accessToken}, function(injectedResponse) {
                    _particles = injectedResponse.data.particles;
                    _setIcon(EXTENSION_STATES.ALIVE);
                    _setIconCount();
                    _intervalId = setInterval(function() {
                        _processParticles();
                    }, PROCESS_PARTICLES_INTERVAL_MS);
                });
                break;
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _clickIcon(tab) {
        console.log('_clickIcon');
        switch (_state) {
            case EXTENSION_STATES.DEAD:
                _tabLockId = tab.id;
                _setExtensionState(EXTENSION_STATES.PULSE);
                break;
            case EXTENSION_STATES.PULSE:
                _setExtensionState(EXTENSION_STATES.DEAD);
                break;
            case EXTENSION_STATES.ALIVE:
                _setExtensionState(EXTENSION_STATES.DEAD);
                break;
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _tabChanged(tabId, selectInfo) {
        console.log('_tabChanged: tabId=' + tabId + ', _tabLockId=' + _tabLockId);
        if (_tabLockId !== undefined) {
            _setExtensionState(EXTENSION_STATES.DEAD);
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _tabUpdated(tabId, changeInfo, tab) {
        console.log('tabUpdated: status=' + changeInfo.status + ', tabId=' + tabId);
        if (changeInfo.status === 'complete' && tab.active && tabId === _tabLockId) {
            _setExtensionState(EXTENSION_STATES.PULSE);
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _onMessage(request, sender, sendResponse) {

        console.log('onMessage: ' + request.method);
        
        switch (request.method) {
            case 'newParticles':
                if (sender.tab.id === _tabLockId) {
                    for (var attrName in request.data) {
                        _particles[attrName] = request.data[attrName];
                    }
                    _setIconCount();
                }
                break;
            case 'loginResponse':
                _accessToken = request.data.accessToken;
                _refreshToken = request.data.refreshToken;
                if (_accessToken === '') {
                    _setExtensionState(EXTENSION_STATES.DEAD);
                }
                else {
                    _setExtensionState(EXTENSION_STATES.ALIVE);
                }
            break;
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _processParticles() {
        console.log('processParticles');
        for (var key in _particles) {
            if (_particles.hasOwnProperty(key)) {
                var vid = _particles[key].vid;
                console.log(_particles[key].state);
                switch (_particles[key].state) {
                    case RIPENESS_STATE.RAW:
                        _injectedMethod('pushRipenessState', { vid: vid, state: RIPENESS_STATE.FRESH }, function(injectedResponse) {
                            // TODO pull API data
                            _setIconCount();
                            _particles[injectedResponse.data.vid].state = RIPENESS_STATE.FRESH;
                        });
                        break;
                    case RIPENESS_STATE.FRESH:
                        _injectedMethod('pushRipenessState', { vid: vid, state: RIPENESS_STATE.COOKED }, function(injectedResponse) {
                            // TODO - push data
                            _particles[injectedResponse.data.vid].state = RIPENESS_STATE.COOKED;
                        });
                        break;
                    case RIPENESS_STATE.COOKED:
                        _injectedMethod('pushRipenessState', { vid: vid, state: RIPENESS_STATE.STALE }, function(injectedResponse) {
                            _particles[injectedResponse.data.vid].state = RIPENESS_STATE.STALE;
                        });
                        break;
                    case RIPENESS_STATE.STALE:
                        _injectedMethod('pushRipenessState', { vid: vid, state: RIPENESS_STATE.ROTTEN }, function(injectedResponse) {
                            // TODO - pull new API data
                            _particles[injectedResponse.data.vid].state = RIPENESS_STATE.ROTTEN;
                        });
                        break;
                    case RIPENESS_STATE.ROTTEN:
                        _injectedMethod('pushRipenessState', { vid: vid, state: RIPENESS_STATE.COOKED }, function(injectedResponse) {
                            // TODO - push data (if changed)
                            _particles[injectedResponse.data.vid].state = RIPENESS_STATE.COOKED;
                        });
                        break;
                }
            }
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    return {
        bootstrap: function() {
            console.log('bootstrap');
            chrome.browserAction.onClicked.addListener(_clickIcon);
            chrome.tabs.onActiveChanged.addListener(_tabChanged);
            chrome.tabs.onUpdated.addListener(_tabUpdated);
            chrome.runtime.onMessage.addListener(_onMessage);                
        }
    };
})();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// entry point
NEONSCOPE.bootstrap();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
