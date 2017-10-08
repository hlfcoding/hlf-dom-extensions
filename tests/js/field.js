/*
HLF Editable Visual Tests
=========================

(function() {
  require.config({
    baseUrl: '../lib',
    paths: {
      hlf: '../dist',
      test: '../tests/js'
    }
  });

  require(['jquery', 'underscore', 'test/base-visual', 'hlf/jquery.hlf.editable'], function($, _) {
    'use strict';
    var tests;
    if (window.QUnit != null) {
      return false;
    }
    tests = [];
    tests.push($.visualTest({
      label: 'inline type',
      template: "<div class=\"box\">\n  <fieldset data-hlf-editable='{\n      \"types\": \"inline\"\n    }'>\n    <legend>Humanized Field Name</legend>\n    <div class=\"js-text\">Default value</div>\n    <!-- If must be inline-block, set data-hlf-editable-display likewise. -->\n    <div class=\"js-input\" style=\"display: none\">\n      <input name=\"fieldName\" type=\"text\" />\n    </div>\n  </fieldset>\n</div>",
      test: function($context) {
        $context.find('[data-hlf-editable]').editable()
        .on('commit.hlf.editable', function(e) {
          // Update data source here.
          $(this).editable('update', { text: e.userInfo.text });
        });;
      },
      anchorName: 'default',
      className: 'default-call'
    }));
    $(function() {
      var i, len, test;
      for (i = 0, len = tests.length; i < len; i++) {
        test = tests[i];
        test();
      }
    });
    return true;
  });

}).call(this);
*/
