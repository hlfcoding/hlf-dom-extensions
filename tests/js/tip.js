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
          var $item, $list;
          $list = $context.find('ul');
          $item = $list.children(':last-child').clone();
          $context.find('[title]').snapTip({
            snap: {
              toYAxis: true
            }
          }, $context);
          return $context.find('.list-append').click(function() {
            var $new, $trigger, title;
            $new = $item.clone();
            $list.append($new);
            $trigger = $new.find('[title]');
            title = $trigger.attr('title').replace(/\d/, $new.index() + 1);
            return $trigger.attr('title', title);
          });
        })($('.list-call'));
        (function($context) {
          return $context.find('[title]').snapTip({
            snap: {
              toXAxis: true
            }
          }, $context);
        })($('.bar-call'));
        (function($context) {
          return $context.find('[alt]').snapTip({
            snap: {
              toXAxis: true
            }
          }, $context);
        })($('.grid-call'));
        return $('.edge-call > .visual-test-fragment[title]').snapTip();
      });
    }
  });

}).call(this);
