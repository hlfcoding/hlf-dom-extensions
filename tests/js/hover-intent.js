//
// HLF Hover Intent Visual Tests
// =============================
// [Page](../../../tests/hover-intent.visual.html) | [Source](../../src/js/hover-intent.html)
//
(function() {
  'use strict';
  if (window.guard && !guard.isNavigatorSupported) { return; }

  require.config({
    baseUrl: '../',
    paths: {
      hlf: 'src/js',
      test: 'tests/js',
    }
  });

  define(['hlf/core', 'test/base', 'hlf/hover-intent'], function(hlf, base, hoverIntent) {

    // ---

    let tests = [];
    const { createVisualTest, placeholderText, runVisualTests } = base;
    const { eventName } = hlf.hoverIntent;
    tests.push(createVisualTest({
      label: 'by default',
      template(vars) {
        return (
`<div class="box">
  <dl>
    <dt>enter count:</dt><dd class="enter-counter">0</dd>
    <dt>leave count:</dt><dd class="leave-counter">0</dd>
  </dl>
</div>`
        );
      },
      test(testElement) {
        let boxElement = testElement.querySelector('.box');
        hoverIntent(boxElement);
        let enterCounter = boxElement.querySelector('.enter-counter');
        let leaveCounter = boxElement.querySelector('.leave-counter');
        boxElement.addEventListener(eventName('enter'), (event) => {
          enterCounter.textContent = parseInt(enterCounter.textContent) + 1;
          leaveCounter.textContent = 0;
        });
        boxElement.addEventListener(eventName('leave'), (event) => {
          enterCounter.textContent = 0;
          leaveCounter.textContent = parseInt(leaveCounter.textContent) + 1;
        });
      },
      anchorName: 'default',
      className: 'default-call',
      vars: {},
    }));
    runVisualTests(tests);
  });

}());
