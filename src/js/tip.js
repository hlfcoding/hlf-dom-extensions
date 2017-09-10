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
      hasFollowing: true,
      hasListeners: false,
      hasStem: true,
      maxLeaveDistanceToStay: 50,
      toggleDelay: 700,
      snapToTrigger: false,
      snapToXAxis: false,
      snapToYAxis: false,
      template() {
        let stemHtml = this.hasStem ? `<div class="${this.className('stem')}"></div>` : '';
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
        case 'var': return 'tip';
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
      this.hoverIntent = null;
      this._bounds = null;
      this._currentTriggerElement = null;
      this._sleepingPosition = null;
      this._state = null;
      this._stemSize = null;
      this._toggleCountdown = null;
    }
    init() {
      if (!this.snapToTrigger) {
        this.snapToTrigger = this.snapToXAxis || this.snapToYAxis;
      }
      this.element = document.createElement('div');
      this._updateState('asleep');
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
    get isAsleep() { return this._state === 'asleep'; }
    get isSleeping() { return this._state === 'sleeping'; }
    get isAwake() { return this._state === 'awake'; }
    get isWaking() { return this._state === 'waking'; }
    performSleep({ triggerElement, event, force }) {
      if (!force && (this.isAsleep || this.isSleeping)) { return; }

      this._updateState('sleeping', { event });
      this.setTimeout('_toggleCountdown', (force ? 0 : this.toggleDelay), () => {
        this._toggleElement(false, () => {
          this._updateState('asleep', { event });
        });
      });
    }
    performWake({ triggerElement, event }) {
      this._updateCurrentTriggerElement(triggerElement);
      if (this.isAwake || this.isWaking) { return; }

      let delayed = !this.isSleeping;
      if (!delayed) { this.debugLog('staying awake'); }
      this._updateState('waking', { event });
      this.setTimeout('_toggleCountdown', (!delayed ? 0 : this.toggleDelay), () => {
        this._toggleElement(true, () => {
          this._updateState('awake', { event });
        });
        this._updateElementPosition(triggerElement, event);
      });
    }
    //
    // § __Internal__
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
    _onContentElementMouseEnter(event) {
      this.debugLog('enter tip');
      let triggerElement = this._currentTriggerElement;
      if (!triggerElement) { return; }
      this.performWake({ triggerElement, event });
    }
    _onContentElementMouseLeave(event) {
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
      let triggerElement = event.target;
      if (!triggerElement.classList.contains(this.className('trigger'))) {
        triggerElement = this._currentTriggerElement;
        this._sleepEarlyIfNeeded(triggerElement, event);
      } else {
        this._updateCurrentTriggerElement(triggerElement);
      }
      if (!this.isAsleep) {
        this._updateElementPosition(triggerElement, event);
      }
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
    _sleepEarlyIfNeeded(triggerElement, event) {
      if (this.isSleeping && !this._isForceSleeping) {
        const { abs, pow, sqrt } = Math;
        const { x, y } = this._sleepingPosition;
        const { pageX, pageY } = event.detail;
        let distance = parseInt(sqrt(pow(pageX - x, 2) + pow(pageY - y, 2)));
        this.debugLog('leave distance', distance);
        if (distance > this.maxLeaveDistanceToStay) {
          this._isForceSleeping = true;
          this.performSleep({ triggerElement, event, force: true });
        }
      } else if (!this.isSleeping) {
        this._isForceSleeping = false;
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
      this.toggleEventListeners(on, {
        'mouseenter': this._onContentElementMouseEnter,
        'mouseleave': this._onContentElementMouseLeave,
      }, this._contentElement);
    }
    _toggleTriggerElementEventListeners(on) {
      if (this.hoverIntent || !on) {
        this.hoverIntent('remove');
        this.hoverIntent = null;
      }
      if (on) {
        this.hoverIntent = hoverIntent(this.elements, this.contextElement);
      }
      const { eventName } = hlf.hoverIntent;
      let listeners = {};
      listeners[eventName('enter')] = this._onTriggerElementMouseEnter;
      listeners[eventName('leave')] = this._onTriggerElementMouseLeave;
      if (this.hasFollowing) {
        listeners[eventName('track')] = this._onTriggerElementMouseMove;
      }
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
      this._contentElement.textContent = content;
    }
    _updateElementPosition(triggerElement, event) {
      let cursorHeight = this.snapToTrigger ? 0 : this.cursorHeight;
      let offset = { left: event.detail.pageX, top: event.detail.pageY };

      if (this.snapToTrigger) {
        this.debugLog(offset);
        // Note vertical directions already account for stem-size.
        if (this.snapToXAxis) {
          offset.top = triggerElement.offsetTop;
          if (this._isTriggerDirection('bottom', triggerElement)) {
            offset.top += triggerElement.offsetHeight;
          }
          if (!this.snapToYAxis) {
            // Note arbitrary buffer offset.
            offset.left -= this.element.offsetWidth / 2;
          }
        }
        if (this.snapToYAxis) {
          offset.left = triggerElement.offsetLeft;
          if (this._isTriggerDirection('right', triggerElement)) {
            offset.left += triggerElement.offsetWidth + this._getStemSize();
          } else if (this._isTriggerDirection('left', triggerElement)) {
            offset.left -= this._getStemSize();
          }
          if (!this.snapToXAxis) {
            offset.top -= this.element.offsetHeight / 2;
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
