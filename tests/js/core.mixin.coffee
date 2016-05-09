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

  {module, test} = QUnit

  module 'mixin core',
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
      return

  test '.createMixin', (assert) ->
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

  test '.applyMixins', (assert) ->
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

  test '.applyMixins with dynamicMixin', (assert) ->
    result = hlf.createMixin @mixins, @dynamicMixinName, @dynamicMixin
    hlf.applyMixins @instance, @dependencies, @dynamicMixin
    assertDynamicMixinInstance.call @, assert
    return

  test '.applyMixins', (assert) ->
    hlf.createMixin @mixins, @mixinName, @mixin
    hlf.createMixin @mixins, @dynamicMixinName, @dynamicMixin
    hlf.applyMixins @instance, @dependencies, _.values(@mixins)...
    assertMixinInstance.call @, assert
    assertDynamicMixinInstance.call @, assert
    return

  module 'hlf.mixins.data',
    beforeEach: ->
      @instance =
        attr: (name) -> "some-ns-#{name}"
        $el: $ '<div>'
      hlf.applyMixin @instance, [], 'data'
      return

  test '#data', (assert) ->
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
    return

  module 'hlf.mixins.event',
    beforeEach: ->
      additions = hlf._createPluginAPIAdditions 'some-plugin',
        { toString: -> '.some-ns' }
      @instance =
        evt: additions.evt
        $el: $ '<div><div></div></div>'
      hlf.applyMixin @instance, [], 'event'
      return

  test "#on", (assert) ->
    assert.expect 10

    @instance.on 'some-event other-event', (e) ->
      assert.ok e, 'It namespaces, binds event(s) with handler via $.fn.on.'
      return
    @instance.$el.trigger('some-event.some-ns').trigger('other-event.some-ns')
      .off() # 2

    handler = (e) ->
      assert.ok e, 'It namespaces, binds from event(s)-handler map via $.fn.on.'
      return
    @instance.on { 'some-event': handler, 'other-event': handler }
    @instance.$el.trigger('some-event.some-ns').trigger('other-event.some-ns')
      .off() # 2

    handler = (e, data) ->
      assert.ok e, 'It supports selector filter (event delegation) via $.fn.on.'
      assert.strictEqual data, 'some-value',
        'It supports event data via $.fn.on.'
      return
    @instance.on 'some-event', 'div', handler
    @instance.$el.find('div')
      .trigger('some-event.some-ns', 'some-value')
      .end().off() # 2
    @instance.on { 'some-event': handler, 'other-event': handler }, 'div'
    @instance.$el.find('div')
      .trigger('some-event.some-ns', 'some-value')
      .trigger('other-event.some-ns', 'some-value')
      .end().off() # 4
    return

  test '#off', (assert) ->
    handled = 
      'some-event.some-ns': 0
      'other-event.some-ns': 0
      total: -> @['some-event.some-ns'] + @['other-event.some-ns']
    handler = (e) ->
      handled["#{e.type}.#{e.namespace}"] += 1; return
    handlers = { 'some-event.some-ns': handler, 'other-event.some-ns': handler }
    boilerplated = (test) =>
      @instance.$el.on handlers
      test()
      @instance.$el.trigger('some-event.some-ns').trigger('other-event.some-ns')
      @instance.$el.off()
      return

    boilerplated => @instance.off(); return
    assert.strictEqual handled.total(), 0,
      'It unbinds all events via $.fn.off.'

    boilerplated =>
      @instance.off { 'some-event': handler, 'other-event': handler }
      return
    assert.strictEqual handled.total(), 0,
      'It namespaces, unbinds from event(s)-handler map via $.fn.off.'

    boilerplated => @instance.off('some-event', handler); return
    assert.ok handled.total() is 1 and handled['other-event.some-ns'] is 1,
      'It namespaces, unbinds event(s) from handler via $.fn.off.'

    boilerplated => @instance.off('some-event'); return
    assert.ok handled.total() is 2 and handled['other-event.some-ns'] is 2,
      'It namespaces, unbinds event(s) from all handlers via $.fn.off.'

    @instance.$el.on handlers, 'div'
    @instance.off 'some-event', 'div', handler
    @instance.$el.trigger('some-event.some-ns').trigger('other-event.some-ns')
      .find('div').trigger('some-event.some-ns').trigger('other-event.some-ns')
    assert.ok handled.total() is 3 and handled['other-event.some-ns'] is 3,
      'It supports selector filter (event delegation) via $.fn.off.'
    return

  module 'hlf.mixins.selection',
    beforeEach: ->
      @instance =
        classNames:
          'some-child': 'js-ns-some-child'
          'other-child': 'js-ns-other-child'
        selectors:
          someChild: '.js-ns-some-child'
          otherChild: '.js-ns-other-child'
        $el: $ """
          <div>
            <div class="js-ns-some-child"></div>
            <div class="js-ns-other-child"></div>
          </div>
          """
      hlf.applyMixin @instance, [], 'selection'
      return

  test '#select', (assert) ->
    @instance.select()
    assert.ok @instance.$someChild.is('.js-ns-some-child'),
      "It sets a property for each 'selectors' prop-class-name pair."
    assert.ok @instance.$otherChild.is('.js-ns-other-child'),
      "It sets a property for each 'selectors' prop-class-name pair."
    return

  test '#selectByClass', (assert) ->
    assert.ok @instance.selectByClass('some-child').is('.js-ns-some-child'),
      "It returns selector results using full 'classNames' value for key."
    assert.ok @instance.selectByClass('other-child').is('.js-ns-other-child'),
      "It returns selector results using full 'classNames' value for key."
    return

  yes
