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
  <a class="trigger" title="${placeholderText.short} %>" href="javascript:">tooltip trigger</a> &middot;
  <a class="trigger" title="${placeholderText.long} %>" href="javascript:">tooltip trigger</a>
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
    runVisualTests(tests);
  });

}());
