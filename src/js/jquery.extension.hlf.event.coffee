###
HLF Event jQuery Extension v1.0  
Released under the MIT License  
Written with jQuery 1.7.2  
###

# jQuery Event Extension
# ======================

extension = ($, _, hlf) ->

  # Composed of three parts:
  
  # 1. Extend main namespace with properties to store global state.
  # 2. Private functions to implement certain behaviors.
  # 3. Adapting the behaviors to custom events.

  # Hover-intent
  # ------------
  # Basically a distance check with a delay to throttle mouse-enter. Allows for
  # customization based on sensitivity to movement. Unlike the jQuery `mouseenter`
  # and `mouseleave` events, these custom ones provide `pageX` and `pageY` values.
  $.extend true, hlf,
    hoverIntent:
      debug: off
      sensitivity: 8
      interval: 300
      toString: _.memoize (context) ->
        switch context
          when 'attr' then 'hlf-hover-intent'
          else 'hlf.hoverIntent'
    mouse:
      x:
        current: 0
        previous: 0
      y:
        current: 0
        previous: 0

  hoverIntent = hlf.hoverIntent
  mouse = hlf.mouse

  attr = (name='') -> "#{hoverIntent.toString 'attr'}#{name}"

  debugLog = if hoverIntent.debug is off then $.noop else
    -> hlf.debugLog hoverIntent.toString('log'), arguments...

  defaultState =
    intentional: yes
    timer: { cleared: no, timeout: null }
    sensitivity: hoverIntent.sensitivity
    interval: hoverIntent.interval

  getComputedState = ($trigger) ->
    state = {}
    for key, value of defaultState
      if $.isPlainObject value then value = _.clone value
      state[key] = $trigger.data(attr(key)) or value
    state

  check = (event) ->
    $trigger = $ @
    state = getComputedState $trigger
    debugLog state
    didTeardown = teardownCheckIfNeeded event, $trigger, state
    if didTeardown is no then setupCheckIfNeeded event, $trigger, state

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

  teardownCheckIfNeeded = (event, $trigger, state) ->
    return no if event.type isnt 'mouseleave'
    debugLog 'teardown'
    if state.timer.cleared is no
      clearTimeout state.timer.timeout
      $trigger
        .removeData attr('timer')
        .removeData attr('intentional')
    triggerEvent 'truemouseleave', $trigger
    return yes

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

  trackMouse = _.throttle (event) ->
    mouse.x.current = event.pageX
    mouse.y.current = event.pageY
  , 16

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

# Export. Prefer AMD.
if define? and define.amd?
  define [
    'jquery'
    'underscore'
    'hlf/jquery.extension.hlf.core'
  ], extension
else
  extension jQuery, _, jQuery.hlf

