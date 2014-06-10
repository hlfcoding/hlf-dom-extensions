###
HLF Core jQuery Extension
=========================
Released under the MIT License  
Written with jQuery 1.7.2  
###

# Export. Prefer AMD.
((extension) ->
  if define? and define.amd?
    define [
      'jquery'
      'underscore'
    ], extension
  else extension jQuery, _
)(($, _) ->

  _.templateSettings = interpolate: /\{\{(.+?)\}\}/g

  hlf = {}

  _noConflicts = []

  _createPluginInstance = ($el, options, $context, namespace, apiClass, apiMixins, mixinFilter, createOptions) ->
    data = $el.data namespace.toString('data')
    finalOptions = options
    if $.isPlainObject(data)
      finalOptions = $.extend (deep = on), {}, options, data
      $root = $el
    else if not createOptions.asSingleton
      $root = $el
    else
      $root = $context

    if apiClass?
      instance = new apiClass $el, finalOptions, $context
      if createOptions.baseMixins?
        hlf.applyMixins instance, namespace, createOptions.baseMixins...
      if createOptions.apiMixins?
        hlf.applyMixins instance, namespace, createOptions.apiMixins...
    else if apiMixins?
      instance = { $el, options: finalOptions }
      if finalOptions.selectors? then instance.selectors = finalOptions.selectors
      if finalOptions.classNames? then instance.classNames = finalOptions.classNames
      if createOptions.baseMixins?
        hlf.applyMixins instance, namespace, createOptions.baseMixins...
      hlf.applyMixin instance, namespace, apiMixins.base
      otherMixins = _.chain apiMixins
        .filter mixinFilter, instance
        .values()
        .without apiMixins.base
        .value()
      hlf.applyMixins instance, namespace, otherMixins...
    if _.isFunction(instance.init) then instance.init()

    if instance.cls isnt $.noop then $root.addClass instance.cls()

    $root.data instance.attr(), instance

  _createPluginAPIAdditions = (name, namespace) ->
    evt: _.memoize (name) -> "#{name}#{namespace.toString 'event'}"
    attr: _.memoize (name) ->
      name = if name? then "-#{name}" else ''
      namespace.toString('data') + name
    cls: if namespace.toString('class') is namespace.toString() then $.noop else
      _.memoize (name) ->
        name = if name? then "-#{name}" else ''
        namespace.toString('class') + name
    debugLog: if namespace.debug is off then $.noop else
      -> hlf.debugLog namespace.toString('log'), arguments...

  _.extend hlf,

    applyMixin: (context, dependencies, mixin) ->
      if _.isString(mixin) then mixin = @mixins[mixin] 
      return unless mixin?
      if _.isFunction(mixin) then mixin = mixin dependencies
      onceMethods = []
      handlerNames = []
      for own name, prop of mixin when _.isFunction(prop)
        if name in @mixinOnceNames then onceMethods.push prop
        if name.indexOf('handle') is 0 and name isnt 'handleCommand'
          handlerNames.push name
      mixinToApply = _.omit mixin, @mixinOnceNames
      _.extend context, mixinToApply
      method.call(context) for method in onceMethods
      if handlerNames.length then _.bindAll context, handlerNames...

    applyMixins: (context, dependencies, mixins...) ->
      @applyMixin context, dependencies, mixin for mixin in mixins

    createMixin: (mixins, name, mixin) ->
      mixins ?= hlf.mixins
      return no if name of mixins
      mixins[name] = mixin
      if $.isPlainObject(mixin)
        (prop.mixin = name) for own k, prop of mixin when _.isFunction(prop)
      mixin

    createPlugin: (createOptions) ->
      
      name = createOptions.name
      safeName = "#{@toString()}#{name[0].toUpperCase()}#{name[1..]}"
      namespace = createOptions.namespace
      
      apiAdditions = _createPluginAPIAdditions name, namespace
        
      if createOptions.apiClass?
        apiClass = namespace.apiClass = createOptions.apiClass
        _.extend apiClass::, apiAdditions
      if createOptions.apiMixins?
        mixinFilter = createOptions.mixinFilter
        mixinFilter ?= (mixin) -> mixin
        apiMixins = namespace.apiMixins = createOptions.apiMixins
        $.extend (deep = on), apiMixins, { base: apiAdditions }

      _noConflict = namespace.noConflict
      _plugin = $.fn[name]
      _noConflicts.push (namespace.noConflict = ->
        if _.isFunction(_noConflict) then _noConflict()
        $.fn[name] = _plugin
      )

      plugin = $.fn[name] = $.fn[safeName] = ->

        if _.isString(arguments[0])
          command =
            type: arguments[0]
            userInfo: arguments[1]
        else
          options = arguments[0]
          $context = arguments[1] if arguments.length > 1

        $context ?= $ 'body'

        if command?
          @each ->
            $el = $(@)
            instance = $el.data namespace.toString('data')
            if _.isFunction(instance.handleCommand)
              if _.isFunction(command.userInfo) then command.userInfo $el
              sender = null
              instance.handleCommand command, sender
          return @
        else
          instance = @first().data namespace.toString('data')
          return instance if instance? and instance.$el? and not arguments.length

        options = $.extend (deep = on), {}, namespace.defaults, options
        $el = @
        ( ->
          args = arguments
          if createOptions.asSingleton is yes then _createPluginInstance $el, args...
          else $el.each -> _createPluginInstance $(@), args...
        )(options, $context, namespace, apiClass, apiMixins, mixinFilter, createOptions)
        return @
      
      plugin

    mixinOnceNames: [
      'decorate'
      'decorateOptions'
    ]
    mixins:

      data: ->
        data: ->
          if arguments.length
            first = arguments[0]
            if _.isString(first)
              arguments[0] = @attr first
            else if _.isObject(first)
              pairs = {}
              (pairs[attr(k)] = v) for own k, v of first
              arguments[0] = pairs
          @$el.data.apply @$el, arguments

      event: ->
        on: (name) ->
          name = @evt name if name?
          @$el.on.apply @$el, arguments
        off: (name) ->
          name = @evt name if name?
          @$el.off.apply @$el, arguments
        trigger: (name, userInfo) ->
          type = @evt name
          @$el.trigger { type, userInfo }

      selection: ->
        select: ->
          for own name, selector of @selectors
            @["$#{name}"] = @$el.find selector

    noConflict: -> (fn() for fn in _noConflicts).length

    debug: on # Turn this off when going to production.
    toString: _.memoize (context) -> 'hlf'

  hlf.debugLog = if hlf.debug is off then $.noop else
    (if console.log.bind then console.log.bind(console) else console.log)

  _.bindAll hlf, 'createPlugin'

  safeSet = (key, toContext=$, fromContext=hlf) ->
    _oldValue = toContext[key]
    toContext[key] = fromContext[key]
    _noConflicts.push -> toContext[key] = _oldValue

  safeSet 'applyMixin'
  safeSet 'applyMixins'
  safeSet 'createMixin'
  safeSet 'createPlugin'
  safeSet 'mixinOnceNames'
  safeSet 'mixins'

  $.hlf = hlf

  return $.hlf
)
