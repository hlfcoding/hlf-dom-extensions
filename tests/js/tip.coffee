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
    do ($context = $ '.default-call') ->
      $context.find('[title]').tip null, $context
    do ($context = $ '.list-call') ->
      $context.find('[title]').snapTip { snap: { toYAxis: true } }, $context
    do ($context = $ '.bar-call') ->
      $context.find('[title]').snapTip { snap: { toXAxis: true } }, $context
    do ($context = $ '.grid-call') ->
      $context.find('[alt]').snapTip { snap: { toXAxis: true } }, $context
    $('.edge-call > .visual-test-fragment[title]').snapTip()

