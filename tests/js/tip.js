(function() {
  'use strict';
  if (window.guard && !guard.isNavigatorSupported) { return; }

  require.config({ baseUrl: '../', paths: { hlf: 'dist', test: 'tests/js' } });
  define(['test/base', 'hlf/tip'], function(base, Tip) {
    let tests = [];
    const { createVisualTest, placeholderText, runVisualTests } = base;

    tests.push(createVisualTest({
      label: 'by default',
      template({ placeholderText }) {
        return (
`<p>
  <a class="trigger" title="link details" href="javascript:">tooltip trigger</a> &middot;
  <a class="trigger" title="${placeholderText.short}" href="javascript:">tooltip trigger</a> &middot;
  <a class="trigger" title="${placeholderText.long}" href="javascript:">tooltip trigger</a>
</p>`
        );
      },
      test(testElement) {
        let triggerElements = testElement.querySelectorAll('[title]');
        let tip = Tip.extend(triggerElements, { contextElement: testElement });
      },
      anchorName: 'default',
      className: 'default-call',
      vars: { placeholderText },
    }));

    tests.push(createVisualTest({
      label: 'snapping with a list',
      template({ itemCount, placeholderText }) {
        let itemsHtml = '';
        [...Array(itemCount)].forEach((_, i) => {
          itemsHtml += (
`<li>
  <a class="trigger" title="This is list item ${i + 1} in detail." href="javascript:">tooltip trigger</a>
</li>`
          );
        });
        return (
`<ul class="list">
  ${itemsHtml}
</ul>`
        );
      },
      footerHtml: `<button name="list-append">load more</button>`,
      beforeTest(testElement) {
        const { vars } = this;
        createVisualTest.setupAppendButton({
          testElement,
          listSelector: '.list',
          onAppend(newElement) {
            vars.itemCount += 1;
            let triggerElement = newElement.querySelector('[title]');
            triggerElement.title = triggerElement.title.replace(/\d/, vars.itemCount);
          },
        });
      },
      test(testElement) {
        let triggerElements = (contextElement) => (contextElement.querySelectorAll('[title]'));
        let tip = Tip.extend(triggerElements, { contextElement: testElement, snapTo: 'y' });
      },
      anchorName: 'snapping-vertically',
      className: 'list-call',
      vars: { itemCount: 3, placeholderText },
    }));

    tests.push(createVisualTest({
      label: 'snapping with a bar',
      template({ itemCount, placeholderText }) {
        let itemsHtml = '';
        [...Array(itemCount)].forEach((_, i) => {
          itemsHtml += (
`<a class="trigger" title="This is bar item ${i + 1} in detail." href="javascript:">tooltip trigger</a>`
          );
        });
        return (
`<nav class="bar">
  ${itemsHtml}
</nav>`
        );
      },
      test(testElement) {
        let triggerElements = testElement.querySelectorAll('[title]');
        let tip = Tip.extend(triggerElements, { contextElement: testElement, snapTo: 'x' });
      },
      anchorName: 'snapping-horizontally',
      className: 'bar-call',
      vars: { itemCount: 3, placeholderText },
    }));

    tests.push(createVisualTest({
      label: 'snapping with a grid',
      template({ itemCount }) {
        let itemsHtml = '';
        [...Array(itemCount)].forEach((_, i) => {
          itemsHtml += (
`<li>
  <img src="resources/avatar.png" alt="This is avatar ${i + 1} in detail.">
</li>`
          );
        });
        return (
`<ul class="grid">
  ${itemsHtml}
</ul>`
        );
      },
      test(testElement) {
        let triggerElements = testElement.querySelectorAll('[alt]');
        let tip = Tip.extend(triggerElements, { contextElement: testElement, snapTo: 'x' });
      },
      anchorName: 'a-model-use-case',
      className: 'grid-call',
      vars: { itemCount: 24 },
    }));

    tests.push(createVisualTest({
      label: 'snapping to corners',
      template({ placeholderText }) {
        return (
`<div class="box" style="height:6em">
  <a class="trigger edge top right" title="${placeholderText.short}" href="javascript:">
    top right corner
  </a>
  <a class="trigger edge bottom left" title="${placeholderText.short}" href="javascript:">
    bottom left corner
  </a>
  <a class="trigger edge bottom right" title="${placeholderText.short}" href="javascript:">
    bottom right corner
  </a>
</div>`
        );
      },
      test(testElement) {
        let triggerElements = testElement.querySelectorAll('[title]');
        let tip = Tip.extend(triggerElements, { contextElement: testElement, snapTo: 'trigger' });
      },
      anchorName: 'corner-cases',
      className: 'corners-call',
      vars: { placeholderText },
    }));

    runVisualTests(tests);
  });

}());
