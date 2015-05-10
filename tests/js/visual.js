(function() {
  define(['jquery', 'underscore'], function($, _) {
    var loremIpsum;
    $.visualTest = function(config) {
      return function() {
        var $context, vars;
        if (config.vars == null) {
          config.vars = {};
        }
        vars = _.pick(config, 'label', 'className', 'footerHtml');
        if (vars.footerHtml == null) {
          vars.footerHtml = '';
        }
        vars.html = _.template(config.template, config.vars);
        $context = $('#main').renderVisualTest(vars);
        if (config.beforeTest != null) {
          config.beforeTest($context);
        }
        return config.test($context);
      };
    };
    _.extend($.visualTest, {
      setupAppendButton: function($context, listSelector, updateItem) {
        var $item, $list;
        $list = $context.find(listSelector);
        $item = $list.children(':last-child').clone();
        return $context.find('[name=list-append]').click(function() {
          var $newItem;
          $newItem = $item.clone();
          $list.append($newItem);
          if (updateItem != null) {
            return updateItem($newItem);
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
      template: _.template("<section class=\"<%- className %> visual-test\">\n  <header><%- label %></header>\n  <%= html %>\n  <footer><%= footerHtml %></footer>\n</section>")
    };
    loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    $.loremIpsum = {
      long: loremIpsum,
      short: loremIpsum.slice(0, 200)
    };
    return true;
  });

}).call(this);
