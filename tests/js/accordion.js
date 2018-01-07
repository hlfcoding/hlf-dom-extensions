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
    //
    // Default
    // -------
    // Basic test with the default settings.
    //
    tests.push(createVisualTest({
      label: 'by default',
      template({ sectionCount }) {
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
      footerHtml: (
`<label for="cursor-enabled">
  <input type="checkbox" id="cursor-enabled" value="[0,1]">
  cursor enabled at first section, second item
</label>`
      ),
      beforeTest(testElement) {
        const inputElement = document.getElementById('cursor-enabled');
        inputElement.addEventListener('change', (_) => {
          let itemElement = testElement.querySelector('.sections > ul:first-child > li:nth-child(2)');
          itemElement.classList.toggle('active', inputElement.checked);
          this.accordion.remove();
          this.accordion = Accordion.extend(testElement.querySelector('.sections'));
        });
      },
      test(testElement) {
        this.accordion = Accordion.extend(testElement.querySelector('.sections'));
      },
      anchorName: 'default',
      className: 'default-call',
      vars: { sectionCount: 3 },
    }));
    runVisualTests(tests);
  });
}());
