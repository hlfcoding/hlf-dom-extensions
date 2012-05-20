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
Basic tooltip plugin with fading. Fades in and out based on give delays. Awake
and asleep states can be read and are set after fade animations. This plugin
requires css display logic for the classes. The API class has hooks; delegation
is used instead of events due to call frequency.

The tip object is shared by the input jQuery collection.

Options:

- `ms.duration`- Duration of sleep and wake animations.
- `ms.delay` - Delay before sleeping and waking.
- `cls.stem` - Empty to remove the stem.
- `cls.follow` - Empty to disable cursor following.
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
        in: 300
        out: 300
      delay:
        in: 300
        out: 300
    cursorHeight: 6
    dir: ['south', 'east']
    cls: (->
      cls = {}
      _.each ['inner', 'content', 'stem', 'north', 'east', 'south', 'west', 'follow', 'trigger'],
        (key) -> cls[key] = "#{pre}#{key}"
      cls.tip = 'js-tip'
      return cls
    )()
    
  
###
Snap-Tip
--------

The tip object is shared by the input jQuery collection.

Options:

- `snap.xSnap`- Set empty to disable snapping along x-axis. Off by default.
- `snap.ySnap`- Set empty to disable snapping along y-axis. Off by default.
- `snap.snap` - Set empty to disable snapping to trigger. Builds on top of
  axis-snapping. Off by default.

###
ns.snapTip = 
  debug: on
  toString: (context) ->
    switch context
      when 'event'  then '.hlf.snapTip'
      when 'data'   then 'hlfSnapTip'
      when 'class'  then 'js-snap-tips'
      when 'log'    then 'hlf-snap-tip:'
      else 'hlf.snapTip'
  
  defaults: do (pre='js-snap-tip-') ->
    $.extend true, {}, ns.tip.defaults, 
      snap:
        toTrigger: on
        toXAxis: off
        toYAxis: off
      cls: (->
        cls =
          snap: {}
        _.each 
          toXAxis:   'x-side'
          toYAxis:   'y-side'
          toTrigger: 'trigger'
        , (val, key) -> cls.snap[key] = "#{pre}#{val}"
        cls.tip = 'js-tip js-snap-tip'
        return cls
      )()
      
  

###
Tip API
-------
###
class Tip
  
  constructor: (@$ts, @o, @$ctx) ->
    _.bindAll @, '_onTriggerMouseMove'
    @$tip = $ '<div>'
    @doStem = @o.cls.stem isnt ''
    @doFollow = @o.cls.follow isnt ''
    @_state = 'truehidden'
    @_p =
      $t: null
    @$ts.each (idx, el) =>
      $t = $ el
      $t.addClass @o.cls.trigger
      @_saveTriggerContent $t
      @_bindTrigger $t
    
    @_render()
    @_bind()
  
  # Protected
  # =========

  _defaultHtml: ->
    c = @o.cls
    cDir = $.trim _.reduce @o.dir, ((cls, dir) => "#{cls} #{c[dir]}"), ''
    containerClass = $.trim [c.tip, c.follow, cDir].join ' '
    stemHtml = "<div class='#{c.stem}'></div>" if @doStem is on
    html = """
           <div class="#{containerClass}">
             <div class="#{c.inner}">
               #{stemHtml}
               <div class="#{c.content}"></div>
              </div>
           </div>
           """
  
  _saveTriggerContent: ($t) ->
    title = $t.attr 'title'
    if title then $t.data(@_dat('Content'), title).removeAttr 'title'
  
  # Link the trigger to the tip for:
  # 1. mouseenter, mouseleave (uses special events)
  # 2. mousemove
  _bindTrigger: ($t) ->
    $t.on @_evt('truemouseenter'), @_onTriggerMouseMove
    $t.on @_evt('truemouseleave'), (evt) => @sleepByTrigger $t
    if @doFollow is on
      $t.on 'mousemove', @_onTriggerMouseMove
  
  _bind: () ->
    @$tip
      .on 'mouseenter', (evt) =>
        @_log @_nsLog, 'enter tip'
        if @_p.$t?
          @_p.$t.data 'hlfIsActive', yes
          @wakeByTrigger @_p.$t
    
      .on 'mouseleave', (evt) =>
        @_log @_nsLog, 'leave tip'
        if @_p.$t?
          @_p.$t.data 'hlfIsActive', no
          @sleepByTrigger @_p.$t
      
  
  _render: () ->
    return no if @$tip.html().length
    html = @htmlOnRender()
    isCustom = html? and html.length
    html = @_defaultHtml() if not isCustom
    @$tip = $(html).addClass @o.cls.follow
    @$tip.prependTo @$ctx
  
  _positionByTrigger: ($t) ->
    $t.trigger 'mousemove'
  
  _inflateByTrigger: ($t) ->
    @$tip.find(".#{@o.cls.content}").text $t.data @_dat 'Content'
  
  _onTriggerMouseMove: (evt) ->
    return no if not evt.pageX?
    $t = if ($t = $(evt.target)) and $t.hasClass(@o.cls.trigger) then $t else $t.closest(@o.cls.trigger)
    return no if not $t.length
    @wakeByTrigger $t, =>
      offset = 
        top: evt.pageY
        left: evt.pageX
      offset = @offsetOnTriggerMouseMove(evt, offset, $t) or offset
      offset.top += @o.cursorHeight
      @$tip.css offset
      @_log @_nsLog, '_onTriggerMouseMove', @isAwake()
  
  # Public
  # ======

  # Accessors
  options: -> @o
  tip: -> @$tip
  isAwake: -> @_state in ['truevisible', 'waking']
  isAsleep: -> @_state in ['truehidden', 'sleeping']
  isDir: (dir) -> _.include @o.dir, dir

  # Methods
  wakeByTrigger: ($t, cb) ->
    initial = not $t.is @_p.$t
    return cb() if cb? and initial is no and @_state isnt 'waking'
    return no if @isAwake() is yes
    if initial then @_inflateByTrigger $t
    delay = @o.ms.delay.in
    duration = @o.ms.duration.in
    if @_state is 'sleeping'
      @_log @_nsLog, 'clear sleep'
      clearTimeout @_sleepCountdown
      duration = delay = 50
    @_state = 'waking'
    @_wakeCountdown = setTimeout =>
      @onShow initial
      @$tip.fadeIn duration, =>
        if initial
          @_p.$t = $t
          cb() if cb?
        @afterShow initial
        @_state = 'truevisible'
      
    , delay
    
    yes
  
  sleepByTrigger: ($t) ->
    return no if @_state isnt 'truevisible'
    @_state = 'sleeping'
    clearTimeout @_wakeCountdown
    @_sleepCountdown = setTimeout =>
      @onHide()
      @$tip.fadeOut @o.ms.duration.out, =>
        @_state = 'truehidden'
        @afterHide()
      
    , @o.ms.delay.out
    
    yes
  
  # Hooks
  onShow: (initial) ->
  onHide: $.noop
  afterShow: (initial) ->
  afterHide: $.noop
  htmlOnRender: $.noop
  offsetOnTriggerMouseMove: (evt, offset, $t) -> no

