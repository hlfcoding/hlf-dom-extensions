define [
  'jquery'
  'underscore'
  'hlf/jquery.hlf.tip'
], ($, _) ->
  $ ->
    $('.default-call [title]').tip()
    $('.list-call [title]').snapTip { snap: { toYAxis: true } }
    $('.box-call [title]').snapTip { snap: { toXAxis: true } }
    $('.border-test[title]').snapTip()

