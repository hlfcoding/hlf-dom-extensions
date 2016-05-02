###
HLF Tip jQuery Plugin
=====================
###

# [Styles](../css/jquery.hlf.tip.html) | [Tests](../../tests/js/tip.html)

# The base `tip` plugin does several things. It does basic parsing of trigger
# element attributes for the tip content. It can anchor itself to a trigger by
# selecting the best direction. It can follow the cursor. It toggles its
# appearance by fading in and out and resizing, all via configurable animation
# options. It can display custom tip content. It uses the `hlf.hoverIntent`
# event extension to prevent over-queueing of appearance handlers. Last, the tip
# object attaches to the context element. It acts as tip for the the current
# jQuery selection via event delegation.

# The extended `snapTip` plugin extends the base tip. It allows the tip to snap
# to the trigger element. And by default the tip locks into place. But turn on
# only one axis of snapping, and the tip will follow the mouse only on the other
# axis. For example, snapping to the x-axis will only allow the tip to shift
# along the y-axis. The x will remain constant.

# § __UMD__
# - When AMD, register the attacher as an anonymous module.
# - When Node or Browserify, set module exports to the attach result.
# - When browser globals (root is window), Just run the attach function.
((root, attach) ->
  if typeof define is 'function' and define.amd?
    define [
      'jquery'
      'underscore'
      'hlf/jquery.extension.hlf.core'
      'hlf/jquery.extension.hlf.event'
    ], attach
  else if typeof module is 'object' && module.exports?
    module.exports = attach(
      require 'jquery',
      require 'underscore',
      require 'hlf/jquery.extension.hlf.core',
      require 'hlf/jquery.extension.hlf.event'
    )
  else
    attach jQuery, _, jQuery.hlf
  return
)(@, ($, _, hlf) ->
  'use strict'

  #- Cache common references internally.
  _requestAnimationFrame = window.requireAnimationFrame or
    window.Modernizr?.prefixed 'requestAnimationFrame', window

  # Namespace
  # ---------

  # It takes some more boilerplate to write the plugins. Any of this additional
  # support API is put into a plugin specific namespace under `$.hlf`, which in
  # this case is __$.hlf.tip__.
  #
  # - __debug__ toggles debug logging for all instances of a plugin.
  # - __toString__ helps to namespace when extending any jQuery API.
  #
  # The plugin's __defaults__ are available as reference. Also note that _the
  # plugin instance gets extended with the options_.
  #
  # - __$viewport__ is the element in which the tip must fit. It is _not_ the
  #   context element, which stores the tip instance and by convention contains
  #   the triggers.
  #
  # - __autoDirection__ automatically changes the direction to better fit the
  #   tip inside the viewport.
  #
  # - __cursorHeight__ is the browser's cursor height. We need to know this to
  #   properly offset the tip to avoid cases of cursor-tip-stem overlap.
  #
  # - __defaultDirection__ is used as a tie-breaker when selecting the best
  #   direction. Note that the direction data structure must be an array of
  #   `components`, and conventionally with top/bottom first.
  #
  # - __fireEvents__ can allow events __show.hlf.tip__ and __shown.hlf.tip__,
  #   __hide.hlf.tip__ and __hidden.hlf.tip__ to be triggered from the trigger
  #   elements. This is off by default to improve performance.
  #
  # - __tipTemplate__ should return interpolated html when given the additional
  #   container class list. Its context is the plugin instance.
  #
  # - __triggerContent__ can be the name of the trigger element's attribute or a
  #   function that provides custom content when given the trigger element.
  #
  # - Note: for these tip plugins, the majority of presentation state logic is
  #   in the plugin stylesheet. We update the presentation state by using
  #   namespaced __classNames__ generated in a closure.
  # 
  #   - __classNames.stem__ - Empty string to remove the stem.
  #   - __classNames.follow__ - Empty string to disable cursor following.
  #
  # - __animator__ by default uses the stock jQuery animation system. If you
  #   want a more performant system, like GreenSock or Velocity, set it here.
  #   See the visual tests for an example.
  #
  # - __animations__ are very configurable. Individual animations can be
  #   customized and will default to the base animation settings as needed.
  #
  # - __followUsingTransform__ will automatically check CSS transforms support
  #   via Modernizr. So you'll need to use Modernizr or manually enable this
  #   option to use the more performant transforms.
  #
  hlf.tip =
    debug: off
    toString: _.memoize (context) ->
      switch context
        when 'event'  then '.hlf.tip'
        when 'data'   then 'hlf-tip'
        when 'class'  then 'js-tips'
        else 'hlf.tip'

    defaults: do (pre = 'js-tip-') ->

      $viewport: $ 'body'
      autoDirection: on
      cursorHeight: 12
      defaultDirection: ['bottom', 'right']
      fireEvents: on
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
      triggerContent: null
      classNames: do ->
        classNames = {}
        keys = ['inner', 'content', 'stem', 'top', 'right', 'bottom', 'left', 'follow', 'trigger']
        (classNames[key] = "#{pre}#{key}") for key in keys
        classNames.tip = 'js-tip'
        classNames
      animator:
        show: ($el, options) -> $el.stop().fadeIn options
        hide: ($el, options) -> $el.stop().fadeOut options
      animations:
        base:
          delay: 0
          duration: 200
          enabled: yes
        show:
          delay: 200
        hide:
          delay: 200
        resize:
          delay: 300
          easing: 'ease-in-out'
      followUsingTransform: window.Modernizr?.csstransforms

  # Within `$.hlf.tip` is a subnamespace for the `snapTip` plugin
  # __$.hlf.tip.snap__.
  #
  # Its __defaults__ extend `tip`'s defaults.
  # 
  # - __snap.toXAxis__ is the switch for snapping along x-axis and only
  #   following along y-axis. Off by default.
  # - __snap.toYAxis__ is the switch for snapping along y-axis and only
  #   following along x-axis. Off by default.
  # - __snap.toTrigger__ is the switch for snapping to trigger built on
  #   axis-snapping. On by default.
  hlf.tip.snap =
    debug: off
    toString: _.memoize (context) ->
      switch context
        when 'event'  then '.hlf.snap-tip'
        when 'data'   then 'hlf-snap-tip'
        when 'class'  then 'js-snap-tips'
        else 'hlf.tip.snap'

    defaults: do (pre = 'js-snap-tip-') ->
      $.extend (deep = yes), {}, hlf.tip.defaults,
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
          classNames.tip = 'js-tip js-snap-tip'
          classNames

  # Tip
  # ---
  class Tip

    # __constructor__ keeps `$triggers` and `$context` as properties. `options`
    # is further normalized.
    constructor: (@$triggers, options, @$context) ->
      for own name, animation of options.animations when name isnt 'base'
        _.defaults animation, options.animations.base

    # __init__ offloads non-trivial setup to other subroutines. Otherwise it will:
    # 1. Store the tip element.
    # 2. Infer `doStem` and `doFollow` flags from respective `classNames` entries.
    # 3. Initialize state, which is either: `awake`, `asleep`, `waking`, `sleeping`;
    #    and which will respectively show or hide the tip.
    # 4. Initialize timers. The tip should remain visible and `awake` as long as
    #    there is a high enough frequency of relevant mouse activity. In addition
    #    to using `hoverIntent`, this is achieved with a basic implementation
    #    around timers `_sleepCountdown` and `_wakeCountdown`, and an extra
    #    reference to `_$currentTrigger`.
    # 5. Initialize tip. Note the initial render.
    # 6. Initialize context.
    # 7. Initialize triggers. Note the initial processing.
    init: ->
      _.bindAll @, '_onTriggerMouseMove', '_setBounds'

      @_setTip $ '<div>'

      @doStem = @classNames.stem isnt ''
      @doFollow = @classNames.follow isnt ''

      @_setState 'asleep'

      @_wakeCountdown = null
      @_sleepCountdown = null
      @_$currentTrigger = null

      @_render()
      @_bind()
      
      @_bindContext()

      @_processTriggers()
      @_bindTriggers()
      return

    # § __Accessors__

    # ___defaultHtml__ provides a basic html structure for tip content. It can be
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

    # ___isDirection__ deduces if `$tip` has the given `directionComponent`,
    # which is true if it has the classes or if there is no given `$trigger` or
    # saved direction value, and `directionComponent` is part of
    # `defaultDirection`.
    _isDirection: (directionComponent, $trigger) ->
      @$tip.hasClass(@classNames[directionComponent]) or (
        (not $trigger? or not $trigger.data(@attr('direction'))) and
        _.include(@defaultDirection, directionComponent)
      )

    # ___offsetForTrigger__ computes the proper trigger offset for proper tip
    # attachment. Fixed-position triggers need to fall back to the fool-proof
    # `$.fn.offset`. This is despite `$.fn.position` being de-facto for elements
    # sharing a parent positioning context.
    _offsetForTrigger: ($trigger) ->
      if $trigger.css('position') is 'fixed' then $trigger.offset()
      else $trigger.position()

    # ___setCurrentTrigger__ also updates a trigger and makes it current, but
    # only if it isn't already.
    _setCurrentTrigger: ($trigger) ->
      @_triggerChanged = not $trigger.is @_$currentTrigger
      return no unless @_triggerChanged
      @_inflateByTrigger $trigger
      @_$currentTrigger = $trigger
      return


    # ___setState__ also performs minor tasks when switching to a new state, if
    # it did not first return `false` from no state change.
    _setState: (state, data) ->
      return no if state is @_state
      #- previous = @_state
      @_state = state
      @debugLog @_state
      switch state
        when 'asleep'
          @_$currentTrigger?.trigger @evt('hidden') if @fireEvents is on
          @afterHide data?.event
          _.defer => @_togglePositionTransition off
        when 'awake'
          @_$currentTrigger?.trigger @evt('shown') if @fireEvents is on
          @afterShow data?.event
          _.defer => @_togglePositionTransition off
        when 'sleeping'
          @_$currentTrigger?.trigger @evt('hide') if @fireEvents is on
          clearTimeout @_wakeCountdown
          if data?.event? and $(data.event.target).hasClass(@classNames.trigger)
            isLeavingToContext = not $(data.event.relatedTarget).hasClass @classNames.trigger
            @_togglePositionTransition isLeavingToContext
        when 'waking'
          @_$currentTrigger?.trigger @evt('show') if @fireEvents is on
          clearTimeout @_sleepCountdown
          @_triggerChanged = yes
      return

    # ___setTip__ aliases the conventional `$el` property to `$tip` for clarity.
    _setTip: ($tip) => @$tip = @$el = $tip; return

    # ___sizeForTrigger__ does a stealth render via `_wrapStealthRender` to find
    # tip size. It returns saved data if possible before doing a measure. The
    # measures, used by `_updateDirectionByTrigger`, are stored on the trigger
    # as namespaced, `width` and `height` jQuery data values. If on,
    # `contentOnly` will factor in content padding into the size value for the
    # current size.
    _sizeForTrigger: ($trigger, contentOnly=no) ->
      size =
        width:  $trigger.data 'width'
        height: $trigger.data 'height'

      $content = @selectByClass('content')
      if not (size.width? and size.height?)
        $content.text $trigger.data @attr('content')
        wrapped = @_wrapStealthRender ->
          $trigger.data 'width',  (size.width = @$tip.outerWidth())
          $trigger.data 'height', (size.height = @$tip.outerHeight())
        wrapped()

      if contentOnly is yes
        padding = $content.css('padding').split(' ')
        [top, right, bottom, left] = (parseInt side, 10 for side in padding)
        bottom ?= top
        left ?= right
        size.width -= left + right
        size.height -= top + bottom

      size

    # ___stemSize__ does a stealth render via `_wrapStealthRender` to find stem
    # size. The stem layout styles will add offset to the tip content based on
    # the tip direction. Knowing the size helps operations like overall tip
    # positioning.
    _stemSize: ->
      key = @attr 'stem-size'
      size = @$tip.data key
      return size if size?

      $stem = @selectByClass 'stem'
      wrapped = @_wrapStealthRender =>
        size = Math.abs parseInt($stem.css('margin').replace(/0px/g, ''), 10)
        @$tip.data key, size
        size
      wrapped()

    # § __Appearance__

    # __wakeByTrigger__ is the main toggler and a `_state` updater. The toggling
    # and main changes only happen if the delay is passed. It returns a promise
    # that fails if waking gets skipped, but async execution isn't guaranteed.
    # It will:
    # 1. Go directly to the position updating if no toggling is needed.
    # 2. Not toggle if awake or waking, or if event isn't `truemouseenter`.
    # 3. Declare a `wake` subroutine running the timed-out logic, which includes
    #    the fade transition, and ensures other tips disappear during it.
    # 4. Wake up depending on current state. If we are in the middle of sleeping,
    #    stop sleeping by updating `_sleepCountdown` and wake up sooner.
    #    Otherwise start the normal wakeup and update `_wakeCountdown`.
    wakeByTrigger: ($trigger, event) ->
      deferred = $.Deferred()
      promise = deferred.promise()
      @_setCurrentTrigger $trigger

      updateBeforeWake = => # Abstract into subroutine.
        @_positionToTrigger $trigger, event
        @onShow event # Hook in custom logic.

      if @_state is 'awake'
        @debugLog 'quick update'
        updateBeforeWake()
        deferred.resolve()
        return promise

      @debugLog event.type if event? # Log the event if we made it this far.

      if @_state in ['awake', 'waking']
        deferred.reject()
        return promise

      wake = (duration) =>
        updateBeforeWake() # Hook in custom logic.
        options = _.defaults { duration }, @animations.show
        options.done = =>
          @_setState 'awake', { event }
          deferred.resolve()
        options.fail = -> deferred.reject()
        @animator.show @$tip, options
        @$tip.siblings(@classNames.tip).each (idx, el) =>
          options = _.defaults { duration }, @animation.hide
          @animator.hide $el, options

      if @_state is 'sleeping'
        @debugLog 'clear sleep'
        clearTimeout @_sleepCountdown
        wake(0)

      else if event? and event.type is 'truemouseenter'
        @_setState 'waking', { event }
        @_wakeCountdown = setTimeout wake, @animations.show.delay

      promise

    # __sleepByTrigger__ is a much simpler toggler compared to its counterpart
    # `wakeByTrigger`. It also updates `_state` and returns a promise that
    # fails if waking gets skipped. As long as the tip isn't truly visible, or
    # sleeping is redundant, or event isn't `truemouseleave`, it bails.
    sleepByTrigger: ($trigger, event) ->
      deferred = $.Deferred()
      promise = deferred.promise()

      if @_state in ['asleep', 'sleeping']
        deferred.reject()
        return promise

      @_setState 'sleeping', { event }
      @_sleepCountdown = setTimeout =>
        @onHide() # Hook in custom logic.
        options = _.clone @animations.hide
        options.done = =>
          @_setState 'asleep', { event }
          deferred.resolve()
        options.fail = -> deferred.reject()
        @animator.hide @$tip, options
      , @animations.hide.delay

      promise

    # __togglePositionTransition__ adds a position css transition to the tip.
    # This normally is very expensive considering we update position on mousemove.
    # But it's used together with a test to see if the cursor is likely currently
    # in a gap between triggers. See `_setState` for details.
    _togglePositionTransition: (toggled) ->
      rest = '0.1s linear'
      transition = if toggled
        (if @followUsingTransform then "transform #{rest}" else "top #{rest}, left #{rest}")
      else ''
      @$tip.css 'transition', transition
      return

    # § __Content__

    # ___saveTriggerContent__ comes with a very simple base implementation that
    # supports the common `title` and `alt` meta content for an element. Support
    # is also provided for the `triggerContent` option. We take that content and
    # store it into a namespaced `content` jQuery data value on the trigger.
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
      return

    # § __Events__

    # ___bind__ adds event handlers to `$tip` mostly, so state can be updated such
    # that the handlers on `_$currentTrigger` make an exception. So that cursor
    # leaving the trigger for the tip doesn't cause the tip to dismiss.
    # 
    # Additionally, track viewport `_bounds` at a reasonable rate, so that
    # `_updateDirectionByTrigger` can work properly.
    _bind: ->
      @$tip.on
        mouseenter: (event) =>
          @debugLog 'enter tip'
          if @_$currentTrigger?
            @_$currentTrigger.data @attr('is-active'), yes
            @wakeByTrigger @_$currentTrigger, event
        mouseleave: (event) =>
          @debugLog 'leave tip'
          if @_$currentTrigger?
            @_$currentTrigger.data @attr('is-active'), no
            @sleepByTrigger @_$currentTrigger, event

      if @autoDirection is on
        $(window).resize _.debounce @_setBounds, 300
      return

    # ___bindContext__ uses `MutationObserver`. If `doLiveUpdate` is inferred to
    # be true, process triggers added in the future. Make sure to ignore mutations
    # related to the tip.
    _bindContext: ->
      return false unless window.MutationObserver?

      selector = @$triggers.selector
      @_mutationObserver = new MutationObserver (mutations) =>
        for mutation in mutations
          $target = $ mutation.target
          continue if $target.hasClass(@classNames.content) # TODO: Limited.
          if mutation.addedNodes.length
            $triggers = $(mutation.addedNodes).find('[title],[alt]') # TODO: Limited.
            @_processTriggers $triggers
            @$triggers = @$triggers.add $triggers
      @_mutationObserver.observe @$context[0],
        childList: yes
        subtree: yes
      return

    # ___bindTriggers__ links each trigger to the tip for:
    # 1. Possible appearance changes during mouseenter, mouseleave (uses special
    #    events).
    # 2. Following on mousemove only if `doFollow` is on.
    # 
    # Also note for our `onMouseMove` handler, it's throttled by `requestAnimationFrame`
    # when available, otherwise manually at hopefully 60fps.
    _bindTriggers: ->
      selector = ".#{@classNames.trigger}"
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
            when 'truemouseleave' then @sleepByTrigger $(event.target), event
            else @debugLog 'unknown event type', event.type
          event.stopPropagation()

      if @doFollow is on
        if _requestAnimationFrame?
          onMouseMove = (event) =>
            _requestAnimationFrame (timestamp) => @_onTriggerMouseMove event
        else 
          onMouseMove = _.throttle @_onTriggerMouseMove, 16
        @$context.on 'mousemove', selector, onMouseMove
      return

    # § __Positioning__

    # ___onTriggerMouseMove__ is actually the main tip toggling handler. To
    # explain, first account for the child elements triggering the mouse event
    # by deducing the event's actual `$trigger` element. Then `wakeByTrigger`
    # if needed.
    _onTriggerMouseMove: (event) ->
      return no if not event.pageX?

      $trigger =
        if ($trigger = $(event.currentTarget)) and $trigger.hasClass @classNames.trigger then $trigger
        else $trigger.closest(@classNames.trigger)
      return no if not $trigger.length

      @wakeByTrigger $trigger, event
      return

    # ___positionToTrigger__ will properly update the tip offset per
    # `offsetOnTriggerMouseMove` and `_isDirection`. Also note that `_stemSize`
    # gets factored in.
    _positionToTrigger: ($trigger, mouseEvent, cursorHeight=@cursorHeight) ->
      return no if not mouseEvent?

      offset = { top: mouseEvent.pageY, left: mouseEvent.pageX }
      offset = @offsetOnTriggerMouseMove(mouseEvent, offset, $trigger) or offset

      if @_isDirection('top', $trigger)
        offset.top -= @$tip.outerHeight() + @_stemSize()
      else if @_isDirection('bottom', $trigger)
        offset.top += @_stemSize() + cursorHeight

      if @_isDirection('left',  $trigger)
        tipWidth = @$tip.outerWidth()
        triggerWidth = $trigger.outerWidth()
        offset.left -= tipWidth
        #- If direction changed due to tip being wider than trigger.
        offset.left += triggerWidth if tipWidth > triggerWidth

      css = if @followUsingTransform
        { top: 0, left: 0, transform: "translate(#{offset.left}px, #{offset.top}px)" }
      else offset

      @$tip.css css
      return

    # ___setBounds__ updates `_bounds` per `$viewport`'s inner bounds, and those
    # measures get used by `_updateDirectionByTrigger`.
    _setBounds: ->
      $viewport = if @$viewport.is('body') then $(window) else @$viewport
      @_bounds =
        top:    $.css @$viewport[0], 'padding-top', yes
        left:   $.css @$viewport[0], 'padding-left', yes
        bottom: $viewport.innerHeight()
        right:  $viewport.innerWidth()
      return

    # § __Rendering__

    # ___inflateByTrigger__ will reset and update `$tip` and its content element
    # for the given trigger, so it is ready to present, ie. it is 'inflated'. If
    # the `resize` animation is on, also specify the content element's dimension
    # for respective transitions to take effect.
    _inflateByTrigger: ($trigger) ->
      $content = @selectByClass 'content'
      $content.text $trigger.data @attr('content')

      #- Note that a transition style is in place, so this causes animation.
      if @animations.resize.enabled
        contentSize = @_sizeForTrigger $trigger, (contentOnly = yes)
        $content
          .width (contentSize.width + 1) # Give some buffer.
          .height contentSize.height

      compoundDirection =
        if $trigger.data(@attr('direction')) then $trigger.data(@attr('direction')).split(' ')
        else @defaultDirection
      @debugLog 'update direction class', compoundDirection
      @$tip
        .removeClass _.chain(@classNames).pick('top', 'bottom', 'right', 'left').values().join(' ').value()
        .addClass $.trim(
          _.reduce compoundDirection, (classListMemo, directionComponent) =>
            "#{classListMemo} #{@classNames[directionComponent]}"
          , ''
        )
      return

    # ___render__ comes with a base implementation that fills in and attaches
    # `$tip` to the DOM, specifically at the beginning of `$viewport`. It uses
    # the result of `htmlOnRender` and falls back to that of `_defaultHtml`. 
    # Render also sets up any animations per the `shouldAnimate` option.
    _render: ->
      return no if @$tip.html().length
      html = @htmlOnRender()
      if not (html? and html.length) then html = @_defaultHtml()
      $tip = $(html).addClass @classNames.follow

      transitionStyle = []
      if @animations.resize.enabled
        duration = @animations.resize.duration / 1000.0 + 's'
        easing = @animations.resize.easing
        transitionStyle.push "width #{duration} #{easing}", "height #{duration} #{easing}"

      @_setTip $tip
      @selectByClass('content').css 'transition', transitionStyle.join(',')
      @$tip.prependTo @$viewport
      return

    # § __Subroutines__

    # ___processTriggers__ does just that and sets up content, event, and
    # positioning aspects.
    _processTriggers: ($triggers) ->
      $triggers ?= @$triggers
      $triggers.each (i, el) =>
        $trigger = $ el
        return no unless $trigger.length
        $trigger.addClass @classNames.trigger
        @_saveTriggerContent $trigger
        @_updateDirectionByTrigger $trigger
      return

    # ___updateDirectionByTrigger__ is the main provider of auto-direction
    # support. Given the `$viewport`'s `_bounds`, it changes to the best
    # direction as needed. The current `direction` is stored as jQuery data on
    # the trigger.
    _updateDirectionByTrigger: ($trigger) ->
      return no if @autoDirection is off
      triggerOffset   = @_offsetForTrigger $trigger
      triggerWidth    = $trigger.outerWidth()
      triggerHeight   = $trigger.outerHeight()
      tipSize         = @_sizeForTrigger $trigger
      newDirection    = _.clone @defaultDirection
      @debugLog { triggerOffset, triggerWidth, triggerHeight, tipSize }
      for component in @defaultDirection
        if not @_bounds? then @_setBounds()
        ok = yes
        switch component
          when 'bottom' then ok = (edge = triggerOffset.top + triggerHeight + tipSize.height) and @_bounds.bottom > edge
          when 'right'  then ok = (edge = triggerOffset.left + tipSize.width) and @_bounds.right > edge
          when 'top'    then ok = (edge = triggerOffset.top - tipSize.height) and @_bounds.top < edge
          when 'left'   then ok = (edge = triggerOffset.left - tipSize.width) and @_bounds.left < edge
        @debugLog 'checkDirectionComponent', { component, edge }
        if not ok
          switch component
            when 'bottom' then newDirection[0] = 'top'
            when 'right'  then newDirection[1] = 'left'
            when 'top'    then newDirection[0] = 'bottom'
            when 'left'   then newDirection[1] = 'right'
          $trigger.data @attr('direction'), newDirection.join ' '
      return

    # ___wrapStealthRender__ is a helper mostly for size detection on tips and
    # triggers. Without stealth rendering the elements by temporarily un-hiding
    # and making invisible, we can't do `getComputedStyle` on them.
    _wrapStealthRender: (func) ->
      =>
        return func.apply @, arguments if not @$tip.is(':hidden')
        @$tip.css { display: 'block', visibility: 'hidden' }
        result = func.apply @, arguments
        @$tip.css { display: 'none', visibility: 'visible' }
        return result

    # § __Delegation to Subclass__

    # These methods are hooks for custom functionality from subclasses. (Some are
    # set to no-ops becase they are given no arguments.)
    onShow: (event) ->
    onHide: $.noop
    afterShow: (event) ->
    afterHide: $.noop
    htmlOnRender: $.noop
    offsetOnTriggerMouseMove: (event, offset, $trigger) -> no

  # SnapTip
  # -------
  # With such a complete base API, extending it with an implementation with
  # snapping becomes almost trivial.
  class SnapTip extends Tip

    # __init__ continues setting up `$tip` and other properties.
    # 1. Infer `snap.toTrigger`.
    # 2. `_offsetStart` stores the original offset, which is used for snapping.
    # 3. Add snapping config as classes.
    init: ->
      super()
      if @snap.toTrigger is off
        @snap.toTrigger = @snap.toXAxis is on or @snap.toYAxis is on
      @_offsetStart = null
      @$tip.addClass(@classNames.snap[key]) for own key, active of @snap when active
      return

    # § __Events__

    # ___bindTriggers__ extend its super to get initial position for snapping.
    # This is only for snapping without snapping to the trigger, which is only
    # what's currently supported. See `afterShow` hook.
    _bindTriggers: ->
      super()
      selector = ".#{@classNames.trigger}"
      #- Modify base binding.
      @$context.on @evt('truemouseleave'), selector, { selector },
        (event) => @_offsetStart = null
      return
    
    # § __Positioning__

    # ___moveToTrigger__ is the main positioner. The `baseOffset` given is
    # expected to be the trigger offset. It returns the new offset.
    _moveToTrigger: ($trigger, baseOffset) -> # TODO: Still needs to support all the directions.
      #- @debugLog baseOffset
      offset = @_offsetForTrigger $trigger
      toTriggerOnly = @snap.toTrigger is on and @snap.toXAxis is off and @snap.toYAxis is off
      #- Note vertical directions already account for stem-size.
      if @snap.toXAxis is on
        if @_isDirection 'bottom', $trigger
          offset.top += $trigger.outerHeight()
        if @snap.toYAxis is off
          #- Note arbitrary buffer offset.
          offset.left = baseOffset.left - @$tip.outerWidth() / 2
      if @snap.toYAxis is on
        if @_isDirection 'right', $trigger
          offset.left += $trigger.outerWidth() + @_stemSize()
        else if @_isDirection 'left', $trigger
          offset.left -= @_stemSize()
        if @snap.toXAxis is off
          offset.top = baseOffset.top - @$tip.outerHeight() / 2 - @_stemSize()
      if toTriggerOnly is on
        if @_isDirection 'bottom', $trigger
          offset.top += $trigger.outerHeight()
      offset

    # ___positionToTrigger__ extends its super to set `cursorHeight` to 0, since
    # it won't need to be factored in if we're snapping.
    _positionToTrigger: ($trigger, mouseEvent, cursorHeight=@cursorHeight) ->
      super $trigger, mouseEvent, 0
      return

    # § __Tip Delegation__

    # Implement __onShow__ and __afterShow__ delegate methods such that they make
    # the tip invisible while it's being positioned and then reveal it.
    onShow: (event) ->
      return unless @_triggerChanged is yes
      @$tip.css 'visibility', 'hidden'
      return
        
    afterShow: (event) ->
      return unless @_triggerChanged is yes
      @$tip.css 'visibility', 'visible'
      @_offsetStart = { top: event.pageY, left: event.pageX }
      return

    # Implement __offsetOnTriggerMouseMove__ delegate method as the main snapping
    # positioning handler. Instead of returning false, we return our custom,
    # snapping offset, so it gets used in lieu of the base `offset`.
    offsetOnTriggerMouseMove: (event, offset, $trigger) ->
      newOffset = @_moveToTrigger $trigger, _.clone(offset)

  # § __Attaching__

  # Both plugins are created and attached with the `asSharedInstance` flag on.
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
