//
// HLF Tip Visual Tests
// ====================
// [Page](../../../tests/tip.visual.html) | [Source](../../src/js/tip.html)
//
(function() {
  'use strict';
  if (window.guard && !guard.isNavigatorSupported) { return; }

  require.config({ baseUrl: '../', paths: { hlf: 'dist', test: 'tests/js' } });
  define(['test/base', 'hlf/tip'], function(base, Tip) {
    let tests = [];
    const { createVisualTest, placeholderText, runVisualTests } = base;
    //
    // Default
    // -------
    //
    // Basic test with the default settings. Tip should entirely follow mouse.
    // Tip size should change when switching between links.
    //
    // Note: `contextElement` also needs to be passed in, and it should be an
    // ancestor element of all trigger elements.
    //
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
    //
    // Snapping Vertically
    // -------------------
    //
    // Snapping tooltips are created via the `snapTo` option. This one should
    // snap to an appropriate x position, along the y axis and the trigger's
    // most fitting edge (left or right). Here it should snap to the right.
    //
    // Also note the append button and each new item automatically becoming a
    // trigger.
    //
    tests.push(createVisualTest({
      label: 'snapping with a list',
      template({ itemCount, placeholderText }) {
        let itemsHtml = '';
        [...Array(itemCount)].forEach((_, i) => {
          itemsHtml += (
`<li>
  <a class="trigger" href="javascript:"
    title="This is list item ${i + 1} in detail. ${(i % 2 == 1) ? placeholderText.short : ''}">
    tooltip trigger</a>
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
    //
    // Snapping Horizontally
    // ---------------------
    //
    // Change the `snapTo` value from `y` to `x`, and this one should snap to an
    // appropriate y position, along the trigger's top or bottom edge.
    //
    tests.push(createVisualTest({
      label: 'snapping with a bar',
      template({ itemCount, placeholderText }) {
        let itemsHtml = '';
        [...Array(itemCount)].forEach((_, i) => {
          itemsHtml += (
`<a class="trigger" href="javascript:"
  title="This is bar item ${i + 1} in detail. ${(i % 2 == 1) ? placeholderText.short : ''}">
  tooltip trigger</a>`
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
    //
    // A Model Use Case
    // ----------------
    //
    // The above examples could suffice with Bootstrap tooltip or others. Snap
    // and shift behavior without redundantly toggling appearance really makes a
    // difference when hovering over a grid of small individual content pieces,
    // ie. avatar images.
    //
    tests.push(createVisualTest({
      label: 'snapping with a grid',
      template({ itemCount }) {
        let itemsHtml = '';
        [...Array(itemCount)].forEach((_, i) => {
          itemsHtml += (
`<li>
  <img src="resources/avatar.png"
    alt="This is avatar ${i + 1} in detail. ${(i % 2 == 1) ? placeholderText.short : ''}">
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
    //
    // Corner Cases
    // ------------
    //
    // Base tips also anchor themselves to the trigger based on available space.
    // Here we change the `snapTo` value to `trigger` to lock the tip into place
    // and prevent mouse following.
    //
    tests.push(createVisualTest({
      label: 'snapping to corners',
      template({ placeholderText }) {
        return (
`<div class="box" style="height:6rem">
  <a class="trigger edge top right" title="${placeholderText.long}" href="javascript:">
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
    //
    // Longer Toggle Delay
    // -------------------
    //
    tests.push(createVisualTest({
      label: 'with longer toggle delay',
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
        let tip = Tip.extend(triggerElements, { contextElement: testElement, toggleDelay: 1000 });
      },
      anchorName: 'optional-longer-toggle-delay',
      className: 'optional-longer-toggle-delay',
      vars: { placeholderText },
    }));
    //
    // Custom Content
    // --------------
    //
    tests.push(createVisualTest({
      label: 'with custom content',
      template({ placeholderText }) {
        return (
`<div>
  <p>
    <a class="trigger" href="javascript:">tooltip trigger</a>
  </p>
  <div class="content" style="display:none">
    <h1>Custom Content</h1>
    <p>${placeholderText.long}</p>
  </div>
</div>`
        );
      },
      test(testElement) {
        let triggerElements = testElement.querySelectorAll('.trigger');
        let contentElement = testElement.querySelector('.content');
        let tip = Tip.extend(triggerElements, {
          contextElement: testElement,
          triggerContent() { return contentElement.innerHTML; },
        });
      },
      anchorName: 'optional-custom-content',
      className: 'optional-custom-content',
      vars: { placeholderText },
    }));
    //
    // Inside Scroll Container
    // -----------------------
    //
    tests.push(createVisualTest({
      label: 'inside an overflow-scroll container',
      template({ placeholderText }) {
        return (
`<div class="box" style="height:6rem; overflow:auto">
  <a class="trigger" title="${placeholderText.short}" href="javascript:"
    style="display:inline-block; margin:6rem 0">
    tooltip trigger</a>
</div>`
        );
      },
      test(testElement) {
        let triggerElements = testElement.querySelectorAll('.trigger');
        let tip = Tip.extend(triggerElements, { contextElement: testElement });
      },
      anchorName: 'inside-scroll-container',
      className: 'inside-scroll-container',
      vars: { placeholderText },
    }));

    runVisualTests(tests);
  });

}());
