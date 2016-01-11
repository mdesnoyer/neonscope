// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

var ACCELERATOR = ACCELERATOR || (function() {

    var _self = this,
        _observer,
        _accountId,
        _winningSelector,
        $ROOT_ELEMENT = $(ROOT_ELEMENT)
    ;

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _watch(accessToken) {
        beacon('_watch');
        _self._observer = _self._observer || new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var addedNodes = mutation.addedNodes;
                if (addedNodes) {
                    var $addedNodes = $(addedNodes);
                    $addedNodes.each(function() {
                        beacon('addedNode');
                        var $shell = $(this);
                        if (
                            $shell.hasClass(CLASSES.BASE + 'thumbnail')
                            || $shell.hasClass(CLASSES.BASE + 'ripeness')
                            || $shell[0].nodeType === TEXT_NODE
                        ) {
                            // ignore
                            beacon('Ignoring');
                        }
                        else {
                            var addedParticles = _captureParticles($shell);
                            if (Object.keys(addedParticles).length > 0) {
                                beacon('Sending particles');
                                chrome.runtime.sendMessage({ method: 'newParticles', data: addedParticles });
                            }
                            else {
                                beacon('Found no particles');
                            }
                        }
                    });
                }
            });
        });
        _self._observer.observe(document.querySelector(ROOT_ELEMENT), { childList: true, subtree: true });
        _toggleHandlers(true, accessToken);
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _unwatch(accessToken) {
        if (_self._observer !== undefined) {
            _self._observer.disconnect();
        }
        _toggleHandlers(false, accessToken);
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _markParticle($particle, vid) {
        $particle.attr(HTML_ATTRIBUTES.PID, vid);
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
        beacon('_generateWinningMask');
        $('<div />')
            .offset($shell.offset())
            .width($shell.outerWidth())
            .height($shell.outerHeight())
            .addClass(CLASSES.BASE + 'mask')
            .addClass(JQUERY_SELECTORS.WINNING_MASK)
            .fadeIn(FADE_TIME)
            .appendTo($ROOT_ELEMENT)
        ;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _generateMask($shell, vid, extraClass) {
        beacon('_generateMask');
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
            .attr(HTML_ATTRIBUTES.MID, vid)
            .attr(HTML_ATTRIBUTES.RIPENESS, RIPENESS_STATE.RAW)
            .attr(HTML_ATTRIBUTES.CAROUSEL_TOGGLE, CAROUSEL_STATE.OFF)
            .appendTo($ROOT_ELEMENT)
            .html(htmlString)
        ;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function formatModelScore(score) {
        return score ? parseFloat(Math.round(score * 100) / 100).toFixed(2) : 'n/a';
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function formatNeonscopePercentage(num, decimalPlaces) {
        return num ? (parseFloat(num) * 100).toFixed(decimalPlaces) : 'n/a';
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function formatCTR(ctr) {
        return formatNeonscopePercentage(ctr, 2);
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function formatServingFrac(servingFrac) {
        return formatNeonscopePercentage(servingFrac, 2);
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _getThumbnails(vid, $thumbnails, $nav, accessToken) {
        if (_self._accountId === undefined) {
            debugger;
        }
        var assembled_url = API_BASE + _self._accountId + '/videos?video_id=' + vid + '&fields=thumbnails&token=' + accessToken;
        beacon('Hitting URL: ' + assembled_url);
        $.ajax({
            crossDomain: true,
            url: assembled_url,
            type: 'GET',
            dataType: 'json',
            jsonp: false,
            success: function(data, textStatus, jqXHR) {
                beacon('success');
                var htmlString = '',
                    count = 1
                ;
                $.each(data.videos[0].thumbnails, function(i, thumb) {
                    if (thumb.type !== 'random' && thumb.type !== 'centerframe') {
                        htmlString += '<li data-key="' + i + '" style="background-image: url(' + thumb.urls[0] + ');" class="' + CLASSES.BASE + 'thumbnail' + (htmlString === '' ? ' ' + CLASSES.HERO : '') + ' enabled-' + thumb.enabled + '" data-enabled="' + thumb.enabled + '">';
                        htmlString += '    <span class="' + CLASSES.BASE + 'enabled"></span>';
                        htmlString += '    <span class="' + CLASSES.BASE + 'paging">' + count + ' of {{ total }}</span>';
                        htmlString += '    <span class="' + CLASSES.BASE + 'score" title="Model Score">' + formatModelScore(thumb.model_score) + '</span>';
                        htmlString += '    <span class="' + CLASSES.BASE + 'serving-frac" title="Serving Fraction"></span>';
                        htmlString += '    <span class="' + CLASSES.BASE + 'ctr" title="Click-through rate"></span>';
                        htmlString += '</li>';
                        count++;
                    }
                    else {
                        beacon('Ignoring ' + thumb.type);
                    }
                });
                $thumbnails.html(htmlString.replace(/{{ total }}/g, count - 1));
                $thumbnails.fadeIn(FADE_TIME, function() {
                    $nav.fadeIn(FADE_TIME);
                });
            },
            error: function(qXHR, textStatus, errorThrown) {
                beacon('error');
                $thumbnails.fadeIn(FADE_TIME);
            }
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _toggleHandlers(flag, accessToken) {
        beacon('_toggleHandlers');
        if (flag) {

            // 1
            $ROOT_ELEMENT.on('click', '.' + CLASSES.BASE + 'settings', function(e) {
                var $shell = $(this),
                    $mask = $shell.closest('.' + CLASSES.BASE + 'mask'),
                    vid = $mask.attr(HTML_ATTRIBUTES.MID),
                    $carousel = $mask.find('.' + CLASSES.BASE + 'outer-carousel'),
                    $thumbnails = $mask.find('.' + CLASSES.BASE + 'thumbnails'),
                    $nav = $mask.find('.' + CLASSES.BASE + 'nav')
                ;
                if ($mask.attr(HTML_ATTRIBUTES.CAROUSEL_TOGGLE) === CAROUSEL_STATE.ON) {
                    $mask.attr(HTML_ATTRIBUTES.CAROUSEL_TOGGLE, CAROUSEL_STATE.OFF);
                    $nav.fadeOut(FADE_TIME, function() {
                        $thumbnails.fadeOut(FADE_TIME, function() {
                            $carousel.fadeOut(FADE_TIME, function() {
                                $thumbnails.empty();
                            });
                        });
                    });
                }
                else {
                    $mask.attr(HTML_ATTRIBUTES.CAROUSEL_TOGGLE, CAROUSEL_STATE.ON);
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
        beacon('_releaseParticles');
        var $neonMasks = $root.find(JQUERY_SELECTORS.MID),
            $neonParticles = $root.find(JQUERY_SELECTORS.PID),
            $neonWinningMasks = $root.find('.' + JQUERY_SELECTORS.WINNING_MASK)
            particles = {}
        ;
        $neonMasks.remove();
        $neonParticles.removeAttr(HTML_ATTRIBUTES.PID);
        $neonWinningMasks.remove();
        return particles;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _captureParticles($root) {
        beacon('_captureParticles');
        var $neonImages = $root.find(JQUERY_SELECTORS.FOREGROUND),
            $neonBackgroundImages = $root.find(JQUERY_SELECTORS.BACKGROUND),
            $neonForegroundWinningImages = $root.find(JQUERY_SELECTORS.WINNING_FOREGROUND.replace(/{{ winning_selector }}/g, _self._winningSelector)),
            $neonBackgroundWinningImages = $root.find(JQUERY_SELECTORS.WINNING_BACKGROUND.replace(/{{ winning_selector }}/g, _self._winningSelector)),
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
                    vid: vid,
                    url: particleURL,
                    type: TYPES.FOREGROUND,
                    state: RIPENESS_STATE.RAW,
                    thumbnails: {}
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
                    vid: vid,
                    url: particleURL,
                    type: TYPES.BACKGROUND,
                    state: RIPENESS_STATE.RAW,
                    thumbnails: {}
                };
            }
        });
        return particles;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    return {

        pushParticleRipenessState: function(args) {
            var particle = args.particle,
                vid = particle.vid
            ;
            var $masks = $('*[' + HTML_ATTRIBUTES.MID + '="' + particle.vid + '"]');
            $masks.each(function() {
                var $shell = $(this);
                $shell.find('.' + CLASSES.BASE + 'ripeness').text(particle.state);
                $shell.attr(HTML_ATTRIBUTES.RIPENESS, particle.state);
                if (particle.state === RIPENESS_STATE.COOKED) {
                    var $thumbnails = $shell.find('.' + CLASSES.BASE + 'thumbnail');
                    $thumbnails.each(function() {
                        var $shell = $(this),
                            key = $shell.attr('data-key'),
                            ctr = formatCTR(particle.statistics[key].ctr),
                            servingFrac = formatServingFrac(particle.statistics[key].serving_frac)
                        ;
                        $shell.find('.' + CLASSES.BASE + 'ctr').fadeOut(FADE_TIME, function() {
                            var $shell = $(this);
                            $shell.text(ctr).fadeIn(FADE_TIME); 
                        });
                        $shell.find('.' + CLASSES.BASE + 'serving-frac').fadeOut(FADE_TIME, function() {
                            var $shell = $(this);
                            $shell.text(servingFrac).fadeIn(FADE_TIME);
                        });
                    });
                }
            });
            return false;
        },

        loginRequest: function(args) {
            beacon('loginRequest');
            chrome.storage.sync.get({ neonscopeUsername: '', neonscopePassword: '', neonscopeAccountId: '', neonscopeWinningSelector: '' }, function(items) {
                var username = items.neonscopeUsername,
                    password = items.neonscopePassword,
                    assembled_url = AUTH_BASE + 'authenticate?username=' + username + '&password=' + password
                ;
                _self._winningSelector = items.neonscopeWinningSelector;
                _self._accountId = items.neonscopeAccountId;
                beacon('Hitting URL: ' + assembled_url);
                $.ajax({
                    url: assembled_url,
                    type: 'POST',
                    success: function(data, textStatus, jqXHR) {
                        beacon('success');
                        loginResponse = {
                            accessToken: data.access_token,
                            refreshToken: data.refresh_token,
                            message: 'OK'
                        };
                        chrome.runtime.sendMessage({ method: 'loginResponse', data: loginResponse });
                    },
                    error: function(qXHR, textStatus, errorThrown) {
                        beacon('error');
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
            beacon('init');
            if (!chrome.runtime.onMessage.hasListeners()) {
                beacon('listening');
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
            beacon('render');
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

ACCELERATOR.init();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
