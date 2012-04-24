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
###
ns.tip = 
  toString: (context) ->
    switch context
      when 'event' then '.hlf.tip'
      when 'data' then 'hlfTip'
      when 'class' then 'js-tips'
      else 'hlf.tip'
  
  defaults: do (pre='js-tip-') ->
    ms:
      duration:
        in: 300
        out: 300
      delay:
        in: 0
        out: 500
    cursorHeight: 6
    cls: (->
      cls = {}
      _.each ['inner', 'content', 'stem', 'north', 'east', 'south', 'west', 'follow'],
        (key) -> cls[key] = "#{pre}#{key}"
      cls.tip = 'js-tip'
      return cls
    )()
    
  

###
Tip API
-------

###
class Tip
  
  constructor: (@$ts, @o, @$ctx) ->
    @$tip = $ '<div>'
    @doStem = @o.cls.stem isnt ''
    @doFollow = @o.cls.follow isnt '' and @o.cursorHeight > 0
    @_visibility = 'truehidden'
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
      $t.on @_evt('mousemove'), $.proxy @_onMouseMove, this
  
  _bind: ($t) ->
    @$tip
      .on @_evt('mouseenter'), (evt) =>
        console.log 'enter tip'
        $t.data 'activeState', true
    
      .on @_evt('mouseleave'), (evt) =>
        console.log 'leave tip'
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
    console.log '_position'
  
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
    console.log '_onMouseMove'
  
  # Public

  # Accessors
  options: -> @o
  tip: -> @$tip
  isAwake: -> @_visibility is 'truevisible'
  isAsleep: -> @_visibility is 'truehidden'

  # Methods
  wake: ($t) ->
    if $t isnt @_p.$t
      @_inflate $t
      @_position $t
    @_wakeCountdown = setTimeout =>
      clearTimeout @_sleepCountdown
      return false if @isAwake()
      @onShow()
      @$tip.fadeIn @o.ms.duration.in, =>
        @_visibility = 'truevisible'
        @afterShow()
      
    , @o.ms.delay.in
    
    true
  
  sleep: ($t) ->
    if $t isnt @_p.$t
      @_p.$t = $t
    @_sleepCountdown = setTimeout =>
      clearTimeout @_wakeCountdown
      return false if @isAsleep()
      @onHide()
      @$tip.fadeOut @o.ms.duration.out, =>
        @_visibility = 'truehidden'
        @afterHide()
      
    , @o.ms.delay.out
    
  
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
    $t.on @_evt('truemouseenter'), (evt) ->
        @_offsetStart = 
          top: evt.pageX
          left: evt.pageY
        console.log 'truemouseenter'
      
      .on @_evt('truemouseleave'), (evt) ->
        @_offsetStart = null
        console.log 'truemouseleave'
      
  
  # Public

  # Hooked
  onPosition: (offset) ->
    console.log 'onPosition'
    offset
  
  onMouseMove: (evt, offset) ->
    return offset if not @_offsetStart?
    if @doXSnap
      offset.top = @_offsetStart.top
      console.log 'xSnap'
    else if @doYSnap
      offset.left = @_offsetStart.left
      console.log 'ySnap'
    offset
  
  

# Export
# ------

$.fn.tip = ns.createPlugin ns.tip, Tip
$.fn.snapTip = ns.createPlugin ns.tip, SnapTip