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
    _updateTriggerElements(triggerElements) {
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
