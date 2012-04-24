$ = jQuery

# Event extensions
$.extend true, $, 
  hoverIntent:
    sensitivity: 8
    interval: 300
  mouse:
    x:
      current: 0
      previous: 0
    y:
      current: 0
      previous: 0

checkHoverIntent = (evt) ->
  $t = $ @
  intentional = $t.data('hoverIntent') or true
  timer = $t.data('hoverIntentTimer') or null
  sensitivity = $t.data('hoverIntentSensitivity') or $.hoverIntent.sensitivity
  interval = $t.data('hoverIntentInterval') or $.hoverIntent.interval
  m = $.mouse
  # Update timer.
  $t.data 'hoverIntentTimer', setTimeout ->
    intentional = Math.abs(m.x.previous - m.x.current) + Math.abs(m.y.previous - m.y.current) > sensitivity 
    intentional = intentional or evt.type is 'mouseleave'
    m.x.previous = evt.pageX
    m.y.previous = evt.pageY
    $t.data 'hoverIntent', intentional
    if intentional
      switch evt.type
        when 'mouseleave' 
          return console.log 'activeState' if $t.data('activeState') is true
          clearHoverIntent $t
        when 'mouseout' then type = 'mouseleave'
        when 'mouseover' then type = 'mouseenter'
      $t.trigger "true#{type}"
      console.log "true#{type}"
  , interval
    #console.log 'timer'
  #console.log 'checker'

trackHoverIntent = (evt) ->
  $.mouse.x.current = evt.pageX
  $.mouse.y.current = evt.pageY

clearHoverIntent = ($t) ->
  clearTimeout $t.data('hoverIntentTimer')

$.event.special.truemouseenter = 
  setup: (data, namespaces) ->
    $(@).bind
      mouseenter: checkHoverIntent
      mousemove: trackHoverIntent
  teardown: (data, namespaces) ->
    $(@).unbind
      mouseenter: checkHoverIntent
      mousemove: trackHoverIntent

$.event.special.truemouseleave = 
  setup: (data, namespaces) ->
    $(@).bind 'mouseleave', checkHoverIntent
  teardown: (data, namespaces) ->
    $(@).unbind 'mouseleave', checkHoverIntent