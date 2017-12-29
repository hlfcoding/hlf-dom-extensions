//
// HLF Accordion Visual Tests
// ==========================
// [Page](../../../tests/accordion.visual.html) | [Source](../../src/js/accordion.html)
//
(function() {
  'use strict';
  if (window.guard && !guard.isNavigatorSupported) { return; }

  require.config({ baseUrl: '../', paths: { hlf: 'dist', test: 'tests/js' } });
  define(['test/base', 'hlf/accordion'], function(base, Accordion) {
    let tests = [];
    const { createVisualTest, placeholderText, runVisualTests } = base;
    tests.push(createVisualTest({
      label: 'by default',
      template({ placeholderText, sectionCount }) {
        let sectionsHtml = '';
        [...Array(sectionCount)].forEach((_, i) => {
          sectionsHtml += (
`<ul class="list">
  <li class="no-a accordion-trigger">Section ${i}, Item Foo</li>
  <li class="no-a">Section ${i}, Item Bar</li>
  <li class="no-a">Section ${i}, Item Baz</li>
</ul>`
          );
        });
        return (
`<div class="sections">
  ${sectionsHtml}
</div>`
        );
      },
      test(testElement) {
        Accordion.extend(testElement.querySelector('.sections'));
      },
      anchorName: 'default',
      className: 'default-call',
      vars: { placeholderText, sectionCount: 3 },
    }));
    runVisualTests(tests);
  });
}());
