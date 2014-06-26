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
        (function($context) {
          return $context.find('[title]').tip(null, $context);
        })($('.default-call'));
        (function($context) {
          return $context.find('[title]').snapTip({
            snap: {
              toYAxis: true
            }
          }, $context);
        })($('.list-call'));
        (function($context) {
          return $context.find('[title]').snapTip({
            snap: {
              toXAxis: true
            }
          }, $context);
        })($('.bar-call'));
        return $('.edge-call > .visual-test-fragment[title]').snapTip();
      });
    }
  });

}).call(this);
