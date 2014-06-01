###
HLF Core jQuery Extension
=========================
Released under the MIT License  
Written with jQuery 1.7.2  
###

extension = ($, _, hlf) ->

  _.templateSettings = interpolate: /\{\{(.+?)\}\}/g

  $.hlf =

    createPlugin: (options) ->
      name = options.name
      namespace = options.namespace
      apiClass = namespace.apiClass = options.apiClass
      return (options, $context) ->
        $el = null # Set to right scope.

        boilerplate = ->
          $root = if options.asSingleton is no then $el else $context
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
        if options.asSingleton is no
          return @each ->
            $el = $(@)
            boilerplate()
        else
          $el = @
          boilerplate()

        @

    debug: on # Turn this off when going to production.
    toString: _.memoize (context) -> 'hlf'

  $.hlf.debugLog = if $.hlf.debug is off then $.noop else
    (if console.log.bind then console.log.bind(console) else console.log)

  return $.hlf

# Export. Prefer AMD.
if define? and define.amd?
  define ['jquery', 'underscore'], extension
else
  extension jQuery, _
