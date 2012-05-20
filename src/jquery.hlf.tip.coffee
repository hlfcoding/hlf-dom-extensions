###
HLF Tip jQuery Plugin v1.2
Released under the MIT License
Written with jQuery 1.7.2
###
$ = jQuery
ns = $.hlf

###
Tip
---
Full-featured tooltip plugin. Use the different plugins to add different types
of tips to an element.

Options:

- `ms.duration`- Duration of sleep and wake animations.
- `ms.delay` - Delay before sleeping and waking.
- `cls.xsnap`- Set empty to disable snapping along x-axis. Off by default.
- `cls.ysnap`- Set empty to disable snapping along y-axis. Off by default.
###
ns.tip = 
  debug: on
  toString: (context) ->
    switch context
      when 'event'  then '.hlf.tip'
      when 'data'   then 'hlfTip'
      when 'class'  then 'js-tips'
      when 'log'    then 'hlf-tip:'
      else 'hlf.tip'
  
  defaults: do (pre='js-tip-') ->
    ms:
      duration:
        in: 200
        out: 100
      delay:
        in: 300
        out: 300
    cursorHeight: 6
    cls: (->
      cls =
        xsnap: ''
        ysnap: ''
      _.each ['inner', 'content', 'stem', 'north', 'east', 'south', 'west', 'follow',
        'snap'],
        (key) -> cls[key] = "#{pre}#{key}"
      cls.tip = 'js-tip'
      return cls
    )()
    
  

nsLog = ns.tip.toString 'log'

###
Tip API
-------
Fades in and out based on give delays. Awake and asleep states can be read and
are set after fade animations.
###
class Tip
  
  constructor: (@$ts, @o, @$ctx) ->
    _.bindAll @, '_onMouseMove'
    @$tip = $ '<div>'
    @doStem = @o.cls.stem isnt ''
    @doFollow = @o.cls.follow isnt '' and @o.cursorHeight > 0
    @_state = 'truehidden'
    @_p =
      $t: null
    @$ts.each (idx, el) =>
      $t = $ el
      @_saveTriggerContent $t
      @_bindTrigger $t
      @_bind $t
    
    @_render()
  
  # Private

  _defaultHtml: ->
    containerClass = $.trim [@o.cls.tip, @o.cls.follow].join(' ')
    stemHtml = "<div class='#{@o.cls.stem}'></div>" if @doStem is on
    html = """
           <div class="#{containerClass}">
           <div class="#{@o.cls.inner}">
           #{stemHtml}
           <div class="#{@o.cls.content}"></div>
           </div>
           </div>
           """
  
  _saveTriggerContent: ($t) ->
    title = $t.attr 'title'
    if title
      $t.data(@_dat('Content'), title)
        .attr('data-tip-content', title)
        .removeAttr('title')
  
  # Link the trigger to the tip for:
  # 1. mouseenter, mouseleave (uses special events)
  # 2. mousemove
  _bindTrigger: ($t) ->
    $t.on @_evt('truemouseenter'), (evt) => @wake $t
      .on @_evt('truemouseleave'), (evt) => @sleep $t
    if @doFollow is on
      $t.on @_evt('mousemove'), @_onMouseMove
  
  _bind: ($t) ->
    @$tip
      .on @_evt('mouseenter'), (evt) =>
        @_log nsLog, 'enter tip'
        $t.data 'activeState', true
    
      .on @_evt('mouseleave'), (evt) =>
        @_log nsLog, 'leave tip'
        $t.data 'activeState', false
      
  
  _render: ($t) ->
    return false if @$tip.html().length
    html = @onRender()
    isCustom = html? and html.length
    html = @_defaultHtml() if not isCustom
    @$tip = $(html).toggleClass @o.cls.follow, isCustom
    @$tip.prependTo @$ctx
  
  _position: ($t) ->
    offset = @onPosition $t.offset()
    if @doFollow is on
      $t.trigger @_evt('mousemove')
      return false
    offset.top += @o.cursorHeight
    @$tip.css offset
    @_log nsLog, '_position'
  
  _inflate: ($t) ->
    @$tip.find(".#{@o.cls.content}").text $t.data @_dat 'Content'
  
  _onMouseMove: (evt) ->
    return false if not evt.pageX?
    @wake $ evt.target if @isAsleep()
    offset = 
      top: evt.pageY
      left: evt.pageX
    offset = @onMouseMove(evt, offset) or offset
    offset.top += @o.cursorHeight
    @$tip.css offset
    @_log nsLog, '_onMouseMove'
  
  # Public

  # Accessors
  options: -> @o
  tip: -> @$tip
  isAwake: -> @_state is 'truevisible'
  isAsleep: -> @_state is 'truehidden'

  # Methods
  wake: ($t) ->
    if $t isnt @_p.$t
      @_inflate $t
      @_position $t
    return no if @_state is 'changing'
    @_state = 'changing'
    clearTimeout @_sleepCountdown
    @_wakeCountdown = setTimeout =>
      @onShow()
      @$tip.stop().fadeIn @o.ms.duration.in, =>
        @_state = 'truevisible'
        @afterShow()
      
    , @o.ms.delay.in
    
    yes
  
  sleep: ($t) ->
    if $t isnt @_p.$t then @_p.$t = $t
    @_state = 'changing'
    clearTimeout @_wakeCountdown
    @_sleepCountdown = setTimeout =>
      # return no if @isAsleep()
      @onHide()
      @$tip.stop().fadeOut @o.ms.duration.out, =>
        @_state = 'truehidden'
        @afterHide()
      
    , @o.ms.delay.out
    
    yes
  
  # Hooks
  onShow: $.noop
  onHide: $.noop
  afterShow: $.noop
  afterHide: $.noop
  onRender: $.noop
  onPosition: $.noop
  onMouseMove: $.noop

###
SnapTip API
-----------
###
class SnapTip extends Tip
  
  constructor: ($ts, o, $ctx) ->
    super $ts, o, $ctx
    @doXSnap = @o.cls.xsnap isnt ''
    @doYSnap = @o.cls.ysnap isnt ''
    @doSnap = @o.cls.snap isnt '' and (@doXSnap or @doYSnap)
    @_offsetStart = null
    @$ts.each (idx, el) =>
      trigger = $ el 
      @_bindTrigger trigger

  # Private

  _move: ->
    
  _bindTrigger: ($t) ->
    super $t
    $t
      .on @_evt('truemouseenter'), (evt) =>
        @_offsetStart = 
          top: evt.pageX
          left: evt.pageY
      
      .on @_evt('truemouseleave'), (evt) =>
        @_offsetStart = null
      
  
  # Public

  # Hooked
  onPosition: (offset) ->
    @_log nsLog, 'onPosition'
    offset
  
  onMouseMove: (evt, offset) ->
    return offset if not @_offsetStart?
    if @doXSnap
      offset.top = @_offsetStart.top
      # @_log nsLog, 'xSnap'
    else if @doYSnap
      offset.left = @_offsetStart.left
      # @_log nsLog, 'ySnap'
    offset
  
  

# Export
# ------

$.fn.tip = ns.createPlugin ns.tip, Tip
$.fn.snapTip = ns.createPlugin ns.tip, SnapTip