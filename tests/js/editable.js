(function() {
  require.config({
    baseUrl: '../lib',
    paths: {
      hlf: '../dist',
      test: '../tests/js'
    }
  });

  require(['jquery', 'underscore', 'hlf/jquery.hlf.editable'], function($, _) {
    var shouldRunVisualTests;
    shouldRunVisualTests = $('#qunit').length === 0;
    if (shouldRunVisualTests) {
      return $(function() {
        return $('[data-hlf-editable]').editable().on('commit.hlf.editable', function(e) {
          return $(this).editable('update', {
            text: e.userInfo.text
          });
        });
      });
    }
  });

}).call(this);
