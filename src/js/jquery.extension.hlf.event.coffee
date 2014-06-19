###
HLF Event jQuery Extension
==========================
Released under the MIT License  
Written with jQuery 1.7.2  
###

#!For working docs generation, disable automatic trailing whitespace trimming.

# This extension adds custom events to jQuery. It general, the process is
# composed of three parts:

# 1. Extend main namespace with properties to store global state.
# 2. Private functions to implement certain behaviors.
# 3. Adapting the behaviors to custom events.

# Export. Prefer AMD. Note that we don't actually provide any exports because
# ours are attached to jQuery.
((extension) ->
  if define? and define.amd?
    define [
      'jquery'
      'underscore'
      'hlf/jquery.extension.hlf.core'
    ], extension
  else extension jQuery, _, jQuery.hlf
)(($, _, hlf) ->

  # I. Hover-Intent
  # ---------------
  
  # A set of custom events based on a distance check with a customizable
  # `interval` of delay to limit 'un-intentional' mouse-enter's and mouse-
  # leave's. Allows for customization based on `sensitivity` to movement.
  
  # Also, unlike the jQuery `mouseenter` and `mouseleave` events,
  # `truemouseenter` and `truemouseleave` provide `pageX` and `pageY` values.
  $.extend true, hlf,
    hoverIntent:
      # Switch for debugging just hover intent. 
      debug: off
      # Stores the global state of the mouse. This is for public use.
      mouse:
        x:
          current: 0
          previous: 0
        y:
          current: 0
          previous: 0
      # Default options.
      sensitivity: 8
      interval: 300
      # To get the name of this set of custom events, just use the `toString`
      # function and pass the appropriate context. Note we're memoizing it.
      toString: _.memoize (context) ->
        switch context
          when 'attr' then 'hlf-hover-intent'
          else 'hlf.hoverIntent'

  # Alias and don't pollute the extension scope.
  do (hoverIntent = hlf.hoverIntent, mouse = hlf.hoverIntent.mouse) ->

    # `attr` is an internal formatter for attribute names,
    # mainly those of jQuery data keys.
    attr = (name='') -> "#{hoverIntent.toString 'attr'}-#{name}"

    # `debugLog` is our internal logger. It's optimized to be a noop if
    # hover intent debugging is off.
    debugLog = if hoverIntent.debug is off then $.noop else
      -> hlf.debugLog hoverIntent.toString('log'), arguments...

    # The internals of hover intent is about tracking the state of the trigger
    # element's interaction with the mouse.

    # With `defaultState`, we start with `intentional` to yes, so the first
    # interaction is always successful. `timer` is also set to an empty state,
    # which tells us the timer is inactive. `sensitivity` and `interval` are
    # stored here, so they can be customized to be trigger-specific, and they
    # both default to the default extension options.
    defaultState =
      intentional: yes
      timer: { cleared: yes, timeout: null }
      sensitivity: hoverIntent.sensitivity
      interval: hoverIntent.interval

    # `getComputedState` simplifies getting the trigger element's hover intent
    # state and using any `defaultState` as fallback. Note that we clone the
    # value if it looks like it will be assigned by reference.
    getComputedState = ($trigger) ->
      state = {}
      for own key, value of defaultState
        if $.isPlainObject value then value = _.clone value
        state[key] = $trigger.data(attr(key)) or value
      state

    # `check` is the main routine that uses the state, setup, and teardown
    # subroutines. It is an event handler (see below).
    check = (event) ->
      $trigger = $ @
      state = getComputedState $trigger
      debugLog state
      didTeardown = teardownCheckIfNeeded event, $trigger, state
      if didTeardown is no then setupCheckIfNeeded event, $trigger, state

    # `setupCheckIfNeeded` will setup to `performCheck` after setting up (again)
    # the timer state, but only if the timer state is properly reset.
    setupCheckIfNeeded = (event, $trigger, state) ->
      return no if state.timer.cleared is no and state.timer.timeout?
      debugLog 'setup'
      state.timer.timeout = setTimeout ->
        debugLog 'check and update'
        performCheck event, $trigger, state
      , state.interval
      state.timer.cleared = no
      $trigger.data attr('timer'), state.timer
      return yes

    # `teardownCheckIfNeeded` will teardown by removing state from trigger data,
    # thereby defaulting them (see `getComputedState`). It will only work on
    # mouse-leave and will always trigger `truemouseleave`.
    teardownCheckIfNeeded = (event, $trigger, state) ->
      return no if event.type isnt 'mouseleave'
      if state.timer.cleared is no
        debugLog 'teardown'
        clearTimeout state.timer.timeout
        $trigger
          .removeData attr('timer')
          .removeData attr('intentional')
      triggerEvent 'truemouseleave', $trigger
      return yes

    # `performCheck` is the main hover intent checking subroutine. The state's
    # `intentional` flag is updated as a crude change-in-distance comparison. If
    # there is intent, then `truemouseenter` is triggered. The timer is reset,
    # since this completes the checking cycle. State is also always saved to the
    # trigger.
    performCheck = (event, $trigger, state) ->
      state.intentional =
        (Math.abs(mouse.x.previous - mouse.x.current) +
         Math.abs(mouse.y.previous - mouse.y.current)) >
        state.sensitivity
      mouse.x.previous = event.pageX
      mouse.y.previous = event.pageY
      if state.intentional is yes and event.type is 'mouseover'
        triggerEvent 'truemouseenter', $trigger
      state.timer.cleared = yes
      $trigger.data attr('intentional'), state.intentional
      $trigger.data attr('timer'), state.timer

    # `trackMouse` tracks mouse position specifically for checking hover intent.
    trackMouse = _.throttle (event) ->
      mouse.x.current = event.pageX
      mouse.y.current = event.pageY
    , 16

    # `triggerEvent` abstracts away the generation of and support for custom
    # hover intent events.
    triggerEvent = (name, $trigger) ->
      switch name
        when 'truemouseenter' then event =
          new $.Event name, { pageX: mouse.x.current, pageY: mouse.y.current }
        when 'truemouseleave' then event = name
        else event = null
      if event?
        debugLog name
        $trigger.trigger event
      else return no

    # Lastly, we register our custom jQuery events, essentially wrapping our
    # binding over binding to `mouseover`, `mousemove`, and `mouseleave`. We're
    # not using `mouseenter`, since its detection mechanism conflicts with hover
    # intent's.

    $.event.special.truemouseenter =
      setup: (data, namespaces) ->
        $(@).on   { mouseover: check, mousemove: trackMouse }
      teardown: (data, namespaces) ->
        $(@).off  { mouseover: check, mousemove: trackMouse }

    $.event.special.truemouseleave =
      setup: (data, namespaces) ->
        $(@).on   { mouseleave: check }
      teardown: (data, namespaces) ->
        $(@).off  { mouseleave: check }

)

