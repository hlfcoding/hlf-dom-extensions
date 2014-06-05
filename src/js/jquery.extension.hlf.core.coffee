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
)(($, _, hlf) ->

  _.templateSettings = interpolate: /\{\{(.+?)\}\}/g

  $.hlf =

    createPlugin: (createOptions) ->
      name = createOptions.name
      safeName = "#{@toString()}#{name[0].toUpperCase()}#{name[1..]}"
      namespace = createOptions.namespace
      apiClass = namespace.apiClass = createOptions.apiClass
      _noConflict = namespace.noConflict
      @noConflicts.push (namespace.noConflict = ->
        if _.isFunction(_noConflict) then _noConflict()
        $.fn[name] = _plugin
      )
      _plugin = $.fn[name]
      plugin = $.fn[name] = $.fn[safeName] = (options, $context) ->
        $el = null # Set to right scope.

        boilerplate = ->
          $root = if createOptions.asSingleton is no then $el else $context
          $root.addClass namespace.toString 'class'
          # - Memoize naming helpers for better performance.
          apiClass::evt ?= _.memoize (name) -> "#{name}#{namespace.toString 'event'}"
          apiClass::attr ?= _.memoize (name) -> "#{namespace.toString 'data'}#{name}"
          # - Plugin-specific debugging.
          apiClass::debugLog ?= if namespace.debug is off then $.noop else
            -> $.hlf.debugLog namespace.toString('log'), arguments...
          # - Instantiate and store instance.
          $root.data namespace.toString('data'), new apiClass $el, options, $context

        $context ?= $ 'body'
        # - First, try returning existing plugin api if no options are passed in.
        api = @first().data namespace.toString('data')
        return api if api? and not options?
        # - Re-apply plugin, and handle requests for singletons.
        options = $.extend (deep = on), {}, namespace.defaults, options
        if createOptions.asSingleton is no
          return @each ->
            $el = $(@)
            boilerplate()
        else
          $el = @
          boilerplate()

        @
      plugin

    noConflicts: [],
    noConflict: -> (fn() for fn in @noConflicts).length

    debug: on # Turn this off when going to production.
    toString: _.memoize (context) -> 'hlf'

  $.hlf.debugLog = if $.hlf.debug is off then $.noop else
    (if console.log.bind then console.log.bind(console) else console.log)

  _.bindAll $.hlf, 'createPlugin'

  _createPlugin = $.createPlugin
  $.createPlugin = $.hlf.createPlugin
  $.hlf.noConflicts.push -> $.createPlugin = _createPlugin

  return $.hlf
)
