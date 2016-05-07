###
HLF Core Mixin Unit Tests
=========================
###

# [Page](../../../tests/core.unit.html)

define [
  'jquery'
  'underscore'
  'hlf/jquery.extension.hlf.core'
], ($, _, hlf) ->
  'use strict'

  QUnit.module 'mixin',
    setup: ->
      @mixins = {}
      @mixin =
        decorate: ->
          @someOtherProperty = 'baz'
          return
        someMethod: -> 'foo'
        someProperty: 'bar'
      @dynamicMixin = (dependencies) ->
        someMethod: -> dependencies.valueA
        someProperty: dependencies.valueB
      @mixinName = 'foo'
      @dynamicMixinName = 'bar'
      @instance = {}
      @dependencies =
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
    return

  assertMixinInstance = (assert) ->
    assert.ok @instance.someMethod,
      'Mixin method should have been added to instance.'
    assert.strictEqual @instance.someMethod(), 'foo',
      'Mixin method should have been generated properly.'
    assert.strictEqual @instance.decorate, undefined,
      'Mixin once method should have been removed after invoking.'
    assert.strictEqual @instance.someOtherProperty, 'baz',
      'Mixin once method should have invoked properly.'
    return

  QUnit.test 'applyMixin', (assert) ->
    result = hlf.createMixin @mixins, @mixinName, @mixin
    hlf.applyMixins @instance, @dependencies, @mixin
    assertMixinInstance.call @, assert
    return

  assertDynamicMixinInstance = (assert) ->
    assert.ok @instance.someMethod,
      'Dynamic mixin method should have been added to instance.'
    assert.strictEqual @instance.someMethod(), @dependencies.valueA,
      'Dynamic mixin method should have been generated properly.'
    return

  QUnit.test 'applyMixin with dynamicMixin', (assert) ->
    result = hlf.createMixin @mixins, @dynamicMixinName, @dynamicMixin
    hlf.applyMixins @instance, @dependencies, @dynamicMixin
    assertDynamicMixinInstance.call @, assert
    return

  QUnit.test 'applyMixins', (assert) ->
    hlf.createMixin @mixins, @mixinName, @mixin
    hlf.createMixin @mixins, @dynamicMixinName, @dynamicMixin
    hlf.applyMixins @instance, @dependencies, _.values(@mixins)...
    assertMixinInstance.call @, assert
    assertDynamicMixinInstance.call @, assert
    return

  QUnit.module 'hlf.mixins.data',
    setup: ->
      @instance =
        attr: (name) -> "some-ns-#{name}"
        $el: $ '<div>'
      hlf.applyMixin @instance, [], 'data'

  QUnit.test '#data', (assert) ->
    @instance.$el.data 'some-ns-some-attr', 'some-value'
    assert.strictEqual @instance.data('some-attr'), 'some-value',
      'it gets value for single key'

    @instance.data 'some-attr', 'some-value'
    assert.strictEqual @instance.$el.data('some-ns-some-attr'), 'some-value',
      'it sets value for single key'

    @instance.data { 'some-attr': 'some-value', 'other-attr': 'other-value' }
    assert.strictEqual @instance.$el.data('some-ns-some-attr'), 'some-value',
      'it sets values in pairs object'
    assert.strictEqual @instance.$el.data('some-ns-other-attr'), 'other-value',
      'it sets values in pairs object'

  yes
