
/*
HLF Event jQuery Extension
==========================
 */

(function() {
  var slice = [].slice,
    hasProp = {}.hasOwnProperty;

  (function(root, attach) {
    if (typeof define === 'function' && (define.amd != null)) {
      define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core'], attach);
    } else if (typeof exports === 'object') {
      module.exports = attach(require('jquery', require('underscore', require('hlf/jquery.extension.hlf.core'))));
    } else {
      attach(jQuery, _, jQuery.hlf);
    }
  })(this, function($, _, hlf) {
    'use strict';
    $.extend(true, hlf, {
      hoverIntent: {
        debug: false,
        mouse: {
          x: {
            current: 0,
            previous: 0
          },
          y: {
            current: 0,
            previous: 0
          }
        },
        sensitivity: 8,
        interval: 300,
        toString: _.memoize(function(context) {
          switch (context) {
            case 'attr':
              return 'hlf-hover-intent';
            default:
              return 'hlf.hoverIntent';
          }
        })
      }
    });
    return (function(hoverIntent, mouse) {
      var attr, check, debugLog, defaultState, getComputedState, performCheck, setupCheckIfNeeded, teardownCheckIfNeeded, trackMouse, triggerEvent;
      attr = function(name) {
        if (name == null) {
          name = '';
        }
        return (hoverIntent.toString('attr')) + "-" + name;
      };
      debugLog = hoverIntent.debug === false ? $.noop : function() {
        hlf.debugLog.apply(hlf, [hoverIntent.toString('log')].concat(slice.call(arguments)));
      };
      defaultState = {
        intentional: true,
        timer: {
          cleared: true,
          timeout: null
        },
        sensitivity: hoverIntent.sensitivity,
        interval: hoverIntent.interval
      };
      getComputedState = function($trigger) {
        var key, state, value;
        state = {};
        for (key in defaultState) {
          if (!hasProp.call(defaultState, key)) continue;
          value = defaultState[key];
          if ($.isPlainObject(value)) {
            value = _.clone(value);
          }
          state[key] = $trigger.data(attr(key)) || value;
        }
        return state;
      };
      check = function(event) {
        var $trigger, didTeardown, state;
        $trigger = $(this);
        state = getComputedState($trigger);
        debugLog(state);
        didTeardown = teardownCheckIfNeeded(event, $trigger, state);
        if (didTeardown === false) {
          setupCheckIfNeeded(event, $trigger, state);
        }
      };
      setupCheckIfNeeded = function(event, $trigger, state) {
        if (state.timer.cleared === false && (state.timer.timeout != null)) {
          return false;
        }
        debugLog('setup');
        state.timer.timeout = setTimeout(function() {
          debugLog('check and update');
          return performCheck(event, $trigger, state);
        }, state.interval);
        state.timer.cleared = false;
        $trigger.data(attr('timer'), state.timer);
        return true;
      };
      teardownCheckIfNeeded = function(event, $trigger, state) {
        if (event.type !== 'mouseleave') {
          return false;
        }
        if (state.timer.cleared === false) {
          debugLog('teardown');
          clearTimeout(state.timer.timeout);
          $trigger.removeData(attr('timer')).removeData(attr('intentional'));
        }
        triggerEvent('truemouseleave', $trigger, event);
        return true;
      };
      performCheck = function(event, $trigger, state) {
        state.intentional = (Math.abs(mouse.x.previous - mouse.x.current) + Math.abs(mouse.y.previous - mouse.y.current)) > state.sensitivity;
        mouse.x.previous = event.pageX;
        mouse.y.previous = event.pageY;
        if (state.intentional === true && event.type === 'mouseover') {
          triggerEvent('truemouseenter', $trigger, event);
        }
        state.timer.cleared = true;
        $trigger.data(attr('intentional'), state.intentional);
        $trigger.data(attr('timer'), state.timer);
      };
      trackMouse = _.throttle(function(event) {
        mouse.x.current = event.pageX;
        mouse.y.current = event.pageY;
      }, 16);
      triggerEvent = function(name, $trigger, oldEvent) {
        var event;
        event = new $.Event(name, {
          pageX: mouse.x.current,
          pageY: mouse.y.current,
          relatedTarget: oldEvent.relatedTarget
        });
        debugLog(name);
        $trigger.trigger(event);
      };
      $.event.special.truemouseenter = {
        setup: function(data, namespaces) {
          $(this).on({
            mouseover: check,
            mousemove: trackMouse
          }, data != null ? data.selector : void 0);
        },
        teardown: function(data, namespaces) {
          $(this).off({
            mouseover: check,
            mousemove: trackMouse
          }, data != null ? data.selector : void 0);
        }
      };
      return $.event.special.truemouseleave = {
        setup: function(data, namespaces) {
          $(this).on({
            mouseleave: check
          }, data != null ? data.selector : void 0);
        },
        teardown: function(data, namespaces) {
          $(this).off({
            mouseleave: check
          }, data != null ? data.selector : void 0);
        }
      };
    })(hlf.hoverIntent, hlf.hoverIntent.mouse);
  });

}).call(this);