###
SnapTip API
-----------
###
class SnapTip extends Tip
  
  constructor: ($ts, o, $ctx) ->
    super $ts, o, $ctx
    @o.snap.toTrigger = @o.snap.toXAxis is on or @o.snap.toYAxis is on
    @_offsetStart = null
    @$ts.each (idx, el) =>
      trigger = $ el 
      @_bindTrigger trigger
    _.each @o.snap, (active, prop) => if active then @$tip.addClass @o.cls.snap[prop]

  # Protected
  # =========

  _moveToTrigger: ($t, baseOffset) ->
    @_log @_nsLog, baseOffset
    offset = $t.offset()
    if @o.snap.toXAxis is yes
      if @isDir 'south' then offset.top += $t.outerHeight()
      # if baseOffset? and @o.snap.toYAxis is no 
      if @o.snap.toYAxis is no 
        offset.left = baseOffset.left - (@$tip.outerWidth() - 12)/ 2
    if @o.snap.toYAxis is yes
      if @isDir 'east' then offset.left += $t.outerWidth()
      # if baseOffset? and @o.snap.toXAxis is no 
      if @o.snap.toXAxis is no 
        offset.top = baseOffset.top - $t.outerHeight() / 2
    offset
  
  _bindTrigger: ($t) ->
    super $t
    $t
      .on @_evt('truemouseenter'), (evt) =>
        @_offsetStart = 
          top: evt.pageY
          left: evt.pageX
      
      .on @_evt('truemouseleave'), (evt) =>
        @_offsetStart = null
      
  
  # Public
  # ======

  # Hooked
  onShow: (initial) -> if initial then @$tip.css 'visibility', 'hidden'
  afterShow: (initial) -> if initial then @$tip.css 'visibility', 'visible'
  
  offsetOnTriggerMouseMove: (evt, offset, $t) ->
    newOffset = _.clone offset
    if @o.snap.toTrigger is yes
      newOffset = @_moveToTrigger $t, newOffset
    else
      if @o.snap.toXAxis is yes
        newOffset.top = @_offsetStart.top
        @_log @_nsLog, 'xSnap'
      if @o.snap.toYAxis is yes
        newOffset.left = @_offsetStart.left
        @_log @_nsLog, 'ySnap'
    newOffset
  
  

# Export
# ------

$.fn.tip = ns.createPlugin ns.tip, Tip, yes
$.fn.snapTip = ns.createPlugin ns.snapTip, SnapTip, yes