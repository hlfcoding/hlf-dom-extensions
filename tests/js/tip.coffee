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
    do ($el = $ '.default-call') ->
      $el.find('[title]').tip { $triggerContext: $el }
    do ($el = $ '.list-call') ->
      $el.find('[title]').snapTip 
        $triggerContext: $el 
        snap: { toYAxis: true }
    do ($el = $ '.bar-call') ->
      $el.find('[title]').snapTip 
        $triggerContext: $el 
        snap: { toXAxis: true }
    $('.edge-call > .visual-test-fragment[title]').snapTip()

