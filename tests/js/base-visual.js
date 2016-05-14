
/*
Visual Test Helpers
===================
This is a developer-level API for writing UI tests. Plugin users need not read
further.
 */

(function() {
  define(['jquery', 'underscore'], function($, _) {
    'use strict';
    var loremIpsum;
    $.visualTest = function(config) {
      return function() {
        var $container, $test, opts, vars;
        if (config.vars == null) {
          config.vars = {};
        }
        vars = _.pick(config, 'label', 'className', 'footerHtml');
        if (!config.asFragments) {
          if (vars.footerHtml == null) {
            vars.footerHtml = '';
          }
        }
        vars.docsUrl = $('body > header [data-rel=docs]').attr('href') + ("#" + config.anchorName);
        vars.html = _.template(config.template, config.vars);
        $container = config.asFragments ? $('body') : $('#main');
        if (config.asFragments) {
          opts = {
            template: '<%= html %>'
          };
        }
        $test = $container.renderVisualTest(vars, opts);
        if (config.asFragments) {
          if (config.className != null) {
            $container.addClass(config.className);
          }
          $test = $test.addClass('visual-test-fragment').filter('.visual-test-fragment');
        }
        if (config.beforeTest != null) {
          config.beforeTest($test);
        }
        config.test($test);
      };
    };
    _.extend($.visualTest, {
      setupAppendButton: function($context, listSelector, updateItem) {
        var $item, $list;
        $list = $context.find(listSelector);
        $item = $list.children(':last-child').clone();
        $context.find('[name=list-append]').click(function() {
          var $newItem;
          $newItem = $item.clone();
          $list.append($newItem);
          if (updateItem != null) {
            updateItem($newItem);
          }
        });
      }
    });
    $.fn.renderVisualTest = function(vars, opts) {
      var $test;
      if (opts == null) {
        opts = {};
      }
      _.defaults(opts, $.fn.renderVisualTest.defaults);
      if (_.isString(opts.template)) {
        opts.template = _.template(opts.template);
      }
      $test = $(opts.template(vars));
      this.append($test);
      return $test;
    };
    $.fn.renderVisualTest.defaults = {
      template: _.template("<section class=\"<%- className %> visual-test\">\n  <header>\n    <span class=\"label\"><%- label %></span>\n    <a data-rel=\"docs\" href=\"<%= docsUrl %>\">docs</a>\n  </header>\n  <%= html %>\n  <footer><%= footerHtml %></footer>\n</section>")
    };
    loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    $.loremIpsum = {
      long: loremIpsum,
      short: loremIpsum.slice(0, 200),
      title: loremIpsum.slice(0, 26)
    };
    return true;
  });

}).call(this);

//# sourceMappingURL=base-visual.js.map
