(function() {
  require.config({
    baseUrl: '../lib',
    paths: {
      hlf: '../dist',
      test: '../tests/js'
    }
  });

  require(['jquery', 'underscore', 'hlf/jquery.hlf.tip'], function($, _) {
    var shouldRunVisualTests;
    shouldRunVisualTests = $('#qunit').length === 0;
    if (shouldRunVisualTests) {
      return $(function() {
        $('.default-call [title]').tip();
        $('.list-call [title]').snapTip({
          snap: {
            toYAxis: true
          }
        });
        $('.box-call [title]').snapTip({
          snap: {
            toXAxis: true
          }
        });
        return $('.border-test[title]').snapTip();
      });
    }
  });

}).call(this);
