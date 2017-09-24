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
    <dt><code>mouseover</code> count:</dt><dd class="mouseover-counter">0</dd>
    <dt><code>mouseleave</code> count:</dt><dd class="mouseleave-counter">0</dd>
    <dt><code>mouseout</code> count:</dt><dd class="mouseout-counter">0</dd>
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
      test(testElement) {
        const { vars } = this;
        let element = testElement.querySelector('.box');
        hoverIntent(element);
        vars.counters.setUp(testElement, element, {
          enter: { selector: '.enter-counter', eventName: eventName('enter') },
          leave: { selector: '.leave-counter', eventName: eventName('leave') },
          mouseover: { selector: '.mouseover-counter', eventName: 'mouseover' },
          mouseleave: { selector: '.mouseleave-counter', eventName: 'mouseleave' },
          mouseout: { selector: '.mouseout-counter', eventName: 'mouseout' },
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
      test(testElement) {
        const { vars } = this;
        let contextElement = testElement.querySelector('.list');
        hoverIntent(contextElement.querySelectorAll('.item'), contextElement);
        vars.counters.setUp(testElement, contextElement, {
          enter: { selector: '.enter-counter', eventName: eventName('enter') },
          leave: { selector: '.leave-counter', eventName: eventName('leave') },
          mouseover: { selector: '.mouseover-counter', eventName: 'mouseover' },
          mouseleave: { selector: '.mouseleave-counter', eventName: 'mouseleave' },
          mouseout: { selector: '.mouseout-counter', eventName: 'mouseout' },
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
