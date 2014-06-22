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
        (function($el) {
          return $el.find('[title]').tip({
            $triggerContext: $el
          });
        })($('.default-call'));
        (function($el) {
          return $el.find('[title]').snapTip({
            $triggerContext: $el,
            snap: {
              toYAxis: true
            }
          });
        })($('.list-call'));
        (function($el) {
          return $el.find('[title]').snapTip({
            $triggerContext: $el,
            snap: {
              toXAxis: true
            }
          });
        })($('.bar-call'));
        return $('.edge-call > .visual-test-fragment[title]').snapTip();
      });
    }
  });

}).call(this);
