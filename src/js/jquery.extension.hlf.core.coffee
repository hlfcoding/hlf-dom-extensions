###
HLF Core jQuery Extension
=========================
###

# [Tests](../../tests/js/core.html) | [Plugin Tests](../../tests/js/core.plugin.html) | [Mixin Tests](../../tests/js/core.mixin.html)

# The core extension is comprised of several aspects.
#
# - Mixin creation and manipulation, as well as providing base mixins, via:
#   `$.applyMixin`, `$.applyMixins`, `$.createMixins`, `$.mixins`.
#
# - Plugin creation with support for both classes and mixins, via:
#   `$.createPlugin`.
#
# - Integrated no-conflict handling and debug-logging, via: `$.hlf.noConflict`,
#   `$.hlf.debugLog`. Child namespaces (for plugins, etc.) automatically inherit
#   these methods unless they provide their own.
#
# The extension also creates and provides the `hlf` jQuery namespace. Namespaces
# for other extensions and plugins are attached to this main namespace.

# § __UMD__
# - When AMD, register the attacher as an anonymous module.
# - When Node or Browserify, set module exports to the attach result.
# - When browser globals (root is window), Just run the attach function.
((root, attach) ->
  if typeof define is 'function' and define.amd?
    define [
      'jquery'
      'underscore'
    ], attach
  else if typeof exports is 'object'
    module.exports = attach(
      require 'jquery',
      require 'underscore'
    )
  else
    attach jQuery, _
  return
)(@, ($, _) ->
  'use strict'

  # Namespace
  # ---------

  # It takes some more boilerplate and helpers to write jQuery modules. That
  # code and set of conventions is here in the root namespace __$.hlf__. Child
  # namespaces follow suit convention.
  #
  # - The __debug__ flag here toggles debug logging for everything in the library
  #   that doesn't have a custom debug flag in its namespace.
  #
  # - __toString__ is mainly for namespacing when extending any jQuery API. For
  #   now, its base form is very simple.
  #
  # - __noConflict__ in its base form will remove assignments to the global
  #   jQuery namespace. Properties will have to be accessed through the `$.hlf`
  #   namespace. See `_safeSet` below. Also see `createPlugin` for its no-
  #   conflict integration.
  #
  #   Using `_noConflicts`, we keep track of no-conflict procedures. This is
  #   essentially working with a callback queue. Calling `$.hlf.noConflict`
  #   simply runs these procedures. Procedures should be simple and idempotent,
  #   ie. restoring the property to a saved previous value.
  #
  # - __debugLog__ in its base form just wraps around `console.log` and links to
  #   the `debug` flag. However, `debugLog` conventionally becomes a no-op if
  #   the `debug` flag is off.
  hlf =
    debug: on # Turn this off when going to production.
    toString: _.constant 'hlf'
    noConflict: -> (fn() for fn in _noConflicts).length

  hlf.debugLog = if hlf.debug is off then $.noop else
    (if console.log.bind then console.log.bind(console) else console.log)

  _noConflicts = []

  # Plugin Support
  # --------------

  # Plugin generation is perhaps the most common jQuery boilerplate. Further
  # binding state and functionality to jQuery elements is a common task that
  # should be abstracted away, with common patterns and conventions around
  # logging, jQuery namespacing, instance access, and sending commands. Also,
  # instead of API classes and plugins inheriting from a base layer, that base
  # layer should be integrated on instantiation.
  _.extend hlf,

    # __createPlugin__ will return an appropriate jQuery plugin method for the
    # given `createOptions`, comprised of:
    #
    # - The __name__ of the method is required. The `safeName` for the method,
    #   which needs to be on the jQuery prototype, is prefixed by `hlf` and
    #   should be used after `noConflict` is called.
    #
    # - __namespace__ is required and must correctly implement `debug`,
    #   `toString`, and `defaults`. It can optionally have a `noConflict`
    #   procedure.
    #
    # - An __apiClass__ definition and/or an __apiMixins__ collection. It will
    #   get modified with base API additions. A `mixinFilter` can be provided to
    #   limit the mixins in the collection that get applied during instantiation.
    #   If provided, the `apiMixins` collection must have a `base` mixin, which
    #   will get the `apiAdditions`. Also note that `apiClass` and `apiMixins`
    #   will get published into the namespace, so additional flexibility is
    #   possible, especially with non-specific mixins.
    #
    # - The plugin's __noConflict__ procedure, which gets published onto its
    #   namespace, but default just restores to the previous method. If a
    #   `noConflict` procedure is provided by the namespace, it gets run
    #   beforehand as well.
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
        return
      )

      # § __Plugin Method__

      # The __plugin__ method handles two variations of input. A command `type`
      # (name) and `userInfo` can be passed in to trigger the command route. The
      # latter is typically additional, command-specific parameters. Otherwise,
      # if the first argument is an options collection, the normal route is
      # triggered.
      #
      # With the command route, if there is a plugin instance and it can
      # __handleCommand__, call the method, but invoke `userInfo` if needed
      # beforehand. With the normal route, if there is a plugin instance and no
      # arguments are provided we assume the call is to access the instance,
      # not reset it.
      #
      # Otherwise if the instance exists, it is returned. __asSharedInstance__
      # will decide what the plugin instance's main element will be. The idea is
      # several elements all share the same plugin instance.
      #
      # Otherwise, continue creating the instance by preparing the options and
      # deciding the main element before passing over to `_createPluginInstance`.
      plugin = $.fn[name] = $.fn[safeName] = ->
        if _.isString(arguments[0])
          command =
            type: arguments[0]
            userInfo: arguments[1]
        else
          options = arguments[0]
          $context = arguments[1] if arguments[1]?
        #- The element's `$context` will default to document body.
        $context ?= $ 'body'

        if command?
          @each ->
            $el = $(@)
            instance = $el.data namespace.toString('data')
            if _.isFunction(instance.handleCommand)
              if _.isFunction(command.userInfo) then command.userInfo $el
              sender = null
              instance.handleCommand command, sender
            return
          return @ # Follow plugin return conventions.

        else
          $el = if createOptions.asSharedInstance is yes then $context else @first()
          instance = $el.data namespace.toString('data')
          return instance if instance? and instance.$el? and not options?

        options = $.extend (deep = on), {}, namespace.defaults, options
        $el = @
        ( ->
          args = arguments
          if createOptions.asSharedInstance is yes
            _createPluginInstance $el, args...
          else
            $el.each ->
              _createPluginInstance $(@), args...
              return
          return
        )(options, $context, namespace, apiClass, apiMixins, mixinFilter, createOptions)
        return @ # Follow plugin return conventions.

  _.bindAll hlf, 'createPlugin'

  # ___createPluginInstance__ is a private subroutine that's part of
  # `createPlugin`, which has more details on its required input.
  #
  # 1. Check if plugin element has options set in its plugin data attribute. If
  #    so, merge those options into our own `finalOptions`.
  #
  # 2. Also decide the `$root` element based on the situation. It's where the
  #    plugin instance gets stored and the root plugin class gets added.
  #    A shared instance, for example, gets stored on the `$context`.
  #
  # 3. If we're provided with a class for the API, instantiate it. Decorate the
  #    instance with additional mixins if applicable.
  #
  # 4. If instead we're provided with just mixins for the API, create a plain
  #    object with the base properties for the instance. Then apply the provided
  #    mixins in order: the names of the base mixins, the `base` mixin from the
  #    provided mixins collection, and the `otherMixins`. The others are just
  #    mixins allowed by the provided filter (if any) that also aren't `base`.
  #
  # 5. If the `compactOptions` flag is toggled, `finalOptions` will be merged
  #    into the instance. This makes accessing options more convenient, but can
  #    cause conflicts with larger existing APIs that don't account for such
  #    naming conflicts, since _we don't handle conflicts here_. Otherwise, just
  #    alias the conventional `selectors` and `classNames` option groups.
  #
  # 6. If the `autoSelect` flag is toggled and a `select` method is provided
  #    (ie. via `selection` mixin), call it and automatically setup element
  #    references prior to initialization.
  #
  # 7. If the `cls` API addition exists and provides the root class, add the root
  #    class to the decided `$root` prior to initialization.
  #
  # 8. If an `init` method is provided, and one must be if it's just mixins for
  #    the API, call it. Convention is to always provide it.
  #
  # 9. Lastly, store the instance on `$root`.
  _createPluginInstance = ($el, options, $context, namespace, apiClass, apiMixins, mixinFilter, createOptions) ->
    data = $el.data namespace.toString('data')
    finalOptions = options

    if $.isPlainObject(data)
      finalOptions = $.extend (deep = on), {}, options, data
      $root = $el
    else if createOptions.asSharedInstance
      $root = $context
    else
      $root = $el

    if apiClass?
      instance = new apiClass $el, finalOptions, $context
      if createOptions.baseMixins?
        hlf.applyMixins instance, namespace, createOptions.baseMixins...
      if createOptions.apiMixins?
        hlf.applyMixins instance, namespace, createOptions.apiMixins...

    else if apiMixins?
      instance = { $el, options: finalOptions }
      if createOptions.baseMixins?
        hlf.applyMixins instance, namespace, createOptions.baseMixins...
      hlf.applyMixin instance, namespace, apiMixins.base
      otherMixins = _.chain apiMixins
        .filter mixinFilter, instance
        .values()
        .without apiMixins.base
        .value()
      hlf.applyMixins instance, namespace, otherMixins...

    if createOptions.compactOptions is yes
      $.extend (deep = yes), instance, finalOptions
      delete instance.options
    else
      if finalOptions.selectors? then instance.selectors = finalOptions.selectors
      if finalOptions.classNames? then instance.classNames = finalOptions.classNames

    if createOptions.autoSelect is yes and _.isFunction(instance.select)
      instance.select()

    if instance.cls isnt $.noop then $root.addClass instance.cls()

    if _.isFunction(instance.init) then instance.init()
    else if not apiClass? then hlf.debugLog 'ERROR: No `init` method on instance.', instance

    $root.data instance.attr(), instance
    return

  # ___createPluginAPIAdditions__ is an internal subroutine that's part of
  # `createPlugin`, which has more details on its required input.
  #
  # - Add the __evt__ method to namespace an event name.
  # - Add the __attr__ method to namespace data keys and attribute names.
  # - Add the __cls__ method and attach functionality instead of a no-op only if
  #   class namespacing is unique.
  # - Add the __debugLog__ method and attach functionality instead of a no-op
  #   only if namespace `debug` is on.
  _createPluginAPIAdditions = (name, namespace) ->
    evt: _.memoize (name) ->
      if _.contains(name, ' ')
        return name.split(' ').reduce ((names, n) => "#{names} #{@evt(n)}"), ''
      "#{name}#{namespace.toString 'event'}"
    attr: _.memoize (name) ->
      name = if name? then "-#{name}" else ''
      namespace.toString('data') + name
    cls: if namespace.toString('class') is namespace.toString() then $.noop else
      _.memoize (name) ->
        name = if name? then "-#{name}" else ''
        namespace.toString('class') + name
    debugLog: if namespace.debug is off then $.noop else ->
      hlf.debugLog namespace.toString('log'), arguments...
      return

  hlf._createPluginAPIAdditions = _createPluginAPIAdditions

  # Mixin Support
  # -------------

  # Mixins are another approach to encapsulating object-oriented behavior. This
  # set of helper functions are to fill the gap of a generic mixin system left
  # by jQuery's highly-specified plugin system. General mixins are also provided
  # to add helper methods for even more flexible extensions between mixins.
  _.extend hlf,

    # __applyMixin__, when given a `context` to decorate with a valid `mixin`,
    # runs any run-once hooks after applying a mixin copy without the hooks.
    # `context` is conventionally a class instance.
    #
    # 1. If `mixin` is a string, check the general `$.mixins` for the mixin.
    #
    # 2. Get run-once methods and filter a clean mixin copy. Run-once methods
    #    are what's specified in `$.mixinOnceNames` and implemented by the mixin.
    #    Also get methods that are conventionally named like event handlers.
    #
    # 3. Apply mixin and call onces with explicit context. Also auto-bind
    #    conventionally-named event handlers.
    applyMixin: (context, dependencies, mixin) ->
      if _.isString(mixin) then mixin = @mixins[mixin]
      if _.isFunction(mixin) then mixin = mixin dependencies
      return unless mixin?
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
      return

    # __applyMixins__, when given a `context` (class) to decorate with `mixins`,
    # which should be passed in order of application, calls `$.applyMixin` for
    # each mixin. Conventionally, this should be used instead of
    # `$.applyMixin`.
    applyMixins: (context, dependencies, mixins...) ->
      @applyMixin context, dependencies, mixin for mixin in mixins
      return

    # __createMixin__, when given a collection of `mixins`, adds a new mixin with
    # given `name` and `mixin` method collection. Conventionally, each logical
    # package of software should be written as a collection of mixins, with one
    # named 'base'.
    createMixin: (mixins, name, mixin) ->
      mixins ?= hlf.mixins
      return no if name of mixins
      mixins[name] = mixin
      if $.isPlainObject(mixin)
        (prop.mixin = name) for own k, prop of mixin when _.isFunction(prop)
      mixin

    # § __Supported Decorators__
    #
    # - __decorate__ allows more complex extending of the instance. For example,
    #   methods and properties can be removed, handlers can be added to
    #   triggered events for more complex extending of existing methods.
    #
    # - __decorateOptions__ allows extending the context's options, which are
    #   conventionally a property named `options`.
    mixinOnceNames: [
      'decorate'
      'decorateOptions'
    ]

    # __$.mixins__ is the general mixin collection that's provided for writing
    # foundation-level jQuery mixins. Conventionally, other mixins not shared
    # between different logical packages do not belong here.
    #
    # - __data__, when given a context with a data-attribute-name translator
    #   that makes a property-name follow jQuery conventions, as well as with
    #   a property `$el`, generate a mixin that applies convenience wrappers
    #   around the jQuery data API to simplify data API calls as much as
    #   possible.
    #
    # - __event__, when given a context with an event-name translator that makes
    #   an event-name follow jQuery conventions, as well as with a property
    #   `$el`, generates a mixin that applies convenience wrappers around the
    #   jQuery custom event API to simplify event API calls as much as possible.
    #
    # - __selection__, when given the context has a property `$el` and a property
    #   `selectors`, define cached selector results for each name-selector pair.
    #   Also provide selection helpers for common tasks.
    mixins:
      data: ->
        data: ->
          if arguments.length
            first = arguments[0]
            if _.isString(first)
              arguments[0] = @attr first
            else if _.isObject(first)
              pairs = {}
              (pairs[@attr(k)] = v) for own k, v of first
              arguments[0] = pairs
          @$el.data.apply @$el, arguments

      event: ->
        evtMap: (map) ->
          namespaced = {}
          namespaced[@evt(name)] = handler for own name, handler of map
          namespaced
        on: (obj) ->
          arguments[0] = if _.isString(obj) then @evt(obj) else @evtMap(obj)
          @$el.on.apply @$el, arguments
          return
        off: (obj) ->
          arguments[0] = if _.isString(obj) then @evt(obj) else @evtMap(obj)
          @$el.off.apply @$el, arguments
          return
        trigger: (name, userInfo) -> # TODO: WIP.
          @$el.trigger { type: @evt(name), userInfo }
          return

      selection: ->
        select: ->
          for own name, selector of @selectors
            if (result = @$el.find selector)?
              @["$#{name}"] = result
          return
        selectByClass: (className) ->
          classNames = @options?.classNames
          classNames ?= @classNames
          @$el.find ".#{@classNames[className]}"

  # § __Attaching__

  # ___safeSet__ is an internal wrapper around `_noConflict`.
  _safeSet = (key, toContext=$, fromContext=hlf) ->
    _oldValue = toContext[key]
    toContext[key] = fromContext[key]
    _noConflicts.push -> toContext[key] = _oldValue; return
    return

  _safeSet 'applyMixin'
  _safeSet 'applyMixins'
  _safeSet 'createMixin'
  _safeSet 'createPlugin'
  _safeSet 'mixinOnceNames'
  _safeSet 'mixins'

  $.hlf = hlf
)
