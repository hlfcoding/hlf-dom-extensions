/**
 * hlf Slideshow Gallery
 * NOTE Namespace: $('foo').myPlugin(options{p_foo:bar}) { var myPrivate; }
 * NOTE For conflicting property namespaces: plugin -> p_foo  utility -> u_foo
 * TODO flexible dims
 * TODO arrow buttons
 * TODO caption list support
 * @see         hlfTip, http://cherne.net/brian/resources/jquery.hoverIntent.html
 * @requires    hlfHover
 * @requires    jQuery 1.2+
 * @package     Peng's JQuery Plugins
 * @subpackage  Peng's WordPress Frontend
 * @version     1.0
 * @author      peng@pengxwang.com
 */
 
(function ($) /* declaration */ // self-invoking function, jQuery passed as alias
{
    $.fn.hlfGallery = function (options) 
    {	
        var defaults = 
            { gallery_class:       'hlfGallery'
            , slider_class:        'hlfGallerySlider'
            , button_class:        'hlfGalleryBtn'
            , next_class:          'hlfGalleryNext'
            , prev_class:          'hlfGalleryPrev'
            , frame_selector:      'li'
            , frame_inner_class:   'in'
            , frame_width:          650
            , frame_height:         510
            , button_width:         65                      // -10px for border + padding TODO dynamic
            , button_height:        500
            , duration:             400
            , easing:              'swing'
            , button_mouse:         8                       // sensitivity
            , button_interval:      50                      // hover
            , button_timeout:       200
            , button_duration:      ['fast', 'slow']        // show, hide
            , caption_selector:    '.caption li'
            , ancestor_selector:   '.modViewer'
            };
        options = $.extend({}, defaults, options);
        
        return this.each(function (i) 
            {
                // trace(i);
                $this = $(this);
                new $.hlfGallery(options, $this);
            }	
        );
    }; // _end registration
    
    $.hlfGallery = function (options, $gallery) 
    {
        /* properties */
        
        var	  $frames         = $gallery.children(options.frame_selector)
            , $images         = $gallery.find(options.frame_selector + ' img')
            , $currentFrame
            , $nextFrame
            , $slider
            , $container
            , $buttons
            , $buttonPrev
            , $buttonNext
            , $captions
            ;
        var gallery = 
            { xOff:           0
            , isFading:       false
            , isMoving:       false
            , isHover:        false
            , hoverTimer:     undefined
            , buttonTimer:    setTimeout(function () { drawButtons('hide'); }, options.button_timeout )
            , currentFrame:   0
            };
        var mouse = 
            { currX:          undefined
            , currY:          undefined
            , prevX:          undefined
            , prevY:          undefined
            , sensitivity:    options.button_mouse
            };
        
        /* methods */
        
        var handlePrevTrigger = function (e) 
        {
            // trace('handlePrevTrigger');
            if (!e.keyCode || e.keyCode == 37) 
            {
                if (e.keyCode == 37 && !gallery.isMoving) 
                {
                    $buttonPrev.addClass('hover');
                    drawButtons('flash');
                }
                $container.trigger('prevFrame'); 
            }
        };
        var handleNextTrigger = function (e) 
        {
            // trace('handleNextTrigger');
            if (!e.keyCode || e.keyCode == 39) 
            {
                if (e.keyCode == 39 && !gallery.isMoving) 
                {
                    $buttonNext.addClass('hover');
                    drawButtons('flash');
                }
                $container.trigger('nextFrame'); 
            }
        };
        var moveSlider = function (e) // complex direction handling, positioning, and animation
        {
            // trace('moveSlider');
            var dir = e.type.replace('Frame', '');
            if (!gallery.isMoving) 
            {
                gallery.isMoving = true;
                
                    /* boundaries */
                
                    // get overall, ideal frame position (offset from slider origin)
                    // NOTE slider's actual position is the inverse of frame position
                gallery.offX = (dir == 'prev')
                        // current pos + shift left / move towards right
                        // current pos + shift right / move towards left
                     ? parseInt($slider.eq(0).css('left') ) * -1 - options.frame_width
                     : parseInt($slider.eq(0).css('left') ) * -1 + options.frame_width
                    ;
                    // get next real frame and its position
                $nextFrame = getFrame(dir); 
                var offset = $nextFrame.offset();
                if (        (dir == 'prev'
                         && (offset.left > gallery.offX || -offset.left > gallery.offX || offset.left < gallery.offX) )
                     ||     (dir == 'next'
                         && (offset.left < gallery.offX || -offset.left > gallery.offX || offset.left < gallery.offX) ) 
                ) 
                    // move to ideal position if too far left / right OR switch direction from way right OR from way left
                    // accounts for if ideal is not real
                    // NOTE does not readjust slider, just moves the current frame
                { 
                    $nextFrame.css({'left': gallery.offX + 'px'});
                }
                
                    /* general behavior */
                
                $slider.animate(
                    { 'left': (dir == 'prev') // opposite from offset (pulling to reveal) NOTE `-1` above
                         ? '+=' + options.frame_width + 'px'
                         : '-=' + options.frame_width + 'px'
                    }
                    , 
                    { 'duration': options.duration
                    , 'easing': options.easing
                    , 'complete': function () 
                        { 
                            gallery.isMoving = false; 
                            $currentFrame = $nextFrame;
                            gallery.currentFrame = parseInt($frames.index($currentFrame[0]) );
                            updateCaption(); 
                        }
                    }
                );
            }
        };
        var getFrame = function (dir) // checks the DOM to return a real frame
        {
            // trace('getFrame');
            if (    (dir == 'prev' && $currentFrame.prev(options.frame_selector).length == 0)
                 || (dir == 'next' && $currentFrame.next(options.frame_selector).length == 0)
            ) // current slide is the first / last frame in DOM level
            { 
                return (dir == 'prev') // do modulo and return last / first frame
                     ? $frames.eq($frames.length - 1)
                     : $frames.eq(0)
                     ;
            } 
            else 
            {
                return (dir == 'prev')
                     ? $currentFrame.prev(options.frame_selector)
                     : $currentFrame.next(options.frame_selector)
                     ;
            }
        };
        var handleHover = function (e) // detects hover intent
        {
            // trace('handleHover');
            var pE = $.extend({}, e);
            if ($.hlfHover &&  $.hlfHover(e, this) == false) // ignore children onMouseOver/onMouseOut
            {
                return false;
            }
                /* reset timer */
            if (gallery.hoverTimer) 
            { 
                gallery.hoverTimer = clearTimeout(gallery.hoverTimer);
            }
            if (e.type == 'mouseover') 
            {
                cacheMouse(pE);
                $container.bind('mousemove', trackMouse);
                if (gallery.isHover == false)
                {
                    setCheck(pE);
                }
            } 
            else if (e.type == 'mouseout') 
            {
                $container.unbind('mousemove', trackMouse);
                if (gallery.isHover == true)
                {
                    setCheck();
                }
            }
            // don't prevent default; keep original hover states			
        };
        var checkMouse = function (pE) 
        {
            // trace('checkMouse');
            gallery.hoverTimer = clearTimeout(gallery.hoverTimer);
            if ( (Math.abs(mouse.prevX - mouse.currX) + Math.abs(mouse.prevY - mouse.currY) )
                 < mouse.sensitivity
            ) // if mouse speed is past certain number of pixels
            {
                gallery.isHover = true;
                drawButtons('show');
            } 
            else 
            {
                cacheMouse();
                setCheck(pE);
            }
        };
        var trackMouse = function (e) 
        {
            // trace('trackMouse');
            mouse.currX = e.pageX;
            mouse.currY = e.pageY;
            
        };
        var setCheck = function (pE) 
        {
            // trace('setCheck');
            gallery.hoverTimer = pE // custom mouseover event
                 ? setTimeout(function () { checkMouse(pE); }, options.button_interval) // reset timer
                 : setTimeout(function () // reset all
                    { 
                        drawButtons('hide'); 
                        gallery.hoverTimer = clearTimeout(gallery.hoverTimer);
                        gallery.isHover = false;
                    }
                    , options.button_timeout)
                ;
        };
        var cacheMouse = function (pE) 
        {
            // trace('cacheMouse');
            mouse.prevX = pE ? pE.pageX : mouse.currX;
            mouse.prevY = pE ? pE.pageY : mouse.currY;
        };
        var drawButtons = function (action) {
            // trace('drawButtons');
            if ($buttons.is(':not(:animated)') ) 
            {
                if (action == 'show' && gallery.isHover == true) 
                {
                    $buttons.fadeIn(options.button_duration[0]);
                } 
                else if (action == 'hide') 
                {
                    $buttons.fadeOut(options.button_duration[1]);
                }
            } 
            if (action == 'flash') 
            {
                $buttons.fadeIn(
                    options.button_duration[0]
                  , function () 
                    { 
                        $buttons.fadeOut(
                            options.button_duration[1] 
                          , function () 
                            { 
                                $buttons.removeClass('hover'); 
                            }
                        ); 
                    }
                );
            }
        };
        var updateCaption = function () 
        {
            // trace('updateCaption');
            // trace(parseInt(gallery.currentFrame));
            $captions.hide();
            $captions.filter('#' + $currentFrame.attr('id')).show();
        };
        
        /* procedure */
        
        if ($images.length > 1) // isGallery
        {
            if ($frames.length > 1) // isSlideshow
            {
                    /* setup container */
                
                $container = $gallery.is('ul, ol')
                     ? $gallery.wrap('<div></div>').parent('div').addClass(options.gallery_class) // add and return
                     : $gallery
                    ;
                $container
                    .css(
                        { 'position':    'relative'
                        , 'display':     'block'
                        , 'width':        options.frame_width + 'px'
                        , 'height':       options.frame_height + 'px'
                        , 'overflow':    'hidden'
                    })
                    .bind('prevFrame',    moveSlider)
                    .bind('nextFrame',    moveSlider)
                    .bind('mouseover',    handleHover)
                    .bind('mouseout',     handleHover)
                    ;
                
                    /* setup slider */
                $slider = $gallery.is(':not(ul, ol)')
                     ? $gallery.wrapInner('<div></div>').children('div') // add and return
                     : $gallery
                    ;
                $slider
                    .addClass(options.slider_class)
                    .css(
                        { 'position':    'absolute'
                        , 'top':          0
                        , 'left':         0
                        }
                    )
                    ;
                
                // at this point $gallery is deprecated
                
                    /* setup buttons */
                $buttons = $container
                    .append('<div><a><span></span></a></div><div><a><span></span></a></div>')
                    .children('div:not([class])')
                        .addClass(options.button_class)
                        .css(
                            { 'position':      'absolute'
                            , 'top':            0
                            , 'width':          options.button_width + 'px'
                            }
                        )
                    .children('a')
                        .css(
                            { 'display':       'block'
                            , 'position':      'relative'
                            , 'height':         options.button_height + 'px'
                            }
                        )
                    ;
                $buttons.children('span')
                        .css(
                            { 'display':       'block'
                            , 'position':      'absolute'
                            , 'top':            50 + '%'
                            , 'left':           50 + '%'
                            , 'width':          options.button_width + 'px'
                            , 'height':         options.button_width + 'px'
                            , 'margin-left':   -(options.button_width / 2) + 'px'
                            , 'margin-top':    -(options.button_width / 2) + 'px'
                            }
                        )
                    ;
                $buttonPrev = $container
                    .find('.' + options.button_class + ':eq(0)')
                        .addClass(options.prev_class)
                        .css({'left': 0})
                        .children('a')
                            .bind('click', handlePrevTrigger)
                    ;
                $buttonNext = $container
                    .find('.' + options.button_class + ':eq(1)')
                        .addClass(options.next_class)
                        .css({'right': 0})
                        .children('a')
                            .bind('click', handleNextTrigger)
                    ;
                $buttons.hide();
                $(window)
                    .bind('keydown', handlePrevTrigger)
                    .bind('keydown', handleNextTrigger)
                    ;
                
                    /* setup frames */
                
                var x = 0;
                $frames.each(function (i) 
                    {
                        // trace(i);
                        $this = $(this);
                        $this.css(
                            { 'position':   'absolute'
                            , 'top':         0
                            , 'left':        x + 'px'
                            }	
                        );
                        x += options.frame_width;
                    }
                );
                $currentFrame = $frames.eq(gallery.currentFrame);
                
                    /* setup captions */
                
                $captions = $gallery.parents(options.ancestor_selector).find(options.caption_selector);
                updateCaption();
            }
            
                /* center image, regardless of isSlideshow */
            
            $images.load(function (i) // dims have been set
                {
                    // trace(i);
                    $this = $(this);
                    $this
                        .wrap('<div></div>')
                        .parent('div') // add and return inner frame
                            .addClass(options.frame_inner_class)
                            .css(
                                { 'position':    'relative'
                                , 'display':     'block'
                                , 'width':        options.frame_width + 'px'
                                , 'height':       options.frame_height + 'px'
                                , 'overflow':    'hidden'
                                , 'padding' :     0
                                }
                            )
                        .end()
                        .css( // this / image
                            { 'position':        'absolute'
                            , 'top':              50 + '%'
                            , 'left':             50 + '%'
                            , 'margin-left':     -( ($this.width() / 2) + (parseInt( $this.css('borderLeftWidth') ) * 2) ) + 'px'
                            , 'margin-top':      -( ($this.height() / 2) + (parseInt( $this.css('borderTopWidth') ) * 2) ) + 'px' // _bug
                            }
                        )
                        ;
                }
            );
            $gallery.parents('.modViewer').trigger('galleryDrawn');
        }
        return $gallery;
    }; // _end gallery class

}
)(jQuery);