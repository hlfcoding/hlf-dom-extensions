(function() {
  define(['jquery', 'underscore', 'hlf/jquery.hlf.tip'], function($, _) {
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
  });

}).call(this);
