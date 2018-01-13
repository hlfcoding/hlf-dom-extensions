//
// HLF SlideShow Extension
// =======================
// [Styles](../css/slide-show.html) | [Tests](../../tests/js/slide-show.html)
//
(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(HLF);
  }
})(this, function(HLF) {
  'use strict';
  //
  // SlideShow
  // ---------
  //
  // - __selectors.nextElement__ points to the optional existing UI for
  //   effectively changing to the slide (if any) after the current on click.
  //   The element will be modified with the `uiHighlightClass` when needed.
  //   `'button.next'` by default.
  //
  // - __selectors.previousElement__ points to the optional existing UI for
  //   effectively changing to the slide (if any) before the current on click.
  //   The element will be modified with the `uiHighlightClass` when needed.
  //   `'button.previous'` by default.
  //
  // - __selectors.slideElements__ points to all elements considered to be
  //   slides, which can be modified with `js-ss-current`, `js-ss-full-screen`
  //   classes. `'.slide'` by default.
  //
  // - __selectors.slidesElement__ points to the container element for all
  //   slides, which can be modified with the `js-ss-full-screen` class. It
  //   needs to be a scrollable element. See recommended, associated styling for
  //   details. `'.slides'` by default.
  //
  // - __uiHighlightClass__ modifies optional UI elements, specifically for
  //   those changing slides when a corresponding slide change occurs.
  //   `'highlighted'` by default.
  //
  // - __uiHighlightDuration__ is the duration to apply the `uiHighlightClass`.
  //   `500` by default.
  //
  // To summarize the implementation, given existing `slideElements` in the
  // extended `element`, keep track of the `currentSlideElement` (and
  // `currentSlideIndex`), which will start at the first slide. Various user
  // input is transformed into calls to `changeSlide`, which if `animated`, will
  // call `scrollIntoView` on `currentSlideElement`. A `hlfssslidechange` event
  // will also be dispatched.
  //
  // User input is handled by `_onKeyDown`, `_onNextClick`, `_onPreviousClick`,
  // `_onSlidesClick`, and `_onSlidesScroll`, with timeouts `_keyDownTimeout`
  // and `_scrollTimeout` for debounce.`_onSlidesClick`, using event delegation,
  // implements both (mobile-ok) double-click recognition (with
  // `_startClickTime` and `_endClickTimeout`) to enter full-screen mode and
  // single-click recognition on left and right regions to change slide.
  // `_onSlidesScroll` implements both current-slide tracking and substitute
  // scroll-snap behavior (in case of no browser support, and with some math),
  // with `_isAnimatingScroll` and `_isUserScroll` to track when to skip
  // execution to avoid conflicts with other interactions and updates.
  //
  class SlideShow {
    static get defaults() {
      return {
        selectors: {
          nextElement: 'button.next',
          previousElement: 'button.previous',
          slideElements: '.slide',
          slidesElement: '.slides',
        },
        uiHighlightClass: 'highlighted',
        uiHighlightDuration: 500,
      };
    }
    static toPrefix(context) {
      switch (context) {
        case 'event': return 'hlfss';
        case 'data': return 'hlf-ss';
        case 'class': return 'ss';
        case 'var': return 'ss';
        default: return 'hlf-ss';
      }
    }
    init() {
      this.slidesElement.style.position = 'relative';
      this._toggleEventListeners(true);
      this._isAnimatingScroll = false;
      this._isUserScroll = false;
      this.changeSlide(0, { animated: false });
      this._slideMargin = parseFloat(getComputedStyle(this.slideElements[0]).marginRight);
      if (this.slideElements.length === 1) {
        this.element.classList.add(this.className('single-slide'));
      }
    }
    deinit() {
      this._toggleEventListeners(false);
    }
    get currentSlideElement() {
      return this.slideElements[this.currentSlideIndex];
    }
    changeSlide(index, { animated } = { animated: true }) {
      if (index < 0 || index >= this.slideElements.length) { return false; }
      if (this.currentSlideElement) {
        this.currentSlideElement.classList.remove(this.className('current'));
      }
      this.currentSlideIndex = index;
      this.currentSlideElement.classList.add(this.className('current'));
      if (animated) {
        this.currentSlideElement.scrollIntoView({ behavior: 'smooth' });
        this._isAnimatingScroll = true;
      }
      if (this.nextElement instanceof HTMLButtonElement) {
        this.nextElement.disabled = index === (this.slideElements.length - 1);
      }
      if (this.previousElement instanceof HTMLButtonElement) {
        this.previousElement.disabled = index === 0;
      }
      this.dispatchCustomEvent('slidechange', { element: this.currentSlideElement, index });
      return true;
    }
    _highlightElement(element) {
      if (element === null) { return; }
      if (element.classList.contains(this.uiHighlightClass)) { return; }
      element.classList.add(this.uiHighlightClass);
      setTimeout(() => {
        element.classList.remove(this.uiHighlightClass);
      }, this.uiHighlightDuration);
    }
    _onKeyDown(event) {
      const leftArrow = 37, rightArrow = 39;
      switch (event.keyCode) {
        case leftArrow:
          this.setTimeout('_keyDownTimeout', 96, () => {
            if (this.changeSlide(this.currentSlideIndex - 1)) {
              this._highlightElement(this.previousElement);
            }
          });
          event.preventDefault();
          return false;
        case rightArrow:
          this.setTimeout('_keyDownTimeout', 96, () => {
            if (this.changeSlide(this.currentSlideIndex + 1)) {
              this._highlightElement(this.nextElement);
            }
          });
          event.preventDefault();
          return false;
        default: break;
      }
    }
    _onNextClick(event) {
      if (this.changeSlide(this.currentSlideIndex + 1)) {
        this._isUserScroll = false;
      }
    }
    _onPreviousClick(event) {
      if (this.changeSlide(this.currentSlideIndex - 1)) {
        this._isUserScroll = false;
      }
    }
    _onSlidesClick(event) {
      if (!this.currentSlideElement.contains(event.target)) { return; }
      if (this.currentSlideElement.classList.contains(this.className('full-screen'))) {
        this.slidesElement.classList.remove(this.className('full-screen'));
        return this.currentSlideElement.classList.remove(this.className('full-screen'));
      }
      if (event.target.tagName.toLowerCase() !== 'img') { return; }
      const maxDelay = 300;
      if (!this._startClickTime) {
        this._startClickTime = Date.now();
        this.setTimeout('_endClickTimeout', maxDelay, () => {
          this._onSlidesClick(event);
        });
        this.debugLog('click:start');
        return;
      } else {
        const delta = Date.now() - this._startClickTime;
        this._startClickTime = null;
        this.setTimeout('_endClickTimeout', null);
        if (delta < maxDelay) {
          this.debugLog('click:end');
          this.slidesElement.classList.add(this.className('full-screen'));
          return this.currentSlideElement.classList.add(this.className('full-screen'));
        }
        this.debugLog('click:fail');
      }
      if (event.offsetX < (event.target.offsetWidth / 2)) {
        if (this.changeSlide(this.currentSlideIndex - 1)) {
          this._highlightElement(this.previousElement);
          this._isUserScroll = false;
        }
      } else {
        if (this.changeSlide(this.currentSlideIndex + 1)) {
          this._highlightElement(this.nextElement);
          this._isUserScroll = false;
        }
      }
    }
    _onSlidesScroll(event) {
      if (this.currentSlideElement.classList.contains(this.className('full-screen'))) { return; }
      this.debugLog('scroll');
      this.setTimeout('_scrollTimeout', 96, () => {
        this.debugLog('did-scroll');
        if (this._isAnimatingScroll && this._isUserScroll) { return; }
        this.debugLog('change slide');
        let nextIndex;
        for (let i = 0, l = this.slideElements.length; i < l; i++) {
          let slideElement = this.slideElements[i];
          if (/* Distance between centers is less than mid-x. */ Math.abs(
            (slideElement.offsetLeft + slideElement.offsetWidth / 2) -
            (this.slidesElement.scrollLeft + this.slidesElement.offsetWidth / 2)
          ) < (slideElement.offsetWidth / 2 + this._slideMargin)) {
            nextIndex = i;
            break;
          }
        }
        if (this.changeSlide(nextIndex, {
          animated: !('scrollSnapType' in this.slidesElement.style),
        })) {
          this._isAnimatingScroll = false;
          this._isUserScroll = true;
        }
      });
    }
    _toggleEventListeners(on) {
      this.toggleEventListeners(on, {
        keydown: this._onKeyDown,
      }, document.body);
      if (this.nextElement !== null) {
        this.toggleEventListeners(on, {
          click: this._onNextClick,
        }, this.nextElement);
      }
      if (this.previousElement !== null) {
        this.toggleEventListeners(on, {
          click: this._onPreviousClick,
        }, this.previousElement);
      }
      this.toggleEventListeners(on, {
        click: this._onSlidesClick,
        scroll: this._onSlidesScroll,
      }, this.slidesElement);
    }
  }
  SlideShow.debug = false;
  HLF.buildExtension(SlideShow, {
    autoBind: true,
    autoSelect: true,
    compactOptions: true,
    mixinNames: ['event'],
  });
  Object.assign(HLF, { SlideShow });
  return SlideShow;
});
