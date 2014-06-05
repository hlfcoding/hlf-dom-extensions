define [
  'jquery'
  'underscore'
  'hlf/jquery.hlf.editable'
], ($, _) ->
  $('[data-hlf-editable]')
    .editable()
    .on 'commit.hlf.editable', (e) ->
      # Update data source here.
      $(@).editable 'update', { text: e.userInfo.text }
