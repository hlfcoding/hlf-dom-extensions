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

# Export. Support AMD, CommonJS (Browserify), and browser globals.
((root, factory) ->
  if typeof define is 'function' and define.amd?
    # - AMD. Register as an anonymous module.
    define [
      'jquery'
      'underscore'
      'hlf/jquery.extension.hlf.core'
      'hlf/jquery.extension.hlf.event'
    ], factory
  else if typeof exports is 'object'
    # - Node. Does not work with strict CommonJS, but only CommonJS-like
    #   environments that support module.exports, like Node.
    module.exports = factory(
      require 'jquery',
      require 'underscore',
      require 'hlf/jquery.extension.hlf.core',
      require 'hlf/jquery.extension.hlf.event'
    )
  else
    # - Browser globals (root is window). No globals needed.
    factory jQuery, _, jQuery.hlf
)(@, ($, _, hlf) ->
  
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
      # - `$viewport` is the element in which the tip must fit into. It is not the
      #   context, which stores the tip instance and by convention contains the
      #   triggers.
      $viewport: $ 'body'
      # - `triggerContent` can be the name of the trigger element's attribute or a
      #   function that provides custom content when given the trigger element.
      triggerContent: null
      # - `cursorHeight` is the browser's cursor height. We need to know this to
      #   properly offset the tip to avoid cases of cursor-tip-stem overlap.
      cursorHeight: 12
      # - Note that the direction data structure must be an array of
      #   `components`, and conventionally with top/bottom first.
      defaultDirection: ['bottom', 'right']
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
        keys = ['inner', 'content', 'stem', 'top', 'right', 'bottom', 'left', 'follow', 'trigger']
        (classNames[key] = "#{pre}#{key}") for key in keys
        classNames.tip = 'js-tip'
        classNames
      # - `animations` are very configurable. Individual animations can be
      #   customized and will default to the base animation settings as needed.
      animations:
        base:
          delay: 0
          duration: 200
          easing: 'ease-in-out'
          enabled: yes
        show:
          delay: 200
        hide:
          delay: 200
        resize:
          delay: 300

  hlf.tip.snap =
    debug: off
    toString: _.memoize (context) ->
      switch context
        when 'event'  then '.hlf.snap-tip'
        when 'data'   then 'hlf-snap-tip'
        when 'class'  then 'js-snap-tips'
        else 'hlf.tip.snap'

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
          (classNames.snap[key] = "#{pre}#{value}") for own key, value of dictionary
          # Update our tip class.
          classNames.tip = 'js-tip js-snap-tip'
          classNames

  # Tip API
  # -------
  # Note that most of the interface is intended as protected.
  class Tip

    # The base constructor and `init` mostly do setup work that uses other
    # subroutines when needed. Note that we're also keeping `$triggers` and
    # `$context` as properties. `$context` is partly used to avoid directly
    # binding event listeners to triggers, which can improve performance and
    # allow dynamic binding.
    constructor: (@$triggers, options, @$context) ->
      for name, animation of options.animations when name isnt 'base'
        _.defaults animation, options.animations.base

    init: ->
      # Bind handler methods here after class setup completes.
      _.bindAll @, '_onTriggerMouseMove', '_setBounds'
      # The element represented by this API is `$tip`. We build it. Alias it to
      # `$el` for any mixins to consume.
      @_setTip = ($tip) => @$tip = @$el = $tip
      @_setTip $ '<div>'
      # Infer `doStem` and `doFollow` flags from respective `classNames` entries.
      @doStem = @classNames.stem isnt ''
      @doFollow = @classNames.follow isnt ''
      # Updated with `_setState`, `_state` toggles between: `awake`, `asleep`,
      # `waking`, `sleeping`. The use case behind these states is the tip will
      # remain visible and `awake` as long as there is a high enough frequency
      # of relevant mouse activity. This is achieved with a simple base
      # implementation around timers `_sleepCountdown` and `_wakeCountdown`.
      @_setState 'asleep'
      @_wakeCountdown = null
      @_sleepCountdown = null
      # `_$currentTrigger` helps manage trigger-related state.
      @_$currentTrigger = null
      # Tip instances start off rendered and bound.
      @_render()
      @_bind()
      # Process `$triggers` and setup content, event, and positioning aspects.
      processTrigger = ($trigger) =>
        return no if not $trigger.length
      @_bindTriggers()
        $trigger.addClass @classNames.trigger
        @_saveTriggerContent $trigger
        @_updateDirectionByTrigger $trigger
      # Do this for initially provided triggers.
      @$triggers.each (i, el) => processTrigger $(el)
      # If `doLiveUpdate` is inferred to be true, process triggers added in the
      # future. Make sure to ignore mutations related to the tip.
      @doLiveUpdate = window.MutationObserver?
      if @doLiveUpdate
        selector = @$triggers.selector
        onMutations = (mutations) =>
          for mutation in mutations
            $target = $ mutation.target
            continue if $target.hasClass(@classNames.content) # TODO: Limited.
            if mutation.addedNodes.length
              $triggers = $(mutation.addedNodes).find('[title],[alt]') # TODO: Limited.
              $triggers.each (i, el) => processTrigger $(el)
              @$triggers = @$triggers.add $triggers
        @_mutationObserver = new MutationObserver onMutations
        @_mutationObserver.observe @$context[0],
          childList: yes
          subtree: yes

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
    # supports the common `title` and `alt` meta content for an element. Support
    # is also provided for the `triggerContent` option. We take that content and
    # store it into a `content` jQuery data value on the trigger.
    _saveTriggerContent: ($trigger) ->
      content = null
      attr = null
      canRemoveAttr = yes
      if @triggerContent?
        if _.isFunction(@triggerContent) then content = @triggerContent $trigger
        else attr = @triggerContent
      else
        if $trigger.is('[title]')
          attr = 'title'
        else if $trigger.is('[alt]')
          attr = 'alt'
          canRemoveAttr = no
      if attr?
        content = $trigger.attr attr
        if canRemoveAttr then $trigger.removeAttr attr
      if content?
        $trigger.data @attr('content'), content

    # `_bindTriggers` links each trigger to the tip for: 1) possible appearance
    # changes during mouseenter, mouseleave (uses special events) and 2)
    # following on mousemove only if `doFollow` is on. Also note for our
    # `onMouseMove` handler, it's throttled by `requestAnimationFrame` when
    # available, otherwise manually at hopefully 60fps.
    _bindTriggers: ->
      selector = ".#{@classNames.trigger}"
      # Base bindings.
      @$context.on [
          @evt('truemouseenter')
          @evt('truemouseleave')
        ].join(' '),
        selector,
        { selector },
        (event) =>
          @debugLog event.type
          switch event.type
            when 'truemouseenter' then @_onTriggerMouseMove event
            when 'truemouseleave' then @sleepByTrigger $(event.target)
            else @debugLog 'unknown event type', event.type
          event.stopPropagation()
      # Follow binding.
      if @doFollow is on
        if window.requestAnimationFrame?
          onMouseMove = (event) =>
            requestAnimationFrame (timestamp) =>
              @_onTriggerMouseMove event
        else 
          onMouseMove = _.throttle @_onTriggerMouseMove, 16
        @$context.on 'mousemove', selector, onMouseMove

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
    # `$tip` to the DOM, specifically at the beginning of `$viewport`. It uses
    # the result of `htmlOnRender` and falls back to that of `_defaultHtml`. 
    # Render also sets up any animations per the `shouldAnimate` option.
    _render: ->
      return no if @$tip.html().length
      html = @htmlOnRender()
      if not (html? and html.length) then html = @_defaultHtml()
      $tip = $(html).addClass @classNames.follow
      # Animation setup.
      transitionStyle = []
      if @animations.resize.enabled
        duration = @animations.resize.duration / 1000.0 + 's'
        easing = @animations.resize.easing
        transitionStyle.push "width #{duration} #{easing}", "height #{duration} #{easing}"
      transitionStyle = transitionStyle.join(',')
      # /Animation setup.
      @_setTip $tip
      @selectByClass('content').css 'transition', transitionStyle
      @$tip.prependTo @$viewport

    # `_inflateByTrigger` will reset and update `$tip` for the given trigger, so
    # that it is ready to present, i.e. it is 'inflated'. Mostly it's just the
    # content element and class list that get updated. If the `resize` animation
    # is desired, we need to also specify the content element's dimensions for
    # respective transitions to take effect.
    _inflateByTrigger: ($trigger) ->
      compoundDirection = if $trigger.data(@attr('direction')) then $trigger.data(@attr('direction')).split(' ') else @defaultDirection
      @debugLog 'update direction class', compoundDirection
      $content = @selectByClass 'content'
      $content.text $trigger.data @attr('content')
      if @animations.resize.enabled
        contentSize = @sizeForTrigger $trigger, (contentOnly = yes)
        $content
          .width contentSize.width
          .height contentSize.height
      @$tip
        .removeClass [
          @classNames.top
          @classNames.bottom
          @classNames.right
          @classNames.left
        ].join ' '
        .addClass $.trim(
          _.reduce compoundDirection, (classListMemo, directionComponent) =>
            "#{classListMemo} #{@classNames[directionComponent]}"
          , ''
        )

    # `_onTriggerMouseMove` is actually the main tip toggling handler. To
    # explain, first we take into account of child elements triggering the mouse
    # event by deducing the event's actual `$trigger` element. Then we
    # `wakeByTrigger` if needed.
    _onTriggerMouseMove: (event) ->
      return no if not event.pageX?
      $trigger = if (
        ($trigger = $(event.currentTarget)) and
        $trigger.hasClass @classNames.trigger
      ) then $trigger else $trigger.closest(@classNames.trigger)
      return no if not $trigger.length
      @wakeByTrigger $trigger, event

    # `_positionToTrigger` will properly update the tip offset per
    # `offsetOnTriggerMouseMove` and `isDirection`. Also note that `stemSize`
    # gets factored in.
    _positionToTrigger: ($trigger, mouseEvent, cursorHeight=@cursorHeight) ->
      return no if not mouseEvent?
      offset =
        top: mouseEvent.pageY
        left: mouseEvent.pageX
      offset = @offsetOnTriggerMouseMove(mouseEvent, offset, $trigger) or offset
      if @isDirection('top', $trigger)
        offset.top -= @$tip.outerHeight() + @stemSize()
      else if @isDirection('bottom', $trigger)
        offset.top += @stemSize() + cursorHeight
      if @isDirection('left',  $trigger)
        tipWidth = @$tip.outerWidth()
        triggerWidth = $trigger.outerWidth()
        offset.left -= tipWidth
        # If direction changed due to tip being wider than trigger.
        if tipWidth > triggerWidth
          offset.left += triggerWidth
      @$tip.css offset

    # `stemSize` does a stealth render via `_wrapStealthRender` to find stem
    # `size. The stem layout styles will add offset to the tip content based on
    # `the tip direction. Knowing the size helps operations like overall tip
    # positioning.
    stemSize: ->
      key = @attr 'stem-size'
      size = @$tip.data key
      return size if size?
      $content = @selectByClass 'content'
      wrapped = @_wrapStealthRender =>
        for direction, offset in $content.position()
          if offset > 0
            size = Math.abs offset
            @$tip.data key, size
        0
      return wrapped()

    # `_updateDirectionByTrigger` is the main provider of auto-direction
    # support. Given the `$viewport`'s `_bounds`, it changes to the best
    # direction as needed. The current `direction` is stored as jQuery data with
    # trigger.
    _updateDirectionByTrigger: ($trigger) ->
      return no if @autoDirection is off
      triggerPosition = $trigger.position()
      triggerWidth    = $trigger.outerWidth()
      triggerHeight   = $trigger.outerHeight()
      tipSize         = @sizeForTrigger $trigger
      newDirection    = _.clone @defaultDirection
      @debugLog { triggerPosition, triggerWidth, triggerHeight, tipSize }
      for component in @defaultDirection
        if not @_bounds? then @_setBounds()
        ok = yes
        switch component
          when 'bottom' then ok = (edge = triggerPosition.top + triggerHeight + tipSize.height) and @_bounds.bottom > edge
          when 'right'  then ok = (edge = triggerPosition.left + tipSize.width) and @_bounds.right > edge
          when 'top'    then ok = (edge = triggerPosition.top - tipSize.height) and @_bounds.top < edge
          when 'left'   then ok = (edge = triggerPosition.left - tipSize.width) and @_bounds.left < edge
        @debugLog 'checkDirectionComponent', { component, edge }
        if not ok
          switch component
            when 'bottom' then newDirection[0] = 'top'
            when 'right'  then newDirection[1] = 'left'
            when 'top'    then newDirection[0] = 'bottom'
            when 'left'   then newDirection[1] = 'right'
          $trigger.data @attr('direction'), newDirection.join ' '

    # `_setBounds` updates `_bounds` per `$viewport`'s inner bounds, and those
    # measures get used by `_updateDirectionByTrigger`.
    _setBounds: ->
      $viewport = if @$viewport.is('body') then $(window) else @$viewport
      @_bounds =
        top:    $.css @$viewport[0], 'padding-top', yes
        left:   $.css @$viewport[0], 'padding-left', yes
        bottom: $viewport.innerHeight()
        right:  $viewport.innerWidth()

    _setState: (state) ->
      return no if state is @_state
      @_state = state
      @debugLog @_state

    # `sizeForTrigger` does a stealth render via `_wrapStealthRender` to find tip
    # size. It will return saved data if possible before doing a measure. The
    # measures, used by `_updateDirectionByTrigger`, are stored on the trigger
    # as namespaced, `width` and `height` jQuery data values. If on,
    # `contentOnly` will factor in content padding into the size value for the
    # current size.
    sizeForTrigger: ($trigger, contentOnly=no) ->
      # Short on existing data.
      size =
        width:  $trigger.data 'width'
        height: $trigger.data 'height'
      # Get size.
      $content = @selectByClass('content')
      if not (size.width? and size.height?)
        $content.text $trigger.data @attr('content')
        wrapped = @_wrapStealthRender ->
          $trigger.data 'width',  (size.width = @$tip.outerWidth())
          $trigger.data 'height', (size.height = @$tip.outerHeight())
        wrapped()
      # Get content size.
      if contentOnly is yes
        padding = $content.css('padding').split(' ')
        [top, right, bottom, left] = (parseInt side, 10 for side in padding)
        bottom ?= top
        left ?= right
        size.width -= left + right
        size.height -= top + bottom + @selectByClass('stem').height() # TODO: This isn't always true.
      size

    # `_wrapStealthRender` is a helper mostly for size detection on tips and
    # triggers. Without stealth rendering the elements by temporarily un-hiding
    # and making invisible, we can't do `getComputedStyle` on them.
    _wrapStealthRender: (func) ->
      =>
        return func.apply @, arguments if not @$tip.is(':hidden')
        @$tip.css
          display: 'block'
          visibility: 'hidden'
        result = func.apply @, arguments
        @$tip.css
          display: 'none',
          visibility: 'visible'
        return result

    # `isDirection` is a helper to deduce if `$tip` currently has the given
    # `directionComponent`. The tip is considered to have the same direction as
    # the given `$trigger` if it has the classes or if there is no trigger or
    # saved direction value and the directionComponent is part of
    # `defaultDirection`. Note that this latter check is placed last for
    # performance savings.
    isDirection: (directionComponent, $trigger) ->
      @$tip.hasClass(@classNames[directionComponent]) or (
        (not $trigger? or not $trigger.data(@attr('direction'))) and
        _.include(@defaultDirection, directionComponent)
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
      if @_state is 'awake'
        @_positionToTrigger $trigger, event
        @onShow triggerChanged, event
        if onWake? then onWake()
        @debugLog 'quick update'
        return yes
      if event? then @debugLog event.type
      # Don't toggle if awake or waking, or if event isn't `truemouseenter`.
      return no if @_state in ['awake', 'waking']
      # Get delay and initial duration.
      delay = @animations.show.delay
      duration = @animations.show.duration
      # Our `wake` subroutine runs the timed-out logic, which includes the fade
      # transition. The latter is also affected by `safeToggle`. The `onShow`
      # and `afterShow` hook methods are also run.
      wake = =>
        @_positionToTrigger $trigger, event
        @onShow triggerChanged, event
        @$tip.stop().fadeIn duration, =>
          if triggerChanged
            onWake() if onWake?
          if @safeToggle is on then @$tip.siblings(@classNames.tip).fadeOut()
          @afterShow triggerChanged, event
          @_setState 'awake'
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
        @_setState 'waking'
        @_wakeCountdown = setTimeout wake, delay
      yes

    # `sleepByTrigger` is a much simpler toggler compared to its counterpart
    # `wakeByTrigger`. It also updates `_state` and returns a bool for success.
    # As long as the tip isn't truly visible, sleep is unneeded.
    sleepByTrigger: ($trigger) ->
      # Don't toggle if asleep or sleeping.
      return no if @_state in ['asleep', 'sleeping']
      @_setState 'sleeping'
      clearTimeout @_wakeCountdown
      @_sleepCountdown = setTimeout =>
        @onHide()
        @$tip.stop().fadeOut @animations.hide.duration, =>
          @_setState 'asleep'
          @afterHide()
      , @animations.hide.delay
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
    init: ->
      super()
      # Infer `snap.toTrigger`.
      if @snap.toTrigger is off
        @snap.toTrigger = @snap.toXAxis is on or @snap.toYAxis is on
      # `_offsetStart` stores the original offset, which is used for snapping.
      @_offsetStart = null
      # Add snapping config as classes.
      @$tip.addClass(@classNames.snap[key]) for own key, active of @snap when active

    # `_moveToTrigger` is the main positioner. The `baseOffset` given is expected
    # to be the trigger offset.
    _moveToTrigger: ($trigger, baseOffset) -> # TODO: Still needs to support all the directions.
      #@debugLog baseOffset
      offset = $trigger.position()
      toTriggerOnly = @snap.toTrigger is on and @snap.toXAxis is off and @snap.toYAxis is off
      if @snap.toXAxis is on
        if @isDirection 'bottom', $trigger
          offset.top += $trigger.outerHeight()
        if @snap.toYAxis is off
          # Note arbitrary buffer offset.
          offset.left = baseOffset.left - @$tip.outerWidth() / 2
      if @snap.toYAxis is on
        if @isDirection 'right', $trigger
          offset.left += $trigger.outerWidth()
        if @snap.toXAxis is off
          offset.top = baseOffset.top - @$tip.outerHeight() / 2
      if toTriggerOnly is on
        if @isDirection 'bottom', $trigger
          offset.top += $trigger.outerHeight()
      offset

    # Extend `_bindTriggers` to get initial position for snapping. This is only
    # for snapping without snapping to the trigger, which is only what's
    # currently supported. See `afterShow` hook.
    _bindTriggers: ->
      super()
      selector = ".#{@classNames.trigger}"
      # Modify base binding.
      @$context.on @evt('truemouseleave'), selector, { selector },
        (event) => @_offsetStart = null

    # Extend `_positionToTrigger` to set `cursorHeight` to 0, since it won't
    # need to be factored in if we're snapping.
    _positionToTrigger: ($trigger, mouseEvent, cursorHeight=@cursorHeight) ->
      super $trigger, mouseEvent, 0

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
      newOffset = @_moveToTrigger $trigger, newOffset
      newOffset

  # Export
  # ------
  # Both are exported with the `asSharedInstance` flag set to true.
  hlf.createPlugin
    name: 'tip'
    namespace: hlf.tip
    apiClass: Tip
    asSharedInstance: yes
    baseMixins: ['selection']
    compactOptions: yes
  hlf.createPlugin
    name: 'snapTip'
    namespace: hlf.tip.snap
    apiClass: SnapTip
    asSharedInstance: yes
    baseMixins: ['selection']
    compactOptions: yes

  yes

)
