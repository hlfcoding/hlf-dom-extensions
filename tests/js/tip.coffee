require.config
  baseUrl: '../lib'
  paths:
    hlf: '../dist'
    test: '../tests/js'

require [
  'jquery'
  'underscore'
  'hlf/jquery.hlf.tip'
], ($, _) ->
  shouldRunVisualTests = $('#qunit').length is 0

  if shouldRunVisualTests then $ ->
    $('.default-call [title]').tip()
    $('.list-call [title]').snapTip { snap: { toYAxis: true } }
    $('.box-call [title]').snapTip { snap: { toXAxis: true } }
    $('.border-test[title]').snapTip()

