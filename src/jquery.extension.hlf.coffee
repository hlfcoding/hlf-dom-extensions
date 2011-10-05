((global, $) ->

  # Helper extensions
  $.extend true, $,
    hlf: 
      titleCase: (name) ->
        name.replace /^\w/, (firstLetter) ->
          firstLetter.toUpperCase()
  
  # Core extensions
  $.extend true, $,
    hlf: 
      # jQuery plugin helper.
      createPluginForClass: (name, type) ->
        class_ = $.hlf[name]
        throw 'No such module' if not class_
        nsName = "hlf#{$.hlf.titleCase(name)}"
        throw 'Plugin already exists' if $.fn[nsName]
        switch type
          when 'singleElement'
            $.fn[nsName] = (options) ->
              return false if this.length > 1
              # Return existing instance.
              instance = this.data(nsName)
              return instance if instance?
              # Create, boilerplate, and store instance
              options = $.extend true, {}, class_.defaults, options
              instance = new class_ this, options
              this.data nsName, instance
              return this
          when 'manyElementsOneContext'
            $.fn[nsName] = (options, context=$('body')) ->
              # Return existing instance.
              instance = context.data(nsName)
              return instance if instance?
              # Create, boilerplate, and store instance
              options = $.extend true, {}, class_.defaults, options
              instance = new class_ context, this, options
              context.data nsName, instance
              return this
  
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
  
  checkHoverIntent = (event) ->
    trigger = $ this
    intentional = trigger.data('hoverIntent') or true
    timer = trigger.data('hoverIntentTimer') or null
    sensitivity = trigger.data('hoverIntentSensitivity') or $.hoverIntent.sensitivity
    interval = trigger.data('hoverIntentInterval') or $.hoverIntent.interval
    m = $.mouse
    # Update timer.
    trigger.data 'hoverIntentTimer', setTimeout ->
      intentional = Math.abs(m.x.previous - m.x.current) + Math.abs(m.y.previous - m.y.current) > sensitivity 
      intentional = intentional or event.type is 'mouseleave'
      m.x.previous = event.pageX
      m.y.previous = event.pageY
      trigger.data 'hoverIntent', intentional
      if intentional
        switch event.type
          when 'mouseleave' 
            return console.log 'activeState' if trigger.data('activeState') is true
            clearHoverIntent trigger
          when 'mouseout' then eventType = 'mouseleave'
          when 'mouseover' then eventType = 'mouseenter'
        trigger.trigger "true#{eventType}"
        console.log "true#{eventType}"
    , interval
      #console.log 'timer'
    #console.log 'checker'
  
  trackHoverIntent = (event) ->
    $.mouse.x.current = event.pageX
    $.mouse.y.current = event.pageY
  
  clearHoverIntent = (trigger) ->
    clearTimeout trigger.data('hoverIntentTimer')
  
  $.event.special.truemouseenter = 
    setup: (data, namespaces) ->
      $(this).bind
        mouseenter: checkHoverIntent
        mousemove: trackHoverIntent
    teardown: (data, namespaces) ->
      $(this).unbind
        mouseenter: checkHoverIntent
        mousemove: trackHoverIntent
  
  $.event.special.truemouseleave = 
    setup: (data, namespaces) ->
      $(this).bind 'mouseleave', checkHoverIntent
    teardown: (data, namespaces) ->
      $(this).unbind 'mouseleave', checkHoverIntent
    
) window, jQuery