###
HLF Core Unit Tests
===================
Offloads testing larger corer components to other test modules.
###

# [Page](../../../tests/core.unit.html)

require.config
  baseUrl: '../lib'
  paths:
    hlf: '../dist'
    test: '../tests/js'

require [
  'jquery'
  'underscore'
  'hlf/jquery.extension.hlf.core'
  'test/base'
  'test/core.mixin'
  'test/core.plugin'
], ($, _, hlf) ->
  'use strict'

  shouldRunVisualTests = $('#qunit').length is 0

  if shouldRunVisualTests then $ ->
  else

    QUnit.module 'other'

    QUnit.test 'exports', (assert) ->
      assert.ok hlf,
        'Namespace should exist.'
      return

    QUnit.test 'noConflict', (assert) ->
      assert.ok $.createPlugin,
        'Method shortcut for createPlugin exists by default, w/o noConflict.'
      hlf.noConflict()
      assert.strictEqual $.createPlugin, undefined,
        'After call, method shortcut for createPlugin is back to old value.'
      assert.ok hlf.createPlugin,
        'After call, original method for createPlugin still exists.'
      return

    QUnit.start()

  yes
