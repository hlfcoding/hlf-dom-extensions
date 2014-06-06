require.config
  baseUrl: '../lib'
  paths:
    hlf: '../dist'
    test: '../tests/js'

require [
  'jquery'
  'underscore'
  'hlf/jquery.extension.hlf.core'
], ($, _, hlf) ->
  shouldRunVisualTests = $('#qunit').length is 0

  if shouldRunVisualTests then $ ->
  else

    QUnit.test 'exports', (assert) ->
      assert.notStrictEqual $.hlf, undefined,
        'Namespace should exist.'

    QUnit.test 'noConflict', (assert) ->
      assert.notStrictEqual $.createPlugin, undefined, 
        'Method shortcut for createPlugin should exist.'
      $.hlf.noConflict()
      assert.strictEqual $.createPlugin, undefined,
        'Method shortcut for createPlugin should be back to original value.'
      assert.notStrictEqual $.hlf.createPlugin, undefined, 
        'Original method for createPlugin should still exist.'

    QUnit.module 'mixins',
      setup: ->
        @.mixins = {}
        @.mixin =
          someMethod: -> 'foo'
          someProperty: 'bar'
        @.mixinName = 'foo'
        @.instance = {}
    QUnit.test 'createMixin', (assert) ->
      result = hlf.createMixin @mixins, @mixinName, @mixin
      assert.strictEqual result, @mixin,
        'Mixin should have been added to mixin collection.'
      assert.strictEqual @mixins[@mixinName], @mixin,
        'Mixin should be accessible.'
      console.log @mixins[@mixinName].someMethod
      assert.strictEqual @mixins[@mixinName].someMethod.mixin, @mixinName,
        'Mixin method should have mixin name attached.'
      result = hlf.createMixin @mixins, @mixinName, @mixin
      assert.strictEqual result, no,
        'Mixin should not have been re-added to mixin collection.'
    QUnit.start()
