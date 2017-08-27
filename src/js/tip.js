//
// HLF Tip Extension
// =================
// [Styles](../css/tip.html) | [Tests](../../tests/js/tip.html)
//
(function(root, attach) {
  //
  // § __UMD__
  // - When AMD, register the attacher as an anonymous module.
  // - When Node or Browserify, set module exports to the attach result.
  // - When browser globals (root is window), Just run the attach function.
  //
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core', 'hlf/hover-intent'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'), require('hlf/hover-intent'));
  } else {
    attach(hlf, hlf.hoverIntent.extension);
  }
})(this, function(hlf, hoverIntent) {
  //
  // Namespace
  // ---------
  //
  hlf.tip = {
    debug: true,
    defaults: {
      cursorHeight: 12,
      defaultDirection: ['bottom', 'right'],
      doDispatchEvents: true,
      doFollow: true,
      doStem: true,
      resizeDelay: 300,
      snapToTrigger: false,
      snapToXAxis: false,
      snapToYAxis: false,
      template() {
        let stemHtml = '';
        if (this.doStem) {
          stemHtml = `<div class="${this.className('stem')}"></div>`;
        }
        return (
`<div class="${this.className('inner')}">
  ${stemHtml}
  <div class="${this.className('content')}"></div>
</div>`
        );
      },
      triggerContent: null,
      viewportElement: document.body,
    },
    toString(context) {
      switch (context) {
        case 'event': return 'hlftip';
        case 'data': return 'hlf-tip';
        case 'class': return 'tips';
        default: return 'hlf-tip';
      }
    },
  };
  //
  // Tip
  // ---
  //
  class Tip {
    constructor(elements, options, contextElement) {
      this._bounds = null;
      this._state = null;
      this._sleepCountdown = null;
      this._wakeCountdown = null;
    }
    init() {
      if (!this.snapToTrigger) {
        this.snapToTrigger = this.snapToXAxis || this.snapToYAxis;
        this._offsetStart = null;
      }
      this.element = document.createElement('div');
      this._updateState('asleep');
      this._currentTriggerElement = null;
      this._renderElement();
      this._toggleContextMutationObserver(true);
      this._toggleElementEventListeners(true);
      this._updateTriggerElements();
      this._toggleTriggerElementEventListeners(true);
    }
    deinit() {
      this.element.parentNode.removeChild(this.element);
      this._toggleContextMutationObserver(false);
      this._toggleElementEventListeners(false);
      this._toggleTriggerElementEventListeners(false);
    }
    //
    // § __Public__
    //
    performSleep({ triggerElement, event }) {
      if (this._state === 'asleep' || this._state === 'sleeping') {
        return;
      }
      this._updateState('sleeping', { event });
      this.setTimeout('_sleepCountdown', this._getElementTransitionDuration, () => {
        this._toggleElement(false, null, () => {
          this._updateState('asleep', { event });
        });
      });
    }
    performWake({ triggerElement, event }) {
      this._updateCurrentTriggerElement(triggerElement);
      if (this._state === 'awake') {
        if (!hlf.hoverIntent.debug) {
          this.debugLog('quick update');
        }
        this._updateElementPosition(triggerElement, event);
        return;
      }
      if (this._state === 'awake' || this._state === 'waking') {
        return;
      }
      const wake = (duration) => {
        this._updateElementPosition(triggerElement, event);
        this._toggleElement(true, duration, () => {
          this._updateState('awake', { event });
        });
      };
      if (this._state === 'sleeping') {
        this.debugLog('clear sleep');
        this.setTimeout('_sleepCountdown', null);
        wake(0);
      } else if (event && event.type === hlf.hoverIntent.eventName('enter')) {
        this._updateState('waking', { event });
        this.setTimeout('_wakeCountdown', this._getElementTransitionDuration(), wake);
      }
    }
    //
    // § __Internal__
    //
    _dispatchStateEvent() {
      if (!this.doDispatchEvents) { return; }
      let triggerElement = this._currentTriggerElement;
      if (!triggerElement) { return; }
      let eventName = (() => {
        switch (this._state) {
          case 'asleep': return 'hidden';
          case 'awake': return 'shown';
          case 'sleeping': return 'hide';
          case 'waking': return 'show';
        }
      })();
      triggerElement.dispatchEvent(this.createCustomEvent(eventName));
    }
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
    _getElementTransitionDuration() {
      return this.cssDuration('transition-duration', this.element);
    }
    _getStemSize() {
      let size = this.element.getAttribute(this.attrName('stem-size'));
      if (size != null) { return parseInt(size); }

      let stemElement = this.selectByClass('stem', this.element);
      return this._withStealthRender(() => {
        let margin = getComputedStyle(stemElement).margin.replace(/0px/g, '');
        size = Math.abs(parseInt(margin));
        this.element.setAttribute(this.attrName('stem-size'), size);
        return size;
      });
    }
    _getTriggerOffset(triggerElement) {
      if (getComputedStyle(triggerElement).position === 'fixed') {
        let { left, top } = triggerElement.getBoundingClientRect();
        return { left, top };
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
      let triggerElements = [];
      mutations
        // TODO: Limited.
        .filter(m => m.target.classList.contains(this.className('content')))
        .forEach((mutation) => {
          triggerElements = triggerElements.concat(
            Array.from(mutation.addedNodes).querySelectorAll('[title],[alt]')
          );
        });
      this._updateTriggerElements(triggerElements);
      this.elements = this.elements.concat(triggerElements);
    }
    _onElementMouseEnter(event) {
      this.debugLog('enter tip');
      let triggerElement = this._currentTriggerElement;
      if (!triggerElement) { return; }
      this.performWake({ triggerElement, event });
    }
    _onElementMouseLeave(event) {
      this.debugLog('leave tip');
      let triggerElement = this._currentTriggerElement;
      if (!triggerElement) { return; }
      this.performSleep({ triggerElement, event });
    }
    _onTriggerElementMouseEnter(event) {
      this.performWake({ triggerElement: event.target, event });
    }
    _onTriggerElementMouseLeave(event) {
      this.performSleep({ triggerElement: event.target, event });
    }
    _onTriggerElementMouseMove(event) {
      this.performWake({ triggerElement: event.target, event });
    }
    _onWindowResize(event) {
      this._updateMetrics();
    }
    _renderElement() {
      if (this.element.innerHTML.length) { return; }
      this.element.innerHTML = this.template();
      this.element.classList.add(
        this.className('tip'), this.className('follow'), this.className('hidden'),
        ...(this.defaultDirection.map(this.className))
      );

      this._contentElement = this.selectByClass('content', this.element);
      this._contentElement.style.transition = 'width 0.3s ease-in-out, height 0.3s ease-in-out';

      this.viewportElement.insertBefore(this.element, this.viewportElement.firstChild);

      if (this.snapToTrigger) {
        let snapClassNames = ['snap-trigger'];
        if (this.snapToXAxis) {
          snapClassNames.push('snap-x-side');
        } else if (this.snapToYAxis) {
          snapClassNames.push('snap-y-side');
        }
        this.element.classList.add(...(snapClassNames.map(this.className)));
      }
    }
    _toggleContextMutationObserver(on) {
      if (!this._contextObserver) {
        this._contextObserver = new MutationObserver(this._onContextMutation);
        this._contextObserver.connect = () => {
          this._contextObserver.observe(this.contextElement,
            { childList: true, subtree: true }
          );
        };
      }
      if (on) {
        this._contextObserver.connect();
      } else {
        this._contextObserver.disconnect();
      }
    }
    _toggleElement(visible, duration, completion) {
      if (this._toggleAnimation) { return; }
      const delay = this.cssDuration('transition-delay', this.element);
      let { classList, style } = this.element;
      if (duration == null) {
        style.transitionDuration = duration;
        duration = this.cssDuration('transition-duration', this.element);
      } else {
        style.transitionDuration = `${duration / 1000}s`;
      }
      classList.toggle(this.className('visible'), visible);
      if (visible) {
        classList.remove(this.className('hidden'));
      }
      this.setTimeout('_toggleAnimation', delay + duration, () => {
        if (!visible) {
          classList.add(this.className('hidden'));
          style.transform = 'none';
        }
        completion();
      });
    }
    _toggleElementEventListeners(on) {
      this.toggleEventListeners(on, {
        'mouseenter': this._onElementMouseEnter,
        'mouseleave': this._onElementMouseLeave,
      }, this.element);
    }
    _toggleElementPositionTransition(toggled) {
      this.element.style.transition = toggled ? 'transform 0.1s linear' : '';
    }
    _toggleTriggerElementEventListeners(on) {
      if (this.hoverIntent || !on) {
        this.hoverIntent('remove');
      }
      if (on) {
        this.hoverIntent = hoverIntent(this.elements, this.contextElement);
      }
      const { eventName } = hlf.hoverIntent;
      let listeners = {};
      listeners[eventName('enter')] = this._onTriggerElementMouseEnter;
      listeners[eventName('leave')] = this._onTriggerElementMouseLeave;
      if (this.doFollow) {
        listeners[eventName('track')] = this._onTriggerElementMouseMove;
      }
      this.toggleEventListeners(on, listeners, this.contextElement);
    }
    _updateCurrentTriggerElement(triggerElement) {
      if (triggerElement == this._currentTriggerElement) { return; }

      this._updateElementContent(triggerElement);
      let contentSize = this._getElementSize(triggerElement, { contentOnly: true });
      this._contentElement.style.height = contentSize.height;
      this._contentElement.style.width = contentSize.width + 1; // Give some buffer.

      let compoundDirection = triggerElement.hasAttribute(this.attrName('direction')) ?
        triggerElement.getAttribute(this.attrName('direction')).split(' ') :
        this.defaultDirection;
      this.debugLog('update direction class', compoundDirection);
      let directionsClassNames = ['top', 'bottom', 'right', 'left'].map(this.className);
      this.element.classList.remove(...directionsClassNames);
      let directionClassNames = compoundDirection.map(this.className);
      this.element.classList.add(...directionClassNames);

      this._currentTriggerElement = triggerElement;
    }
    _updateElementContent(triggerElement) {
      const content = triggerElement.getAttribute(this.attrName('content'));
      this._contentElement.textContent = content;
    }
    _updateElementPosition(triggerElement, event) {
      let cursorHeight = this.snapToTrigger ? 0 : this.cursorHeight;
      let offset = { left: event.detail.pageX, top: event.detail.pageY };

      if (this.snapToTrigger) {
        this.debugLog(offset);
        // Note vertical directions already account for stem-size.
        if (this.snapToXAxis) {
          if (this._isTriggerDirection('bottom', triggerElement)) {
            offset.top += triggerElement.offsetHeight;
          }
          if (!this.snapToYAxis) {
            // Note arbitrary buffer offset.
            offset.left -= this.element.offsetWidth / 2;
          }
        }
        if (this.snapToYAxis) {
          if (this._isTriggerDirection('right', triggerElement)) {
            offset.left += triggerElement.offsetWidth + this._getStemSize();
          } else if (this._isTriggerDirection('left', triggerElement)) {
            offset.left -= this._getStemSize();
          }
          if (!this.snapToXAxis) {
            offset.top -= this.element.offsetHeight / 2 - this._getStemSize();
          }
        }
        let toTriggerOnly = !this.snapToXAxis && !this.snapToYAxis;
        if (toTriggerOnly && this._isTriggerDirection('bottom', triggerElement)) {
          offset.top += triggerElement.offsetHeight;
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

      if (this.snapToTrigger) {
        this.element.style.visibility = 'hidden';
      }
    }
    _updateMetrics() {
      let { viewportElement } = this;
      let innerHeight, innerWidth;
      if (viewportElement == document.body) {
        innerHeight = window.innerHeight;
        innerWidth = window.innerWidth;
      } else {
        innerHeight = viewportElement.clientHeight;
        innerWidth = viewportElement.clientWidth;
      }
      const { paddingLeft, paddingTop } = getComputedStyle(this.viewportElement);
      this._bounds = {
        top: parseFloat(paddingTop),
        left: parseFloat(paddingLeft),
        bottom: innerHeight,
        right: innerWidth,
      };
    }
    _updateState(state, { event } = {}) {
      if (state === this._state) { return; }
      this._state = state;
      this.debugLog(state);

      this._dispatchStateEvent();
      if (this._state === 'asleep' || this._state === 'awake') {
        if (this._currentTriggerElement) {
          this._currentTriggerElement.setAttribute(
            this.attrName('has-tip-focus'), this._state === 'awake'
          );
        }
        setTimeout(() => {
          this._toggleElementPositionTransition(false);
        }, 0);
        if (this.snapToTrigger && this._state === 'awake') {
          this.element.style.visibility = 'visible';
          this._offsetStart = { left: event.detail.pageX, top: event.detail.pageY };
        }
      } else if (this._state === 'sleeping') {
        this.setTimeout('_wakeCountdown', null);
        if (this.snapToTrigger) {
          this._offsetStart = null;
        }
      } else if (this._state === 'waking') {
        this.setTimeout('_sleepCountdown', null);
      }
    }
    _updateTriggerAnchoring(triggerElement) {
      let offset = this._getTriggerOffset(triggerElement);
      let height = triggerElement.offsetHeight;
      let width = triggerElement.offsetWidth;
      let tip = this._getElementSize(triggerElement);
      this.debugLog({ offset, height, width, tip });
      let newDirection = this.defaultDirection.map((d) => {
        if (!this._bounds) {
          this._updateMetrics();
        }
        const bounds = this._bounds;
        let edge, fits;
        if (d === 'bottom') {
          fits = (edge = offset.top + height + tip.height) && bounds.bottom > edge;
        } else if (d === 'right') {
          fits = (edge = offset.left + tip.width) && bounds.right > edge;
        } else if (d === 'top') {
          fits = (edge = offset.top - tip.height) && bounds.top < edge;
        } else if (d === 'left') {
          fits = (edge = offset.left - tips.width) && bounds.left < edge;
        } else {
          fits = true;
        }
        this.debugLog('check-direction-component', { d, edge });
        if (!fits) {
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
      let content, contentAttribute;
      let shouldRemoveAttribute = true;
      if (triggerContent) {
        if (typeof triggerContent === 'function') {
          content = triggerContent(triggerElement);
        } else {
          contentAttribute = triggerContent;
        }
      } else {
        if (triggerElement.hasAttribute('title')) {
          contentAttribute = 'title';
        } else if (triggerElement.hasAttribute('alt')) {
          contentAttribute = 'alt';
          shouldRemoveAttribute = false;
        }
      }
      if (contentAttribute) {
        content = triggerElement.getAttribute(contentAttribute);
        if (shouldRemoveAttribute) {
          triggerElement.removeAttribute(contentAttribute);
        }
      }
      if (content) {
        triggerElement.setAttribute(this.attrName('content'), content);
      }
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
  //
  // § __Attaching__
  //
  return hlf.createExtension({
    name: 'tip',
    namespace: hlf.tip,
    apiClass: Tip,
    asSharedInstance: true,
    autoBind: true,
    autoListen: true,
    baseMethodGroups: ['css', 'selection'],
    compactOptions: true,
  });
});
