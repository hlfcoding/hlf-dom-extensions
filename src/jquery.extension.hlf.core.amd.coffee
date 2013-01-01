#
# HLF Core jQuery Extension v1.0
# Released under the MIT License
#
define ['jquery', 'underscore'], ($, _) ->
  #
  # jQuery Core Extension
  # =====================

  # Customize libraries.
  # Use mustache templating conventions.
  _.templateSettings = interpolate: /\{\{(.+?)\}\}/g
  # Helper accessor that automates css value conversion.
  $.fn.cssNum = (prop) ->
    val = @.css prop
    if prop % 1 > 0 then parseInt(val, 10) else parseFloat(val)

  # Private debug flag.
  debug = off

  #
  # Besides being a namespace, does two things:
  #
  # 1. Create plugin functions with helpers to maintain convention and debug.
  # 2. Manage debugging through a custom logger.
  #
  NS =
    #
    # Create a plugin with event and data name translators that allow the plugin
    # to follow conventions without being verbose. The helpers are attached as
    # 'private' methods. The logging namespace is the first value logged in each
    # call. The plugin created has an api instance stored as jQuery data,
    # accessible via the conventional repeated call, and has the option to be a
    # singleton and attached to a context element while representing an element
    # collection. Plugins should follow a set of conventions:
    #
    # - Create a subnamespace with `debug` bool, `toString` function, `defaults`
    #   options bag.
    # - Create a private class.
    # - Pass the above two objects to get the plugin and assign it.
    #
    createPlugin: (ns, apiClass, asSingleton=no) ->
      ns.apiClass = apiClass
      nsEvt = ns.toString 'event'
      nsDat = ns.toString 'data'
      nsLog = ns.toString 'log'
      return (opt, $ctx) ->
        $el = null # Set to right scope.
        boilerplate = ->
          $root = if asSingleton is no then $el else $ctx
          $root.addClass ns.toString 'class'
          apiClass::_evt ?= (name) -> "#{name}#{nsEvt}"
          apiClass::_dat ?= (name) -> "#{nsDat}#{name}"
          if ns.debug is on
            apiClass::_log ?= ->
              vals = _.toArray arguments
              vals.unshift nsLog
              $.hlf.log.apply null, vals

          else apiClass::_log ?= $.noop
          $root.data ns.toString(), new apiClass $el, opt, $ctx

        $ctx ?= $ 'body'
        # - Try returning existing plugin api if no options are passed in.
        api = @first().data ns.toString()
        return api if api? and not opt?
        # - Re-apply plugin.
        opt = $.extend (deep=on), {}, ns.defaults, opt

        if asSingleton is no
          return @each ->
            $el = $ @
            boilerplate()

        else
          $el = @
          boilerplate()


    # Call to turn off when going to production.
    debug: (val) ->
      if val?
        debug = !!val
        $('body').trigger "debug#{@.toString('event')}"
      debug

    # This is a template for `toString` functions for sub-namespaces.
    toString: (context) ->
      switch context
        when 'event'  then '.hlf'
        when 'data'   then 'hlf'
        when 'log'    then 'hlf:'
        else 'hlf'

  makeLog = -> (if console.log.bind then console.log.bind(console) else console.log)
  # Don't setup a logger if we're not debugging.
  NS.log = if NS.debug() is off then $.noop else makeLog()
  # But if we change our mind, ie. in the app init code, setup logging.
  # Also make AMD code easier to debug.
  $('body').on "debug#{NS.toString('event')}", ->
    if debug is on
      window.$ = $
      window._ = _
      NS.log = makeLog()

  # Export for global jQuery.
  $.hlf = NS

  # Export for AMD.
  return NS
