# 
# HLF Event jQuery Extension v1.0  
# Released under the MIT License  
# Written with jQuery 1.7.2  
# 
$ = jQuery
#
# jQuery Event Extension
# ======================

#
# Composed of three parts:
# 
# 1. Extend main namespace with properties to store global state.
# 2. Private functions to implement certain behaviors.
# 3. Adapting the behaviors to custom events.
#

# 
# Hover-intent
# ------------
# Basically a distance check with a delay to throttle mouse-enter. Allows for
# customization based on sensitivity to movement. Unlike the jQuery `mouseenter`
# and `mouseleave` events, these custom ones provide `pageX` and `pageY` values.
#
$.extend true, $.hlf,
  hoverIntent:
    debug: off
    sensitivity: 8
    interval: 300
    toString: (context) ->
      switch context
        when 'data' then 'hlfHoverIntent'
        when 'log'  then 'hover-intent:'
        else 'hlf.HoverIntent'
  mouse:
    x:
      current: 0
      previous: 0
    y:
      current: 0
      previous: 0

do (ns=$.hlf.hoverIntent, m=$.hlf.mouse) ->
  
  nsDat = ns.toString 'data'
  nsLog = ns.toString 'log'
  dat = (name) -> "#{nsDat}#{name}"
  log = if ns.debug is on then $.hlf.log else $.noop
  
  check = (evt) ->
    trigger = (evtType) ->
      $t.trigger "true#{evtType}"
      log nsLog, "true#{evtType}"

    # `$t` for trigger.
    $t = $ @
    intentional = $t.data(dat()) or yes
    timer = $t.data(dat('Timer')) or null
    sensitivity = $t.data(dat('Sensitivity')) or ns.sensitivity
    interval = $t.data(dat('Interval')) or ns.interval
    $t.data dat('Timer'), setTimeout ->
      intentional = Math.abs(m.x.previous - m.x.current) + Math.abs(m.y.previous - m.y.current) > sensitivity 
      intentional = intentional
      m.x.previous = evt.pageX
      m.y.previous = evt.pageY
      $t.data dat(), intentional
      if intentional is yes
        switch evt.type
          when 'mouseout'
            type = 'mouseleave'
            clear $t if not $t.data 'hlfIsActive'
          when 'mouseover'  then type = 'mouseenter'
        trigger type
    , interval
    
  
  track = (evt) ->
    m.x.current = evt.pageX
    m.y.current = evt.pageY
  
  clear = ($t) ->
    clearTimeout $t.data dat('Timer')
    $t.removeData dat('Timer')
    $t.removeData dat()
  
  $.event.special.truemouseenter =
    setup: (data, namespaces) ->
      $(@).on
        mouseenter: check
        mousemove:  track
    
    teardown: (data, namespaces) ->
      $(@).off
        mouseenter: check
        mousemove:  track
    
  $.event.special.truemouseleave =
    setup: (data, namespaces) ->
      $(@).on
        mouseleave: check
    
    teardown: (data, namespaces) ->
      $(@).off
        mouseleave: check
    

