###
HLF Tip jQuery Plugin v2.0.1  
Released under the MIT License  
Written with jQuery 1.7.2  
###

# jQuery Tooltip Plugin
# =====================

# The base `tip` plugin features basic trigger element parsing, direction-based
# attachment, appearance state management and presentation by fading, custom tip
# content, and use of the `hlf.hoverIntent` event extension. The tip object is
# shared amongst the provided triggers.

# The extended `snapTip` plugin extends the base tip and adds snapping-to-
# trigger-element behavior. By default locks into place. If one of the snap-to-
# axis options is turned off, the tip will slide along the remaining locked
# axis.

# Note the majority of presentation state logic is in the plugin stylesheet. We
# update the presentation state by using `classNames`.

# Lastly, like any other module in this library, we're using proper namespacing
# whenever there is an added endpoint to the jQuery interface. This is done with
# the custom `toString` methods. Also, plugin namespaces (under the root
# `$.hlf`) each have a `debug` flag allowing more granular logging. Each
# plugin's API is also entirely public, although some methods are intended as
# protected given their name. Access the plugin singleton is as simple as via
# `$('body').tip()` or `$('body').snapTip()`, although using the `toString` and
# jQuery data methods is the same.
plugin = ($, _, hlf) ->
  
  hlf.tip =
    debug: off
    toString: _.memoize (context) ->
      switch context
        when 'event'  then '.hlf.tip'
        when 'data'   then 'hlf-tip'
        when 'class'  then 'js-tips'
        else 'hlf.tip'

    # Tip Options
    # -----------
    # Note the plugin instance gets extended with the options.
    defaults: do (pre = 'js-tip-') ->
      # - `ms.duration` are the durations of sleep and wake animations.
      # - `ms.delay` are the delays before sleeping and waking.
      ms:
        duration:
          in: 200
          out: 200
        delay:
          in: 300
          out: 300
      cursorHeight: 6
      # - Note that the direction data structure must be an array of
      #   `components`, and conventionally with north/south first.
      defaultDirection: ['south', 'east']
      # - `safeToggle` prevents orphan tips, since timers are sometimes unreliable.
      safeToggle: on
      # - `autoDirection` automatically changes the direction so the tip can
      #   better fit inside the viewport.
      autoDirection: on
      # - `tipTemplate` should return interpolated html when given the
      #   additional container class list. Its context is the plugin instance.
      tipTemplate: (containerClass) ->
        stemHtml = "<div class='#{@classNames.stem}'></div>" if @doStem is on
        """
        <div class="#{containerClass}">
          <div class="#{@classNames.inner}">
            #{stemHtml}
            <div class='#{@classNames.content}'></div>
          </div>
        </div>
        """
      # - `classNames.stem` - Empty string to remove the stem.
      # - `classNames.follow` - Empty string to disable cursor following.
      classNames: do ->
        classNames = {}
        keys = ['inner', 'content', 'stem', 'north', 'east', 'south', 'west', 'follow', 'trigger']
        (classNames[key] = "#{pre}#{key}") for key in keys
        classNames.tip = 'js-tip'
        classNames

  hlf.snapTip =
    debug: off
    toString: _.memoize (context) ->
      switch context
        when 'event'  then '.hlf.snap-tip'
        when 'data'   then 'hlf-snap-tip'
        when 'class'  then 'js-snap-tips'
        else 'hlf.snapTip'

    # Snap-Tip Options
    # ----------------
    # These options extend the tip options.
    defaults: do (pre = 'js-snap-tip-') ->
      $.extend (deep = yes), {}, hlf.tip.defaults,
        # - `snap.toXAxis` is the switch for snapping along x-axis. Off by default.
        # - `snap.toYAxis` is the switch for snapping along y-axis. Off by default.
        # - `snap.toTrigger` is the switch snapping to trigger that builds on top of
        #   axis-snapping. On by default.
        snap:
          toTrigger: on
          toXAxis: off
          toYAxis: off
        classNames: do ->
          classNames =
            snap: {}
          dictionary =
            toXAxis:   'x-side'
            toYAxis:   'y-side'
            toTrigger: 'trigger'
          (classNames.snap[key] = "#{pre}#{value}") for key, value of dictionary
          # Update our tip class.
          classNames.tip = 'js-tip js-snap-tip'
          classNames

  # Tip API
  # -------
  class Tip

    constructor: (@$triggers, options, @$context) ->
      
      # - Extend self with `options`.  
      #   See default options for property names.
      $.extend (deep = yes), @, options
      # - Public properties.  
      #   Also includes `$triggers`, `$context`.
      @$tip = $ '<div>'
      @doStem = @classNames.stem isnt ''
      @doFollow = @classNames.follow isnt ''
      # - Protected properties.  
      #   `_state` toggles between: `awake`, `asleep`, `waking`, `sleeping`.
      @_state = 'asleep'
      @_$currentTrigger = null
      # - Process tip.
      @_render()
      @_bind()
      # - Process triggers.
      @$triggers.each (i, el) =>
        $trigger = $ el
        $trigger.addClass @classNames.trigger
        @_saveTriggerContent $trigger
        @_bindTrigger $trigger
        @_updateDirectionByTrigger $trigger
      # - Bind handler methods.
      _.bindAll @, '_onTriggerMouseMove', '_setBounds'

    # ###Protected

    _defaultHtml: ->
      directionClass = $.trim(
        _.reduce @defaultDirection, (classListMemo, directionComponent) =>
          "#{classListMemo} #{@classNames[directionComponent]}"
        , ''
      )
      containerClass = $.trim [@classNames.tip, @classNames.follow, directionClass].join ' '
      html = @tipTemplate containerClass

    _saveTriggerContent: ($trigger) ->
      title = $trigger.attr 'title'
      if title?
        $trigger
          .data @attr('content'), title
          .removeAttr 'title'

    # - Link the trigger to the tip for:
    #   1. mouseenter, mouseleave (uses special events)
    #   2. mousemove
    _bindTrigger: ($trigger) ->
      $trigger.on @evt('truemouseenter'), (event) =>
        @debugLog event
        @_onTriggerMouseMove event
      $trigger.on @evt('truemouseleave'), (event) => @sleepByTrigger $trigger
      if @doFollow is on
        if window.requestAnimationFrame?
          onMouseMove = (event) =>
            requestAnimationFrame (timestamp) =>
              @_onTriggerMouseMove event
        else 
          onMouseMove = _.throttle @_onTriggerMouseMove, 16
        $trigger.on 'mousemove', onMouseMove

    # - Bind to the tip on hover so the toggling makes an exception.
    _bind: () ->
      @$tip
        .on 'mouseenter', (event) =>
          @debugLog 'enter tip'
          if @_$currentTrigger?
            @_$currentTrigger.data @attr('is-active'), yes
            @wakeByTrigger @_$currentTrigger
        .on 'mouseleave', (event) =>
          @debugLog 'leave tip'
          if @_$currentTrigger?
            @_$currentTrigger.data @attr('is-active'), no
            @sleepByTrigger @_$currentTrigger
      # - Handle adapting to window resize.
      if @autoDirection is on
        $(window).resize _.debounce @_setBounds, 300

    # - The tip should only need to be rendered once.
    _render: () ->
      return no if @$tip.html().length
      html = @htmlOnRender()
      if not (html? and html.length) then html = @_defaultHtml()
      @$tip = $(html).addClass @classNames.follow
      @$tip.prependTo @$context

    # - The tip content will change as it's being refreshed / initialized.
    _inflateByTrigger: ($trigger) ->
      compoundDirection = if $trigger.data(@attr 'direction') then $trigger.data(@attr 'direction').split(' ') else @defaultDirection
      @debugLog 'update direction class', compoundDirection
      @$tip
        .find ".#{@classNames.content}"
          .text $trigger.data @attr 'content'
        .end()
        .removeClass [
          @classNames.north
          @classNames.south 
          @classNames.east
          @classNames.west
        ].join ' '
        .addClass $.trim(
          _.reduce compoundDirection, (classListMemo, directionComponent) =>
            "#{classListMemo} #{@classNames[directionComponent]}"
          , ''
        )

    # - The main toggle handler. Hooked into by `offsetOnTriggerMouseMove`.
    _onTriggerMouseMove: (event) ->
      return no if not event.pageX?
      $trigger = if (
        $trigger = $(event.currentTarget)) and 
        $trigger.hasClass(@classNames.trigger
      ) then $trigger else $trigger.closest(@classNames.trigger)
      return no if not $trigger.length
      @wakeByTrigger $trigger, event, =>
        offset =
          top: event.pageY
          left: event.pageX
        offset = @offsetOnTriggerMouseMove(event, offset, $trigger) or offset
        if @isDirection('north', $trigger) then offset.top -= @$tip.outerHeight() + @cursorHeight
        if @isDirection('west',  $trigger) then offset.left -= @$tip.outerWidth()
        if @isDirection('south', $trigger) then offset.top += @cursorHeight
        offset.top += @cursorHeight
        @$tip.css offset
        @debugLog '_onTriggerMouseMove', @_state, offset

    # - Auto-direction support. Given the context boundary, choose the best
    #   direction. The data is stored with the trigger and gets accessed elsewhere.
    _updateDirectionByTrigger: ($trigger) ->
      return no if @autoDirection is off
      # - Check if adapting is needed. Adapt and store as needed.
      checkDirectionComponent = (component) =>
        if not @_bounds? then @_setBounds()
        ok = yes
        switch component
          when 'south' then ok = (edge = triggerPosition.top + triggerHeight + tipSize.height) and @_bounds.bottom > edge
          when 'east'  then ok = (edge = triggerPosition.left + tipSize.width) and @_bounds.right > edge
          when 'north' then ok = (edge = triggerPosition.top - tipSize.height) and @_bounds.top < edge
          when 'west'  then ok = (edge = triggerPosition.left - tipSize.width) and @_bounds.left < edge
        @debugLog 'checkDirectionComponent', "'#{$trigger.html()}'", component, edge, tipSize
        if not ok
          switch component
            when 'south' then newDirection[0] = 'north'
            when 'east'  then newDirection[1] = 'west'
            when 'north' then newDirection[0] = 'south'
            when 'west'  then newDirection[1] = 'east'
          $trigger.data @attr('direction'), newDirection.join ' '
      # - Prepare for checking subroutine.
      triggerPosition = $trigger.position()
      triggerWidth    = $trigger.outerWidth()
      triggerHeight   = $trigger.outerHeight()
      tipSize         = @sizeForTrigger $trigger
      newDirection    = _.clone @defaultDirection
      # - Check each direction component.
      checkDirectionComponent component for component in @defaultDirection

    _setBounds: ->
      $context = if @$context.is('body') then $(window) else @$context
      @_bounds =
        top:    parseInt @$context.css('padding-top'), 10
        left:   parseInt @$context.css('padding-left'), 10
        bottom: $context.innerHeight()
        right:  @$context.innerWidth()

    # ###Public

    # - Does a stealth render to find tip size. The data is stored with the
    #   trigger and gets accessed elsewhere.
    sizeForTrigger: ($trigger, force=no) ->
      # - Try cached.
      size =
        width:  $trigger.data @attr 'width'
        height: $trigger.data @attr 'height'
      return size if size.width and size.height
      # - Otherwise new.
      @$tip.find(".#{@classNames.content}").text($trigger.data @attr 'content').end()
        .css
          display: 'block',
          visibility: 'hidden'
      $trigger.data @attr('width'),  (size.width = @$tip.outerWidth())
      $trigger.data @attr('height'), (size.height = @$tip.outerHeight())
      @$tip.css
        display: 'none',
        visibility: 'visible'
      size

    # - Direction is actually an array.
    isDirection: (directionComponent, $trigger) -> 
      (@$tip.hasClass @classNames[directionComponent]) or
      ((not $trigger? or not $trigger.data @attr 'direction') and 
        _.include @defaultDirection, directionComponent)

    # Methods

    # - The main toggler. Takes in a callback, which is usually to update position.
    #   The toggling and main changes only happen if the delay is passed.
    #   1. Store current trigger info.
    #   2. Go directly to the position updating if no toggling is needed.
    #   3. Don't toggle if awake or waking, or if event isn't `truemouseenter`.
    #   4. If we are in the middle of sleeping, stop and speed up our waking
    #      transition.
    #   5. Update our trigger cache.
    wakeByTrigger: ($trigger, event, onWake) ->
      # - Check.
      triggerChanged = not $trigger.is @_$currentTrigger
      if triggerChanged
        @_inflateByTrigger $trigger
        @_$currentTrigger = $trigger
      # - Guard.
      if @_state is 'awake' and onWake?
        onWake()
        @debugLog 'quick update'
        return yes
      if event? then @debugLog event.type
      return no if @_state in ['awake', 'waking']
      # - Prepare.
      delay = @ms.delay.in
      duration = @ms.duration.in
      wake = =>
        @onShow triggerChanged, event
        @$tip.fadeIn duration, =>
          if triggerChanged
            onWake() if onWake?
          if @safeToggle is on then @$tip.siblings(@classNames.tip).fadeOut()
          @afterShow triggerChanged, event
          @_state = 'awake'
      # - Run.
      if @_state is 'sleeping'
        @debugLog 'clear sleep'
        clearTimeout @_sleepCountdown
        duration = 0
        wake()
      else if event? and event.type is 'truemouseenter'
        triggerChanged = yes
        @_state = 'waking'
        @_wakeCountdown = setTimeout wake, delay
      # - Success.
      yes

    # - Much simpler toggler. As long as tip isn't truly visible, sleep is unneeded.
    sleepByTrigger: ($trigger) ->
      return no if @_state isnt 'awake'
      @_state = 'sleeping'
      clearTimeout @_wakeCountdown
      @_sleepCountdown = setTimeout =>
        @onHide()
        @$tip.fadeOut @ms.duration.out, =>
          @_state = 'asleep'
          @afterHide()
      , @ms.delay.out
      # - Success.
      yes

    # Hooks
    onShow: (triggerChanged, event) -> return
    onHide: $.noop
    afterShow: (triggerChanged, event) -> return
    afterHide: $.noop
    htmlOnRender: $.noop
    offsetOnTriggerMouseMove: (event, offset, $trigger) -> no

  # SnapTip API
  # -----------
  class SnapTip extends Tip

    constructor: ($triggers, options, $context) ->
      super $triggers, options, $context
      if @snap.toTrigger is off
        @snap.toTrigger = @snap.toXAxis is on or @snap.toYAxis is on
      if @snap.toXAxis is on then @cursorHeight = 0
      if @snap.toYAxis is on then @cursorHeight = 2
      @_offsetStart = null
      # - Add snapping config as classes.
      @$tip.addClass @classNames.snap[key] for key, active of @snap when active

    # ###Protected

    # - The main positioner. Uses the trigger offset as the base.
    #   TODO - Still needs to support all the directions.
    _moveToTrigger: ($trigger, baseOffset) ->
      #@debugLog baseOffset
      offset = $trigger.offset()
      if @snap.toXAxis is on
        if @isDirection 'south' then offset.top += $trigger.outerHeight()
        if @snap.toYAxis is off
          offset.left = baseOffset.left - (@$tip.outerWidth() - 12)/ 2 # Note arbitrary buffer offset.
      if @snap.toYAxis is on
        if @isDirection 'east' then offset.left += $trigger.outerWidth()
        if @snap.toXAxis is off
          offset.top = baseOffset.top - @$tip.outerHeight() / 2
      offset

    # - Bind to get initial position for snapping. This is only for snapping
    #   without snapping to the trigger, which is only what's currently supported.
    #   See `afterShow` hook.
    _bindTrigger: ($trigger) ->
      super $trigger
      $trigger.on @evt('truemouseleave'), (event) => @_offsetStart = null

    # ###Public

    # Hooked

    # - Make the tip invisible while it's being positioned, then reveal it.
    onShow: (triggerChanged, event) ->
      if triggerChanged is yes
        @$tip.css 'visibility', 'hidden'

    afterShow: (triggerChanged, event) ->
      if triggerChanged is yes
        @$tip.css 'visibility', 'visible'
        @_offsetStart =
          top: event.pageY
          left: event.pageX

    # - Main positioning handler.
    offsetOnTriggerMouseMove: (event, offset, $trigger) ->
      newOffset = _.clone offset
      if @snap.toTrigger is on
        newOffset = @_moveToTrigger $trigger, newOffset
      else
        if @snap.toXAxis is on
          newOffset.top = @_offsetStart.top
          @debugLog 'xSnap'
        if @snap.toYAxis is on
          newOffset.left = @_offsetStart.left
          @debugLog 'ySnap'
      newOffset

  # Export
  # ------
  # Both are exported with the `asSingleton` flag set to true.
  $.fn.tip = hlf.createPlugin hlf.tip, Tip, yes
  $.fn.snapTip = hlf.createPlugin hlf.snapTip, SnapTip, yes

# Export. Prefer AMD.
if define? and define.amd?
  define [
    'jquery'
    'underscore'
    'hlf/jquery.extension.hlf.core'
    'hlf/jquery.extension.hlf.event'
  ], plugin
else
  plugin jQuery, _, jQuery.hlf

