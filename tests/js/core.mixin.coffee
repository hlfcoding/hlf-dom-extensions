###
HLF Core Mixin Unit Tests
=========================
###

# [Page](../../../tests/core.unit.html)

define [
  'jquery'
  'underscore'
  'hlf/jquery.extension.hlf.core'
  'test/base'
], ($, _, hlf) ->
  'use strict'

  QUnit.module 'mixin core',
    beforeEach: ->
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

  QUnit.test '.createMixin', (assert) ->
    result = hlf.createMixin @mixins, @mixinName, @mixin
    assert.strictEqual result, @mixin,
      'Mixin is added to mixin collection.'
    assert.strictEqual @mixins[@mixinName], @mixin,
      'Mixin is accessible.'
    assert.strictEqual @mixins[@mixinName].someMethod.mixin, @mixinName,
      'Mixin method has mixin name attached.'
    result = hlf.createMixin @mixins, @mixinName, @mixin
    assert.strictEqual result, no,
      'Mixin is not re-added to mixin collection.'
    return

  assertMixinInstance = (assert) ->
    assert.ok @instance.someMethod,
      'Mixin method is added to instance.'
    assert.strictEqual @instance.someMethod(), 'foo',
      'Mixin method is generated properly.'
    assert.strictEqual @instance.decorate, undefined,
      'Mixin once method is removed after invoking.'
    assert.strictEqual @instance.someOtherProperty, 'baz',
      'Mixin once method is invoked properly.'
    return

  QUnit.test '.applyMixins', (assert) ->
    result = hlf.createMixin @mixins, @mixinName, @mixin
    hlf.applyMixins @instance, @dependencies, @mixin
    assertMixinInstance.call @, assert
    return

  assertDynamicMixinInstance = (assert) ->
    assert.ok @instance.someMethod,
      'Dynamic mixin method is added to instance.'
    assert.strictEqual @instance.someMethod(), @dependencies.valueA,
      'Dynamic mixin method is generated properly.'
    return

  QUnit.test '.applyMixins with dynamicMixin', (assert) ->
    result = hlf.createMixin @mixins, @dynamicMixinName, @dynamicMixin
    hlf.applyMixins @instance, @dependencies, @dynamicMixin
    assertDynamicMixinInstance.call @, assert
    return

  QUnit.test '.applyMixins', (assert) ->
    hlf.createMixin @mixins, @mixinName, @mixin
    hlf.createMixin @mixins, @dynamicMixinName, @dynamicMixin
    hlf.applyMixins @instance, @dependencies, _.values(@mixins)...
    assertMixinInstance.call @, assert
    assertDynamicMixinInstance.call @, assert
    return

  QUnit.module 'hlf.mixins.data',
    beforeEach: ->
      @instance =
        attr: (name) -> "some-ns-#{name}"
        $el: $ '<div>'
      hlf.applyMixin @instance, [], 'data'

  QUnit.test '#data', (assert) ->
    @instance.$el.data 'some-ns-some-attr', 'some-value'
    assert.strictEqual @instance.data('some-attr'), 'some-value',
      'It namespaces key and gets value for single key via $.fn.data.'

    @instance.data 'some-attr', 'some-value'
    assert.strictEqual @instance.$el.data('some-ns-some-attr'), 'some-value',
      'It namespaces key and sets value for single key via $.fn.data.'

    pairs = { 'some-attr': 'some-value', 'other-attr': 'other-value' }
    @instance.data pairs
    for own key, value of pairs
      assert.strictEqual @instance.$el.data("some-ns-#{key}"), value,
        'It namespaces keys and sets values in pairs object via $.fn.data.'

  yes
