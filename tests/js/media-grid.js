//
// HLF Media Grid Visual Tests
// ===========================
// [Page](../../../tests/media-grid.visual.html) | [Source](../../src/js/media-grid.html)
//
(function() {
  'use strict';

  require.config({
    baseUrl: '../lib',
    paths: {
      hlf: '../src/js',
      test: '../tests/js',
    }
  });

  define(['hlf/core', 'test/base', 'hlf/media-grid'], function(hlf, base, mediaGrid) {
    if (window.QUnit) {
      const { module, test } = QUnit;
      /*
      module('hlf.mediaGrid', {
        beforeEach() {
          return this.mg = $("<div>\n  <div>\n    <div class=\"js-mg-item\"></div>\n    <div class=\"js-mg-item\"></div>\n    <div class=\"js-mg-item\"></div>\n  </div>\n</div>").appendTo('body').children('div').mediaGrid().mediaGrid();
        },
        afterEach() {
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
      */
    }

    // ---

    let tests = [];
    const { createVisualTest, placeholderText } = base;
    tests.push(createVisualTest({
      label: 'by default',
      template(vars) {
        const { placeholderText } = vars;
        let html = '<div class="test-body mg-item-extras">';
        let i = 12;
        do {
          html += (
`<article class="js-mg-item">
  <section class="mg-preview">
    <img src="http://placehold.it/200x134/888/aaa" alt="preview thumbnail" />
    <hgroup>
      <h1 class="mg-title">${placeholderText.title}</h1>
      <h2 class="mg-date">July 14, 2012</h2>
    </hgroup>
    <ul class="mg-tags">
      <li>foo</li>
      <li>bar</li>
      <li>baz</li>
    </ul>
  </section>
  <section class="mg-detail">
    <img src="http://placehold.it/418x270/888/aaa" alt="main banner" />
    <hgroup>
      <h1 class="mg-title">${placeholderText.title}</h1>
      <h2 class="mg-date">July 14, 2012</h2>
    </hgroup>
    <p>${placeholderText.short}</p>
    <ul class="mg-tags">
      <li>foo</li>
      <li>bar</li>
      <li>baz</li>
    </ul>
  </section>
</article>`
          );
        } while ((i -= 1));
        html += '</div>';
        return html;
      },
      test(testElement) {
        let instance = mediaGrid(
          testElement.querySelector('.test-body')
        )();
        setTimeout(() => {
          instance.load();
        }, 500);
      },
      anchorName: 'default',
      className: 'default-call',
      vars: { placeholderText },
    }));
    function run() {
      tests.forEach(test => test());
      tests = [];
    }
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', run);
    } else {
      run();
    }
  });

}());
