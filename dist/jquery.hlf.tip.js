
/*
HLF Tip jQuery Plugin
=====================
 */

(function() {
  var hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function(root, attach) {
    if (typeof define === 'function' && (define.amd != null)) {
      define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core', 'hlf/jquery.extension.hlf.event'], attach);
    } else if (typeof module === 'object' && (module.exports != null)) {
      module.exports = attach(require('jquery', require('underscore', require('hlf/jquery.extension.hlf.core', require('hlf/jquery.extension.hlf.event')))));
    } else {
      attach(jQuery, _, jQuery.hlf);
    }
  })(this, function($, _, hlf) {
    var SnapTip, Tip, _requestAnimationFrame, ref;
    _requestAnimationFrame = window.requireAnimationFrame || ((ref = window.Modernizr) != null ? ref.prefixed('requestAnimationFrame', window) : void 0);
    hlf.tip = {
      debug: false,
      toString: _.memoize(function(context) {
        switch (context) {
          case 'event':
            return '.hlf.tip';
          case 'data':
            return 'hlf-tip';
          case 'class':
            return 'js-tips';
          default:
            return 'hlf.tip';
        }
      }),
      defaults: (function(pre) {
        var ref1;
        return {
          $viewport: $('body'),
          autoDirection: true,
          cursorHeight: 12,
          defaultDirection: ['bottom', 'right'],
          fireEvents: true,
          tipTemplate: function(containerClass) {
            var stemHtml;
            if (this.doStem === true) {
              stemHtml = "<div class='" + this.classNames.stem + "'></div>";
            }
            return "<div class=\"" + containerClass + "\">\n  <div class=\"" + this.classNames.inner + "\">\n    " + stemHtml + "\n    <div class='" + this.classNames.content + "'></div>\n  </div>\n</div>";
          },
          triggerContent: null,
          classNames: (function() {
            var classNames, j, key, keys, len;
            classNames = {};
            keys = ['inner', 'content', 'stem', 'top', 'right', 'bottom', 'left', 'follow', 'trigger'];
            for (j = 0, len = keys.length; j < len; j++) {
              key = keys[j];
              classNames[key] = "" + pre + key;
            }
            classNames.tip = 'js-tip';
            return classNames;
          })(),
          animator: {
            show: function($el, options) {
              return $el.stop().fadeIn(options);
            },
            hide: function($el, options) {
              return $el.stop().fadeOut(options);
            }
          },
          animations: {
            base: {
              delay: 0,
              duration: 200,
              enabled: true
            },
            show: {
              delay: 200
            },
            hide: {
              delay: 200
            },
            resize: {
              delay: 300,
              easing: 'ease-in-out'
            }
          },
          followUsingTransform: (ref1 = window.Modernizr) != null ? ref1.csstransforms : void 0
        };
      })('js-tip-')
    };
    hlf.tip.snap = {
      debug: false,
      toString: _.memoize(function(context) {
        switch (context) {
          case 'event':
            return '.hlf.snap-tip';
          case 'data':
            return 'hlf-snap-tip';
          case 'class':
            return 'js-snap-tips';
          default:
            return 'hlf.tip.snap';
        }
      }),
      defaults: (function(pre) {
        var deep;
        return $.extend((deep = true), {}, hlf.tip.defaults, {
          snap: {
            toTrigger: true,
            toXAxis: false,
            toYAxis: false
          },
          classNames: (function() {
            var classNames, dictionary, key, value;
            classNames = {
              snap: {}
            };
            dictionary = {
              toXAxis: 'x-side',
              toYAxis: 'y-side',
              toTrigger: 'trigger'
            };
            for (key in dictionary) {
              if (!hasProp.call(dictionary, key)) continue;
              value = dictionary[key];
              classNames.snap[key] = "" + pre + value;
            }
            classNames.tip = 'js-tip js-snap-tip';
            return classNames;
          })()
        });
      })('js-snap-tip-')
    };
    Tip = (function() {
      function Tip($triggers1, options, $context) {
        var animation, name, ref1;
        this.$triggers = $triggers1;
        this.$context = $context;
        this._setTip = bind(this._setTip, this);
        ref1 = options.animations;
        for (name in ref1) {
          if (!hasProp.call(ref1, name)) continue;
          animation = ref1[name];
          if (name !== 'base') {
            _.defaults(animation, options.animations.base);
          }
        }
      }

      Tip.prototype.init = function() {
        _.bindAll(this, '_onTriggerMouseMove', '_setBounds');
        this._setTip($('<div>'));
        this.doStem = this.classNames.stem !== '';
        this.doFollow = this.classNames.follow !== '';
        this._setState('asleep');
        this._wakeCountdown = null;
        this._sleepCountdown = null;
        this._$currentTrigger = null;
        this._render();
        this._bind();
        this._bindContext();
        this._processTriggers();
        this._bindTriggers();
      };

      Tip.prototype._defaultHtml = function() {
        var containerClass, directionClass, html;
        directionClass = $.trim(_.reduce(this.defaultDirection, (function(_this) {
          return function(classListMemo, directionComponent) {
            return classListMemo + " " + _this.classNames[directionComponent];
          };
        })(this), ''));
        containerClass = $.trim([this.classNames.tip, this.classNames.follow, directionClass].join(' '));
        return html = this.tipTemplate(containerClass);
      };

      Tip.prototype._isDirection = function(directionComponent, $trigger) {
        return this.$tip.hasClass(this.classNames[directionComponent]) || ((($trigger == null) || !$trigger.data(this.attr('direction'))) && _.include(this.defaultDirection, directionComponent));
      };

      Tip.prototype._offsetForTrigger = function($trigger) {
        if ($trigger.css('position') === 'fixed') {
          return $trigger.offset();
        } else {
          return $trigger.position();
        }
      };

      Tip.prototype._setCurrentTrigger = function($trigger) {
        this._triggerChanged = !$trigger.is(this._$currentTrigger);
        if (!this._triggerChanged) {
          return false;
        }
        this._inflateByTrigger($trigger);
        this._$currentTrigger = $trigger;
      };

      Tip.prototype._setState = function(state, data) {
        var isLeavingToContext, ref1, ref2, ref3, ref4;
        if (state === this._state) {
          return false;
        }
        this._state = state;
        this.debugLog(this._state);
        switch (state) {
          case 'asleep':
            if (this.fireEvents === true) {
              if ((ref1 = this._$currentTrigger) != null) {
                ref1.trigger(this.evt('hidden'));
              }
            }
            this.afterHide(data != null ? data.event : void 0);
            _.defer((function(_this) {
              return function() {
                return _this._togglePositionTransition(false);
              };
            })(this));
            break;
          case 'awake':
            if (this.fireEvents === true) {
              if ((ref2 = this._$currentTrigger) != null) {
                ref2.trigger(this.evt('shown'));
              }
            }
            this.afterShow(data != null ? data.event : void 0);
            _.defer((function(_this) {
              return function() {
                return _this._togglePositionTransition(false);
              };
            })(this));
            break;
          case 'sleeping':
            if (this.fireEvents === true) {
              if ((ref3 = this._$currentTrigger) != null) {
                ref3.trigger(this.evt('hide'));
              }
            }
            clearTimeout(this._wakeCountdown);
            if (((data != null ? data.event : void 0) != null) && $(data.event.target).hasClass(this.classNames.trigger)) {
              isLeavingToContext = !$(data.event.relatedTarget).hasClass(this.classNames.trigger);
              this._togglePositionTransition(isLeavingToContext);
            }
            break;
          case 'waking':
            if (this.fireEvents === true) {
              if ((ref4 = this._$currentTrigger) != null) {
                ref4.trigger(this.evt('show'));
              }
            }
            clearTimeout(this._sleepCountdown);
            this._triggerChanged = true;
        }
      };

      Tip.prototype._setTip = function($tip) {
        this.$tip = this.$el = $tip;
      };

      Tip.prototype._sizeForTrigger = function($trigger, contentOnly) {
        var $content, bottom, left, padding, ref1, right, side, size, top, wrapped;
        if (contentOnly == null) {
          contentOnly = false;
        }
        size = {
          width: $trigger.data('width'),
          height: $trigger.data('height')
        };
        $content = this.selectByClass('content');
        if (!((size.width != null) && (size.height != null))) {
          $content.text($trigger.data(this.attr('content')));
          wrapped = this._wrapStealthRender(function() {
            $trigger.data('width', (size.width = this.$tip.outerWidth()));
            return $trigger.data('height', (size.height = this.$tip.outerHeight()));
          });
          wrapped();
        }
        if (contentOnly === true) {
          padding = $content.css('padding').split(' ');
          ref1 = (function() {
            var j, len, results;
            results = [];
            for (j = 0, len = padding.length; j < len; j++) {
              side = padding[j];
              results.push(parseInt(side, 10));
            }
            return results;
          })(), top = ref1[0], right = ref1[1], bottom = ref1[2], left = ref1[3];
          if (bottom == null) {
            bottom = top;
          }
          if (left == null) {
            left = right;
          }
          size.width -= left + right;
          size.height -= top + bottom;
        }
        return size;
      };

      Tip.prototype._stemSize = function() {
        var $stem, key, size, wrapped;
        key = this.attr('stem-size');
        size = this.$tip.data(key);
        if (size != null) {
          return size;
        }
        $stem = this.selectByClass('stem');
        wrapped = this._wrapStealthRender((function(_this) {
          return function() {
            size = Math.abs(parseInt($stem.css('margin').replace(/0px/g, ''), 10));
            _this.$tip.data(key, size);
            return size;
          };
        })(this));
        return wrapped();
      };

      Tip.prototype.wakeByTrigger = function($trigger, event) {
        var deferred, promise, ref1, updateBeforeWake, wake;
        deferred = $.Deferred();
        promise = deferred.promise();
        this._setCurrentTrigger($trigger);
        updateBeforeWake = (function(_this) {
          return function() {
            _this._positionToTrigger($trigger, event);
            return _this.onShow(event);
          };
        })(this);
        if (this._state === 'awake') {
          this.debugLog('quick update');
          updateBeforeWake();
          deferred.resolve();
          return promise;
        }
        if (event != null) {
          this.debugLog(event.type);
        }
        if ((ref1 = this._state) === 'awake' || ref1 === 'waking') {
          deferred.reject();
          return promise;
        }
        wake = (function(_this) {
          return function(duration) {
            var options;
            updateBeforeWake();
            options = _.defaults({
              duration: duration
            }, _this.animations.show);
            options.done = function() {
              _this._setState('awake', {
                event: event
              });
              return deferred.resolve();
            };
            options.fail = function() {
              return deferred.reject();
            };
            _this.animator.show(_this.$tip, options);
            return _this.$tip.siblings(_this.classNames.tip).each(function(idx, el) {
              options = _.defaults({
                duration: duration
              }, _this.animation.hide);
              return _this.animator.hide($el, options);
            });
          };
        })(this);
        if (this._state === 'sleeping') {
          this.debugLog('clear sleep');
          clearTimeout(this._sleepCountdown);
          wake(0);
        } else if ((event != null) && event.type === 'truemouseenter') {
          this._setState('waking', {
            event: event
          });
          this._wakeCountdown = setTimeout(wake, this.animations.show.delay);
        }
        return promise;
      };

      Tip.prototype.sleepByTrigger = function($trigger, event) {
        var deferred, promise, ref1;
        deferred = $.Deferred();
        promise = deferred.promise();
        if ((ref1 = this._state) === 'asleep' || ref1 === 'sleeping') {
          deferred.reject();
          return promise;
        }
        this._setState('sleeping', {
          event: event
        });
        this._sleepCountdown = setTimeout((function(_this) {
          return function() {
            var options;
            _this.onHide();
            options = _.clone(_this.animations.hide);
            options.done = function() {
              _this._setState('asleep', {
                event: event
              });
              return deferred.resolve();
            };
            options.fail = function() {
              return deferred.reject();
            };
            return _this.animator.hide(_this.$tip, options);
          };
        })(this), this.animations.hide.delay);
        return promise;
      };

      Tip.prototype._togglePositionTransition = function(toggled) {
        var rest, transition;
        rest = '0.1s linear';
        transition = toggled ? (this.followUsingTransform ? "transform " + rest : "top " + rest + ", left " + rest) : '';
        this.$tip.css('transition', transition);
      };

      Tip.prototype._saveTriggerContent = function($trigger) {
        var attr, canRemoveAttr, content;
        content = null;
        attr = null;
        canRemoveAttr = true;
        if (this.triggerContent != null) {
          if (_.isFunction(this.triggerContent)) {
            content = this.triggerContent($trigger);
          } else {
            attr = this.triggerContent;
          }
        } else {
          if ($trigger.is('[title]')) {
            attr = 'title';
          } else if ($trigger.is('[alt]')) {
            attr = 'alt';
            canRemoveAttr = false;
          }
        }
        if (attr != null) {
          content = $trigger.attr(attr);
          if (canRemoveAttr) {
            $trigger.removeAttr(attr);
          }
        }
        if (content != null) {
          $trigger.data(this.attr('content'), content);
        }
      };

      Tip.prototype._bind = function() {
        this.$tip.on({
          mouseenter: (function(_this) {
            return function(event) {
              _this.debugLog('enter tip');
              if (_this._$currentTrigger != null) {
                _this._$currentTrigger.data(_this.attr('is-active'), true);
                return _this.wakeByTrigger(_this._$currentTrigger, event);
              }
            };
          })(this),
          mouseleave: (function(_this) {
            return function(event) {
              _this.debugLog('leave tip');
              if (_this._$currentTrigger != null) {
                _this._$currentTrigger.data(_this.attr('is-active'), false);
                return _this.sleepByTrigger(_this._$currentTrigger, event);
              }
            };
          })(this)
        });
        if (this.autoDirection === true) {
          $(window).resize(_.debounce(this._setBounds, 300));
        }
      };

      Tip.prototype._bindContext = function() {
        var selector;
        if (window.MutationObserver == null) {
          return false;
        }
        selector = this.$triggers.selector;
        this._mutationObserver = new MutationObserver((function(_this) {
          return function(mutations) {
            var $target, $triggers, j, len, mutation, results;
            results = [];
            for (j = 0, len = mutations.length; j < len; j++) {
              mutation = mutations[j];
              $target = $(mutation.target);
              if ($target.hasClass(_this.classNames.content)) {
                continue;
              }
              if (mutation.addedNodes.length) {
                $triggers = $(mutation.addedNodes).find('[title],[alt]');
                _this._processTriggers($triggers);
                results.push(_this.$triggers = _this.$triggers.add($triggers));
              } else {
                results.push(void 0);
              }
            }
            return results;
          };
        })(this));
        this._mutationObserver.observe(this.$context[0], {
          childList: true,
          subtree: true
        });
      };

      Tip.prototype._bindTriggers = function() {
        var onMouseMove, selector;
        selector = "." + this.classNames.trigger;
        this.$context.on([this.evt('truemouseenter'), this.evt('truemouseleave')].join(' '), selector, {
          selector: selector
        }, (function(_this) {
          return function(event) {
            _this.debugLog(event.type);
            switch (event.type) {
              case 'truemouseenter':
                _this._onTriggerMouseMove(event);
                break;
              case 'truemouseleave':
                _this.sleepByTrigger($(event.target), event);
                break;
              default:
                _this.debugLog('unknown event type', event.type);
            }
            return event.stopPropagation();
          };
        })(this));
        if (this.doFollow === true) {
          if (_requestAnimationFrame != null) {
            onMouseMove = (function(_this) {
              return function(event) {
                return _requestAnimationFrame(function(timestamp) {
                  return _this._onTriggerMouseMove(event);
                });
              };
            })(this);
          } else {
            onMouseMove = _.throttle(this._onTriggerMouseMove, 16);
          }
          this.$context.on('mousemove', selector, onMouseMove);
        }
      };

      Tip.prototype._onTriggerMouseMove = function(event) {
        var $trigger;
        if (event.pageX == null) {
          return false;
        }
        $trigger = ($trigger = $(event.currentTarget)) && $trigger.hasClass(this.classNames.trigger) ? $trigger : $trigger.closest(this.classNames.trigger);
        if (!$trigger.length) {
          return false;
        }
        this.wakeByTrigger($trigger, event);
      };

      Tip.prototype._positionToTrigger = function($trigger, mouseEvent, cursorHeight) {
        var css, offset, tipWidth, triggerWidth;
        if (cursorHeight == null) {
          cursorHeight = this.cursorHeight;
        }
        if (mouseEvent == null) {
          return false;
        }
        offset = {
          top: mouseEvent.pageY,
          left: mouseEvent.pageX
        };
        offset = this.offsetOnTriggerMouseMove(mouseEvent, offset, $trigger) || offset;
        if (this._isDirection('top', $trigger)) {
          offset.top -= this.$tip.outerHeight() + this._stemSize();
        } else if (this._isDirection('bottom', $trigger)) {
          offset.top += this._stemSize() + cursorHeight;
        }
        if (this._isDirection('left', $trigger)) {
          tipWidth = this.$tip.outerWidth();
          triggerWidth = $trigger.outerWidth();
          offset.left -= tipWidth;
          if (tipWidth > triggerWidth) {
            offset.left += triggerWidth;
          }
        }
        css = this.followUsingTransform ? {
          top: 0,
          left: 0,
          transform: "translate(" + offset.left + "px, " + offset.top + "px)"
        } : offset;
        this.$tip.css(css);
      };

      Tip.prototype._setBounds = function() {
        var $viewport;
        $viewport = this.$viewport.is('body') ? $(window) : this.$viewport;
        this._bounds = {
          top: $.css(this.$viewport[0], 'padding-top', true),
          left: $.css(this.$viewport[0], 'padding-left', true),
          bottom: $viewport.innerHeight(),
          right: $viewport.innerWidth()
        };
      };

      Tip.prototype._inflateByTrigger = function($trigger) {
        var $content, compoundDirection, contentOnly, contentSize;
        $content = this.selectByClass('content');
        $content.text($trigger.data(this.attr('content')));
        if (this.animations.resize.enabled) {
          contentSize = this._sizeForTrigger($trigger, (contentOnly = true));
          $content.width(contentSize.width + 1).height(contentSize.height);
        }
        compoundDirection = $trigger.data(this.attr('direction')) ? $trigger.data(this.attr('direction')).split(' ') : this.defaultDirection;
        this.debugLog('update direction class', compoundDirection);
        this.$tip.removeClass(_.chain(this.classNames).pick('top', 'bottom', 'right', 'left').values().join(' ').value()).addClass($.trim(_.reduce(compoundDirection, (function(_this) {
          return function(classListMemo, directionComponent) {
            return classListMemo + " " + _this.classNames[directionComponent];
          };
        })(this), '')));
      };

      Tip.prototype._render = function() {
        var $tip, duration, easing, html, transitionStyle;
        if (this.$tip.html().length) {
          return false;
        }
        html = this.htmlOnRender();
        if (!((html != null) && html.length)) {
          html = this._defaultHtml();
        }
        $tip = $(html).addClass(this.classNames.follow);
        transitionStyle = [];
        if (this.animations.resize.enabled) {
          duration = this.animations.resize.duration / 1000.0 + 's';
          easing = this.animations.resize.easing;
          transitionStyle.push("width " + duration + " " + easing, "height " + duration + " " + easing);
        }
        this._setTip($tip);
        this.selectByClass('content').css('transition', transitionStyle.join(','));
        this.$tip.prependTo(this.$viewport);
      };

      Tip.prototype._processTriggers = function($triggers) {
        if ($triggers == null) {
          $triggers = this.$triggers;
        }
        $triggers.each((function(_this) {
          return function(i, el) {
            var $trigger;
            $trigger = $(el);
            if (!$trigger.length) {
              return false;
            }
            $trigger.addClass(_this.classNames.trigger);
            _this._saveTriggerContent($trigger);
            return _this._updateDirectionByTrigger($trigger);
          };
        })(this));
      };

      Tip.prototype._updateDirectionByTrigger = function($trigger) {
        var component, edge, j, len, newDirection, ok, ref1, tipSize, triggerHeight, triggerOffset, triggerWidth;
        if (this.autoDirection === false) {
          return false;
        }
        triggerOffset = this._offsetForTrigger($trigger);
        triggerWidth = $trigger.outerWidth();
        triggerHeight = $trigger.outerHeight();
        tipSize = this._sizeForTrigger($trigger);
        newDirection = _.clone(this.defaultDirection);
        this.debugLog({
          triggerOffset: triggerOffset,
          triggerWidth: triggerWidth,
          triggerHeight: triggerHeight,
          tipSize: tipSize
        });
        ref1 = this.defaultDirection;
        for (j = 0, len = ref1.length; j < len; j++) {
          component = ref1[j];
          if (this._bounds == null) {
            this._setBounds();
          }
          ok = true;
          switch (component) {
            case 'bottom':
              ok = (edge = triggerOffset.top + triggerHeight + tipSize.height) && this._bounds.bottom > edge;
              break;
            case 'right':
              ok = (edge = triggerOffset.left + tipSize.width) && this._bounds.right > edge;
              break;
            case 'top':
              ok = (edge = triggerOffset.top - tipSize.height) && this._bounds.top < edge;
              break;
            case 'left':
              ok = (edge = triggerOffset.left - tipSize.width) && this._bounds.left < edge;
          }
          this.debugLog('checkDirectionComponent', {
            component: component,
            edge: edge
          });
          if (!ok) {
            switch (component) {
              case 'bottom':
                newDirection[0] = 'top';
                break;
              case 'right':
                newDirection[1] = 'left';
                break;
              case 'top':
                newDirection[0] = 'bottom';
                break;
              case 'left':
                newDirection[1] = 'right';
            }
            $trigger.data(this.attr('direction'), newDirection.join(' '));
          }
        }
      };

      Tip.prototype._wrapStealthRender = function(func) {
        return (function(_this) {
          return function() {
            var result;
            if (!_this.$tip.is(':hidden')) {
              return func.apply(_this, arguments);
            }
            _this.$tip.css({
              display: 'block',
              visibility: 'hidden'
            });
            result = func.apply(_this, arguments);
            _this.$tip.css({
              display: 'none',
              visibility: 'visible'
            });
            return result;
          };
        })(this);
      };

      Tip.prototype.onShow = function(event) {};

      Tip.prototype.onHide = $.noop;

      Tip.prototype.afterShow = function(event) {};

      Tip.prototype.afterHide = $.noop;

      Tip.prototype.htmlOnRender = $.noop;

      Tip.prototype.offsetOnTriggerMouseMove = function(event, offset, $trigger) {
        return false;
      };

      return Tip;

    })();
    SnapTip = (function(superClass) {
      extend(SnapTip, superClass);

      function SnapTip() {
        return SnapTip.__super__.constructor.apply(this, arguments);
      }

      SnapTip.prototype.init = function() {
        var active, key, ref1;
        SnapTip.__super__.init.call(this);
        if (this.snap.toTrigger === false) {
          this.snap.toTrigger = this.snap.toXAxis === true || this.snap.toYAxis === true;
        }
        this._offsetStart = null;
        ref1 = this.snap;
        for (key in ref1) {
          if (!hasProp.call(ref1, key)) continue;
          active = ref1[key];
          if (active) {
            this.$tip.addClass(this.classNames.snap[key]);
          }
        }
      };

      SnapTip.prototype._bindTriggers = function() {
        var selector;
        SnapTip.__super__._bindTriggers.call(this);
        selector = "." + this.classNames.trigger;
        this.$context.on(this.evt('truemouseleave'), selector, {
          selector: selector
        }, (function(_this) {
          return function(event) {
            return _this._offsetStart = null;
          };
        })(this));
      };

      SnapTip.prototype._moveToTrigger = function($trigger, baseOffset) {
        var offset, toTriggerOnly;
        offset = this._offsetForTrigger($trigger);
        toTriggerOnly = this.snap.toTrigger === true && this.snap.toXAxis === false && this.snap.toYAxis === false;
        if (this.snap.toXAxis === true) {
          if (this._isDirection('bottom', $trigger)) {
            offset.top += $trigger.outerHeight();
          }
          if (this.snap.toYAxis === false) {
            offset.left = baseOffset.left - this.$tip.outerWidth() / 2;
          }
        }
        if (this.snap.toYAxis === true) {
          if (this._isDirection('right', $trigger)) {
            offset.left += $trigger.outerWidth() + this._stemSize();
          } else if (this._isDirection('left', $trigger)) {
            offset.left -= this._stemSize();
          }
          if (this.snap.toXAxis === false) {
            offset.top = baseOffset.top - this.$tip.outerHeight() / 2 - this._stemSize();
          }
        }
        if (toTriggerOnly === true) {
          if (this._isDirection('bottom', $trigger)) {
            offset.top += $trigger.outerHeight();
          }
        }
        return offset;
      };

      SnapTip.prototype._positionToTrigger = function($trigger, mouseEvent, cursorHeight) {
        if (cursorHeight == null) {
          cursorHeight = this.cursorHeight;
        }
        SnapTip.__super__._positionToTrigger.call(this, $trigger, mouseEvent, 0);
      };

      SnapTip.prototype.onShow = function(event) {
        if (this._triggerChanged !== true) {
          return;
        }
        this.$tip.css('visibility', 'hidden');
      };

      SnapTip.prototype.afterShow = function(event) {
        if (this._triggerChanged !== true) {
          return;
        }
        this.$tip.css('visibility', 'visible');
        this._offsetStart = {
          top: event.pageY,
          left: event.pageX
        };
      };

      SnapTip.prototype.offsetOnTriggerMouseMove = function(event, offset, $trigger) {
        var newOffset;
        return newOffset = this._moveToTrigger($trigger, _.clone(offset));
      };

      return SnapTip;

    })(Tip);
    hlf.createPlugin({
      name: 'tip',
      namespace: hlf.tip,
      apiClass: Tip,
      asSharedInstance: true,
      baseMixins: ['selection'],
      compactOptions: true
    });
    hlf.createPlugin({
      name: 'snapTip',
      namespace: hlf.tip.snap,
      apiClass: SnapTip,
      asSharedInstance: true,
      baseMixins: ['selection'],
      compactOptions: true
    });
    return true;
  });

}).call(this);

//# sourceMappingURL=jquery.hlf.tip.js.map
