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

    class Counters {
      setUp(testElement, element, countersInfo) {
        Object.keys(countersInfo).map(key => countersInfo[key]).forEach((info) => {
          const { selector, eventName } = info;
          let counterElement = testElement.querySelector(selector);
          element.addEventListener(eventName, (event) => {
            counterElement.textContent = parseInt(counterElement.textContent) + 1;
          });
        });
      }
      template() {
        return (
  `<dl>
    <dt>enter count:</dt><dd class="enter-counter">0</dd>
    <dt>leave count:</dt><dd class="leave-counter">0</dd>
    <dt>raw-enter count:</dt><dd class="raw-enter-counter">0</dd>
    <dt>raw-leave count:</dt><dd class="raw-leave-counter">0</dd>
  </dl>`
        );
      }
    }

    tests.push(createVisualTest({
      label: 'by default',
      template({ counters }) {
        return (
`<div class="box">
  ${counters.template()}
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
      test(testElement, { counters }) {
        let element = testElement.querySelector('.box');
        hoverIntent(element);
        counters.setUp(testElement, element, {
          enter: { selector: '.enter-counter', eventName: eventName('enter') },
          leave: { selector: '.leave-counter', eventName: eventName('leave') },
          rawEnter: { selector: '.raw-enter-counter', eventName: 'mouseover' },
          rawLeave: { selector: '.raw-leave-counter', eventName: 'mouseleave' },
        });
      },
      anchorName: 'default',
      className: 'default-call',
      vars: {
        counters: new Counters(),
      },
    }));
    tests.push(createVisualTest({
      label: 'as shared instance',
      template({ counters }) {
        return (
`<ul class="list">
  <li class="item">trigger</li>
  <li class="item">trigger</li>
  <li class="item">trigger</li>
</ul>
<div class="box">
  ${counters.template()}
</div>`
        );
      },
      test(testElement, { counters }) {
        let contextElement = testElement.querySelector('.list');
        hoverIntent(contextElement.querySelector('.item'), contextElement);
        counters.setUp(testElement, contextElement, {
          enter: { selector: '.enter-counter', eventName: eventName('enter') },
          leave: { selector: '.leave-counter', eventName: eventName('leave') },
          rawEnter: { selector: '.raw-enter-counter', eventName: 'mouseover' },
          rawLeave: { selector: '.raw-leave-counter', eventName: 'mouseleave' },
        });
      },
      anchorName: 'as-shared-instance',
      className: 'as-shared-instance-call',
      vars: {
        counters: new Counters(),
      },
    }));
    runVisualTests(tests);
  });

}());
