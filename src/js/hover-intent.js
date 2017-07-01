//
// HLF Hover Intent Extension
// ==========================
//
(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(hlf);
  }
})(this, function(hlf) {
  hlf.hoverIntent = {
    debug: true,
    defaults: {
      interval: 300,
      sensitivity: 8,
    },
    toString(context) {
      switch (context) {
        case 'event': return 'hlfhi';
        case 'data': return 'hlf-hi';
        default: return 'hlf-hi';
      }
    },
  };
  class HoverIntent {
    constructor(element, options) {
      this.eventListeners = {
        'mouseleave': this._onMouseLeave,
        'mousemove': this._onMouseMove,
        'mouseover': this._onMouseOver,
      };
    }
    init() {
      this._setDefaultState();
    }
    deinit() {
      // TODO
    }
    _dispatchHoverEvent(on, mouseEvent) {
      const { mouse: { x, y } } = this;
      let type = on ? 'enter' : 'leave';
      this.dispatchCustomEvent(type, {
        pageX: x.current,
        pageY: y.current,
        relatedTarget: mouseEvent.relatedTarget,
      });
      this.debugLog(type, x.current, y.current, Date.now() % 100000);
    }
    _onMouseLeave(event) {
      let { timer } = this;
      if (timer.cleared) { return; }
      this.debugLog('teardown');
      clearTimeout(timer.timeout);
      clearTimeout(this.trackTimeout);
      this._setDefaultState();
      this._dispatchHoverEvent(false, event);
    }
    _onMouseMove(event) {
      if (this.trackTimeout != null) { return; }
      this.trackTimeout = setTimeout(() => {
        this.debugLog('track');
        let { mouse: { x, y } } = this;
        x.current = event.pageX;
        y.current = event.pageY;
        this.trackTimeout = null;
      }, 16);
    }
    _onMouseOver(event) {
      let { timer } = this;
      if (!timer.cleared && timer.timeout != null) { return; }
      this.debugLog('setup');
      timer.timeout = setTimeout(() => {
        this._setState(event);
        if (this.intentional) {
          this._dispatchHoverEvent(true, event);
        }
      }, this.interval);
      timer.cleared = false;
    }
    _setDefaultState() {
      this.debugLog('reset');
      this.intentional = true;
      this.mouse = {
        x: { current: 0, previous: 0 },
        y: { current: 0, previous: 0 },
      };
      this.timer = { cleared: true, timeout: null };
      this.trackTimeout = null;
    }
    _setState(event) {
      this.debugLog('update');
      let { mouse: { x, y }, timer } = this;
      this.intentional = (
        Math.abs(x.previous - x.current) + Math.abs(y.previous - y.current) >
        this.sensitivity
      );
      x.previous = event.pageX;
      y.previous = event.pageY;
      timer.cleared = true;
    }
  }
  return hlf.createExtension({
    name: 'hoverIntent',
    namespace: hlf.hoverIntent,
    apiClass: HoverIntent,
    autoBind: true,
    autoListen: true,
    baseMethodGroups: ['event'],
    compactOptions: true,
  });
});
