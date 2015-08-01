
/*
HLF Tip Visual Tests
====================
 */

(function() {
  var animatorDeps, animatorName, ref;

  require.config({
    baseUrl: '../lib',
    paths: {
      hlf: '../dist',
      test: '../tests/js'
    },
    shim: {
      TweenLite: {
        exports: 'TweenLite'
      },
      'jquery.gsap': {
        deps: ['jquery', 'CSSPlugin', 'TweenLite']
      }
    }
  });

  animatorName = (ref = location.search.match(/\banimator=(\w+)\b/)) != null ? ref[1] : void 0;

  if (animatorName == null) {
    animatorName = 'jquery';
  }

  animatorDeps = (function() {
    switch (animatorName) {
      case 'gsap':
        return ['jquery.gsap'];
      case 'jquery':
        return [];
      case 'velocity':
        return ['promise', 'velocity'];
    }
  })();

  require(['jquery', 'underscore'].concat(animatorDeps, ['test/base-visual', 'hlf/jquery.hlf.tip']), function($, _) {
    var shouldRunVisualTests, tests;
    shouldRunVisualTests = $('#qunit').length === 0;
    if (!shouldRunVisualTests) {
      return false;
    }
    tests = [];
    $('.animator :radio').prop('checked', false).filter("[value=" + animatorName + "]").prop('checked', true).end().click(function() {
      return location.search = "?animator=" + ($(this).val());
    });
    if (animatorName === 'velocity') {
      animator = {
      show: function($el, options) {
        $.Velocity('fadeIn', options).then(options.done, options.fail);
      },
      hide: function($el, options) {
        $.Velocity('fadeOut', options).then(options.done, options.fail);
      }
    };;
    }
    tests.push($.visualTest({
      label: "by default",
      template: "<p>\n  <a class=\"trigger\" title=\"link details\" href=\"javascript:\">tooltip trigger</a> &middot;\n  <a class=\"trigger\" title=\"<%= loremIpsum.short %>\" href=\"javascript:\">tooltip trigger</a> &middot;\n  <a class=\"trigger\" title=\"<%= loremIpsum.long %>\" href=\"javascript:\">tooltip trigger</a>\n</p>",
      test: function($context) {
        $context.find('[title]').tip(null, $context);;
        return api = $context.tip(null, $context);;
      },
      anchorName: 'default',
      className: 'default-call',
      vars: _.pick($, 'loremIpsum')
    }));
    tests.push($.visualTest({
      label: 'snapping with a list',
      template: "<ul class=\"list\">\n<% _.range(1, count +1).forEach(function(i) { %>\n  <li>\n    <a class=\"trigger\" title=\"This is list item <%= i %> in detail.\" href=\"javascript:\">\n      tooltip trigger\n    </a>\n  </li>\n<% }); %>\n</ul>",
      footerHtml: "<button name=\"list-append\">load more</button>",
      test: function($context) {
        return $context.find('[title]').snapTip({ snap: { toYAxis: true } }, $context);;
      },
      anchorName: 'snapping-vertically',
      className: 'list-call',
      vars: {
        count: 3
      },
      beforeTest: function($context) {
        return $.visualTest.setupAppendButton($context, '.list', function($newItem) {
          var $trigger, title;
          $trigger = $newItem.find('[title]');
          title = $trigger.attr('title').replace(/\d/, $newItem.index() + 1);
          return $trigger.attr('title', title);
        });
      }
    }));
    tests.push($.visualTest({
      label: 'snapping with a bar',
      template: "<nav class=\"bar\">\n<% _.range(1, count +1).forEach(function(i) { %>\n  <a class=\"trigger\" href=\"#\" title=\"This is bar item <%= i %> in detail.\">\n    tooltip trigger\n  </a>\n<% }); %>\n</nav>",
      test: function($context) {
        return $context.find('[title]').snapTip({ snap: { toXAxis: true } }, $context);;
      },
      anchorName: 'snapping-horizontally',
      className: 'bar-call',
      vars: {
        count: 3
      }
    }));
    tests.push($.visualTest({
      label: 'snapping with a grid',
      template: "<ul class=\"grid\">\n<% _.range(1, count +1).forEach(function(i) { %>\n  <li>\n    <img src=\"resources/avatar.png\" alt=\"This is avatar <%= i %> in detail.\">\n  </li>\n<% }); %>\n</ul>",
      test: function($context) {
        return $context.find('[alt]').snapTip({
        snap: { toXAxis: true },
        animations: { hide: { delay: 400 } }
      }, $context);;
      },
      anchorName: 'a-model-use-case',
      className: 'grid-call',
      vars: {
        count: 24
      }
    }));
    tests.push($.visualTest({
      template: "<a class=\"trigger top right\" title=\"<%= loremIpsum.short %>\" href=\"javascript:\">\n  top right corner\n</a>\n<a class=\"affixed trigger bottom left\" title=\"<%= loremIpsum.short %>\" href=\"javascript:\">\n  bottom left corner\n</a>\n<a class=\"affixed trigger bottom right\" title=\"<%= loremIpsum.short %>\" href=\"javascript:\">\n  bottom right corner\n</a>",
      test: function($fragments) {
        return $fragments.snapTip();;
      },
      anchorName: 'corner-cases',
      asFragments: true,
      className: 'edge-call',
      vars: _.pick($, 'loremIpsum')
    }));
    tests.push($.visualTest({
      label: 'loading rich content',
      template: "<p>\n  <a class=\"trigger\" href=\"javascript:\">tooltip trigger</a> &middot;\n  <a class=\"trigger\" data-hlf-tip-href=\"local-content\" href=\"javascript:\">tooltip trigger</a>\n  <span data-hlf-tip-content=\"local-content\">This is some <em>local</em> <strong>html</strong>.</span>\n</p>",
      test: function($context) {
        return $context.find('.trigger').tip({
        triggerContent: function() { return $.loremIpsum.short; }
      }, $context);;
      },
      anchorName: 'rich-content',
      className: 'html-call',
      vars: _.pick($, 'loremIpsum')
    }));
    return $(function() {
      var i, len, results, test;
      results = [];
      for (i = 0, len = tests.length; i < len; i++) {
        test = tests[i];
        results.push(test());
      }
      return results;
    });
  });

}).call(this);

//# sourceMappingURL=tip.js.map
