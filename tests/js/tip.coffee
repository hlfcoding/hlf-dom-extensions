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
      $list = $context.find 'ul'
      $item = $list.children(':last-child').clone()
      # Run plugin after capturing original DOM.
      $context.find('[title]').snapTip { snap: { toYAxis: true } }, $context
      $context.find('.list-append').click ->
        # Use original DOM to append new items.
        $new = $item.clone()
        $list.append $new
        # Make titles dynamic.
        $trigger = $new.find '[title]'
        title = $trigger.attr('title').replace /\d/, $new.index() + 1
        $trigger.attr 'title', title

    do ($context = $ '.bar-call') ->
      $context.find('[title]').snapTip { snap: { toXAxis: true } }, $context

    do ($context = $ '.grid-call') ->
      $context.find('[alt]').snapTip { snap: { toXAxis: true } }, $context

    $('.edge-call > .visual-test-fragment[title]').snapTip()

