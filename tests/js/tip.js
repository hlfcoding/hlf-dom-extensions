(function() {
  'use strict';
  if (window.guard && !guard.isNavigatorSupported) { return; }

  require.config({
    baseUrl: '../',
    paths: {
      hlf: 'src/js',
      test: 'tests/js',
    },
  });

  define(['hlf/core', 'test/base', 'hlf/tip'], function(hlf, base, tip) {
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
        tip(triggerElements, testElement);
        let instance = tip(testElement);
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
      beforeTest(testElement, vars) {
        createVisualTest.setupAppendButton({
          testElement,
          listSelector: '.list',
          onAppend(newElement) {
            vars.itemCount += 1;
            let triggerElement = newElement.querySelector('[title]');
            triggerElement.title = triggerElement.title.replace(/\d/, vars.itemCount + 1);
          },
        });
      },
      test(testElement) {
        let triggerElements = testElement.querySelectorAll('[title]');
        tip(triggerElements, {
          maxLeaveDistanceToStay: 0,
          snapToYAxis: true,
        }, testElement);
        let instance = tip(testElement);
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
        tip(triggerElements, {
          maxLeaveDistanceToStay: 0,
          snapToXAxis: true,
        }, testElement);
        let instance = tip(testElement);
      },
      anchorName: 'snapping-horizontally',
      className: 'bar-call',
      vars: { itemCount: 3, placeholderText },
    }));

    runVisualTests(tests);
  });

}());
