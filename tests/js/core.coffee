require.config
  baseUrl: '../lib'
  paths:
    hlf: '../dist'
    test: '../tests/js'

require [
  'jquery'
  'underscore'
  'hlf/jquery.extension.hlf.core'
], ($, _) ->
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

    QUnit.start()
