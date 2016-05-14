
/*
HLF Media Grid Visual Tests
===========================
 */

(function() {
  require.config({
    baseUrl: '../lib',
    paths: {
      hlf: '../dist',
      test: '../tests/js'
    }
  });

  require(['jquery', 'underscore', 'test/base', 'test/base-visual', 'hlf/jquery.hlf.media-grid'], function($, _) {
    'use strict';
    var module, test, tests;
    if (window.QUnit != null) {
      module = QUnit.module, test = QUnit.test;
      module('hlf.mediaGrid', {
        beforeEach: function() {
          return this.mg = $("<div>\n  <div>\n    <div class=\"js-mg-item\"></div>\n    <div class=\"js-mg-item\"></div>\n    <div class=\"js-mg-item\"></div>\n  </div>\n</div>").appendTo('body').children('div').mediaGrid().mediaGrid();
        },
        afterEach: function() {
          return this.mg.$el.parent().remove();
        }
      });
      test('#_updateMetrics', function(assert) {
        var $el, $items, ref;
        ref = this.mg, $el = ref.$el, $items = ref.$items;
        $el.add($items).css({
          boxSizing: 'border-box'
        });
        $el.css({
          padding: 10
        });
        $el.parent().css({
          width: 610
        });
        $items.css({
          marginRight: 10,
          padding: 9,
          borderWidth: 1,
          width: 200,
          height: 200
        });
        this.mg._updateMetrics(true);
        assert.strictEqual(this.mg.metrics.gutter, 10, 'It calculates gutter based on item margin sizes.');
        assert.strictEqual(this.mg.metrics.itemWidth, 200, "It uses the item's 'outerWidth' as item width.");
        assert.strictEqual(this.mg.metrics.rowSize, 2, 'It calculates row size based on item and wrap sizes.');
        assert.strictEqual(this.mg.metrics.colSize, 2, 'It calculates column size based on row size.');
        $el.parent().css({
          width: 620
        });
        this.mg._updateMetrics(true);
        assert.strictEqual(this.mg.metrics.rowSize, 3, 'It calculates row size based on item and wrap sizes.');
        assert.strictEqual(this.mg.selectByClass('sample').length, 1, 'It cleans up after multiple hard updates.');
      });
      QUnit.start();
      return true;
    }
    tests = [];
    tests.push($.visualTest({
      label: 'by default',
      template: "<div class=\"test-body\">\n<% _.range(12).forEach(function() { %>\n  <article class=\"js-mg-item\">\n    <section class=\"mg-preview\">\n      <img src=\"http://placehold.it/200x134/888/aaa\" alt=\"preview thumbnail\" />\n      <hgroup>\n        <h1 class=\"mg-title\"><%= loremIpsum.title %></h1>\n        <h2 class=\"mg-date\">July 14, 2012</h2>\n      </hgroup>\n      <ul class=\"mg-tags\">\n        <li>foo</li>\n        <li>bar</li>\n        <li>baz</li>\n      </ul>\n    </section>\n    <section class=\"mg-detail\">\n      <img src=\"http://placehold.it/418x270/888/aaa\" alt=\"main banner\" />\n      <hgroup>\n        <h1 class=\"mg-title\"><%= loremIpsum.title %></h1>\n        <h2 class=\"mg-date\">July 14, 2012</h2>\n      </hgroup>\n      <p><%= loremIpsum.short %></p>\n      <ul class=\"mg-tags\">\n        <li>foo</li>\n        <li>bar</li>\n        <li>baz</li>\n      </ul>\n    </section>\n  </article>\n<% }) %>\n</div>",
      test: function($context) {
        var mg = $context.find('.test-body').mediaGrid().mediaGrid();
      _.delay(function() { mg.trigger('ready'); }, 500);;
      },
      anchorName: 'default',
      className: 'default-call',
      vars: _.pick($, 'loremIpsum')
    }));
    $(function() {
      var i, len;
      for (i = 0, len = tests.length; i < len; i++) {
        test = tests[i];
        test();
      }
    });
    return true;
  });

}).call(this);

//# sourceMappingURL=media-grid.js.map
