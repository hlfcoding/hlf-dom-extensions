###
HLF Core jQuery Extension
=========================
Released under the MIT License  
Written with jQuery 1.7.2  
###

# The core extension is comprised of several aspects.

# - Mixin creation and manipulation, as well as providing base mixins, via:
#   `$.applyMixin`, `$.applyMixins`, `$.createMixins`, `$.mixins`.
# - Plugin creation with support for both classes and mixins, via: 
#   `$.createPlugin`.
# - Integrated no-conflict handling and debug-logging, via: `$.hlf.noConflict`, 
#   `$.hlf.debugLog`.

# The extension also creates and provides the `hlf` jQuery namespace. Namespaces
# for other extensions and plugins are attached to this main namespace.

# Export. Prefer AMD.
((extension) ->
  if define? and define.amd?
    define [
      'jquery'
      'underscore'
    ], extension
  else extension jQuery, _
)(($, _) ->

  hlf =
    debug: on # Turn this off when going to production.
    toString: _.memoize (context) -> 'hlf'

  # We keep track of no-conflict procedures with `_noConflicts`. This is
  # essentially working with a callback queue. Calling `$.hlf.noConflict` simply
  # runs these procedures. Procedures should be simple and idempotent, i.e.
  # restoring the property to a saved previous value.
  _noConflicts = []
  
  _.extend hlf,
    # The base `noConflict` behavior will remove assignments to the global
    # jQuery namespace. Properties will have to be accessed through the `$.hlf`
    # namespace. See `safeSet` below. Also see `createPlugin` for its no-
    # conflict integration.
    noConflict: -> (fn() for fn in _noConflicts).length
    # The base debug logging implementation just wraps around `console.log`.
    debugLog: if hlf.debug is off then $.noop else
      (if console.log.bind then console.log.bind(console) else console.log)

  # Plugin Support
  # --------------

  # Plugin generation is perhaps the most common jQuery boilerplate. Binding
  # additional state and functionality to jQuery elements is a common task that
  # should be abstracted away, with common patterns and conventions around the
  # process accounted for, including logging, jQuery namespacing, instance
  # access, and sending commands. Furthermore, instead of API classes and
  # plugins inheriting from a base layer, that base layer is integrated on
  # instantiation.

  # `_createPluginInstance` is a private subroutine that's part of
  # `createPlugin`, which has more details on its required input.
  _createPluginInstance = ($el, options, $context, namespace, apiClass, apiMixins, mixinFilter, createOptions) ->
    # Check if plugin element has options set in its plugin data attribute. If
    # so, merge those options into our own `finalOptions`.
    data = $el.data namespace.toString('data')
    finalOptions = options
    if $.isPlainObject(data)
      finalOptions = $.extend (deep = on), {}, options, data
      # Also decide the `$root` element based on the situation. It's where the
      # plugin instance gets stored and the root plugin class gets added.
      # Singletons, for example, get stored on the `$context`.
      $root = $el
    else if not createOptions.asSingleton
      $root = $el
    else
      $root = $context
    # If we're provided with a class for the API, instantiate it. Decorate the
    # instance with additional mixins if applicable.
    if apiClass?
      instance = new apiClass $el, finalOptions, $context
      if createOptions.baseMixins?
        hlf.applyMixins instance, namespace, createOptions.baseMixins...
      if createOptions.apiMixins?
        hlf.applyMixins instance, namespace, createOptions.apiMixins...
    # If instead we're provided with just mixins for the API, create a plain
    # object with the base properties for the instance. Then apply the provided
    # mixins in order: the names of the base mixins, the `base` mixin from the
    # provided mixins collection, and the `otherMixins`. The others are just
    # mixins allowed by the provided filter (if any) that also aren't `base`.
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
    # If the `compactOptions` flag is toggled, `finalOptions` will be merged
    # into the instance. This makes accessing options more convenient, but can
    # cause conflicts with larger existing APIs that don't account for such
    # naming conflicts, since _we don't handle conflicts here_. Otherwise, just
    # alias the conventional `selectors` and `classNames` option groups.
    if createOptions.compactOptions is yes
      $.extend (deep = yes), instance, finalOptions
      delete instance.options
    else
      if finalOptions.selectors? then instance.selectors = finalOptions.selectors
      if finalOptions.classNames? then instance.classNames = finalOptions.classNames
    # If the `autoSelect` flag is toggled and a `select` method is provided
    # (i.e. via `selection` mixin), call it and automatically setup element
    # references prior to initialization.
    if createOptions.autoSelect is yes and _.isFunction(instance.select)
      instance.select()
    # If the `cls` API addition exists and provides the root class, add the root
    # class to the decided `$root` prior to initialization.
    if instance.cls isnt $.noop then $root.addClass instance.cls()
    # If an `init` method is provided, and one must be if it's just mixins for
    # the API, call it. Convention is to always provide it.
    if _.isFunction(instance.init) then instance.init()
    else if not apiClass? then hlf.debugLog 'ERROR: No `init` method on instance.', instance
    # Lastly, store the instance on `$root`.
    $root.data instance.attr(), instance

  # `_createPluginAPIAdditions` is a private subroutine that's part of
  # `createPlugin`, which has more details on its required input.
  _createPluginAPIAdditions = (name, namespace) ->
    # - Add the `evt` method to namespace an event name.
    evt: _.memoize (name) -> "#{name}#{namespace.toString 'event'}"
    # - Add the `attr` method to namespace data keys and attribute names.
    attr: _.memoize (name) ->
      name = if name? then "-#{name}" else ''
      namespace.toString('data') + name
    # - Add the `cls` method and attach functionality instead of a no-op only if
    #   class namespacing is unique.
    cls: if namespace.toString('class') is namespace.toString() then $.noop else
      _.memoize (name) ->
        name = if name? then "-#{name}" else ''
        namespace.toString('class') + name
    # - Add the `debugLog` method and attach functionality instead of a no-op
    #   only if namespace `debug` is on.
    debugLog: if namespace.debug is off then $.noop else
      -> hlf.debugLog namespace.toString('log'), arguments...

  _.extend hlf,
    # `createPlugin`, will return an appropriate jQuery plugin method for the
    # `given `createOptions`, comprised of:
    createPlugin: (createOptions) ->
      # `name`, which is required and is the name of the method. The `safeName`
      # for the method, which needs to be on the jQuery prototype, is prefixed
      # by `hlf` and should be used after `noConflict` is called.
      name = createOptions.name
      safeName = "#{@toString()}#{name[0].toUpperCase()}#{name[1..]}"
      # `namespace`, which is required and must correctly implement `debug`,
      # `toString`, and `defaults`. It can optionally have a `noConflict`
      # procedure.
      namespace = createOptions.namespace
      # An `apiClass` definition and/or an `apiMixins` collection. It will get
      # modified with base API additions. A `mixinFilter` can be provided to
      # limit the mixins in the collection that get applied during
      # instantiation. If provided, the `apiMixins` collection must have a
      # `base` mixin, which will get the API additions. Also note that
      # `apiClass` and `apiMixins` will get published into the namespace, so
      # additional flexibility is possible, especially with non-specific mixins.
      apiAdditions = _createPluginAPIAdditions name, namespace
      if createOptions.apiClass?
        apiClass = namespace.apiClass = createOptions.apiClass
        _.extend apiClass::, apiAdditions
      if createOptions.apiMixins?
        mixinFilter = createOptions.mixinFilter
        mixinFilter ?= (mixin) -> mixin
        apiMixins = namespace.apiMixins = createOptions.apiMixins
        $.extend (deep = on), apiMixins, { base: apiAdditions }
      # The plugin's `noConflict` procedure, which gets published onto its
      # namespace, but default just restores to the previous method. If a
      # `noConflict` procedure is provided by the namespace, it gets run
      # beforehand as well.
      _noConflict = namespace.noConflict
      _plugin = $.fn[name]
      _noConflicts.push (namespace.noConflict = ->
        if _.isFunction(_noConflict) then _noConflict()
        $.fn[name] = _plugin
      )
      # Generate and publish the plugin method.
      plugin = $.fn[name] = $.fn[safeName] = ->
        # The method handles two variations of input. A command `type` (name)
        # and `userInfo` can be passed in to trigger the command route. The
        # latter is typically additional, command-specific parameters.
        # Otherwise, if the first argument is an options collection, the normal
        # route is triggered.
        if _.isString(arguments[0])
          command =
            type: arguments[0]
            userInfo: arguments[1]
        else
          options = arguments[0]
          $context = arguments[1] if arguments.length > 1
        # The element's `$context` will default to document body.
        $context ?= $ 'body'
        # With the command route, if there is a plugin instance and it can
        # `handleCommand`, call the method, but invoke `userInfo` if needed
        # beforehand. With the normal route, if there is a plugin instance and
        # no arguments are provided we assume the call is to access the
        # instance, not reset it.
        if command?
          @each ->
            $el = $(@)
            instance = $el.data namespace.toString('data')
            if _.isFunction(instance.handleCommand)
              if _.isFunction(command.userInfo) then command.userInfo $el
              sender = null
              instance.handleCommand command, sender
          # Follow plugin return conventions.
          return @
        else
          # `asSingleton` will decide what the plugin instance's main element
          # will be. The notion is that several elements all share the same
          # plugin instance.
          $el = if createOptions.asSingleton is yes then $context else @first()
          instance = $el.data namespace.toString('data')
          return instance if instance? and instance.$el? and not arguments.length
        # Otherwise, continue creating the instance by preparing the options and
        # deciding the main element before passing things onto
        # `_createPluginInstance`.
        options = $.extend (deep = on), {}, namespace.defaults, options
        $el = @
        ( ->
          args = arguments
          if createOptions.asSingleton is yes then _createPluginInstance $el, args...
          else $el.each -> _createPluginInstance $(@), args...
        )(options, $context, namespace, apiClass, apiMixins, mixinFilter, createOptions)
        # Follow plugin return conventions.
        return @

  _.bindAll hlf, 'createPlugin'

  # Mixin Support
  # -------------

  # Mixins are another approach to encapsulating object-oriented behavior. This
  # set of helper functions are to fill the gap of a generic mixin system left
  # by jQuery's highly-specified plugin system. General mixins are also provided
  # to add helper methods for even more flexible extensions between mixins.
  _.extend hlf,

    # `applyMixin`, when given a `context` to decorate with a valid `mixin`, runs
    # any run-once hooks after applying a mixin copy without the hooks.
    # `context` is conventionally a class instance.
    applyMixin: (context, dependencies, mixin) ->
      # If `mixin` is a string, check the general `$.mixins` for the mixin.
      if _.isString(mixin) then mixin = @mixins[mixin] 
      return unless mixin?
      if _.isFunction(mixin) then mixin = mixin dependencies
      onceMethods = []
      handlerNames = []
      # Get run-once methods and filter a clean mixin copy. Run-once methods are
      # what's specified in `$.mixinOnceNames` and implemented by the mixin.
      # Also get methods that are conventionally named like event handlers.
      for own name, prop of mixin when _.isFunction(prop)
        if name in @mixinOnceNames then onceMethods.push prop
        if name.indexOf('handle') is 0 and name isnt 'handleCommand'
          handlerNames.push name
      mixinToApply = _.omit mixin, @mixinOnceNames
      # Apply mixin and call onces with explicit context.
      _.extend context, mixinToApply
      method.call(context) for method in onceMethods
      # Auto-bind conventionally-named event handlers.
      if handlerNames.length then _.bindAll context, handlerNames...

    # `applyMixins`, when given a `context` (class) to decorate with `mixins`,
    # which should be passed in order of application, calls `$.applyMixin` for
    # each mixin. Conventionally, this should be used instead of
    # `$.applyMixin`.
    applyMixins: (context, dependencies, mixins...) ->
      @applyMixin context, dependencies, mixin for mixin in mixins

    # `createMixin`, when given a collection of `mixins`, adds a new mixin with
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

    # Supported decorators:
    mixinOnceNames: [
      # `decorate` allows more complex extending of the instance. For example,
      # methods and properties can be removed, handlers can be added to
      # triggered events for more complex extending of existing methods.
      'decorate'
      # `decorateOptions` allows extending the context's options, which are
      # conventionally a property named `options`.
      'decorateOptions'
    ]
    # `$.mixins` is the general mixin collection that's provided for writing
    # foundation-level jQuery mixins. Conventionally, other mixins not shared
    # between different logical packages do not belong here.
    mixins:
      # `data`, when given a context with a data-attribute-name translator that
      # makes a property-name follow jQuery conventions, as well as with a
      # property `$el`, generate a mixin that applies convenience wrappers
      # around the jQuery data API to simplify data API calls as much as
      # possible.
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
      # `event`, when given a context with an event-name translator that makes an
      # event-name follow jQuery conventions, as well as with a property `$el`,
      # generates a mixin that applies convenience wrappers around the jQuery
      # custom event API to simplify event API calls as much as possible.
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
      # `selection`, when given the context has a property `$el` and a property
      # `selectors`, define cached selector results for each name-selector pair.
      selection: ->
        select: ->
          for own name, selector of @selectors
            @["$#{name}"] = @$el.find selector

  # Export
  # ------

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
