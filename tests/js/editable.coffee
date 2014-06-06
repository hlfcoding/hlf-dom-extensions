require.config
  baseUrl: '../lib'
  paths:
    hlf: '../dist'
    test: '../tests/js'

require [
  'jquery'
  'underscore'
  'hlf/jquery.hlf.editable'
], ($, _) ->
  shouldRunVisualTests = $('#qunit').length is 0

  if shouldRunVisualTests then $ ->
    $('[data-hlf-editable]')
      .editable()
      .on 'commit.hlf.editable', (e) ->
        # Update data source here.
        $(@).editable 'update', { text: e.userInfo.text }
