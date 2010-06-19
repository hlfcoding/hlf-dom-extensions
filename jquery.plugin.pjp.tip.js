/**
 * Tooltip Widget
 * @author Peng Wang <peng@pengxwang.com>
 * @version 1.2
 * @requires jQuery 1.4+
 * @package jQuery.hlf
 * @subpackage jQuery.hlf.tip
**/
console.log = jQuery.noop; // comment out to start debugging
;(function ($) {
    //---------------------------------------
    // STATIC VARIABLES
    //---------------------------------------
    $.extend(true, $, {
        // $.hlf.tip
        hlf: { tip: { 
            opt: {
                innerClass: 'inner',
                contentClass: 'content',
                stemClass: 'stem',
                northClass: 'north',
                eastClass: 'east',
                southClass: 'south',
                westClass: 'west',
                followClass: 'tip-follow',
                // direction: '',
                cursorHeight: 9,
                tipClass: 'tip'
            }
        }}
    });
    /**
     * Base Tip
     * prevents hover queueing
     * slots for display and movement
    **/
    var Tip = function ($context, $triggers, opt) {
        //---------------------------------------
        // PRIVATE VARIABLES
        //---------------------------------------
        var $tip,
            $trigger, $triggerP,
            self = this;
        //---------------------------------------
        // PRIVATE METHODS
        //---------------------------------------
        var saveTriggerContent = function ($trigger) {
            title = $trigger.attr('title');
            if (title) {
                $trigger.data('hlfTipContent', title)
                        .attr('data-tip-content', 'hlfTipContent')
                        .removeAttr('title');
            }
        };
        var bindTrigger = function ($trigger) {
            $trigger.bind({
                truemouseenter: function (evt) {
                    self.wake($trigger);
                    console.log('truemouseenter');
                },
                truemouseleave: function (evt) {
                    self.sleep($trigger);
                }
            });
            if (self.doFollow) {
                $trigger.bind('mousemove.hlftip', followCursor);
            }
        };
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
            html = self.onRenderDefault(html);
            return html;
        };
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
        var positionTip = function ($trigger) {
            var offset = $trigger.offset(), 
                _offset = offset;
            offset = self.onPosition(offset);
            if (self.doFollow) {
                $trigger.trigger('mousemove');
            } else {
                $tip.css({
                    top: offset.top,
                    left: offset.left
                });
            }
        };
        var hydrateTip = function ($trigger) {
            var content = $trigger.data('hlfTipContent');
            $tip.find("." + opt.contentClass).text(content);
        };
        var followCursor = function (evt) {
            $tip.css({
                top: evt.pageY + opt.cursorHeight,
                left: evt.pageX
            });
        };
        var checkBounds = function (position) {
            
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
                });
                renderTip();
            },
            getTip: function () {
                return $tip;
            },
            wake: function ($trigger) {
                hydrateTip($trigger);
                positionTip($trigger);
                $tip.fadeIn();
            },
            sleep: function ($trigger) {
                $triggerP = $trigger;
                $tip.fadeOut();
            },
            //---------------------------------------
            // EXTENSION SLOTS
            //---------------------------------------
            move: function () {},
            onRender: function (content) { return ''; },
            onRenderDefault: function (html) { return html; },
            onPosition: function (offset) { return offset; }
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
                cache(evt);
                $trigger.data('hoverIntent', intentional);
                if (intentional) {
                    $trigger.trigger('true'+evt.type);
                    switch (evt.type) {
                        case 'mouseleave':
                            clear($trigger);
                            break; 
                    }
                    console.log(evt.type);
                }
                console.log('timer');
            }, interval)
        );
        console.log('checker');
    };
    var tracker = function (evt) {
        var mouse = $.mouse;
        mouse.x.current = evt.pageX;
        mouse.y.current = evt.pageY;
        console.log('tracker');
    };
    //---------------------------------------
    // PRIVATE METHODS
    //---------------------------------------
    var cache = function (evt) {
        evt = evt || false;
        var mouse = $.mouse;
        if (evt) {
            mouse.x.previous = evt.pageX;
            mouse.y.previous = evt.pageY;
        } else {
            mouse.x.previous = mouse.x.current;
            mouse.y.previous = mouse.y.current;
        }
        console.log('cache');
    };
    var clear = function ($trigger) {
        clearTimeout($trigger.data('hoverIntentTimer'));
        console.log('clear');
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
        // PRIVATE VARIABLES
        //---------------------------------------
        var self = this,
            tip
            ;
        //---------------------------------------
        // PRIVATE METHODS
        //---------------------------------------
        $.extend(self, {
            //---------------------------------------
            // PUBLIC VARIABLES
            //---------------------------------------
            doRailX: false, 
            doRailY: false, 
            //---------------------------------------
            // PUBLIC METHODS
            //---------------------------------------
            init: function () {
                tip = $context.data('hlfTip');
                self.doRailX = (opt.railXClass !== '');
                self.doRailY = (opt.railYClass !== '');
            },
            move: function () {
                
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

        
