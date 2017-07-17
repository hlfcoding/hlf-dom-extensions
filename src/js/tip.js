(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core', 'hlf/hover-intent'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'), require('hlf/hover-intent'));
  } else {
    attach(hlf);
  }
})(this, function(hlf, hoverIntent) {
  hlf.tip = {
    debug: true,
    defaults: {
      cursorHeight: 12,
      defaultDirection: ['bottom', 'right'],
      doDispatchEvents: true,
      doFollow: true,
      doStem: true,
      snapToTrigger: true,
      snapToXAxis: false,
      snapToYAxis: false,
      template({ containerClass }) {
        let stemHtml = '';
        if (this.doStem) {
          stemHtml = `<div class="${this.className('stem')}"></div>`;
        }
        return (
`<div class="${containerClass}">
  <div class="${this.className('inner')}">
    ${stemHtml}
    <div class="${this.className('content')}"></div>
  </div>
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
  class Tip {
    constructor(elements, options, contextElement) {
      this._bounds = null;
      this._state = {
        name: null,
        sleepCountdown: null,
        wakeCountdown: null,
      };
    }
    init() {
      this.element = document.createElement('div');
      this._updateState('asleep');
      this._currentTriggerElement = null;
      this._renderElement();
      this._toggleContextMutationObserver(true);
      this._toggleElementEventListeners(true);
      this._updateTriggerElements();
      window.addEventListener('resize', this._onWindowResize);
    }
    deinit() {
      this.element.parentNode.removeChild(this.element);
      this._toggleContextMutationObserver(false);
      this._toggleElementEventListeners(false);
      window.removeEventListener('resize', this._onWindowResize);
    }
    performSleep({ triggerElement, event }) {
    }
    performWake({ triggerElement, event }) {
    }
    _dispatchStateEvent() {
      if (!this.doDispatchEvents) { return; }
      let triggerElement = this._currentTriggerElement;
      if (!triggerElement) { return; }
      let eventName = (() => {
        switch (this._state.name) {
          case 'asleep': return 'hidden';
          case 'awake': return 'shown';
          case 'sleeping': return 'hide';
          case 'waking': return 'show';
        }
      }());
      triggerElement.dispatchEvent(this.createCustomEvent(eventName));
    }
    _getElementSize(triggerElement, contentOnly = false) {
      let size = {
        height: triggerElement.getAttribute(this.attrName('height')),
        width: triggerElement.getAttribute(this.attrName('width')),
      };
      let contentElement = this.selectByClass('content', this.element);
      if (!size.height || !size.width) {
        contentElement.textContent = triggerElement.getAttribute(this.attrName('content'));
        this._withStealthRender(() => {
          triggerElement.setAttribute(this.attrName('height')
            (size.height = this.element.offsetHeight));
          triggerElement.setAttribute(this.attrName('width')
            (size.width = this.element.offsetWidth));
        });
      }
      if (contentOnly) {
        const { paddingTop, paddingLeft, paddingBottom, paddingRight } =
          getComputedStyle(contentElement);
        size.height -= parseFloat(paddingTop) + parseFloat(paddingBottom);
        size.width -= parseFloat(paddingLeft) + parseFloat(paddingRight);
      }
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
      this.triggerElements = this.triggerElements.concat(triggerElements);
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
    _onWindowResize(event) {
      const delay = 300;
      const now = Date.now();
      if (this._ran && now < this._ran + delay) { return; }
      this._ran = now;
      this._updateMetrics();
    }
    _renderElement() {
      if (this.element.innerHTML.length) { return; }
      let directionClass = this.defaultDirection.reduce(
        (memo, component) => { return `${memo} ${this.className(component)}`; },
      '').trim();
      this.element.innerHTML = this.template({
        containerClass: `${this.className('tip')} ${this.className('follow')} ${directionClass}`,
      });

      let contentElement = this.element.querySelector(this.className('content'));
      contentElement.style.transition = 'width 0.3s ease-in-out, height 0.3s ease-in-out';

      this.viewportElement.insertBefore(this.element, this.viewportElement.firstChild);
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
    _toggleElementEventListeners(on) {
      this.toggleEventListeners(on, {
        'mouseenter': this._onElementMouseEnter,
        'mouseleave': this._onElementMouseLeave,
      }, this.element);
    }
    _toggleElementPositionTransition(toggled) {
      this.element.style.transition = toggled ? 'transform 0.1s linear' : '';
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
    _updateState(name) {
      let state = this._state;
      if (name === state.name) { return; }
      state.name = name;
      this.debugLog(name);

      this._dispatchStateEvent();
      if (state.name === 'asleep' || state.name === 'awake') {
        if (this._currentTriggerElement) {
          this._currentTriggerElement.setAttribute(
            this.attrName('has-tip-focus'), state.name === 'awake'
          );
        }
        setTimeout(() => {
          this._toggleElementPositionTransition(false);
        }, 0);
      } else if (state.name === 'sleeping') {
        clearTimeout(state.wakeCountdown);
        state.wakeCountdown = null;
      } else if (state.name === 'waking') {
        clearTimeout(state.sleepCountdown);
        state.sleepCountdown = null;
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
        triggerElements = this.triggerElements;
      }
      triggerElements.forEach((triggerElement) => {
        triggerElement.classList.add(this.className('trigger'));
        this._updateTriggerContent(triggerElement);
        this._updateTriggerAnchoring(triggerElement);
      });
    }
    _withStealthRender(fn) {
      if (getComputedStyle(this.element).display === 'none') {
        return fn();
      }
      let { style } = this.element;
      style.display = 'block';
      style.visibility = 'hidden';
      let result = fn();
      style.display = 'none';
      style.visibility = 'visible';
      return result;
    }
  }
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
