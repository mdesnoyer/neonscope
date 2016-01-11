// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

var NEONSCOPE = NEONSCOPE || (function() {

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    var _state = EXTENSION_STATES.DEAD,
        _intervalId,
        _particles = {},
        _tabLockId,
        _accessToken = '',
        _refreshToken = '',
        _accountId = ''
    ;

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _getParticleCount() {
        var returnValue = Object.keys(_particles).length;
        beacon('_getParticleCount: ' + returnValue);
        return returnValue;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _setIcon(icon) {
        beacon('_setIcon: ' + icon);
        chrome.browserAction.setIcon({
            path: 'icons/icon-' + icon + '.png'
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    function _setIconCount() {
        beacon('_setIconCount');
        _setIconText(_getParticleCount().toString());
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    function _setIconText(text) {
        beacon('_setIconText: ' + text);
        chrome.browserAction.setBadgeText({
            text: text
        });
    }
    
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _injectedMethod(method, args, callback) {
        beacon('_injectedMethod: ' + method);
        if (_tabLockId === undefined) {
            beacon('_injectedMethod: undefined tabLockId');
        }
        chrome.tabs.executeScript(_tabLockId, { file: SCRIPTS.JQUERY }, function() {
            chrome.tabs.executeScript(_tabLockId, { file: SCRIPTS.INJECT }, function() {
                chrome.tabs.sendMessage(_tabLockId, { method: method, args: args }, callback);
            });
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _setExtensionState(state) {
        beacon('_setExtensionState: ' + state);
        _state = state;
        switch (state) {
            case EXTENSION_STATES.DEAD:
                _setIconText('');
                _setIcon(EXTENSION_STATES.DEAD);
                _injectedMethod('render', { power: false, accessToken: _accessToken }, function(injectedResponse) {
                    _particles = injectedResponse.data.particles;
                    _tabLockId = undefined;
                    clearInterval(_intervalId);
                });
                break;
            case EXTENSION_STATES.PULSE:
                _setIconText('...');
                _setIcon(EXTENSION_STATES.PULSE);
                if (_accessToken === '') {
                    _injectedMethod('loginRequest', {}, null);
                }
                else {
                    _setExtensionState(EXTENSION_STATES.ALIVE);
                }
                break;
            case EXTENSION_STATES.ALIVE:
                _injectedMethod('render', { power: true, accessToken: _accessToken }, function(injectedResponse) {
                    _particles = injectedResponse.data.particles;
                    _setIcon(EXTENSION_STATES.ALIVE);
                    _setIconCount();
                    chrome.storage.sync.get({ neonscopeAccountId: '' }, function(items) {
                        _accountId = items.neonscopeAccountId;
                        _intervalId = setInterval(function() {
                            _processParticles();
                        }, PROCESS_PARTICLES_INTERVAL_MS);
                    });
                });
                break;
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _clickIcon(tab) {
        beacon('_clickIcon: ' + _state);
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
        beacon('_tabChanged: tabId=' + tabId + ', _tabLockId=' + _tabLockId);
        if (_tabLockId !== undefined || _tabLockId !== tabId) {
            _setExtensionState(EXTENSION_STATES.DEAD);
        }

    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _tabUpdated(tabId, changeInfo, tab) {
        beacon('tabUpdated: status=' + changeInfo.status + ', tabId=' + tabId);
        if (changeInfo.status === 'complete' && tab.active && tabId === _tabLockId) {
            _setExtensionState(EXTENSION_STATES.PULSE);
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _onMessage(request, sender, sendResponse) {

        beacon('_onMessage: ' + request.method);
        
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

    function _ajaxParticleStats(vid, newRipenessState) {
        var assembled_url = API_BASE + _accountId + '/statistics/thumbnails?video_id=' + vid + '&token=' + _accessToken;
        $.ajax({
            crossDomain: true,
            url: assembled_url,
            type: 'GET',
            dataType: 'json',
            jsonp: false,
            success: function(data, textStatus, jqXHR) {
                _particles[vid].statistics = data.statistics;
                _particles[vid].state = newRipenessState;
                _injectedMethod('pushParticleRipenessState', { particle: _particles[vid] }, null);
            },
            error: function(qXHR, textStatus, errorThrown) {
                beacon('error');
            },
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _processParticles() {
        beacon('processParticles');
        for (var vid in _particles) {
            if (_particles.hasOwnProperty(vid)) {
                beacon('Particle ' + vid + ': ' + _particles[vid].state);
                switch (_particles[vid].state) {
                    case RIPENESS_STATE.RAW:
                        _setIconCount();
                        _ajaxParticleStats(vid, RIPENESS_STATE.FRESH);
                        break;
                    case RIPENESS_STATE.FRESH:
                        _particles[vid].state = RIPENESS_STATE.COOKED;
                        _injectedMethod('pushParticleRipenessState', { particle: _particles[vid] }, null);
                        break;
                    case RIPENESS_STATE.COOKED:
                        _particles[vid].state = RIPENESS_STATE.STALE;
                        _injectedMethod('pushParticleRipenessState', { particle: _particles[vid] }, null);
                        break;
                    case RIPENESS_STATE.STALE:
                        _ajaxParticleStats(vid, RIPENESS_STATE.ROTTEN);
                        break;
                    case RIPENESS_STATE.ROTTEN:
                        _particles[vid].state = RIPENESS_STATE.COOKED;
                        _injectedMethod('pushParticleRipenessState', { particle: _particles[vid] }, null);
                        break;
                }
            }
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    return {
        bootstrap: function() {
            beacon('bootstrap');
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
