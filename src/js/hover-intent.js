//
// HLF Hover Intent Extension
// ==========================
// [Tests](../../tests/js/hover-intent.html)
//
// The `hoverIntent` extension normalizes DOM events associated with mouse enter
// and leave interaction. It prevents the 'thrashing' of attached behaviors (ex:
// non-cancel-able animations) when matching mouse input arrives at frequencies
// past the threshold. It is heavily inspired by Brian Cherne's jQuery plugin of
// the same name (github.com/briancherne/jquery-hoverIntent).
(function(root, attach) {
  //
  // § __UMD__
  // - When AMD, register the attacher as an anonymous module.
  // - When Node or Browserify, set module exports to the attach result.
  // - When browser globals (root is window), Just run the attach function.
  //
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(hlf);
  }
})(this, function(hlf) {
  //
  // Namespace
  // ---------
  //
  // It takes some more boilerplate to write the extension. Any of this additional
  // support API is put into a extension specific namespace under `hlf`, which in
  // this case is __hlf.hoverIntent__.
  //
  // - __debug__ toggles debug logging for all instances of an extension.
  // - __toString__ helps to namespace when registering any DOM names.
  // - __attrName__, __className__, __eventName__ helpers are all attached to
  //   the namespace on extension creation, along with the __extension__ itself.
  //
  // The extension's __defaults__ are available as reference. Also note that _the
  // extension instance gets extended with the options_.
  //
  // - __interval__ is the millis to wait before deciding intent. `300` is the
  //   default to reduce more thrashing.
  //
  // - __sensitivity__ is the pixel threshold for mouse travel between polling
  //   intervals. With the minimum sensitivity threshold of 1, the mouse must
  //   not move between intervals. With higher values yield more false positives.
  //   `6` is the default.
  //
  // The events dispatched are the name-spaced `enter` and `leave` events. They
  // try to match system mouse events where possible and include values for:
  // `pageX`, `pageY`, `relatedTarget`.
  //
  hlf.hoverIntent = {
    debug: true,
    defaults: {
      interval: 300,
      sensitivity: 6,
    },
    toString(context) {
      switch (context) {
        case 'event': return 'hlfhi';
        case 'data': return 'hlf-hi';
        default: return 'hlf-hi';
      }
    },
  };
  //
  // HoverIntent
  // -----------
  //
  // To summarize the implementation, the `_onMouseOver` handler is the start of
  // the intent 'life-cycle', with state being the default. It records the mouse
  // coordinates, sets up a delayed intent check. All event handlers guard
  // against unneeded checking, with `_onMouseOut` and `_onMouseOver` also using
  // `_checkEventElement` as a filter. Meanwhile, about every frame, the
  // `_onMouseMove` handler tracks the current mouse coordinates. If the
  // `_onMouseOut` handler runs before the delayed check, the check and
  // subsequent behavior get canceled as state resets to default. Otherwise, if
  // the check of the stored mouse coordinates against `sensitivity` passes, an
  // `enter` event gets dispatched, ensuring a `leave` event will too during
  // `_onMouseOut`.
  //
  class HoverIntent {
    constructor(elementOrElements, options, contextElement) {
      this.eventListeners = {
        'mousemove': this._onMouseMove,
        'mouseout': this._onMouseOut,
        'mouseover': this._onMouseOver,
      };
    }
    init() {
      this._resetState();
    }
    deinit() {
      this._resetState();
    }
    //
    // § __Internal__
    //
    _checkEventElement(event) {
      const { relatedTarget, target, type } = event;
      if (type === 'mouseout' && target.contains(relatedTarget)) {
        return false;
      }
      if (this.contextElement) {
        if (Array.from(this.elements).indexOf(target) === -1) { return false; }
        // this.debugLog(target, relatedTarget);
      } else {
        if (target !== this.rootElement) { return false; }
      }
      return true;
    }
    _dispatchHoverEvent(on, event) {
      const { mouse: { x, y } } = this;
      let type = on ? 'enter' : 'leave';
      event.target.dispatchEvent(this.createCustomEvent(type, {
        pageX: event.pageX,
        pageY: event.pageY,
        relatedTarget: event.relatedTarget,
      }));
      this.debugLog(type, event.pageX, event.pageY, Date.now() % 100000);
    }
    _dispatchTrackEvent(event) {
      event.target.dispatchEvent(this.createCustomEvent('track', {
        pageX: event.pageX,
        pageY: event.pageY,
      }));
    }
    _onMouseMove(event) {
      if (this._trackTimeout) { return; }
      if (!this.intentional) { return; }
      this.setTimeout('_trackTimeout', 16, () => {
        this._updateState(event);
        this._dispatchTrackEvent(event);
      });
    }
    _onMouseOut(event) {
      if (!this._checkEventElement(event)) { return; }
      if (this.intentional) {
        this._dispatchHoverEvent(false, event);
      }
      this._resetState();
      this.debugLogGroup(false);
    }
    _onMouseOver(event) {
      if (this.intentional) { return; }
      if (this._timeout) { return; }
      if (!this._checkEventElement(event)) { return; }
      this.debugLogGroup();
      this._updateState(event);
      this.setTimeout('_timeout', this.interval, () => {
        this._updateState(event);
        if (this.intentional) {
          this._dispatchHoverEvent(true, event);
        }
      });
    }
    _resetState() {
      this.debugLog('reset');
      this.intentional = false;
      this.mouse = {
        x: { current: 0, previous: 0 },
        y: { current: 0, previous: 0 },
      };
      this.setTimeout('_timeout', null);
      this.setTimeout('_trackTimeout', null);
    }
    _updateState(event) {
      if (event.type === 'mousemove') {
        this.debugLog('track');
        let { mouse: { x, y } } = this;
        x.current = event.pageX;
        y.current = event.pageY;
        return;
      }
      let { mouse: { x, y } } = this;
      if (!this._timeout) {
        x.previous = event.pageX;
        y.previous = event.pageY;
        return;
      }
      this.debugLog('check');
      const { abs, pow, sqrt } = Math;
      this.intentional = (
        abs(
          sqrt(pow(x.previous, 2) + pow(y.previous, 2)) -
          sqrt(pow(x.current, 2) + pow(y.current, 2))
        ) > this.sensitivity
      );
    }
  }
  //
  // § __Attaching__
  //
  return hlf.createExtension({
    name: 'hoverIntent',
    namespace: hlf.hoverIntent,
    apiClass: HoverIntent,
    autoBind: true,
    autoListen: true,
    compactOptions: true,
  });
});
