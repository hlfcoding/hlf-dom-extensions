###
HLF Core Plugin Unit Tests
==========================
###

define [
  'jquery'
  'underscore'
  'hlf/jquery.extension.hlf.core'
  'test/base'
], ($, _, hlf) ->

  class SomePlugin
    constructor: (@$el, options, @$context) ->

  QUnit.module 'plugin',
    setup: ->
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

      $.createMixin @mixins, 'someMixin',
        decorate: ->
          @on 'did-init', => @initSomeMixin()
        initSomeMixin: ->
          @someMixinProperty = 'foo'
        someMixinMethod: -> 'foo'

      $.createMixin @mixins, 'someOtherMixin',
        decorate: ->
          @on 'did-init', => @initSomeOtherMixin()
        initSomeOtherMixin: ->
          @someOtherMixinProperty = 'bar'
        someOtherMixinMethod: -> 'bar'

      @baseCreateOptions = 
        name: 'somePlugin'
        namespace: @namespace
        apiClass: SomePlugin
        baseMixins: ['selection']
        autoSelect: yes
        compactOptions: yes

      @$someElement = $ '<div>'

  assertGeneralPlugin = (assert) ->
    assert.ok @$someElement.somePlugin,
      'Plugin method should have been created and attached to jQuery elements.'
    @$someElement.somePlugin()
    result = @$someElement.somePlugin()
    assert.hasFunctions result, ['evt', 'attr', 'cls', 'debugLog', 'select'],
      'Plugin instance should have generated API additions.'
    assert.hasOwnProperties result, _.keys(@namespace.defaults),
      'Plugin instance should have options merged in as properties.'
    assert.ok result.$someElement,
      'Plugin instance should have auto-selected sub elements based on selectors option.'
    return result

  QUnit.test 'createPlugin with apiClass and baseMixins', (assert) ->
    hlf.createPlugin @baseCreateOptions
    result = assertGeneralPlugin.call @, assert
    assert.ok result instanceof SomePlugin,
      'Plugin method should return instance upon re-invocation without any parameters.'

  QUnit.test 'createPlugin with apiMixins and baseMixins', (assert) ->
    createOptions = @baseCreateOptions
    createOptions.apiClass = null
    createOptions.apiMixins = @mixins
    createOptions.baseMixins.push 'data', 'event'
    hlf.createPlugin createOptions
    result = assertGeneralPlugin.call @, assert
    assert.hasFunctions result, ['data', 'on', 'off', 'trigger'],
      'Base mixin methods should have been added to instance.'
    assert.strictEqual result.someMixinMethod(), 'foo',
      'Mixin method attached to instance should work.'
    assert.strictEqual result.someOtherMixinMethod(), 'bar',
      'Mixin method attached to instance should work.'
    assert.strictEqual result.someMixinProperty, 'foo',
      'Mixin property should have been set on deferred initialization.'
    assert.strictEqual result.someOtherMixinProperty, 'bar',
      'Mixin property should have been set on deferred initialization.'

  QUnit.test 'createPlugin with apiClass and baseMixins and asSharedInstance', (assert) ->
    createOptions = @baseCreateOptions
    createOptions.asSharedInstance = yes
    hlf.createPlugin createOptions
    result = assertGeneralPlugin.call @, assert
    assert.strictEqual result, $('body').data('somePlugin'),
      'Plugin singleton should be stored with context element.'


  yes
