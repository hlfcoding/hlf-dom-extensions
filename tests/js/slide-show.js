//
// HLF SlideShow Visual Tests
// ==========================
// [Page](../../../tests/slide-show.visual.html) | [Source](../../src/js/slide-show.html)
//
(function() {
  'use strict';
  if (window.guard && !guard.isNavigatorSupported) { return; }

  require.config({ baseUrl: '../', paths: { hlf: 'dist', test: 'tests/js' } });
  define(['test/base', 'hlf/slide-show'], function(base, SlideShow) {
    let tests = [];
    const { createVisualTest, placeholderText, runVisualTests } = base;
    tests.push(createVisualTest({
      label: 'by default',
      template({ slideCount }) {
        let slidesHtml = '';
        [...Array(slideCount)].forEach(() => {
          slidesHtml += (
`<li class="slide">
  <figure><img src="resources/slide.png"></figure>
</li>`
          );
        });
        return (
`<div class="slideshow">
  <ol class="slides">
    ${slidesHtml}
  </ol>
</div>`
        );
      },
      test(testElement) {
        SlideShow.extend(testElement.querySelector('.slideshow'));
      },
      anchorName: 'default',
      className: 'default-call',
      vars: { slideCount: 3 },
    }));
    tests.push(createVisualTest({
      label: 'with buttons',
      template({ slideCount }) {
        let slidesHtml = '';
        [...Array(slideCount)].forEach(() => {
          slidesHtml += (
`<li class="slide">
  <figure><img src="resources/slide.png"></figure>
</li>`
          );
        });
        return (
`<div class="slideshow">
  <ol class="slides">
    ${slidesHtml}
  </ol>
  <nav class="bar full">
    <button type="button" class="previous">Previous</button>
    <span class="flexible-space"></span>
    <button type="button" class="next">Next</button>
  </nav>
</div>`
        );
      },
      test(testElement) {
        SlideShow.extend(testElement.querySelector('.slideshow'));
      },
      anchorName: 'with-buttons',
      className: 'with-buttons-call',
      vars: { slideCount: 3 },
    }));
    runVisualTests(tests);
  });
}());
