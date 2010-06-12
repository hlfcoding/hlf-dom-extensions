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
    $.hlf.snapper = {
        opt: {
            snapAlongX: true,
            snapAlongY: false,
            snap: true,
        }
    }
    //---------------------------------------
    // FACTORY
    //---------------------------------------
    var instances = [];
    //---------------------------------------
    // CLASSES
    //---------------------------------------
    var Tip = function ($context, $triggers, opt) {
        //---------------------------------------
        // PRIVATE VARIABLES
        //---------------------------------------
        var self = this
            
            ;
        //---------------------------------------
        // PRIVATE METHODS
        //---------------------------------------
        var moveTip = function () {
            
        }
        var displayTip = function () {
            
        }
        //---------------------------------------
        // PUBLIC METHODS
        //---------------------------------------
        $.extend(self, {
            init: function () {
                $trigger.each(function () {
                    
                });
            },
            display: function () {
                
            }
        });
        self.init();
    };
    var Snapper = function ($context, $triggers, opt) {
        //---------------------------------------
        // PRIVATE VARIABLES
        //---------------------------------------
        var self = this
            
            ;
        //---------------------------------------
        // PRIVATE METHODS
        //---------------------------------------
        $.extend(self, {
            
            display: function () {
                
            }
        });
        self.init();
    }
        
    // one tip per context
    // links the tip to everything selected
    $.fn.hlfTip = function ($context, opt) {
        $context = $context || $('body');
        var instance = $.data($context, 'hlfTip');
        if (instance) {
            return instance;
        }
        opt = $.extend({}, $.hlf.tip.conf)
        var $triggers = $(this);
        instance = new Tip($context, $triggers, opt);
        $.extend(instance, new Snapper($context, $triggers, opt));
        $.data($context, 'hlfTip', instance);
        $context.attr('data-tip', 'hlfTip');
    }
})(jQuery);

        
