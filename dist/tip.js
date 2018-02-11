//
// HLF Tip Extension
// =================
// [Styles](../css/tip.html) | [Tests](../../tests/js/tip.html)
//
// The `Tip` extension does several things. It does basic parsing of trigger
// element attributes for the tip content. It can anchor itself to a trigger by
// selecting the best direction. It can follow the cursor. It toggles its
// appearance by fading in and out and resizing. It can display custom tip
// content. It uses the `HLF.HoverIntent` extension to prevent over-queueing of
// appearance handlers. The `snapTo` option allows the tip to snap to the
// trigger element. And by default the tip locks into place. But turn on only
// one axis of snapping, and the tip will follow the mouse only on the other
// axis. For example, snapping to the x-axis will only allow the tip to shift
// along the y-axis. The x will remain constant.
//
(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core', 'hlf/hover-intent'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'), require('hlf/hover-intent'));
  } else {
    attach(HLF, HLF.HoverIntent);
  }
})(this, function(HLF, HoverIntent) {
  'use strict';
  //
  // Tip
  // ---
  //
  // - __cursorHeight__ is the browser's cursor height. We need to know this to
  //   properly offset the tip to avoid cases of cursor-tip-stem overlap.
  //
  // - __defaultDirection__ is used as a tie-breaker when selecting the best
  //   direction. Note that the direction data structure must be an array of
  //   string components, and conventionally with `'top'`/`'bottom'` first.
  //
  // - __hasListeners__ can allow events `hlftipawake` and `hlftipwaking`,
  //   `hlftipasleep` and `hlftipsleeping` to be triggered from the trigger
  //   elements. This is off by default to improve performance.
  //
  // - __hasStem__ can be turned off to omit rendering the stem and accounting
  //   for it during layout.
  //
  // - __snapTo__ when set allows the tip to first snap to or along the trigger
  //   before mouse tracking. Null by default. Values can also be `'x'`,
  //   `'y'`, `'trigger'`.
  //
  // - __template__ should return interpolated HTML. Its context is the
  //   extension instance.
  //
  // - __toggleDelay__ delays the tip's waking or sleeping under normal cases.
  //   It defaults to 0.7 seconds.
  //
  // - __triggerContent__ can be the name of the trigger element's attribute
  //   or a function providing custom content when given the trigger element.
  //
  // - __viewportElement__ is the element in which the tip must fit. It is
  //   _not_ the context element, which by convention contains the triggers.
  //
  // - Note: the majority of presentation state logic is in the extension
  //   stylesheet. We update the presentation state by using __className__.
  //
  // To summarize the implementation, given existing `elements` in a
  // `contextElement`, a tip `element` is created and configured via
  // `_renderElement` and attached to `viewportElement`. The extension will
  // initially `_updateTriggerElements`, which effectively
  // `_updateTriggerAnchoring` and `_updateTriggerContent`.
  //
  // `HoverIntent` event listeners are added to `element` via
  // `_toggleElementEventListeners` with the `_onContentElementMouseEnter` and
  // `_onContentElementMouseLeave` handlers, and to `contextElement` via
  // `_toggleTriggerElementEventListeners` with the
  // `_onTriggerElementMouseEnter`, `_onTriggerElementMouseLeave`, and
  // `_onTriggerElementMouseMove` handlers. Aside from
  // `_onTriggerElementMouseMove` mostly wrapping `_updateElementPosition`,
  // the handlers mostly wrap `wake` and `sleep`, which `_toggleElement` in a
  // locking and delayed approach per `_updateState`, `_toggleCountdown`,
  // `toggleDelay` to avoid the tip having short lifespans or thrashing its
  // CSS-animated appearance.
  //
  // `_updateCurrentTriggerElement` calls are also typical during these actions
  // and involve updating tip anchoring and size (via `_getElementSize`). And
  // the `_contextObserver` is manually set up with the `_onContextMutation`
  // handler that `_updateTriggerElements` and also updates `elements` lists.
  //
  // `wake` will also `_updateElementPosition`, which holds the majority of the
  // tip positioning logic but offloads to `_getStemSize` and
  // `_getTriggerOffset` (and thereby `_withStealthRender`) as needed. The
  // current positioning implementation uses `offset(Height|Width|Left|Top)`,
  // `getBoundingClientRect`, `getComputedStyle`, etc. to simply calculate the
  // offset, factoring in `snapTo`. The offset is applied to the tip as a CSS
  // translate transform.
  //
  class Tip {
    static get defaults() {
      return {
        cursorHeight: 12,
        defaultDirection: ['bottom', 'right'],
        hasListeners: false,
        hasStem: true,
        repositionToFit: true,
        snapTo: null,
        template() {
          let stemHtml = this.hasStem ? `<div class="${this.className('stem')}"></div>` : '';
          return (
`<div class="${this.className('inner')}">
  ${stemHtml}
  <div class="${this.className('content')}"></div>
</div>`
          );
        },
        toggleDelay: 700,
        triggerContent: null,
        viewportElement: document.body,
      };
    }
    static toPrefix(context) {
      switch (context) {
        case 'event': return 'hlftip';
        case 'data': return 'hlf-tip';
        case 'class': return 'tips';
        case 'var': return 'tip';
        default: return 'hlf-tip';
      }
    }
    constructor(elements, options, contextElement) {
      this.elementHoverIntent = null;
      this.hoverIntent = null;
      this._currentTriggerElement = null;
      this._sleepingPosition = null;
      this._state = null;
      this._stemSize = null;
      this._toggleCountdown = null;
    }
    init() {
      this.element = document.createElement('div');
      this._updateState('asleep');
      this._renderElement();
      this._toggleContextMutationObserver(true);
      this._toggleElementEventListeners(true);
      this._toggleTriggerElementEventListeners(true);
      this._updateTriggerElements();
    }
    deinit() {
      this.element.parentNode.removeChild(this.element);
      this._toggleContextMutationObserver(false);
      this._toggleElementEventListeners(false);
      this._toggleTriggerElementEventListeners(false);
    }
    get isAsleep() { return this._state === 'asleep'; }
    get isSleeping() { return this._state === 'sleeping'; }
    get isAwake() { return this._state === 'awake'; }
    get isWaking() { return this._state === 'waking'; }
    get snapToTrigger() { return this.snapTo === 'trigger'; }
    get snapToXAxis() { return this.snapTo === 'x'; }
    get snapToYAxis() { return this.snapTo === 'y'; }
    sleep({ triggerElement, event }) {
      if (this.isAsleep || this.isSleeping) { return; }

      this._updateState('sleeping', { event });
      this.setTimeout('_toggleCountdown', this.toggleDelay, () => {
        this._toggleElement(false, () => {
          this._updateState('asleep', { event });
        });
      });
    }
    wake({ triggerElement, event }) {
      this._updateCurrentTriggerElement(triggerElement);
      if (this.isAwake || this.isWaking) { return; }

      let delayed = !this.isSleeping;
      if (!delayed) { this.debugLog('staying awake'); }
      this._updateState('waking', { event });
      this.setTimeout('_toggleCountdown', (!delayed ? 0 : this.toggleDelay), () => {
        this._toggleElement(true, () => {
          this._updateState('awake', { event });
        });
        if (event.target !== this._contentElement) {
          this._updateElementPosition(triggerElement, event);
        }
      });
    }
    //
    // `_getElementSize` does a stealth render via `_withStealthRender` to find
    // tip size. It returns saved data if possible before doing a measure. The
    // measures, used by `_updateTriggerAnchoring`, are stored on the trigger
    // as namespaced, `width` and `height` data-attributes. If on,
    // `contentOnly` will factor in content padding into the size value for the
    // current size.
    //
    // `_getStemSize` does a stealth render via `_withStealthRender` to find
    // stem size. The stem layout styles will add offset to the tip content
    // based on the tip direction. Knowing the size helps operations like
    // overall tip positioning.
    //
    // `_isTriggerDirection` deduces if `element` has the given
    // `directionComponent`, which is true if it has the classes or if there is
    // no `triggerElement` or saved direction value, and `directionComponent`
    // is part of `defaultDirection`.
    //
    // `_updateTriggerContent` comes with a very simple base implementation
    // that supports the common `title` and `alt` meta content for an element.
    // Support is also provided for the `triggerContent` option. We take that
    // content and store it into a namespaced `content` data-attribute on the
    // trigger.
    //
    _getElementSize(triggerElement, { contentOnly } = {}) {
      let size = {
        height: triggerElement.getAttribute(this.attrName('height')),
        width: triggerElement.getAttribute(this.attrName('width')),
      };
      if (!size.height || !size.width) {
        this._updateElementContent(triggerElement);
        this._withStealthRender(() => {
          triggerElement.setAttribute(this.attrName('height'),
            (size.height = this.element.offsetHeight));
          triggerElement.setAttribute(this.attrName('width'),
            (size.width = this.element.offsetWidth));
        });
      }
      if (contentOnly) {
        const { paddingTop, paddingLeft, paddingBottom, paddingRight } =
          getComputedStyle(this._contentElement);
        size.height -= parseFloat(paddingTop) + parseFloat(paddingBottom);
        size.width -= parseFloat(paddingLeft) + parseFloat(paddingRight);
      }
      return size;
    }
    _getStemSize() {
      let size = this._stemSize;
      if (size != null) { return size; }

      let stemElement = this.selectByClass('stem', this.element);
      if (!stemElement) {
        size = 0;
      } else {
        this._withStealthRender(() => {
          let margin = getComputedStyle(stemElement).margin.replace(/0px/g, '');
          size = Math.abs(parseInt(margin));
        });
      }
      this._stemSize = size;
      return size;
    }
    _getTriggerOffset(triggerElement) {
      const { position } = getComputedStyle(triggerElement);
      if (position === 'fixed' || position === 'absolute') {
        const triggerRect = triggerElement.getBoundingClientRect();
        const viewportRect = this.viewportElement.getBoundingClientRect();
        return {
          left: triggerRect.left - viewportRect.left,
          top: triggerRect.top - viewportRect.top,
        };
      } else {
        return {
          left: triggerElement.offsetLeft, top: triggerElement.offsetTop
        };
      }
    }
    _isTriggerDirection(directionComponent, triggerElement) {
      if (this.element.classList.contains(this.className(directionComponent))) {
        return true;
      }
      if (
        (!triggerElement || !triggerElement.hasAttribute(this.attrName('direction'))) &&
        this.defaultDirection.indexOf(directionComponent) !== -1
      ) {
        return true;
      }
      return false;
    }
    _onContextMutation(mutations) {
      let newTriggerElements = [];
      const allTriggerElements = Array.from(this.querySelector(this.contextElement));
      mutations.forEach((mutation) => {
        let triggerElements = Array.from(mutation.addedNodes)
          .filter(n => n instanceof HTMLElement)
          .map((n) => {
            let result = this.querySelector(n);
            return result.length ? result[0] : n;
          })
          .filter(n => allTriggerElements.indexOf(n) !== -1);
        newTriggerElements = newTriggerElements.concat(triggerElements);
      });
      this._updateTriggerElements(newTriggerElements);
      this.elements = this.elements.concat(newTriggerElements);
      this.hoverIntent.elements = this.elements;
    }
    _onContentElementMouseEnter(event) {
      this.debugLog('enter tip');
      let triggerElement = this._currentTriggerElement;
      if (!triggerElement) { return; }
      this.wake({ triggerElement, event });
    }
    _onContentElementMouseLeave(event) {
      this.debugLog('leave tip');
      let triggerElement = this._currentTriggerElement;
      if (!triggerElement) { return; }
      this.sleep({ triggerElement, event });
    }
    _onTriggerElementMouseEnter(event) {
      this.wake({ triggerElement: event.target, event });
    }
    _onTriggerElementMouseLeave(event) {
      this.sleep({ triggerElement: event.target, event });
    }
    _onTriggerElementMouseMove(event) {
      const { target } = event;
      if (target.classList.contains(this.className('trigger'))) {
        this._updateCurrentTriggerElement(target);
      }
      if (
        this.isAsleep || !this._currentTriggerElement || (
          target !== this._currentTriggerElement &&
          target !== this._currentTriggerElement.parentElement &&
          !this._currentTriggerElement.contains(target)
        )
      ) {
        return;
      }
      this._updateElementPosition(this._currentTriggerElement, event);
    }
    _renderElement() {
      if (this.element.innerHTML.length) { return; }
      this.element.innerHTML = this.template();
      this.element.classList.add(
        this.className('tip'), this.className('follow'), this.className('hidden'),
        ...(this.defaultDirection.map(this.className))
      );

      this._contentElement = this.selectByClass('content', this.element);

      this.viewportElement.insertBefore(this.element, this.viewportElement.firstChild);

      if (this.snapTo) {
        this.element.classList.add(this.className((() => {
          if (this.snapToTrigger) { return 'snap-trigger'; }
          else if (this.snapToXAxis) { return 'snap-x-side'; }
          else if (this.snapToYAxis) { return 'snap-y-side'; }
        })()));
      }
    }
    _toggleContextMutationObserver(on) {
      if (!this.querySelector) { return; }
      if (!this._contextObserver) {
        this._contextObserver = new MutationObserver(this._onContextMutation);
      }
      if (on) {
        const options = { childList: true, subtree: true };
        this._contextObserver.observe(this.contextElement, options);
      } else {
        this._contextObserver.disconnect();
      }
    }
    _toggleElement(visible, completion) {
      if (this._toggleAnimation) { return; }
      const duration = this.cssVariableDuration('toggle-duration', this.element);
      let { classList, style } = this.element;
      classList.toggle(this.className('visible'), visible);
      if (visible) {
        classList.remove(this.className('hidden'));
      }
      this.setTimeout('_toggleAnimation', duration, () => {
        if (!visible) {
          classList.add(this.className('hidden'));
          style.transform = 'none';
        }
        completion();
      });
    }
    _toggleElementEventListeners(on) {
      if (this.elementHoverIntent || !on) {
        this.elementHoverIntent.remove();
        this.elementHoverIntent = null;
      }
      if (on) {
        this.elementHoverIntent = HoverIntent.extend(this._contentElement);
      }
      const { eventName } = HoverIntent;
      let listeners = {};
      listeners[eventName('enter')] = this._onContentElementMouseEnter;
      listeners[eventName('leave')] = this._onContentElementMouseLeave;
      this.toggleEventListeners(on, listeners, this._contentElement);
    }
    _toggleTriggerElementEventListeners(on) {
      if (this.hoverIntent || !on) {
        this.hoverIntent.remove();
        this.hoverIntent = null;
      }
      if (on) {
        const { contextElement } = this;
        this.hoverIntent = HoverIntent.extend(this.elements, { contextElement });
      }
      const { eventName } = HoverIntent;
      let listeners = {};
      listeners[eventName('enter')] = this._onTriggerElementMouseEnter;
      listeners[eventName('leave')] = this._onTriggerElementMouseLeave;
      listeners[eventName('track')] = this._onTriggerElementMouseMove;
      this.toggleEventListeners(on, listeners, this.contextElement);
    }
    _updateCurrentTriggerElement(triggerElement) {
      if (triggerElement == this._currentTriggerElement) { return; }

      this._updateElementContent(triggerElement);
      let contentSize = this._getElementSize(triggerElement, { contentOnly: true });
      this._contentElement.style.height = `${contentSize.height}px`;
      this._contentElement.style.width = `${contentSize.width + 1}px`; // Give some buffer.

      let { classList } = this.element;
      let compoundDirection = triggerElement.hasAttribute(this.attrName('direction')) ?
        triggerElement.getAttribute(this.attrName('direction')).split(' ') :
        this.defaultDirection;
      let directionClassNames = compoundDirection.map(this.className);
      if (!directionClassNames.reduce((memo, className) => {
        return memo && classList.contains(className);
      }, true)) {
        this.debugLog('update direction class', compoundDirection);
        classList.remove(...(['top', 'bottom', 'right', 'left'].map(this.className)));
        classList.add(...directionClassNames);
      }

      this._currentTriggerElement = triggerElement;
    }
    _updateElementContent(triggerElement) {
      const content = triggerElement.getAttribute(this.attrName('content'));
      if (content.indexOf('<') !== -1) {
        this._contentElement.innerHTML = content;
      } else {
        this._contentElement.textContent = content;
      }
    }
    _updateElementPosition(triggerElement, event) {
      let cursorHeight = this.snapTo ? 0 : this.cursorHeight;
      let offset = { left: event.detail.pageX, top: event.detail.pageY };

      if (this.snapTo) { // Note vertical directions already account for stem-size.
        let triggerOffset = this._getTriggerOffset(triggerElement);
        if (this.snapToXAxis || this.snapToTrigger) {
          offset.top = triggerOffset.top;
          if (this._isTriggerDirection('bottom', triggerElement)) {
            offset.top += triggerElement.offsetHeight;
          }
          if (!this.snapToTrigger) {
            offset.left -= this.element.offsetWidth / 2;
          }
        }
        if (this.snapToYAxis || this.snapToTrigger) {
          offset.left = triggerOffset.left;
          if (!this.snapToTrigger) {
            if (this._isTriggerDirection('right', triggerElement)) {
              offset.left += triggerElement.offsetWidth + this._getStemSize();
            } else if (this._isTriggerDirection('left', triggerElement)) {
              offset.left -= this._getStemSize();
            }
            offset.top -= this.element.offsetHeight / 2 + this._getStemSize();
          }
        }
      }

      if (this._isTriggerDirection('top', triggerElement)) {
        offset.top -= this.element.offsetHeight + this._getStemSize();
      } else if (this._isTriggerDirection('bottom', triggerElement)) {
        offset.top += cursorHeight * 2 + this._getStemSize();
      }
      if (this._isTriggerDirection('left', triggerElement)) {
        offset.left -= this.element.offsetWidth;
        if (this.element.offsetWidth > triggerElement.offsetWidth) {
          offset.left += triggerElement.offsetWidth;
        }
      }
      this.element.style.transform = `translate(${offset.left}px, ${offset.top}px)`;
    }
    _updateState(state, { event } = {}) {
      if (state === this._state) { return; }
      if (this._state) {
        if (state === 'asleep' && !this.isAsleep) { return; }
        if (state === 'awake' && !this.isWaking) { return; }
      }
      this._state = state;
      this.debugLog(state);

      if (this.hasListeners && this._currentTriggerElement) {
        this._currentTriggerElement.dispatchEvent(
          this.createCustomEvent(this._state)
        );
      }

      if (this.isAsleep || this.isAwake) {
        if (this._currentTriggerElement) {
          this._currentTriggerElement.setAttribute(
            this.attrName('has-tip-focus'), this.isAwake
          );
        }
        if (this.hoverIntent) {
          this.hoverIntent.configure({
            interval: this.isAwake ? 100 : 'default',
            sensitivity: this.isAwake ? 1 : 'default',
          });
        }
      } else if (this.isSleeping) {
        this._sleepingPosition = { x: event.detail.pageX, y: event.detail.pageY };
      } else if (this.isWaking) {
        this._sleepingPosition = null;
      }
    }
    _updateTriggerAnchoring(triggerElement) {
      let offset = this._getTriggerOffset(triggerElement);
      let height = triggerElement.offsetHeight;
      let width = triggerElement.offsetWidth;
      let tip = this._getElementSize(triggerElement);
      this.debugLog({ offset, height, width, tip });
      const viewportRect = this.viewportElement.getBoundingClientRect();
      let newDirection = this.defaultDirection.map((d) => {
        let edge, fits;
        if (d === 'bottom') {
          fits = (edge = offset.top + height + tip.height) && edge <= viewportRect.height;
        } else if (d === 'right') {
          fits = (edge = offset.left + tip.width) && edge <= viewportRect.width;
        } else if (d === 'top') {
          fits = (edge = offset.top - tip.height) && edge >= 0;
        } else if (d === 'left') {
          fits = (edge = offset.left - tips.width) && edge >= 0;
        } else {
          fits = true;
        }
        this.debugLog('check-direction-component', { d, edge });
        if (!fits && this.repositionToFit) {
          if (d === 'bottom') { return 'top'; }
          if (d === 'right') { return 'left'; }
          if (d === 'top') { return 'bottom'; }
          if (d === 'left') { return 'right'; }
        }
        return d;
      });
      triggerElement.setAttribute(this.attrName('direction'), newDirection.join(' '));
    }
    _updateTriggerContent(triggerElement) {
      const { triggerContent } = this;
      let content;
      if (typeof triggerContent === 'function') {
        content = triggerContent(triggerElement);
      } else {
        let contentAttribute;
        let shouldRemoveAttribute = true;
        if (triggerElement.hasAttribute(triggerContent)) {
          contentAttribute = triggerContent;
        } else if (triggerElement.hasAttribute('title')) {
          contentAttribute = 'title';
        } else if (triggerElement.hasAttribute('alt')) {
          contentAttribute = 'alt';
          shouldRemoveAttribute = false;
        } else {
          return console.error('Unsupported trigger.');
        }
        content = triggerElement.getAttribute(contentAttribute);
        if (shouldRemoveAttribute) {
          triggerElement.removeAttribute(contentAttribute);
        }
      }
      triggerElement.setAttribute(this.attrName('content'), content);
    }
    _updateTriggerElements(triggerElements) {
      if (!triggerElements) {
        triggerElements = this.elements;
      }
      triggerElements.forEach((triggerElement) => {
        triggerElement.classList.add(this.className('trigger'));
        this._updateTriggerContent(triggerElement);
        this._updateTriggerAnchoring(triggerElement);
      });
    }
    _withStealthRender(fn) {
      if (getComputedStyle(this.element).display !== 'none') {
        return fn();
      }
      this.swapClasses('hidden', 'visible', this.element);
      this.element.style.visibility = 'hidden';
      let result = fn();
      this.swapClasses('visible', 'hidden', this.element);
      this.element.style.visibility = 'visible';
      return result;
    }
  }
  Tip.debug = false;
  HLF.buildExtension(Tip, {
    autoBind: true,
    compactOptions: true,
    mixinNames: ['css', 'event', 'selection'],
  });
  Object.assign(HLF, { Tip });
  return Tip;
});
