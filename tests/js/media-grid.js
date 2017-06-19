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
      module('hlf.mediaGrid', {
        beforeEach() {
          let element = document.createElement('div');
          element.innerHTML = '<div>' +
            '<div class="js-mg-item"></div>' +
            '<div class="js-mg-item"></div>' +
            '<div class="js-mg-item"></div>' +
            '</div>';
          document.getElementById('qunit-fixture').appendChild(element);
          this.instance = mediaGrid(element)();
        },
      });
      test('#_updateMetrics', function(assert) {
        const { instance } = this;
        let { style } = instance.element;
        style.boxSizing = 'border-box';
        style.padding = '10px';
        Array.from(instance.itemElements).forEach((itemElement) => {
          let { style } = itemElement;
          style.borderWidth = '1px';
          style.boxSizing = 'border-box';
          style.marginRight = '10px';
          style.padding = '9px';
          style.width = style.height = '200px';
        });
        style = instance.element.parentElement.style;
        style.width = '610px';
        let metrics;
        instance._updateMetrics(true);
        metrics = instance.metrics;
        assert.strictEqual(metrics.gutter, 10, 'It bases gutter on item margin sizes.');
        assert.strictEqual(metrics.itemWidth, 200, "It uses the item's 'outerWidth' as width.");
        assert.strictEqual(metrics.rowSize, 2, 'It bases row size on item and wrap sizes.');
        assert.strictEqual(metrics.colSize, 2, 'It bases column size on row size.');
        style.width = '620px';
        instance._updateMetrics(true);
        metrics = instance.metrics;
        assert.strictEqual(metrics.rowSize, 3, 'It bases row size on item and wrap sizes.');
        assert.strictEqual(instance.selectAllByClass('sample').length, 1,
          'It cleans up after multiple hard updates.');
      });
      QUnit.start();
      return true;
    }

    // ---

    let tests = [];
    const { createVisualTest, placeholderText } = base;
    tests.push(createVisualTest({
      label: 'by default',
      template(vars) {
        const { placeholderText } = vars;
        let html = '<div class="test-body mg-theme-folio">';
        let i = 12;
        do {
          html += (
`<article class="js-mg-item">
  <section class="mg-preview">
    <img src="http://placehold.it/200x134/888/aaa" alt="preview thumbnail" />
    <div class="mg-headings">
      <h1 class="mg-title">${placeholderText.title}</h1>
      <h2 class="mg-date">July 14, 2012</h2>
    </div>
    <ul class="mg-tags">
      <li>foo</li>
      <li>bar</li>
      <li>baz</li>
    </ul>
  </section>
  <section class="mg-detail">
    <img src="http://placehold.it/418x280/888/aaa" alt="main banner" />
    <div class="mg-headings">
      <h1 class="mg-title">${placeholderText.title}</h1>
      <h2 class="mg-date">July 14, 2012</h2>
    </div>
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
        let extension = mediaGrid(testElement.querySelector('.test-body'));
        setTimeout((() => extension('load')), 500);
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
