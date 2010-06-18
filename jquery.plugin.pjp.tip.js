/**
 * Tooltip Widget
 * @author Peng Wang <peng@pengxwang.com>
 * @version 1.2
 * @requires jQuery 1.4+
 * @package jQuery.hlf
 * @subpackage jQuery.hlf.tip
 */
console.log = jQuery.noop;
;(function ($) {
    $.hlf = $.hlf || {};
    //---------------------------------------
    // STATIC VARIABLES
    //---------------------------------------
    $.hlf.tip = {
        opt: {
            showStem: true,
            followCursor: true,
            sClass: 'tip',
            sInnerClass: 'inner',
            sContentClass: 'content',
            sStemClass: 'stem',
            sNorthClass: 'north',
            sEastClass: 'east',
            sSouthClass: 'south',
            sWestClass: 'west'
        }
    };
    //---------------------------------------
    // FACTORY
    //---------------------------------------
    var instances = [];
    /**
     * Base Tip
     * prevents hover queueing
     * slots for display and movement
     */
    var Tip = function ($context, $triggers, opt) {
        //---------------------------------------
        // PRIVATE VARIABLES
        //---------------------------------------
        var $tip = $('<div>'),
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
        };
        var renderDefaultTip = function () {
            var builder = [],
                html;
            builder.push('<div class="', opt.sClass, '">');
            builder.push('<div class="', opt.sInnerClass, '">');
            if (opt.showStem) {
                builder.push('<div class="', opt.sStemClass, '">');            
                builder.push('</div>');            
            }
            builder.push('<div class="', opt.sContentClass, '">');            
            builder.push('</div>');
            builder.push('</div>');
            builder.push('</div>');
            html = builder.join('\n');
            html = self.onRenderDefault(html);
            return html;
        };
        var renderTip = function () {
            if ($tip.html && $tip.html().length > 0) {
                return;
            }
            var html;
            html = self.onRender();
            if (html.length === 0) {
                html = renderDefaultTip();
            }
            $tip = $(html);
            $tip.prependTo($context);
        };
        var positionTip = function ($trigger) {
            var position = $trigger.position();
            $tip.css({
                top: position.top,
                left: position.left
            });
        };
        //---------------------------------------
        // PUBLIC METHODS
        //---------------------------------------
        $.extend(self, {
            init: function () {
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
            isSleeping: function () {
                return true;
            },
            isAwake: function () {
                return true;
            },
            wake: function ($trigger) {
                if (self.isSleeping()) {
                    positionTip($trigger);
                    $tip.fadeIn();
                }
            },
            sleep: function ($trigger) {
                if (self.isAwake) {
                    $triggerP = $trigger;
                    $tip.fadeOut();
                }
            },
            //---------------------------------------
            // EXTENSION SLOTS
            //---------------------------------------
            move: function () {},
            onRender: function () { return ''; },
            onRenderDefault: function (html) { return html; }
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
        instance = new Tip($context, $(this), opt);
        $context.data('hlfTip', instance);
        // other
        $context.attr('data-tip', 'hlfTip');
        instances.push(instance);
        return this;
    };

})(jQuery);
(function ($) {
    //---------------------------------------
    // GLOBALS
    //---------------------------------------
    $.mouse = $.extend(($.mouse || {}), {
        x: {current: 0, previous: 0},
        y: {current: 0, previous: 0},
        hoverIntentSensitivity: 8,
        hoverIntentInterval: 300
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
    if (!$.hlf.tip) {
        return;
    }
    $.hlf.tip.snap = {
        opt: {
            snapAlongX: true,
            snapAlongY: false
        }
    }
    //---------------------------------------
    // CLASSES
    //---------------------------------------
    var SnapTip = function ($context, $triggers, opt) {
        //---------------------------------------
        // PRIVATE VARIABLES
        //---------------------------------------
        var self = this,
            tip = $context.data('hlfTip')
            ;
        //---------------------------------------
        // PRIVATE METHODS
        //---------------------------------------
        //---------------------------------------
        // PUBLIC METHODS
        //---------------------------------------
        $.extend(self, {
            init: function () {
                
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
        instance = new SnapTip($(this), opt);
        $context.data('hlfSnapTip', instance);
        $context.attr('data-snap-tip', 'hlfSnapTip');
        return this;
    };
})(jQuery);

        
