//
// HLF Hover Intent Visual Tests
// =============================
// [Page](../../../tests/hover-intent.visual.html) | [Source](../../src/js/hover-intent.html)
//
(function() {
  'use strict';
  if (window.guard && !guard.isNavigatorSupported) { return; }

  require.config({ baseUrl: '../', paths: { hlf: 'dist', test: 'tests/js' } });
  define(['test/base', 'hlf/hover-intent'], function(base, HoverIntent) {

    // ---

    let tests = [];
    const { createVisualTest, runVisualTests } = base;
    const { eventName } = HoverIntent;

    class Counters {
      setUp(testElement, element, countersInfo = {
        enter: { selector: '.enter-counter', eventName: eventName('enter') },
        leave: { selector: '.leave-counter', eventName: eventName('leave') },
        mouseover: { selector: '.mouseover-counter', eventName: 'mouseover' },
        mouseleave: { selector: '.mouseleave-counter', eventName: 'mouseleave' },
        mouseout: { selector: '.mouseout-counter', eventName: 'mouseout' },
      }) {
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
  <input type="checkbox" id="default-enabled" checked>
  enabled
</label>`
      ),
      beforeTest(testElement) {
        const inputElement = document.getElementById('default-enabled');
        inputElement.addEventListener('change', (_) => {
          let element = testElement.querySelector('.box');
          if (inputElement.checked) {
            this.hoverIntent = HoverIntent.extend(element);
          } else {
            this.hoverIntent.remove();
          }
        });
      },
      test(testElement) {
        const { vars } = this;
        let element = testElement.querySelector('.box');
        this.hoverIntent = HoverIntent.extend(element);
        vars.counters.setUp(testElement, element);
      },
      anchorName: 'default',
      className: 'default-call',
      vars: {
        counters: new Counters(),
      },
    }));
    tests.push(createVisualTest({
      label: 'with longer interval',
      template({ counters }) {
        return (
`<div class="box">
  ${counters.template()}
</div>`
        );
      },
      test(testElement) {
        const { vars } = this;
        let element = testElement.querySelector('.box');
        this.hoverIntent = HoverIntent.extend(element, { interval: 600 });
        vars.counters.setUp(testElement, element);
      },
      anchorName: 'optional-longer-interval',
      className: 'optional-longer-interval',
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
        HoverIntent.extend(contextElement.querySelectorAll('.item'), { contextElement });
        vars.counters.setUp(testElement, contextElement);
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
