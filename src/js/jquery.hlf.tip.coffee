###
HLF Tip jQuery Plugin
=====================
Released under the MIT License  
Written with jQuery 1.7.2  
###

# The base `tip` plugin features basic trigger element parsing, direction-based
# attachment, cursor following, appearance state management and presentation by
# fading, custom tip content, and use of the `hlf.hoverIntent` event extension.
# The tip object is shared amongst the provided triggers.

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

    # SnapTip Options
    # ---------------
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
  # Note that most of the interface is intended as protected.
  class Tip

    # The base constructor mostly does setup work that uses other subroutines
    # when needed. Note that we're also keeping `$triggers` and `$context` as
    # properties.
    constructor: (@$triggers, options, @$context) ->
      # Per convention, bind handler methods here.
      _.bindAll @, '_onTriggerMouseMove', '_setBounds'
      # Extend self with `options`.  
      # See default options for property names.
      $.extend (deep = yes), @, options
      # The element represented by this API is `$tip`. We build it.
      @$tip = $ '<div>'
      # Infer `doStem` and `doFollow` flags from respective `classNames` entries.
      @doStem = @classNames.stem isnt ''
      @doFollow = @classNames.follow isnt ''
      # `_state` toggles between: `awake`, `asleep`, `waking`, `sleeping`. The
      # use case behind these states is the tip will remain visible and `awake`
      # as long as there is a high enough frequency of relevant mouse activity.
      # This is achieved with a simple base implementation around timers
      # `_sleepCountdown` and `_wakeCountdown`.
      @_state = 'asleep'
      @_wakeCountdown = null
      @_sleepCountdown = null
      # `_$currentTrigger` helps manage trigger-related state.
      @_$currentTrigger = null
      # Tip instances start off rendered and bound.
      @_render()
      @_bind()
      # Process `$triggers` and setup content, event, and positioning aspects.
      @$triggers.each (i, el) =>
        $trigger = $ el
        $trigger.addClass @classNames.trigger
        @_saveTriggerContent $trigger
        @_bindTrigger $trigger
        @_updateDirectionByTrigger $trigger

    # `_defaultHtml` provides a basic html structure for tip content. It can be
    # customized via the `tipTemplate` external option, or by subclasses using
    # the `htmlOnRender` hook.
    _defaultHtml: ->
      directionClass = $.trim(
        _.reduce @defaultDirection, (classListMemo, directionComponent) =>
          "#{classListMemo} #{@classNames[directionComponent]}"
        , ''
      )
      containerClass = $.trim [@classNames.tip, @classNames.follow, directionClass].join ' '
      html = @tipTemplate containerClass

    # `_saveTriggerContent` comes with a very simple base implementation that's
    # more for links and their `title` attribute. We take that content and store
    # it into a `content` jQuery data value on the trigger.
    _saveTriggerContent: ($trigger) ->
      title = $trigger.attr 'title'
      if title?
        $trigger
          .data @attr('content'), title
          .removeAttr 'title'

    # `_bindTrigger` links the trigger to the tip for: 1) possible appearance
    # changes during mouseenter, mouseleave (uses special events) and 2)
    # following on mousemove only if `doFollow` is on. Also note for our
    # `onMouseMove` handler, it's throttled by `requestAnimationFrame` when
    # available, otherwise manually at hopefully 60fps.
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

    # `_bind` adds event handlers to `$tip`, mostly so state can be updated such
    # that the handlers on `_$currentTrigger` make an exception. The desired
    # behavior is the cursor leaving the trigger for the tip doesn't cause the
    # tip to dismiss.
    _bind: ->
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
      # Additionally, track viewport `_bounds` at a reasonable rate, so that
      # `_updateDirectionByTrigger` can work properly.
      if @autoDirection is on
        $(window).resize _.debounce @_setBounds, 300

    # `_render` comes with a base implementation that fills in and attaches
    # `$tip` to the DOM, specifically at the beginning of `$context`. It uses
    # the result of `htmlOnRender` and falls back to that of `_defaultHtml`.
    _render: ->
      return no if @$tip.html().length
      html = @htmlOnRender()
      if not (html? and html.length) then html = @_defaultHtml()
      @$tip = $(html).addClass @classNames.follow
      @$tip.prependTo @$context

    # `_inflateByTrigger` will reset and update `$tip` for the given trigger, so
    # that it is ready to present, i.e. it is 'inflated'. Mostly it's just the
    # content and class list that get updated.
    _inflateByTrigger: ($trigger) ->
      compoundDirection = if $trigger.data(@attr('direction')) then $trigger.data(@attr('direction')).split(' ') else @defaultDirection
      @debugLog 'update direction class', compoundDirection
      @$tip
        .find ".#{@classNames.content}"
          .text $trigger.data @attr('content')
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

    # `_onTriggerMouseMove` is actually the main tip toggling handler. To
    # explain, first we take into account of child elements triggering the mouse
    # event by deducing the event's actual `$trigger` element. Then we
    # `wakeByTrigger` if needed, and provide a completion callback that will
    # properly update the tip offset per `offsetOnTriggerMouseMove` and
    # `isDirection`. Also note that `cursorHeight` gets factored in.
    _onTriggerMouseMove: (event) ->
      return no if not event.pageX?
      $trigger = if (
        ($trigger = $(event.currentTarget)) and
        $trigger.hasClass @classNames.trigger
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

    # `_updateDirectionByTrigger` is the main provider of auto-direction
    # support. Given the `$context`'s `_bounds`, it changes to the best
    # direction as needed. The current `direction` is stored as jQuery data with
    # trigger.
    _updateDirectionByTrigger: ($trigger) ->
      return no if @autoDirection is off
      triggerPosition = $trigger.position()
      triggerWidth    = $trigger.outerWidth()
      triggerHeight   = $trigger.outerHeight()
      tipSize         = @sizeForTrigger $trigger
      newDirection    = _.clone @defaultDirection
      for component in @defaultDirection
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

    # `_setBounds` updates `_bounds` per `$context`'s inner bounds, and those
    # measures get used by `_updateDirectionByTrigger`.
    _setBounds: ->
      $context = if @$context.is('body') then $(window) else @$context
      @_bounds =
        top:    parseInt @$context.css('padding-top'), 10
        left:   parseInt @$context.css('padding-left'), 10
        bottom: $context.innerHeight()
        right:  $context.innerWidth()

    # `sizeForTrigger` does a stealth render to find tip size by temporarily un-
    # hiding and making invisible. It will return saved data if possible before
    # doing a measure. The measures, used by `_updateDirectionByTrigger`, are
    # stored on the trigger as namespaced, `width` and `height` jQuery data
    # values.
    sizeForTrigger: ($trigger, force=no) ->
      size =
        width:  $trigger.data @attr('width')
        height: $trigger.data @attr('height')
      return size if size.width and size.height
      @$tip
        .find ".#{@classNames.content}"
          .text $trigger.data @attr('content')
        .end()
        .css
          display: 'block'
          visibility: 'hidden'
      $trigger.data @attr('width'),  (size.width = @$tip.outerWidth())
      $trigger.data @attr('height'), (size.height = @$tip.outerHeight())
      @$tip.css
        display: 'none',
        visibility: 'visible'
      size

    # `isDirection` is a helper to deduce if `$tip` currently has the given
    # `directionComponent`. The tip is considered to have the same direction as
    # the given `$trigger` if it has the classes or if there is no trigger or
    # saved direction value and the directionComponent is part of
    # `defaultDirection`. Note that this latter check is placed last for
    # performance savings.
    isDirection: (directionComponent, $trigger) ->
      (
        @$tip.hasClass(@classNames[directionComponent]) or (
          (not $trigger? or not $trigger.data(@attr('direction'))) and 
          _.include(@defaultDirection, directionComponent)
        )
      )

    # `wakeByTrigger` is the main toggler and a `_state` updater. It takes an
    # `onWake` callback, which is usually to update position. The toggling and
    # main changes only happen if the delay is passed. It will return a bool for
    # success.
    wakeByTrigger: ($trigger, event, onWake) ->
      # Store current trigger info.
      triggerChanged = not $trigger.is @_$currentTrigger
      if triggerChanged
        @_inflateByTrigger $trigger
        @_$currentTrigger = $trigger
      # Go directly to the position updating if no toggling is needed.
      if @_state is 'awake' and onWake?
        onWake()
        @debugLog 'quick update'
        return yes
      if event? then @debugLog event.type
      # Don't toggle if awake or waking, or if event isn't `truemouseenter`.
      return no if @_state in ['awake', 'waking']
      delay = @ms.delay.in
      duration = @ms.duration.in
      # Our `wake` subroutine runs the timed-out logic, which includes the fade
      # transition. The latter is also affected by `safeToggle`. The `onShow`
      # and `afterShow` hook methods are also run.
      wake = =>
        @onShow triggerChanged, event
        @$tip.fadeIn duration, =>
          if triggerChanged
            onWake() if onWake?
          if @safeToggle is on then @$tip.siblings(@classNames.tip).fadeOut()
          @afterShow triggerChanged, event
          @_state = 'awake'
      # Wake up depending on current state.  
      # If we are in the middle of sleeping, stop sleeping by updating
      # `_sleepCountdown` and wake up sooner.
      if @_state is 'sleeping'
        @debugLog 'clear sleep'
        clearTimeout @_sleepCountdown
        duration = 0
        wake()
      # Start the normal wakeup and update `_wakeCountdown`.
      else if event? and event.type is 'truemouseenter'
        triggerChanged = yes
        @_state = 'waking'
        @_wakeCountdown = setTimeout wake, delay
      yes

    # `sleepByTrigger` is a much simpler toggler compared to its counterpart
    # `wakeByTrigger`. It also updates `_state` and returns a bool for success.
    # As long as the tip isn't truly visible, sleep is unneeded.
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
      yes

    # These methods are hooks for custom functionality from subclasses. Some are
    # set to no-ops becase they are given no arguments.
    onShow: (triggerChanged, event) -> undefined
    onHide: $.noop
    afterShow: (triggerChanged, event) -> undefined
    afterHide: $.noop
    htmlOnRender: $.noop
    offsetOnTriggerMouseMove: (event, offset, $trigger) -> no

  # SnapTip API
  # -----------
  # With such a complete base API, extending it with an implementation with
  # snapping becomes almost trivial.
  class SnapTip extends Tip

    # Continue setting up `$tip` and other properties.
    constructor: ($triggers, options, $context) ->
      super $triggers, options, $context
      # Infer `snap.toTrigger`.
      if @snap.toTrigger is off
        @snap.toTrigger = @snap.toXAxis is on or @snap.toYAxis is on
      # Tweak `cursorHeight`.
      if @snap.toXAxis is on then @cursorHeight = 0
      if @snap.toYAxis is on then @cursorHeight = 2
      # `_offsetStart` stores the original offset, which is used for snapping.
      @_offsetStart = null
      # Add snapping config as classes.
      @$tip.addClass @classNames.snap[key] for key, active of @snap when active

    # `_moveToTrigger` is the main positioner. The `baseOffset` given is
    # expected to be the trigger offset.  
    # TODO: Still needs to support all the directions.
    _moveToTrigger: ($trigger, baseOffset) ->
      #@debugLog baseOffset
      offset = $trigger.offset()
      if @snap.toXAxis is on
        if @isDirection 'south' then offset.top += $trigger.outerHeight()
        if @snap.toYAxis is off
          # Note arbitrary buffer offset.
          offset.left = baseOffset.left - (@$tip.outerWidth() - 12)/ 2
      if @snap.toYAxis is on
        if @isDirection 'east' then offset.left += $trigger.outerWidth()
        if @snap.toXAxis is off
          offset.top = baseOffset.top - @$tip.outerHeight() / 2
      offset

    # Extend `_bindTrigger` to get initial position for snapping. This is only
    # for snapping without snapping to the trigger, which is only what's
    # currently supported. See `afterShow` hook.
    _bindTrigger: ($trigger) ->
      super $trigger
      $trigger.on @evt('truemouseleave'), (event) => @_offsetStart = null

    # `onShow` and `afterShow` are implemented such that they make the tip
    # invisible while it's being positioned and then reveal it.
    onShow: (triggerChanged, event) ->
      if triggerChanged is yes
        @$tip.css 'visibility', 'hidden'
    afterShow: (triggerChanged, event) ->
      if triggerChanged is yes
        @$tip.css 'visibility', 'visible'
        @_offsetStart =
          top: event.pageY
          left: event.pageX

    # `offsetOnTriggerMouseMove` is implemented as the main snapping positioning
    # handler. Instead of returning false, we return our custom, snapping
    # offset, so it gets used in lieu of the base `offset`.
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

