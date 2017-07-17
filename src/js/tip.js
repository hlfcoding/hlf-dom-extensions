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
      autoDirection: true,
      cursorHeight: 12,
      defaultDirection: ['bottom', 'right'],
      doDispatchEvents: true,
      doFollow: true,
      doStem: true,
      snapToTrigger: true,
      snapToXAxis: false,
      snapToYAxis: false,
      tipTemplate({ containerClass }) {
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
    }
    deinit() {
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
    _toggleElementPositionTransition(toggled) {
      this.element.style.transition = toggled ? 'transform 0.1s linear' : '';
    }
    _updateState(name) {
      let state = this._state;
      if (name === state.name) { return; }
      state.name = name;
      this.debugLog(name);

      this._dispatchStateEvent();
      if (state.name === 'asleep' || state.name === 'awake') {
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
