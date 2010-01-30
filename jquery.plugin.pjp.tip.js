/**
 * PJP ToolTip 
 * contains PJU Hover function
 * NOTE Namespace: $('foo').myPlugin(options{p_foo:bar}) { var myPrivate; }
 * NOTE For conflicting property namespaces: plugin -> p_foo  utility -> u_foo
 * TODO display inside viewport
 * TODO dynamic dims
 * TODO html formatting via regex parsing
 * TODO don't redraw on adjacent calls
 * TODO jQuery UI compatibility

 * @param       {jQuery object}     set of matched elements
 * @see         http://cherne.net/brian/resources/jquery.hoverIntent.html
 * @requires    jQuery 1.2+
 * @package     Peng's JQuery Plugins
 * @subpackage  Peng's WordPress Frontend
 * @version     1.1
 * @author      peng@pengxwang.com
 */

(function ($) /* declaration */ // self-invoking function, jQuery passed as alias, allows chaining
{
    $.fn.pjpTip = function (options) // assign jQuery prototype custom function
    {
        var defaults = // default implementation is to replace tooltips
            { filters:              undefined // exceptions list
            , p_type:              'attribute' 
            , p_selector_class:    'pjpTipTrigger' // TODO for other content
            , p_attr:              'title'
            , tip_parent:           document.body
            , tip_parent_class:    'pjpTips'
            , tip_id:              'pjpTip'
            , tip_class:           'pjpTip'
            , tip_inner_class:     'wrap'
            , tip_content_class:   'content'
            , tip_stem_class:      'stem'
            , tip_anchor:          ''
            , tip_custom_class:    ''
            , do_stem:              true
            , do_follow:            true
            , do_lock_x:            false
            , do_lock_y:            true
            , do_snap:              true
            , do_snap_side:         false // side instead of corner
            , do_fade:              true
            , fade_in:              200
            , fade_out:             100
            , offset_x:             0
            , offset_y:             0
            , mouse:                8
            , interval:             300
            , timeout:              0
            , always:               ''
            };
        options = $.extend({}, defaults, options); // merge settings
        // checking
        // options.do_lock_y = ! options.do_lock_x;
        if (options.do_lock_x == true) 
        {
            options.do_snap_side = true;
        }
        if (options.do_snap == false) // #hack 
        {
            options.do_snap = true;
        }
        return this.each( function (i) // allow chaining
            {
                // trace(i);
                $this = $(this);
                new $.PJPTip(options, $this);
            }
        );
    }; // _end registration

    /* utilities */

    if (typeof $.pjuHover != 'function') 
    {
        $.pjuHover = function (e, trigger) // default jQuery behavior
        {
            // trace('pjuHover');
            var p = (e.type == "mouseover" ? e.fromElement : e.toElement) 
                || e.relatedTarget;
            while (p && p != trigger) 
            { 
                try { p = p.parentNode; } 
                catch (e) { p = trigger; } 
            }
            if (p == trigger) 
            { 
                return false; 
            }
        };
    }
    if (typeof $.fn.pjuFullWidth != 'function') 
    {
        $.fn.pjuFullWidth = function () 
        {
            $this = this;
            // no chaining
            var width = parseInt($this.width());
            var w_padding = parseInt($this.css('paddingLeft')) + parseInt($this.css('paddingRight'));
            var w_border = parseInt($this.css('borderLeftWidth')) + parseInt($this.css('borderRightWidth'));
            if (w_padding) { width += w_padding; }
            if (w_border) { width += w_border; }
            if ( ! width) { trace('Width failed'); console.info(this); }
            return width;
        };
    }
    if (typeof $.fn.pjuFullHeight != 'function') 
    {
        $.fn.pjuFullHeight = function () 
        {
            $this = this;
            // no chaining
            var height = parseInt($this.height()); 
            var h_padding = parseInt($this.css('paddingTop')) + parseInt($this.css('paddingBottom'));
            var h_border = parseInt($this.css('borderTopWidth')) + parseInt($this.css('borderBottomWidth'));
            if (h_padding) { height += h_padding; }
            if (h_border) { height += h_border; }
            if ( ! height) { trace('Height failed'); console.info(this); }
            return height;
        };
    }
    if (typeof $.pjuScrolled != 'boolean') 
    {
        $.pjuScrolled = false;
        $.pjuResetScrolled = false;
        // #hack
        $(window).scroll(function () { $.pjuScrolled = true; });
    }
    
    /* plugin object */
    
    $.PJPTip = function (options, $trigger) // pseudo-class; separating from plugin scope allows more access
    {   
        /* constants */
        
        var stemClasses = 
            { ne:               'north east northEast'
            , nw:               'north west northWest'
            , se:               'south east southEast'
            , sw:               'south west southWest'
            };
         
        /* properties */
        
        var trigger = // dom element ?
            { myHover: 
                { timer:        undefined
                , state:        false
                }
            , myOffset:         undefined
            , myWidth:          undefined
            , myHeight:         undefined
            };
        var anchor = 
            { myOffset:         undefined
            , myWidth:          undefined
            , myHeight:         undefined
            }
        var tip = // extra layer of organization
            { myContent:        undefined
            , myLeft:           undefined // in relation to <body>
            , myTop:            undefined
            , imSet:            false
            , imPastBottom:     false
            , imPastRight:      false
            , my$:              undefined
            , my$In:            undefined
            , my$Stem:          undefined
            , my$Content:       undefined
            , my$Parent:        undefined
            , myDirection:      undefined
            , myWidth:          undefined
            , myHeight:         undefined
            , myParentWidth:    undefined
            , myParentHeight:   undefined
            , myOffsetX:        undefined
            , myOffsetY:        undefined
            };
        var mouse = 
            { currX:            undefined 
            , currY:            undefined
            , prevX:            undefined
            , prevY:            undefined
            , sensitivity:      options.mouse
            };
        
        /* methods */
        
        var setContent = function () /* called once upon init */
        {
            // trace('setContent');
            switch (options.p_type) 
            {
                case 'attribute':
                        // get
                    tip.myContent = $trigger.attr(options.p_attr);
                    $trigger.attr(options.p_attr, ''); // prevent default in ALL cases
                        // exit cases
                    if (tip.myContent == '') { return false; } // no content
                    if (options.filters && $trigger.is(options.filters)) { return false; } // is an exception
                        // prevent children
                    $trigger.find('*[' + options.p_attr + ']').attr(options.p_attr, '');
                    
                break; case 'selector': // TODO for other content
                
                    
                
                break;
            }
        };
        var checkMouse = function (pE) /* crux of smart-hover */
        {
            // trace('checkMouse');
            trigger.myHover.timer = clearTimeout(trigger.myHover.timer);
            if ((Math.abs(mouse.prevX - mouse.currX) + Math.abs(mouse.prevY - mouse.currY)) < mouse.sensitivity) 
                // if mouse is moving fast enough
            {
                trigger.myHover.state = true;
                drawTip(pE);
            } 
            else 
            {
                cacheMouse();
                setCheck(pE);
            }
        };
        var setCheck = function (pE) /* checking helper */
        {
            // trace('setCheck');
            trigger.myHover.timer = setTimeout( 
                function () { checkMouse(pE); },  
                options.interval
            );
        };
        var cacheMouse = function (pE) /* checking helper */
        {
            // trace('cacheMouse');
            if (pE) {
                mouse.prevX = pE.pageX;
                mouse.prevY = pE.pageY;
            } 
            else 
            {
                mouse.prevX = mouse.currX;
                mouse.prevY = mouse.currY;
            }
        };
        var trackMouse = function (e) /* constantly monitors input */
        {
            // trace('trackMouse');
            mouse.currX = e.pageX;
            mouse.currY = e.pageY;
            if (tip.imSet == true) 
            {
                moveTip(e); // pE            
            }
        };
        var drawTip = function (pE) /* the over function, injects html */ // only done once per show event
        { 
            // trace('drawTip');
            // parent
            tip.my$Parent = $(options.tip_parent);
            // tip
            tip.my$ = $('<div></div>')
                .appendTo(options.tip_parent)
                .html(tip.myContent)
                .attr(
                    { id: options.tip_id
                    , className: options.tip_class + ' ' + options.tip_custom_class
                    }
                )
                .mouseover(handleTipHover).mouseout(handleTipHover) // hack in case tip is over trigger
                .appendTo(options.tip_parent)
                .hide()
                ;
            // wrap
            tip.my$In = tip.my$ // set and return
                .wrapInner('<div><div></div></div>')
                .children('div')
                    .attr('class', options.tip_inner_class)
                ;
            // content
            tip.my$Content = tip.my$In
                .children('div')
                    .attr('class', options.tip_content_class)
                ;
            // stem
            if (options.do_stem == true) 
            {
                tip.my$Stem = tip.my$In // set and return
                    .prepend('<div>&nbsp;</div>')
                    .children('div')
                        .not('.' + options.tip_content_class)
                        .addClass(options.tip_stem_class)
                        .empty();
                ;
            }
            // set initial css position
            checkScreenBounds(pE);
            // add classes
            tip.my$In.addClass(stemClasses[tip.myDirection]);
            if (options.do_snap == true && ! IE) 
            {
                var classAppend = (options.do_snap_side == true) ? 'Side' : '';
                if (options.do_lock_y == true) 
                {
                    tip.my$.addClass('snapY' + classAppend);
                }
                else if (options.do_lock_x == true)
                {
                    tip.my$.addClass('snapX' + classAppend);
                }
                // for easy css writing
                tip.my$Parent.addClass(options.tip_parent_class);
            }
            else 
            {
                tip.my$Stem.remove();
            }
            // jquery-only css
            // max-width
            if (tip.my$In.css('max-width') 
                && parseInt(tip.my$In.width()) >= parseInt(tip.my$In.css('max-width'))) 
            {
                tip.my$In.css('width', parseInt(tip.my$In.css('max-width')));
            }
            // position
            moveTip(pE);
            // draw with fade
            if (options.do_fade == true) 
            { 
                tip.my$.hide().fadeIn(options.fade_in); 
            }
            else 
            {
                tip.my$.show();
            }
            // done
            tip.imSet = true;
        };
        var checkScreenBounds = function(pE) /* adjusts tip position if out of bounds */ // only done once per show event
        {
            // set
            positionTip(pE);
            // smart
            // set tip
            if (tip.myHeight == undefined) 
            {
                tip.myHeight = tip.my$.pjuFullHeight();
            }
            if (tip.myWidth == undefined) 
            {
                tip.myWidth = tip.my$.pjuFullWidth();
            }
            // set tip parent
            if (tip.myParentHeight == undefined) 
            {
                tip.myParentHeight = tip.my$Parent.pjuFullHeight(); 
            }
            if (tip.myParentWidth == undefined) 
            {
                tip.myParentWidth = tip.my$Parent.pjuFullWidth();
            }
            // set anchor
            var thisAnchor, $thisAnchor;
            if (options.tip_anchor != '') 
            {
                thisAnchor = anchor;
                $thisAnchor = $trigger.parents().filter(options.tip_anchor);
                // trace($thisAnchor);
            }
            else 
            {
                thisAnchor = trigger;
                $thisAnchor = $trigger;
            }
            if (thisAnchor.myHeight == undefined) 
            {
                thisAnchor.myHeight = $thisAnchor.pjuFullHeight();
            }
            if (thisAnchor.myWidth == undefined) 
            {
                thisAnchor.myWidth = $thisAnchor.pjuFullWidth();
            }
            // and trace
            // base
            tip.myOffsetY = (options.do_snap == true)
                ? ((options.do_lock_y == false) 
                    ? ((options.do_lock_x == false || options.do_snap_side == false) 
                        ? options.offset_y // yes snapping, no lock_y, no_lock_x
                        : -9 -(tip.myHeight / 2)) // yes snapping, no lock_y, yes snap_side #hack #temp
                        // : -((tip.myHeight + thisAnchor.myHeight) / 2)) // yes snapping, no lock_y, yes snap_side 
                    : thisAnchor.myHeight + options.offset_y) // yes snapping, yes lock_y
                : options.offset_y; // no snapping
            tip.myOffsetX = (options.do_snap == true) 
                ? ((options.do_lock_x == false) 
                    ? ((options.do_lock_y == false || options.do_snap_side == false) 
                        ? options.offset_x 
                        : -(tip.myWidth / 2)) 
                    : thisAnchor.myWidth + options.offset_x) 
                : options.offset_x;
            // and trace
            // trace('y offset: ' + (tip.myTop + tip.myHeight + tip.myOffsetY));
            // trace('x offset: ' + (tip.myLeft + tip.myWidth + tip.myOffsetX));
            // check bounds
            tip.imPastBottom = ((tip.myTop + tip.myHeight + tip.myOffsetY) > tip.myParentHeight);
            tip.imPastRight = ((tip.myLeft + tip.myWidth + tip.myOffsetX) > tip.myParentWidth);
            if (options.always == 'top') 
            {
                tip.imPastBottom = true;
            }
            if (options.always == 'left') 
            {
                tip.imPastRight = true;
            }
            // and trace
            // trace('past bottom' + tip.imPastBottom);
            // trace('past right' + tip.imPastRight);
            // exception for snapped side
            // TODO - keep inside window
            if (options.do_snap_side == true) 
            {
                if (options.do_lock_x == true) 
                {
                    tip.imPastBottom = false;
                }
                if (options.do_lock_y == true) 
                {
                    tip.imPastRight = false;
                }
            }
            if (IE && options.do_snap == false) // #hack
            {
                tip.imPastBottom = false;
            }
            // change classes accordingly
            if (tip.myDirection == undefined || $.pjuScrolled == true) 
            {
                $.pjuResetScrolled = true;
                switch (true) 
                {
                    case (tip.imPastBottom && tip.imPastRight):
                        tip.myDirection = 'nw';
                    break; case (tip.imPastBottom):
                        tip.myDirection = 'ne';
                    break; case (tip.imPastRight):
                        tip.myDirection = 'sw';
                    break; default:
                        tip.myDirection = 'se';
                    break;
                }
            }
            // adjust positions
            if (tip.imPastBottom == true) // adjust y-position
            {
                // TODO - hover bug
                tip.myOffsetY = -(Math.abs((options.do_lock_y == false) ? tip.myOffsetY : 0) + tip.myHeight);
                // tracking vs. locking on the axis
            }
            if (tip.imPastRight == true) // adjust x-position
            {
                tip.myOffsetX = -(Math.abs((options.do_lock_x == false) ? tip.myOffsetX : 0) + tip.myWidth);
            }
        };
        var positionTip = function(pE) /* set starter position values based on snapping */ // called every hoverIntent event
        {
            // base
            if (options.do_lock_y == false || tip.imSet == false) 
            {
                tip.myTop = mouse.currY;
            }
            if (options.do_lock_x == false || tip.imSet == false)
            {
                tip.myLeft = mouse.currX;
            }
            // snapping
            if (options.do_snap == true) 
            {
                var thisAnchor, $thisAnchor;
                if (options.tip_anchor != '') 
                {
                    thisAnchor = anchor;
                    $thisAnchor = $trigger.parents().filter(options.tip_anchor);
                }
                else 
                {
                    thisAnchor = trigger;
                    $thisAnchor = $trigger;
                }
                if (thisAnchor.myOffset == undefined || $.pjuScrolled == true) 
                // check at start and when scrolled
                {
                    $.pjuResetScrolled = true;
                    thisAnchor.myOffset = $thisAnchor.offset();
                    // trace(thisAnchor.myOffset);
                } 
                if (options.do_lock_y == true)
                {
                    tip.myTop = thisAnchor.myOffset.top;
                }
                if (options.do_lock_x == true) 
                {
                    tip.myLeft = thisAnchor.myOffset.left;
                }
            }
        };
        var moveTip = function (pE) /* conditionally updates css properties */ // called every hoverIntent event
        {
            // trace('moveTip');
            // successful hover
            if (tip.imSet == false || (trigger.myHover.state == true && options.do_follow == true)) 
            {
                if (tip.imSet == true) // still need to check position
                {
                    positionTip(pE);
                }
                // not incremental, values are reset each call
                tip.myTop += tip.myOffsetY;
                tip.myLeft += tip.myOffsetX;
                // set
                tip.my$.css(
                    { 'top':    tip.myTop
                    , 'left':   tip.myLeft
                    });
            }
            if ($.pjuResetScrolled == true) 
            {
                $.pjuResetScrolled = false;
                $.pjuScrolled = false;
            }
        };
        var clearTip = function () // only done once per show event
        {
            // trace('clearTip');
                /* reset timer */
            trigger.myHover.timer = clearTimeout(trigger.myHover.timer);
            trigger.myHover.state = false;
            if (tip.imSet == true) 
            {
                tip.imSet = false;
                if (options.do_fade) 
                {
                    tip.my$.fadeOut(options.fade_out, function () { tip.my$.remove(); }); // debug helper
                    return;
                } 
                else 
                {
                    tip.my$.remove();
                }
            }
        };
        var handleHover = function (e) 
        {
            // trace('handleHover');
                // legacy (required for event object to be passed in IE)
            var pE = $.extend({}, e);
            if ($.pjuHover &&  $.pjuHover(e, this) == false)
            {
                return false;  // ignore children onMouseOver/onMouseOut
            }
                // reset timer
            if (trigger.myHover.timer) 
            { 
                trigger.myHover.timer = clearTimeout(trigger.myHover.timer); 
            }
            if (e.type == 'mouseover') 
            {
                    // update cache
                cacheMouse(pE);
                    // update current
                $trigger.bind('mousemove', trackMouse);
                    // set timer for over procedure
                if (trigger.myHover.state == false) 
                {
                    setCheck(pE);
                }
            } 
            else if (e.type == 'mouseout') 
            {
                    // expensive event
                $trigger.unbind('mousemove', trackMouse);
                    // set timer for out procedure
                if (trigger.myHover.state == true) { 
                    trigger.myHover.timer = setTimeout(
                          function () { clearTip(); }
                        , options.timeout
                    ); 
                }
            }
            // don't prevent default; keep original hover states
        };
        var handleTipHover = function (e) 
        {
            if (options.offset_y < 0 || options.offset_x < 0) 
            {                
                if (e.type == 'mouseover') 
                {
                    trigger.myHoverTimeout = tip.myHoverTimeout;
                }
                else if (e.type == 'mouseout') 
                {
                    trigger.myHoverTimeout = options.timeout;
                }
            }
        };
        
        /* procedure */
        
        if (setContent() == false) // if no content, exit
        { 
            return $trigger; 
        }
        // drawTip(); // debug helper
        // bind
        return $trigger.mouseover(handleHover).mouseout(handleHover);
    }; // _end tip class
    
}
)(jQuery);