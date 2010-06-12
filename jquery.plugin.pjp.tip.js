/**
 * Tooltip Widget
 * @author Peng Wang <peng@pengxwang.com>
 * @version 1.2
 * @requires jQuery 1.4+
 * @package jQuery.hlf
 * @subpackage jQuery.hlf.tip
 */

;(function ($) {
    $.hlf = $.hlf || {};
    //---------------------------------------
    // STATIC VARIABLES
    //---------------------------------------
    $.hlf.tip = {
        opt: {
            showTip: true,
            followCursor: true,
            
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
        var self = this,
            $trigger
            ;
        //---------------------------------------
        // PRIVATE METHODS
        //---------------------------------------
        var findTipContent = function ($trigger) {
            title = $trigger.attr('title');
            if (title) {
                return title;
            }
        }
        var displayTip = function () {
            
        }
        //---------------------------------------
        // PUBLIC METHODS
        //---------------------------------------
        $.extend(self, {
            init: function () {
                $triggers.each(function () {
                    var $t = $(this);
                    $t.data('tipContent', findTipContent($t));
                });
            },
            render: function () {
                
            },
            //---------------------------------------
            // EXTENSION SLOTS
            //---------------------------------------
            move: function () {}
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

        
