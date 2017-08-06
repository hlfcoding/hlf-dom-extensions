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
    const { createVisualTest, runVisualTests } = base;
    const { eventName } = hlf.hoverIntent;
    tests.push(createVisualTest({
      label: 'by default',
      template(vars) {
        return (
`<div class="box">
  <dl>
    <dt>enter count:</dt><dd class="enter-counter">0</dd>
    <dt>leave count:</dt><dd class="leave-counter">0</dd>
    <dt>raw-enter count:</dt><dd class="raw-enter-counter">0</dd>
    <dt>raw-leave count:</dt><dd class="raw-leave-counter">0</dd>
  </dl>
</div>`
        );
      },
      footerHtml: (
`<label for="default-enabled">
  <input type="checkbox" id="default-enabled" checked />
  enabled
</label>`
      ),
      beforeTest(testElement) {
        const inputElement = document.getElementById('default-enabled');
        inputElement.addEventListener('change', (_) => {
          let element = testElement.querySelector('.box');
          if (inputElement.checked) {
            hoverIntent(element);
          } else {
            hoverIntent(element, 'remove');
          }
        });
      },
      test(testElement) {
        function setUpCounters(element, {
          enterCounter, leaveCounter, enterEvent, leaveEvent,
        }) {
          enterCounter = element.querySelector(enterCounter);
          leaveCounter = element.querySelector(leaveCounter);
          element.addEventListener(enterEvent, (event) => {
            enterCounter.textContent = parseInt(enterCounter.textContent) + 1;
            leaveCounter.textContent = 0;
          });
          element.addEventListener(leaveEvent, (event) => {
            enterCounter.textContent = 0;
            leaveCounter.textContent = parseInt(leaveCounter.textContent) + 1;
          });
        }
        let contextElement = testElement.querySelector('.box');
        let element = contextElement.querySelector('dl');
        hoverIntent(element, contextElement);
        setUpCounters(contextElement, {
          enterCounter: '.enter-counter',
          leaveCounter: '.leave-counter',
          enterEvent: eventName('enter'),
          leaveEvent: eventName('leave'),
        });
        setUpCounters(element, {
          enterCounter: '.raw-enter-counter',
          leaveCounter: '.raw-leave-counter',
          enterEvent: 'mouseover',
          leaveEvent: 'mouseleave',
        });
      },
      anchorName: 'default',
      className: 'default-call',
      vars: {},
    }));
    runVisualTests(tests);
  });

}());
