/**
 * Tooltip Widget
 * @author Peng Wang <peng@pengxwang.com>
 * @version 1.2
 * @requires jQuery 1.4+
 * @package jQuery.hlf
 * @subpackage jQuery.hlf.tip
**/
;(function ($) {
    var log = function(x) { console.log(x); };
    // log = $.noop; // comment to start debugging
    //---------------------------------------
    // STATIC VARIABLES
    //---------------------------------------
    $.extend(true, $, {
        // $.hlf.tip
        hlf: { tip: { 
            opt: {
                // direction: '',
                // millis
                inDuration: 300,
                inDelay: 0,
                outDuration: 300,
                outDelay: 500,
                // pixels
                cursorHeight: 16,
                // class names
                innerClass: 'inner',
                contentClass: 'content',
                stemClass: 'stem',
                northClass: 'north',
                eastClass: 'east',
                southClass: 'south',
                westClass: 'west',
                followClass: 'tip-follow',
                tipClass: 'tip'
            }
        }}
    });
    /**
     * Base Tip
     * prevents hover queueing
     * slots for display and movement
     * @todo truemouseenter sometimes doesn't fire when moving to adjacent trigger
    **/
    var Tip = function ($context, $triggers, opt) {
        //---------------------------------------
        // PRIVATE VARIABLES / CONSTRUCTOR
        //---------------------------------------
        var $tip,
            $trigger, $triggerP,
            visibility,
            wakeCountdown,
            sleepCountdown,
            self = this;
        //---------------------------------------
        // PRIVATE METHODS
        //---------------------------------------
        /**
         * Remove the title attribute to disable the default tooltip
         * Store the content in a data attribute for future access by the tip
         * @see hydrateTip
         */
        var saveTriggerContent = function ($trigger) {
            title = $trigger.attr('title');
            if (title) {
                $trigger.data('hlfTipContent', title)
                        .attr('data-tip-content', 'hlfTipContent')
                        .removeAttr('title');
            }
        };
        /**
         * Link the trigger to the tip for 
         * 1 - mouseenter, mouseleave (uses special events)
         * 2 - mousemove
         */
        var bindTrigger = function ($trigger) {
            $trigger.bind({
                'truemouseenter.hlf.tip': function (evt) {
                    self.wake($trigger);
                }, 'truemouseleave.hlf.tip': function (evt) {
                    self.sleep($trigger);
                }
            });
            if (self.doFollow) {
                $trigger.bind('mousemove.hlf.tip', onMouseMove);
            }
        };
        /** 
         * Link the tip to the trigger for 
         * 1 - mouseenter, mouseleave
         */
        var bindTip = function ($trigger) {
            $tip.bind({
                'mouseenter.hlf.tip': function (evt) {
                    log('enter tip');
                    $trigger.data('activeState', true);
                }, 'mouseleave.hlf.tip': function (evt) {
                    log('leave tip');
                    $trigger.data('activeState', false);
                }
            });
        }
        /**
         * Default HTML Template
         */
        var renderDefaultTip = function () {
            var builder = [],
                html;
            builder.push('<div class="', $.trim([opt.tipClass, opt.followClass].join(' ')), '">');
            builder.push('<div class="', opt.innerClass, '">');
            if (self.doStem) {
                builder.push('<div class="', opt.stemClass, '">');
                builder.push('</div>');
            }
            builder.push('<div class="', opt.contentClass, '">');
            builder.push('</div>');
            builder.push('</div>', '</div>');
            html = builder.join('');
            return html;
        };
        /**
         * Create and insert the jQuery element 
         * Hook for custom template
         */
        var renderTip = function ($trigger) {
            if ($tip.html && $tip.html().length > 0) {
                return;
            }
            var html = self.onRender(),
                isCustom = (html.length > 0);
            if (!isCustom) {
                html = renderDefaultTip();
            } 
            $tip = $(html);
            if (isCustom) {
                $tip.addClass(opt.followClass);
            }
            $tip.prependTo($context);
        };
        /** 
         * Update tip position
         * Hook for custom positioning
         */
        var positionTip = function ($trigger) {
            var offset = $trigger.offset();
            offset = self.onPosition(offset);
            if (self.doFollow) {
                $trigger.trigger('mousemove.hlf.tip');
                return;
            }
            // default adjustment
            offset.top += opt.cursorHeight;
            $tip.css(offset);
            log('positionTip');
        };
        /** 
         * Take stored data 
         * @see saveTriggerContent
         */
        var hydrateTip = function ($trigger) {
            var content = $trigger.data('hlfTipContent');
            $tip.find("." + opt.contentClass).text(content);
        };
        /** 
         * 
         */
        var checkBounds = function (position) {
            
        };
        //---------------------------------------
        // EVENT HANDLERS
        //---------------------------------------
        var onMouseMove = function (evt) {
            if (evt.pageX === undefined) {
                return;
            }
            // #HACK
            if (self.isAsleep()) {
                self.wake($(evt.target));
            }
            var offset = {
                top: evt.pageY,
                left: evt.pageX
            };
            offset = self.onMouseMove(evt, offset);
            offset.top += opt.cursorHeight;
            $tip.css(offset);
            log('onMouseMove');
        };        
        $.extend(self, {
            //---------------------------------------
            // PUBLIC VARIABLES
            //---------------------------------------
            doStem: true,
            doFollow: true,
            //---------------------------------------
            // PUBLIC METHODS
            //---------------------------------------
            init: function () {
                $tip = $('<div>');
                self.doStem = (opt.stemClass !== '');
                self.doFollow = (opt.followClass !== '' && opt.cursorHeight > 0);
                $triggers.each(function () {
                    var $t = $(this);
                    saveTriggerContent($t);
                    bindTrigger($t);
                    bindTip($t);
                });
                renderTip();
            },
            getOptions: function () {
                return opt;
            },
            getTip: function () {
                return $tip;
            },
            isAwake: function () {
                return visibility === 'truevisible';
            },
            isAsleep: function () {
                return visibility === 'truehidden';
            },
            wake: function ($trigger) {
                if ($trigger !== $triggerP) {
                    hydrateTip($trigger);
                    positionTip($trigger);
                }
                wakeCountdown = setTimeout(function () {
                    clearTimeout(sleepCountdown);
                    if (self.isAwake()) {
                        return;
                    }
                    self.onShow();
                    $tip.fadeIn(opt.inDuration, function () {
                        visibility = 'truevisible';
                        self.afterShow();
                    });
                }, opt.inDelay);
            },
            sleep: function ($trigger) {
                if ($trigger !== $triggerP) {
                    $triggerP = $trigger;
                }
                sleepCountdown = setTimeout(function () {
                    clearTimeout(wakeCountdown);
                    if (self.isAsleep()) {
                        return;
                    }
                    self.onHide();
                    $tip.fadeOut(opt.outDuration, function () {
                        visibility = 'truehidden';
                        self.afterHide();
                    });
                }, opt.outDelay);
            },
            //---------------------------------------
            // EXTENSION SLOTS
            //---------------------------------------
            onShow: function () {},
            onHide: function () {},
            afterShow: function () {},
            afterHide: function () {},
            onRender: function (content) { return ''; },
            onPosition: function (offset) { return offset; },
            onMouseMove: function (evt, offset) { return offset; }
        });
        self.init();
    };
    // one tip per context
    // links the tip to everything selected
    $.fn.hlfTip = function (opt, $context) {
        $context = $context || $('body');
        var instance = $context.data('hlfTip');
        if (instance) {
            return instance;
        }
        opt = $.extend({}, $.hlf.tip.opt, opt);
        // instantiate
        instance = new Tip($context, this, opt);
        $context.data('hlfTip', instance);
        // other
        $context.attr('data-tip', 'hlfTip');
        return this;
    };

})(jQuery);
(function ($) {
    var log = function(x) { console.log(x); };
    // log = $.noop; // comment to start debugging
    //---------------------------------------
    // STATIC VARIABLES
    //---------------------------------------
    $.extend(true, $, { 
        // $.mouse
        mouse: {
            x: {current: 0, previous: 0},
            y: {current: 0, previous: 0},
            hoverIntentSensitivity: 8,
            hoverIntentInterval: 300
        }
    });
    //---------------------------------------
    // EVENT HANDLERS
    //---------------------------------------
    var checker = function (evt) {
        var $trigger = $(this),
            intentional = $trigger.data('hoverIntent') || true,
            timer = $trigger.data('hoverIntentTimer') || null,
            sensitivity = $trigger.data('hoverIntentSensitivity') || $.mouse.hoverIntentSensitivity,
            interval = $trigger.data('hoverIntentInterval') || $.mouse.hoverIntentInterval,
            mouse = $.mouse;
        // update timer
        $trigger.data('hoverIntentTimer', 
            setTimeout(function () {
                var intentional = ((Math.abs(mouse.x.previous - mouse.x.current) +
                    Math.abs(mouse.y.previous - mouse.y.current)) > sensitivity || 
                    evt.type === 'mouseleave');
                // cache
                mouse.x.previous = evt.pageX;
                mouse.y.previous = evt.pageY;
                $trigger.data('hoverIntent', intentional);
                // go
                if (intentional) {
                    switch (evt.type) {
                        case 'mouseleave':
                            if ($trigger.data('activeState') === true) {
                                log('activeState');
                                return;
                            }
                            clear($trigger);
                            break; 
                    }
                    $trigger.trigger('true'+evt.type);
                    log(evt.type);
                }
                // log('timer');
            }, interval)
        );
        // log('checker');
    };
    var tracker = function (evt) {
        var mouse = $.mouse;
        mouse.x.current = evt.pageX;
        mouse.y.current = evt.pageY;
        // log('tracker');
    };
    //---------------------------------------
    // PRIVATE METHODS
    //---------------------------------------
    var cache = function (evt) {
        evt = evt || false;
        // log('cache');
    };
    var clear = function ($trigger) {
        clearTimeout($trigger.data('hoverIntentTimer'));
        // log('clear');
    }
    $.event.special.truemouseenter = {
        setup: function (data, namespaces) {
            $(this).bind({
               mouseenter: checker,
               mousemove: tracker 
            });
        },
        teardown: function (namespaces) {
            $(this).unbind({
               mouseenter: checker,
               mousemove: tracker 
            });
        }
    };
    $.event.special.truemouseleave = {
        setup: function (data, namespaces) {
            $(this).bind('mouseleave', checker);
        },
        teardown: function (namespaces) {
            $(this).unbind('mouseleave', checker);
        }
    };
})(jQuery);
(function ($) {
    var log = function(x) { console.log(x); };
    log = $.noop; // comment to start debugging
    //---------------------------------------
    // STATIC VARIABLES
    //---------------------------------------
    $.extend(true, $, {
        // $.hlf.tip.snap
        hlf: { tip: { snap: {
            opt: {
                snapClass: 'tip-snap',
                railXClass: 'rail-x',
                railYClass: 'rail-y'
            }
        }}}
    });
    //---------------------------------------
    // CLASSES
    //---------------------------------------
    var SnapTip = function ($context, $triggers, opt) {
        //---------------------------------------
        // PRIVATE VARIABLES / CONSTRUCTOR
        //---------------------------------------
        var self = this,
            tip = $context.data('hlfTip'),
            tipOptions = tip.getOptions(),
            offsetStart;
        //---------------------------------------
        // PRIVATE METHODS
        //---------------------------------------
        var bindTrigger = function ($trigger) {
            $trigger.bind({
                'truemouseenter.hlf.tip': function (evt) {
                    offsetStart = {
                        top: evt.pageX,
                        left: evt.pageY
                    };
                    log('truemouseenter');
                },
                'truemouseleave.hlf.tip': function (evt) {
                    offsetStart = undefined;
                    log('truemouseleave');
                }
            });
        };
        $.extend(self, {
            //---------------------------------------
            // PUBLIC VARIABLES
            //---------------------------------------
            doRailX: true, 
            doRailY: false, 
            doSnap: true,
            //---------------------------------------
            // PUBLIC METHODS
            //---------------------------------------
            init: function () {
                self.doRailX = (opt.railXClass !== '');
                self.doRailY = (opt.railYClass !== '');
                self.doSnap = (opt.snapClass !== '' && (self.doRailX || self.doRailY));
                $triggers.each(function () {
                    var $t = $(this);
                    bindTrigger($t);
                });
                // allow us to extend tip api
                $context.data('hlfTip', tip);
            },
            move: function () {
                
            }
        });
        $.extend(tip, {
            onPosition: function (offset) {
                log('onPosition');
                return offset;
            },
            onMouseMove: function (evt, offset) {
                if (offsetStart === undefined) {
                    return offset;
                }
                if (self.doRailX) {
                    offset.top = offsetStart.top;
                    log('railX');
                } else if (self.doRailY) {
                    offset.left = offsetStart.left;
                    log('railY');
                }
                return offset;
            }
        });
        self.init();
    };
    $.fn.hlfSnapTip = function (opt, $context) {
        $context = $context || $('body');
        var instance = $context.data('hlfSnapTip');
        if (instance) {
            return instance;
        }
        opt = $.extend({}, $.hlf.tip.snap.opt, opt);
        instance = new SnapTip($context, this, opt);
        $context.data('hlfSnapTip', instance);
        $context.attr('data-snap-tip', 'hlfSnapTip');
        return this;
    };
})(jQuery);

        
