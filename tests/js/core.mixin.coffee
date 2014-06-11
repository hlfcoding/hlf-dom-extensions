define [
  'jquery'
  'underscore'
  'hlf/jquery.extension.hlf.core'
], ($, _, hlf) ->

  QUnit.module 'mixin',
    setup: ->
      @.mixins = {}
      @.mixin =
        decorate: -> @someOtherProperty = 'baz'
        someMethod: -> 'foo'
        someProperty: 'bar'
      @.dynamicMixin = (dependencies) ->
        someMethod: -> dependencies.valueA
        someProperty: dependencies.valueB
      @.mixinName = 'foo'
      @.dynamicMixinName = 'bar'
      @.instance = {}
      @.dependencies =
        valueA: 'foo'
        valueB: 'bar'

  QUnit.test 'createMixin', (assert) ->
    result = hlf.createMixin @mixins, @mixinName, @mixin
    assert.strictEqual result, @mixin,
      'Mixin should have been added to mixin collection.'
    assert.strictEqual @mixins[@mixinName], @mixin,
      'Mixin should be accessible.'
    assert.strictEqual @mixins[@mixinName].someMethod.mixin, @mixinName,
      'Mixin method should have mixin name attached.'
    result = hlf.createMixin @mixins, @mixinName, @mixin
    assert.strictEqual result, no,
      'Mixin should not have been re-added to mixin collection.'

  assertMixinInstance = (assert) ->
    assert.ok @instance.someMethod,
      'Mixin method should have been added to instance.'
    assert.strictEqual @instance.someMethod(), 'foo',
      'Mixin method should have been generated properly.'
    assert.strictEqual @instance.decorate, undefined,
      'Mixin once method should have been removed after invoking.'
    assert.strictEqual @instance.someOtherProperty, 'baz',
      'Mixin once method should have invoked properly.'

  QUnit.test 'applyMixin', (assert) ->
    result = hlf.createMixin @mixins, @mixinName, @mixin
    hlf.applyMixins @instance, @dependencies, @mixin
    assertMixinInstance.call @, assert

  assertDynamicMixinInstance = (assert) ->
    assert.ok @instance.someMethod,
      'Dynamic mixin method should have been added to instance.'
    assert.strictEqual @instance.someMethod(), @dependencies.valueA,
      'Dynamic mixin method should have been generated properly.'

  QUnit.test 'applyMixin with dynamicMixin', (assert) ->
    result = hlf.createMixin @mixins, @dynamicMixinName, @dynamicMixin
    hlf.applyMixins @instance, @dependencies, @dynamicMixin
    assertDynamicMixinInstance.call @, assert

  QUnit.test 'applyMixins', (assert) ->
    hlf.createMixin @mixins, @mixinName, @mixin
    hlf.createMixin @mixins, @dynamicMixinName, @dynamicMixin
    hlf.applyMixins @instance, @dependencies, _.values(@mixins)...
    assertMixinInstance.call @, assert
    assertDynamicMixinInstance.call @, assert

  yes
