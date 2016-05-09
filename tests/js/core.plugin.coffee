###
HLF Core Plugin Unit Tests
==========================
###

# [Page](../../../tests/core.unit.html)

define [
  'jquery'
  'underscore'
  'hlf/jquery.extension.hlf.core'
  'test/base'
], ($, _, hlf) ->
  'use strict'

  {module, test} = QUnit

  class SomePlugin
    constructor: (@$el, options, @$context) ->

  module 'plugin core',
    beforeEach: ->
      @namespace = 
        debug: off
        toString: _.memoize (context) ->
          switch context
            when 'event' then '.some-plugin'
            when 'data'  then 'some-plugin'
            else 'somePlugin'
        defaults:
          someOption: 'foo'
          someOptionGroup:
            someOption: 'bar'
          selectors: 
            someElement: '.foo'
          classNames:
            someElement: 'foo'

      @mixins = {}

      $.createMixin @mixins, 'base',
        init: ->
          @trigger 'did-init'
          return

      $.createMixin @mixins, 'someMixin',
        decorate: ->
          @on 'did-init', => @initSomeMixin()
          return
        initSomeMixin: ->
          @someMixinProperty = 'foo'
          return
        someMixinMethod: -> 'foo'

      $.createMixin @mixins, 'someOtherMixin',
        decorate: ->
          @on 'did-init', => @initSomeOtherMixin()
          return
        initSomeOtherMixin: ->
          @someOtherMixinProperty = 'bar'
          return
        someOtherMixinMethod: -> 'bar'

      @baseCreateOptions = 
        name: 'somePlugin'
        namespace: @namespace
        apiClass: SomePlugin
        baseMixins: ['selection']
        autoSelect: yes
        compactOptions: yes

      @$someElement = $ '<div>'
      return

  assertGeneralPlugin = (assert) ->
    assert.ok @$someElement.somePlugin,
      'Plugin method is created and attached to jQuery elements.'
    @$someElement.somePlugin()
    result = @$someElement.somePlugin()
    assert.hasFunctions result, ['evt', 'attr', 'cls', 'debugLog', 'select'],
      'Instance has generated API additions.'
    assert.hasOwnProperties result, _.keys(@namespace.defaults),
      'Instance has options merged in as properties.'
    assert.ok result.$someElement,
      'Instance has auto-selected sub elements based on selectors option.'
    result

  test '.createPlugin with apiClass, baseMixins', (assert) ->
    hlf.createPlugin @baseCreateOptions
    result = assertGeneralPlugin.call @, assert
    assert.ok result instanceof SomePlugin,
      'It returns instance upon re-invocation without any parameters.'
    return

  test '.createPlugin with apiMixins, baseMixins', (assert) ->
    createOptions = @baseCreateOptions
    createOptions.apiClass = null
    createOptions.apiMixins = @mixins
    createOptions.baseMixins.push 'data', 'event'
    hlf.createPlugin createOptions
    result = assertGeneralPlugin.call @, assert
    assert.hasFunctions result, ['data', 'on', 'off', 'trigger'],
      'It adds base mixin methods to instance.'
    assert.strictEqual result.someMixinMethod(), 'foo',
      'Mixin method attached to instance works.'
    assert.strictEqual result.someOtherMixinMethod(), 'bar',
      'Mixin method attached to instance works.'
    assert.strictEqual result.someMixinProperty, 'foo',
      'Mixin property is set on deferred initialization.'
    assert.strictEqual result.someOtherMixinProperty, 'bar',
      'Mixin property is set on deferred initialization.'
    return

  test '.createPlugin with apiClass, baseMixins, asSharedInstance', (assert) ->
    createOptions = @baseCreateOptions
    createOptions.asSharedInstance = yes
    hlf.createPlugin createOptions
    result = assertGeneralPlugin.call @, assert
    assert.strictEqual result, $('body').data('somePlugin'),
      'It stores plugin singleton with context element.'
    return

  yes
