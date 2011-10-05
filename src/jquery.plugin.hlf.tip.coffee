((global, $) ->

  # Base Tip
  class Tip

    @defaults:
      # millis
      inDuration: 300
      inDelay: 0
      outDuration: 300
      outDelay: 500
      # pixels
      cursorHeight: 6
      # classNames
      innerClass: 'inner'
      contentClass: 'content'
      stemClass: 'stem'
      northClass: 'north'
      eastClass: 'east'
      southClass: 'south'
      westClass: 'west'
      followClass: 'tip-follow'
      tipClass: 'tip'

    constructor: (@_context, @_triggers, @_options) ->
      @_tip = $ '<div>'
      @doStem = @_options.stemClass isnt ''
      @doFollow = @_options.followClass isnt '' and @_options.cursorHeight > 0
      @_visibility = 'truehidden'
      @_triggers.each (index,  element) =>
        trigger = $  element
        @_saveTriggerContent trigger
        @_bindTrigger trigger
        @_bind trigger
      @_render()

    # Private

    _defaultHtml: ->
      containerClass = $.trim [@_options.tipClass, @_options.followClass].join(' ')
      stemHtml = "<div class='#{@_options.stemClass}'></div>" if @doStem is on
      html = "
  <div class='#{containerClass}'>
  <div class='#{@_options.innerClass}'>
  #{stemHtml}
  <div class='#{@_options.contentClass}'></div>
  </div>
  </div>"
  
    _saveTriggerContent: (trigger) ->
      title = trigger.attr 'title'
      if title
        trigger.data('hlfTipContent', title)
               .attr('data-tip-content', title)
               .removeAttr('title')
  
    # Link the trigger to the tip for:
    # 1. mouseenter, mouseleave (uses special events)
    # 2. mousemove
    _bindTrigger: (trigger) ->
      trigger.bind
        'truemouseenter.hlf.tip': (event) =>
          @wake trigger
        'truemouseleave.hlf.tip': (event) =>
          @sleep trigger
      trigger.bind 'mousemove.hlf.tip', $.proxy(@_onMouseMove, this) if @doFollow is on

    _bind: (trigger) ->
      @_tip.bind
        'mouseenter.hlf.tip': (event) =>
          console.log 'enter tip'
          trigger.data 'activeState', true
        'mouseleave.hlf.tip': (event) =>
          console.log 'leave tip'
          trigger.data 'activeState', false

    _render: (trigger) ->
      return false if @_tip.html().length isnt 0
      html = @onRender()
      isCustom = html? and html.length isnt 0
      html = @_defaultHtml() if not isCustom
      @_tip = $(html).toggleClass @_options.followClass, isCustom
      @_tip.prependTo @_context

    _position: (trigger) ->
      offset = @onPosition trigger.offset()
      if @doFollow is on
        trigger.trigger 'mousemove.hlf.tip' 
        return false
      offset.top += @_options.cursorHeight
      @_tip.css offset
      console.log '_position'

    _inflate: (trigger) ->
      @_tip.find(".#{@_options.contentClass}").text trigger.data('hlfTipContent')

    _onMouseMove: (event) ->
      return false if not event.pageX?
      @wake $ event.target if @isAsleep()
      offset = 
        top: event.pageY
        left: event.pageX
      offset = @onMouseMove(event, offset) or offset
      offset.top += @_options.cursorHeight
      @_tip.css offset
      console.log '_onMouseMove'
    
    # Public
  
    # Accessors
    options: -> @_options
    tip: -> @_tip
    isAwake: -> @_visibility is 'truevisible'
    isAsleep: -> @_visibility is 'truehidden'
  
    # Methods
    wake: (trigger) ->
      if trigger isnt @_triggerP
        @_inflate trigger
        @_position trigger
      @_wakeCountdown = setTimeout =>
        clearTimeout @_sleepCountdown
        return false if @isAwake()
        @onShow()
        @_tip.fadeIn @_options.inDuration, =>
          @_visibility = 'truevisible'
          @afterShow()
      , @_options.inDelay
      true
    sleep: (trigger) ->
      if trigger isnt @_triggerP
        @_triggerP = trigger
      @_sleepCountdown = setTimeout =>
        clearTimeout @_wakeCountdown
        return false if @isAsleep()
        @onHide()
        @_tip.fadeOut @_options.outDuration, =>
          @_visibility = 'truehidden'
          @afterHide()
      , @_options.outDelay
  
    # Hooks
    onShow: $.noop
    onHide: $.noop
    afterShow: $.noop
    afterHide: $.noop
    onRender: $.noop
    onPosition: $.noop
    onMouseMove: $.noop
  
  # Snapping Tip
  class SnapTip extends Tip
  
    constructor: (context, triggers, options) ->
      super context, triggers, options
      @doXSnap = @_options.xSnapClass isnt ''
      @doYSnap = @_options.ySnapClass isnt ''
      @doSnap = @_options.snapClass isnt '' and (@doXSnap or @doYSnap)
      @_offsetStart = null
      @_triggers.each (index,  element) =>
        trigger = $ element 
        @_bindTrigger trigger
  
    # Private
  
    _move: ->
      
    _bindTrigger: (trigger) ->
      super trigger
      trigger.bind 
        'truemouseenter.hlf.tip': (event) ->
          @_offsetStart = 
            top: event.pageX
            left: event.pageY
          console.log 'truemouseenter'
        ,
        'truemouseleave.hlf.tip': (event) ->
          @_offsetStart = null
          console.log 'truemouseleave'
  
    # Public
  
    # Hooked
    onPosition: (offset) ->
      console.log 'onPosition'
      offset
  
    onMouseMove: (event, offset) ->
      return offset if not @_offsetStart?
      if @doXSnap
        offset.top = @_offsetStart.top
        console.log 'xSnap'
      else if @doYSnap
        offset.left = @_offsetStart.left
        console.log 'ySnap'
      offset

  # Export
  $.hlf.Tip = Tip
  $.hlf.SnapTip = SnapTip
  $.hlf.createPluginForClass 'Tip', 'manyElementsOneContext'
  $.hlf.createPluginForClass 'SnapTip', 'manyElementsOneContext'

  return true
) window, jQuery
