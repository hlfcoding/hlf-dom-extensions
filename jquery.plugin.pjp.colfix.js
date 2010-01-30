/**
 * PJP CSS Column Fixer
 * equalizes column heights and supports padding and ems
 * NOTE Namespace: $('foo').myPlugin(options{p_foo:bar}) { var myPrivate; }
 * NOTE For conflicting property namespaces: plugin -> p_foo  utility -> u_foo
 * @param       {jQuery object}     one matched grid / set of columns
 * @requires    pjuPxToEm
 * @requires    jQuery 1.2+
 * @package     Peng's JQuery Plugins
 * @subpackage  Peng's WordPress Frontend
 * @version     1.0
 * @author      peng@pengxwang.com
 */

(function ($) /* declaration */ // self-invoking function, jQuery passed as alias
{
    $.fn.pjpColFix = function (options) // assign jQuery prototype custom function
    {	
        /* setup */
        
        var defaults = 
            { min_h:    false
            , max_h:    false
            , use_px:   false
            };
        options = $.extend({}, defaults, options);
        
        /* properties */
        
        var tallest;
        var unit = (options.use_px === false && Number.prototype.pjuPxToEm && IE == false) ? 'em' : 'px';
        
        /* methods */
        
        if (typeof $.fn.pjuFullHeight != 'function') 
        {
            $.fn.pjuFullHeight = function () 
            {
                $this = this;
                // no chaining
                return parseInt($this.height()) 
                    + (parseInt($this.css('padding-top')) 
                        + parseInt($this.css('padding-bottom')))
                    + (parseInt($this.css('border-top-width'))
                        + parseInt($this.css('border-bottom-width')))
                    ;
            };
        }
        
        /* procedure */
        
        var $cols = $(this);
        $cols.bind('columnsReady', function (e) 
            {
                tallest = (options.min_h !== false) ? parseInt(options.min_h) : 0;	
                $cols.each(function (i) 
                    {
                        // trace(i);
                        tallest = Math.max($(this).pjuFullHeight(), tallest);
                    }
                );
                tallest = (options.max_h !== false) ? parseInt(options.max_h) : tallest;
                // trace('pjpColFix :: tallest = ' + tallest + unit);        
                $cols.each(function (i) 
                    {
                        // trace(i);
                        var $col = $(this);
                            // set in relation to individual padding
                        var h = tallest 
                            - (parseInt($col.css('padding-top'))
                                + parseInt($col.css('padding-bottom'))) 
                            ;
                            h = (unit == 'em') ? h.pjuPxToEm({u_scope: $col.parent()}) : h;
                        // trace(h);
                        // trace($this.attr('class'));
                            /* climax */
                        $col.css('height', h + unit);
                    }
                ); // _end each
            }
        ); // _end bind
        if ($cols.find('img').length > 0) // has images
        {	
            var once = false; 
            $cols.find('img').load(function () 
                { 
                    if (once == false) 
                    {
                        $cols.trigger('columnsReady');
                        once = true;
                    }
                }
            ); // _end load
        } 
        else 
        {
            $cols.trigger('columnsReady');
        }
        
        return $cols; // for chaining

    };

/**
 * PJU PxToEm
 * Converter tool for CSS
 * 
 * @param {string} u_scope
 * @param {bool} do_units
 * @param {bool} do_reverse
 * 
 * @requires	jQuery 1.2+
 * @package		Peng's JQuery Utilities
 * @subpackage	Peng's WordPress Frontend
 * @version		1.0
 * @author		peng@pengxwang.com
 */

    Number.prototype.pjuPxToEm = String.prototype.pjuPxToEm = function (options) 
    {	
            /* setup */
        
        var defaults = 
            { u_scope:       $('body') // _lock
            , do_units:      false
            , do_reverse:    false
            };
        options = $.extend({}, defaults, options);
        
            /* properties */
        
        var pxVal = (this == '') ? 0 : parseFloat(this);
        var scopeVal;
        var result;
        
            /* methods */
        
        var getBaseVal = function ($parent) 
        {
            // trace('getBaseVal')
            return parseFloat($parent.css('font-size'));
        };
            
            /* procedure */
        
        scopeVal = getBaseVal(options.u_scope);
        result = (options.do_reverse == true) 
            ? (pxVal * scopeVal).toFixed(2) + ((options.do_units == true) ? 'px' : 0) 
            : (pxVal / scopeVal).toFixed(2) + ((options.do_units == true) ? 'em' : 0)
            ;
        // trace('pjuPxToEm :: result = ' + result);
        return result;
    };

}
)(jQuery);