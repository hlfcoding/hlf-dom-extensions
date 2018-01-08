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
  class SlideShow {
    static get defaults() {
      return {
        highlightClass: 'highlighted',
        highlightDuration: 500,
        selectors: {
          nextElement: 'button.next',
          previousElement: 'button.previous',
          slideElements: '.slide',
          slidesElement: '.slides',
        },
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
      if (element.classList.contains(this.highlightClass)) { return; }
      element.classList.add(this.highlightClass);
      setTimeout(() => {
        element.classList.remove(this.highlightClass);
      }, this.highlightDuration);
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
      this.toggleEventListeners(on, {
        click: this._onNextClick,
      }, this.nextElement);
      this.toggleEventListeners(on, {
        click: this._onPreviousClick,
      }, this.previousElement);
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
