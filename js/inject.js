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
            .addClass(ELEMENT_SELECTORS.WINNING_MASK)
            .fadeIn(FADE_TIME)
            .appendTo($ROOT_ELEMENT)
        ;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _renderCarousel($container, args) {
        beacon('_renderCarousel');
        var result = '';
        $.get('template/mask.mst', function(template) {
            var rendered = Mustache.render(template, args);
            $container.html(rendered);
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _renderThumbnail($container, args) {
        beacon('_renderThumbnail');
        var result = '';
        $.get('template/thumbnail.mst', function(template) {
            var rendered = Mustache.render(template, args);
            $container.append(rendered);
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _generateMask($shell, vid, extraClass) {
        beacon('_generateMask');
        var $newMask = $('<div />')
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
        ;
        _renderCarousel($newMask, {
            baseClass: CLASSES.BASE,
            initialRipenessState: RIPENESS_STATE.RAW
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function getNeonScoreData(score) {
        if (score && !isNaN(score) && (score > 0)) {
            var neonScoresLength = NEONSCORES.length;
            for (var i = 0; i < neonScoresLength; i++) {
                if (score < NEONSCORES[i].modelScore) {
                    return {
                        neonScore: i - 1,
                        emoji: NEONSCORES[i].emoji
                    };
                }
            }
            return {
                neonScore: i - 1,
                emoji: NEONSCORES[i].emoji
            };
        }
        else {
            return {
                neonScore: UNKNOWN_STRING,
                emoji: UNKNOWN_EMOJI
            };
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function formatNeonscopePercentage(num, decimalPlaces) {
        return num ? (parseFloat(num) * 100).toFixed(decimalPlaces) : UNKNOWN_STRING;
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
        var assembledUrl = API_BASE + _self._accountId + '/videos?video_id=' + vid + '&fields=thumbnails&token=' + accessToken;
        beacon('Hitting URL: ' + assembledUrl);
        $.ajax({
            crossDomain: true,
            url: assembledUrl,
            type: 'GET',
            dataType: 'json',
            jsonp: false,
            success: function(data, textStatus, jqXHR) {
                beacon('success');
                var htmlString = '',
                    count = 1,
                    goodThumbnails = []
                ;
                // Quick look to work out what we need to check (and the real count)
                $.each(data.videos[0].thumbnails, function(i, thumb) {
                    if (thumb.type !== 'random' && thumb.type !== 'centerframe') {
                        goodThumbnails.push(thumb);
                    }
                    else {
                        beacon('Ignoring ' + thumb.type);
                    }
                });
                $.each(goodThumbnails, function(i, thumb) {
                    var neonScoreData = getNeonScoreData(thumb.neon_score);
                    _renderThumbnail($thumbnails, {
                        baseClass: CLASSES.BASE,
                        thumbnailId: thumb.thumbnail_id,
                        thumbType: thumb.type,
                        i: i,
                        thumbnailStatus: (thumb.enabled ? THUMBNAIL_STATE.ENABLED : THUMBNAIL_STATE.DISABLED),
                        thumbnailUrl: thumb.url,
                        heroClass: (count === 1 ? CLASSES.HERO : ''),
                        count: count++,
                        total: goodThumbnails.length,
                        neonScoreName: NEONSCORE_NAME,
                        neonScore: neonScoreData.neonScore,
                        emoji: neonScoreData.emoji
                    });
                });
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
            $ROOT_ELEMENT.on('click', '.' + CLASSES.BASE + 'thumbnail-status', function(e) {
                var $shell = $(this),
                    $thumbnail = $shell.closest('.' + CLASSES.BASE + 'thumbnail'),
                    tid = $thumbnail.attr('data-' + CLASSES.BASE + 'tid'),
                    thumbnailStatus = $thumbnail.attr('data-' + CLASSES.BASE + 'thumbnail-status')
                ;
                toggleThumbnail($thumbnail, tid, (thumbnailStatus === THUMBNAIL_STATE.ENABLED ? THUMBNAIL_STATE.DISABLED : THUMBNAIL_STATE.ENABLED), accessToken);
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
            $ROOT_ELEMENT.off('click', '.' + CLASSES.BASE + 'thumbnail-status');
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function toggleThumbnail($thumbnail, tid, newThumbnailStatus, accessToken) {
        if ($thumbnail.attr('data-' + CLASSES.BASE + 'thumbnail-status') === THUMBNAIL_STATE.THINKING) {
            return false;
        }
        $thumbnail.attr('data-' + CLASSES.BASE + 'thumbnail-status', THUMBNAIL_STATE.THINKING);
        $thumbnail.addClass(CLASSES.BASE + 'thumbnail-status-' + THUMBNAIL_STATE.THINKING);
        $thumbnail.removeClass(CLASSES.BASE + 'thumbnail-status-' + THUMBNAIL_STATE.ENABLED + ' ' + CLASSES.BASE + 'thumbnail-status-' + THUMBNAIL_STATE.DISABLED);
        var assembledUrl = API_BASE + _self._accountId + '/thumbnails?thumbnail_id=' + tid + '&enabled=' + (newThumbnailStatus === THUMBNAIL_STATE.ENABLED ? '1' : '0') + '&token=' + accessToken;
        beacon('Hitting URL: ' + assembledUrl);
        $.ajax({
            crossDomain: true,
            url: assembledUrl,
            type: 'PUT',
            contentType: 'application/json',
            success: function(data, textStatus, jqXHR) {
                $thumbnail.attr('data-' + CLASSES.BASE + 'thumbnail-status', newThumbnailStatus);
                $thumbnail.removeClass(CLASSES.BASE + 'thumbnail-status-' + THUMBNAIL_STATE.THINKING).addClass(CLASSES.BASE + 'thumbnail-status-' + newThumbnailStatus)
                console.log('success');
            },
            error: function(qXHR, textStatus, errorThrown) {
                var oldThumbnailStatus = (newThumbnailStatus === THUMBNAIL_STATE.ENABLED ? THUMBNAIL_STATE.DISABLED : THUMBNAIL_STATE.ENABLED);
                $thumbnail.attr('data-' + CLASSES.BASE + 'thumbnail-status', oldThumbnailStatus);
                $thumbnail.removeClass(CLASSES.BASE + 'thumbnail-status-' + THUMBNAIL_STATE.THINKING).addClass(CLASSES.BASE + 'thumbnail-status-' + oldThumbnailStatus)
                console.log('error');
            }
        });
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function _releaseParticles($root) {
        beacon('_releaseParticles');
        var $neonMasks = $root.find(ELEMENT_SELECTORS.MID),
            $neonParticles = $root.find(ELEMENT_SELECTORS.PID),
            $neonWinningMasks = $root.find('.' + ELEMENT_SELECTORS.WINNING_MASK)
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
        var $neonImages = $root.find(ELEMENT_SELECTORS.FOREGROUND),
            $neonBackgroundImages = $root.find(ELEMENT_SELECTORS.BACKGROUND),
            $neonForegroundWinningImages = $root.find(ELEMENT_SELECTORS.WINNING_FOREGROUND.replace(/{{ winning_selector }}/g, _self._winningSelector)),
            $neonBackgroundWinningImages = $root.find(ELEMENT_SELECTORS.WINNING_BACKGROUND.replace(/{{ winning_selector }}/g, _self._winningSelector)),
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
                            key = $shell.attr('data-' + CLASSES.BASE + 'key'),
                            ctr = formatCTR(particle.statistics[key].ctr),
                            servingFrac = formatServingFrac(particle.statistics[key].serving_frac)
                        ;
                        $shell.find('.' + CLASSES.BASE + 'ctr').fadeOut(FADE_TIME, function() {
                            var $shell = $(this);
                            $shell.text(ctr).fadeIn(FADE_TIME); 
                        });
                        $shell.find('.' + CLASSES.BASE + 'serving-fraction').fadeOut(FADE_TIME, function() {
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
                    assembledUrl = AUTH_BASE + 'authenticate?username=' + username + '&password=' + password
                ;
                _self._winningSelector = items.neonscopeWinningSelector;
                _self._accountId = items.neonscopeAccountId;
                beacon('Hitting URL: ' + assembledUrl);
                $.ajax({
                    url: assembledUrl,
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
