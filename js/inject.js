// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

var ACCELERATOR = ACCELERATOR || (function() {

    // Private

    var _self = this,
        _observer,
        _aid,
        _winningSelector,
        FADE_TIME = 500,
        AUTH_BASE = 'https://auth.neon-lab.com/api/v2/',
        API_BASE = 'http://services.neon-lab.com/api/v2/',
        ROOT_ELEMENT = 'body',
        $ROOT_ELEMENT = $(ROOT_ELEMENT),
        BASE_URL = 'neon-images.com',
        VID_REGULAR_EXPRESSION = "neonvid_(.*)[.]",
        ATTRIBUTES = {
            MID: 'data-neonscope-mid',
            PID: 'data-neonscope-pid',
            VID: 'data-neonscope-vid',
            TID: 'data-neonscope-tid',
            CAROUSEL_TOGGLE: 'data-neonscope-carousel-toggle'
        },
        TYPES = {
            FOREGROUND: 'foreground',
            BACKGROUND: 'background'
        },
        CLASSES = {
            BASE: 'neonscope-',
            HERO: '-hero'
        },
        STATES = {
            ON: 'on',
            OFF: 'off'
        },
        SELECTORS = {
            FOREGROUND: 'img[src*="' + BASE_URL + '"], img[data-original*="' + BASE_URL + '"]',
            BACKGROUND: '*[style*="' + BASE_URL + '"], *[data-background-image*="' + BASE_URL + '"]',
            MID: '*[' + ATTRIBUTES.MID + ']',
            PID: '*[' + ATTRIBUTES.PID + ']',
            // {{ winning_selector }} is replaced laters
            WINNING_FOREGROUND: 'img[src*="{{ winning_selector }}"]', 
            WINNING_BACKGROUND: '*[style*="{{ winning_selector }}"]',
            WINNING_MASK: CLASSES.BASE + 'winning-mask'
        }
    ;

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _watch(accessToken) {
        console.log('_watch');
        _observer = _observer || new MutationObserver(function( mutations ) {
            mutations.forEach(function( mutation ) {
                var addedNodes = mutation.addedNodes;
                if (addedNodes) {
                    var $addedNodes = $(addedNodes);
                    $addedNodes.each(function() {
                        console.log('addedNode');
                        var $shell = $(this);
                        console.log($shell);
                        if ($shell.hasClass('neonscope-thumbnail')) {
                            // ignore 
                            console.log('Ignoring');
                        }
                        else {
                            var addedParticles = _captureParticles($shell);
                            if (Object.keys(addedParticles).length > 0) {
                                console.log('Sending particles');
                                chrome.runtime.sendMessage({ method: 'newParticles', data: addedParticles });
                            }
                            else {
                                console.log('Found no particles');
                            }
                        }
                    });
                }
            });    
        });
        _observer.observe(document.querySelector(ROOT_ELEMENT), { childList: true, subtree: true });
        _toggleHandlers(true, accessToken);
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _unwatch(accessToken) {
        if (_observer !== undefined) {
            _observer.disconnect();
        }
        _toggleHandlers(false, accessToken);
        _aid = undefined;
        _winningSelector = undefined;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _markParticle($particle, vid) {
        $particle.attr(ATTRIBUTES.PID, vid);
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _getParticleURL($particle) {
        return $particle.attr('data-background-image') || $particle.attr('data-original') || $particle.attr('src') || $particle.css('background-image') || undefined;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _getParticleVID(particleURL) {
        // http://i2.neon-images.com/v1/client/1830901739/neonvid_153335.006.01.197.jpg?width=337&height=337
        var parser = document.createElement('a'),
            pattern = new RegExp(VID_REGULAR_EXPRESSION)
        ;
        parser.href = particleURL;
        var match = pattern.exec(parser.pathname); 
        return match[1]; // 0 is the whole match
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _generateWinningMask($shell) {
        console.log('_generateWinningMask');
        $('<div />')
            .offset($shell.offset())
            .width($shell.outerWidth())
            .height($shell.outerHeight())
            .addClass(CLASSES.BASE + 'mask')
            .addClass(SELECTORS.WINNING_MASK)
            .fadeIn(FADE_TIME)
            .appendTo($ROOT_ELEMENT)
        ;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _generateMask($shell, vid, extraClass) {
        console.log('_generateMask');
        var htmlString = '';
        htmlString += '<div class="' + CLASSES.BASE + 'outer-carousel">';
        htmlString += '    <div class="' + CLASSES.BASE + 'inner-carousel">';
        htmlString += '        <ol class="' + CLASSES.BASE + 'thumbnails">';
        htmlString += '        </ol>';
        htmlString += '        <nav class="' + CLASSES.BASE + 'nav ' + CLASSES.BASE + 'nav-prev">&#10142;</nav>';
        htmlString += '        <nav class="' + CLASSES.BASE + 'nav ' + CLASSES.BASE + 'nav-next">&#10142;</nav>';
        htmlString += '    </div>';
        htmlString += '</div>';
        htmlString += '<span class="' + CLASSES.BASE + 'ripeness">' + RIPENESS_STATE.RAW + '</span>';
        htmlString += '<span class="' + CLASSES.BASE + 'settings">&#9881;</span>';

        $('<div />')
            .offset($shell.offset())
            .width($shell.outerWidth())
            .height($shell.outerHeight())
            .addClass(CLASSES.BASE + 'mask')
            .addClass(extraClass)
            .fadeIn(FADE_TIME)
            .attr(ATTRIBUTES.MID, vid)
            .attr(ATTRIBUTES.CAROUSEL_TOGGLE, STATES.OFF)
            .appendTo($ROOT_ELEMENT)
            .html(htmlString)
        ;
    }     

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _getThumbnails(vid, $thumbnails, $nav, accessToken) {
        var assembled_url = API_BASE + _aid + '/videos?video_id=' + vid + '&fields=thumbnails&token=' + accessToken;
        $.ajax({
            crossDomain: true,
            url: assembled_url, 
            type: 'GET',
            dataType: 'json',
            jsonp: false,
            success: function(data, textStatus, jqXHR) {
                console.log('success');
                var htmlString = '',
                    count = 1
                ;
                $.each(data.videos[0].thumbnails, function(i, thumb) {
                    if (thumb.type !== 'random' && thumb.type !== 'centerframe') {
                        htmlString += '<li style="background-image: url(' + thumb.urls[0] + ');" class="' + CLASSES.BASE + 'thumbnail' + (htmlString === '' ? ' ' + CLASSES.HERO : '') + ' enabled-' + thumb.enabled + '" data-enabled="' + thumb.enabled + '">';
                        htmlString += '    <span class="neonscope-enabled"></span>';
                        htmlString += '    <span class="neonscope-paging">' + count + ' of {{ total }}</span>';
                        htmlString += '    <span class="neonscope-score">' + (thumb.model_score ? parseFloat(Math.round(thumb.model_score * 100) / 100).toFixed(2) : 'n/a') + '</span>';
                        htmlString += '</li>';
                        count++;
                    }
                    else {
                        console.log('Ignoring ' + thumb.type);
                    }
                });
                $thumbnails.html(htmlString.replace(/{{ total }}/g, count - 1));
                $thumbnails.fadeIn(FADE_TIME, function() {
                    $nav.fadeIn(FADE_TIME);
                });
            },
            error: function(qXHR, textStatus, errorThrown) {
                console.log('error');
                $thumbnails.fadeIn(FADE_TIME);
            },
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _toggleHandlers(flag, accessToken) {
        console.log('_toggleHandlers');
        if (flag) {

            // 1
            $ROOT_ELEMENT.on('click', '.' + CLASSES.BASE + 'settings', function(e) {
                var $shell = $(this),
                    $mask = $shell.closest('.' + CLASSES.BASE + 'mask'),
                    vid = $mask.attr(ATTRIBUTES.MID),
                    $carousel = $mask.find('.' + CLASSES.BASE + 'outer-carousel'),
                    $thumbnails = $mask.find('.' + CLASSES.BASE + 'thumbnails'),
                    $nav = $mask.find('.' + CLASSES.BASE + 'nav')
                ;
                if ($mask.attr(ATTRIBUTES.CAROUSEL_TOGGLE) === STATES.ON) {
                    $mask.attr(ATTRIBUTES.CAROUSEL_TOGGLE, STATES.OFF);
                    $nav.fadeOut(FADE_TIME, function() {
                        $thumbnails.fadeOut(FADE_TIME, function() {
                            $carousel.fadeOut(FADE_TIME, function() {
                                $thumbnails.empty();
                            });
                        });
                    });
                }
                else {
                    $mask.attr(ATTRIBUTES.CAROUSEL_TOGGLE, STATES.ON);
                    $carousel.fadeIn(FADE_TIME);
                    _getThumbnails(vid, $thumbnails, $nav, accessToken);
                }
            });

            // 2
            $ROOT_ELEMENT.on('click', '.' + CLASSES.BASE + 'nav-next', function(e) {
                var $shell = $(this),
                    $mask = $shell.closest('.' + CLASSES.BASE + 'mask'),
                    $hero = $mask.find('.' + CLASSES.HERO)
                ;
                $hero.removeClass(CLASSES.HERO);
                if ($hero.next().length > 0) {
                    $hero.removeClass(CLASSES.HERO).next().addClass(CLASSES.HERO);
                }
                else {
                    // go to first
                    $hero.parent().children().first().addClass(CLASSES.HERO);
                }
            });

            // 3
            $ROOT_ELEMENT.on('click', '.' + CLASSES.BASE + 'nav-prev', function(e) {
                var $shell = $(this),
                    $mask = $shell.closest('.' + CLASSES.BASE + 'mask'),
                    $hero = $mask.find('.' + CLASSES.HERO)
                ;
                $hero.removeClass(CLASSES.HERO);
                if ($hero.prev().length > 0) {
                    $hero.removeClass(CLASSES.HERO).prev().addClass(CLASSES.HERO);
                }
                else {
                    // go to first
                    $hero.parent().children().last().addClass(CLASSES.HERO);
                }
            });

            // 4
            $ROOT_ELEMENT.on('click', '.' + CLASSES.BASE + 'enabled', function(e) {
                var $shell = $(this),
                    $thumbnail = $shell.closest('.' + CLASSES.BASE + 'thumbnail')
                ;
                $thumbnail.toggleClass('enabled-true').toggleClass('enabled-false');
                if ($thumbnail.attr('data-enabled') === 'true') {
                    $thumbnail.attr('data-enabled', 'false');
                }
                else {
                    $thumbnail.attr('data-enabled', 'true');
                }
            });
        }
        else {
            // 1
            $ROOT_ELEMENT.off('click', '.' + CLASSES.BASE + 'settings');
            // 2
            $ROOT_ELEMENT.off('click', '.' + CLASSES.BASE + 'nav-prev');
            // 3
            $ROOT_ELEMENT.off('click', '.' + CLASSES.BASE + 'nav-next');
            // 4
            $ROOT_ELEMENT.off('click', '.' + CLASSES.BASE + 'enabled');
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _releaseParticles($root) {
        console.log('_releaseParticles');
        var $neonMasks = $root.find(SELECTORS.MID),
            $neonParticles = $root.find(SELECTORS.PID),
            $neonWinningMasks = $root.find('.' + SELECTORS.WINNING_MASK)
            particles = {}
        ;
        $neonMasks.remove();
        $neonParticles.removeAttr(ATTRIBUTES.PID);
        $neonWinningMasks.remove();
        return particles;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _captureParticles($root) {
        console.log('_captureParticles');
        var $neonImages = $root.find(SELECTORS.FOREGROUND),
            $neonBackgroundImages = $root.find(SELECTORS.BACKGROUND),
            $neonForegroundWinningImages = $root.find(SELECTORS.WINNING_FOREGROUND.replace(/{{ winning_selector }}/g, _winningSelector)),
            $neonBackgroundWinningImages = $root.find(SELECTORS.WINNING_BACKGROUND.replace(/{{ winning_selector }}/g, _winningSelector)),
            particles = {}
        ;
        $neonForegroundWinningImages.each(function() {
            var $shell = $(this);
            _generateWinningMask($shell);
        });
        $neonBackgroundWinningImages.each(function() {
            var $shell = $(this);
            _generateWinningMask($shell);
        });
        $neonImages.each(function() {
            var $shell = $(this),
                particleURL = _getParticleURL($shell),
                vid = _getParticleVID(particleURL)
            ;
            if (vid !== undefined) {
                _generateMask($shell, vid, '-' + CLASSES.BASE + TYPES.FOREGROUND + '-image');    
                _markParticle($shell, vid);
                particles[vid] = {
                    url: particleURL,
                    type: TYPES.FOREGROUND,
                    state: RIPENESS_STATE.RAW,
                    vid: vid
                };
            }
            
        });
        $neonBackgroundImages.each(function() {
            var $shell = $(this),
                particleURL = _getParticleURL($shell),
                vid = _getParticleVID(particleURL)
            ;
            if (vid !== undefined) {
                _generateMask($shell, vid, '-' + CLASSES.BASE + TYPES.BACKGROUND + '-image');
                _markParticle($shell, vid);
                particles[vid] = {
                    url: particleURL,
                    type: TYPES.BACKGROUND,
                    state: RIPENESS_STATE.RAW,
                    vid: vid
                };
            }
        });
        return particles;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    return {

        // Public

        pushRipenessState: function(args) {
            var state = args.state,
                vid = args.vid,
                $masks = $('*[' + ATTRIBUTES.MID + '="' + vid + '"]')
            ;
            $masks.each(function() {
                var $shell = $(this);
                $shell.find('.' + CLASSES.BASE + 'ripeness').text(state);
            });
            return {
                vid: vid
            }
        },

        loginRequest: function(args) {
            console.log('loginRequest');
            chrome.storage.sync.get({ neonscopeUsername: '', neonscopePassword: '', neonscopeAid: '', neonscopeWinningSelector: '' }, function(items) {
                var username = items.neonscopeUsername,
                    password = items.neonscopePassword,
                    _winningSelector = items.neonscopeWinningSelector,
                    _aid = items.neonscopeAid,
                    assembled_url = AUTH_BASE + 'authenticate?username=' + username + '&password=' + password
                ;
                $.ajax({
                    url: assembled_url,
                    type: 'POST',
                    success: function(data, textStatus, jqXHR) {
                        console.log('success');
                        loginResponse = {
                            accessToken: data.access_token,
                            refreshToken: data.refresh_token,
                            message: 'OK'
                        };
                        chrome.runtime.sendMessage({ method: 'loginResponse', data: loginResponse });
                    },
                    error: function(qXHR, textStatus, errorThrown) {
                        console.log('error');
                        loginResponse = {
                            accessToken: '',
                            refreshToken: '',
                            message: 'Could not login'
                        };
                        chrome.runtime.sendMessage({ method: 'loginResponse', data: loginResponse });
                    }
                });
            });
        },

        init: function() {
            console.log('init');
            if (!chrome.runtime.onMessage.hasListeners()) {
                console.log('listening');
                chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
                    var data = {};
                    if (ACCELERATOR.hasOwnProperty(request.method)) {
                        data = ACCELERATOR[request.method](request.args);
                    }
                    sendResponse({ data: data });
                    return true;
                });
            }
        },

        render: function(args) {
            console.log('render');
            var particles = {},
                power = args.power,
                accessToken = args.accessToken
            ;
            if (power === false) {
                particles = _releaseParticles($ROOT_ELEMENT);
                _unwatch(accessToken);
            }
            else {
                particles = _captureParticles($ROOT_ELEMENT);
                _watch(accessToken);
            }
            return {
                particles: particles
            };
        },

    };

    return true;

})();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

console.log('entry point');
ACCELERATOR.init();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
