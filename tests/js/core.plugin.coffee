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

      @baseCreateOptions = 
        name: 'somePlugin'
        namespace: @namespace
        apiClass: SomePlugin
        baseMixins: ['selection']
        autoSelect: yes
        compactOptions: yes

      @$someElement = $ '<div>'

  QUnit.test 'createPlugin with apiClass and baseMixins', (assert) ->
    hlf.createPlugin @baseCreateOptions
    assert.ok @$someElement.somePlugin,
      'Plugin method should have been created and attached to jQuery elements.'
    @$someElement.somePlugin()
    result = @$someElement.somePlugin()
    assert.ok result instanceof SomePlugin,
      'Plugin method should return instance upon re-invocation without any parameters.'
    assert.hasFunctions result, ['evt', 'attr', 'cls', 'debugLog', 'select'],
      'Plugin instance should have generated API additions.'
    assert.hasOwnProperties result, _.keys(@namespace.defaults),
      'Plugin instance should have options merged in as properties.'
    assert.ok result.$someElement,
      'Plugin instance should have auto-selected sub elements based on selectors option.'

  yes
