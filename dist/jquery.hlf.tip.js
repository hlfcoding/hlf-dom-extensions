
/*
HLF Tip jQuery Plugin
=====================
Released under the MIT License  
Written with jQuery 1.7.2
 */

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function(plugin) {
    if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
      return define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core', 'hlf/jquery.extension.hlf.event'], plugin);
    } else {
      return plugin(jQuery, _, jQuery.hlf);
    }
  })(function($, _, hlf) {
    var SnapTip, Tip;
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
        return {
          ms: {
            duration: {
              "in": 200,
              out: 200,
              resize: 300
            },
            delay: {
              "in": 300,
              out: 300
            }
          },
          easing: {
            base: 'ease-in-out'
          },
          shouldAnimate: {
            resize: true
          },
          cursorHeight: 6,
          defaultDirection: ['south', 'east'],
          safeToggle: true,
          autoDirection: true,
          tipTemplate: function(containerClass) {
            var stemHtml;
            if (this.doStem === true) {
              stemHtml = "<div class='" + this.classNames.stem + "'></div>";
            }
            return "<div class=\"" + containerClass + "\">\n  <div class=\"" + this.classNames.inner + "\">\n    " + stemHtml + "\n    <div class='" + this.classNames.content + "'></div>\n  </div>\n</div>";
          },
          classNames: (function() {
            var classNames, key, keys, _i, _len;
            classNames = {};
            keys = ['inner', 'content', 'stem', 'north', 'east', 'south', 'west', 'follow', 'trigger'];
            for (_i = 0, _len = keys.length; _i < _len; _i++) {
              key = keys[_i];
              classNames[key] = "" + pre + key;
            }
            classNames.tip = 'js-tip';
            return classNames;
          })()
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
              if (!__hasProp.call(dictionary, key)) continue;
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
      function Tip($triggers, options, $context) {
        this.$triggers = $triggers;
        this.$context = $context;
        _.bindAll(this, '_onTriggerMouseMove', '_setBounds');
      }

      Tip.prototype.init = function() {
        this._setTip = (function(_this) {
          return function($tip) {
            return _this.$tip = _this.$el = $tip;
          };
        })(this);
        this._setTip($('<div>'));
        this.doStem = this.classNames.stem !== '';
        this.doFollow = this.classNames.follow !== '';
        this._setState('asleep');
        this._wakeCountdown = null;
        this._sleepCountdown = null;
        this._$currentTrigger = null;
        this._render();
        this._bind();
        return this.$triggers.each((function(_this) {
          return function(i, el) {
            var $trigger;
            $trigger = $(el);
            $trigger.addClass(_this.classNames.trigger);
            _this._saveTriggerContent($trigger);
            _this._bindTrigger($trigger);
            return _this._updateDirectionByTrigger($trigger);
          };
        })(this));
      };

      Tip.prototype._defaultHtml = function() {
        var containerClass, directionClass, html;
        directionClass = $.trim(_.reduce(this.defaultDirection, (function(_this) {
          return function(classListMemo, directionComponent) {
            return "" + classListMemo + " " + _this.classNames[directionComponent];
          };
        })(this), ''));
        containerClass = $.trim([this.classNames.tip, this.classNames.follow, directionClass].join(' '));
        return html = this.tipTemplate(containerClass);
      };

      Tip.prototype._saveTriggerContent = function($trigger) {
        var title;
        title = $trigger.attr('title');
        if (title != null) {
          return $trigger.data(this.attr('content'), title).removeAttr('title');
        }
      };

      Tip.prototype._bindTrigger = function($trigger) {
        var onMouseMove;
        $trigger.on(this.evt('truemouseenter'), (function(_this) {
          return function(event) {
            _this.debugLog(event.type);
            return _this._onTriggerMouseMove(event);
          };
        })(this));
        $trigger.on(this.evt('truemouseleave'), (function(_this) {
          return function(event) {
            _this.debugLog(event.type);
            return _this.sleepByTrigger($trigger);
          };
        })(this));
        if (this.doFollow === true) {
          if (window.requestAnimationFrame != null) {
            onMouseMove = (function(_this) {
              return function(event) {
                return requestAnimationFrame(function(timestamp) {
                  return _this._onTriggerMouseMove(event);
                });
              };
            })(this);
          } else {
            onMouseMove = _.throttle(this._onTriggerMouseMove, 16);
          }
          return $trigger.on('mousemove', onMouseMove);
        }
      };

      Tip.prototype._bind = function() {
        this.$tip.on('mouseenter', (function(_this) {
          return function(event) {
            _this.debugLog('enter tip');
            if (_this._$currentTrigger != null) {
              _this._$currentTrigger.data(_this.attr('is-active'), true);
              return _this.wakeByTrigger(_this._$currentTrigger);
            }
          };
        })(this)).on('mouseleave', (function(_this) {
          return function(event) {
            _this.debugLog('leave tip');
            if (_this._$currentTrigger != null) {
              _this._$currentTrigger.data(_this.attr('is-active'), false);
              return _this.sleepByTrigger(_this._$currentTrigger);
            }
          };
        })(this));
        if (this.autoDirection === true) {
          return $(window).resize(_.debounce(this._setBounds, 300));
        }
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
        this._setTip($tip);
        this.$tip.prependTo(this.$context);
        transitionStyle = [];
        if (this.shouldAnimate.resize) {
          duration = this.ms.duration.resize / 1000.0 + 's';
          easing = this.easing.resize;
          if (easing == null) {
            easing = this.easing.base;
          }
          transitionStyle.push("width " + duration + " " + easing, "height " + duration + " " + easing);
        }
        transitionStyle = transitionStyle.join(',');
        return this.selectByClass('content').css('transition', transitionStyle);
      };

      Tip.prototype._inflateByTrigger = function($trigger) {
        var $content, compoundDirection, contentOnly, contentSize;
        compoundDirection = $trigger.data(this.attr('direction')) ? $trigger.data(this.attr('direction')).split(' ') : this.defaultDirection;
        this.debugLog('update direction class', compoundDirection);
        $content = this.selectByClass('content');
        $content.text($trigger.data(this.attr('content')));
        if (this.shouldAnimate.resize) {
          contentSize = this.sizeForTrigger($trigger, (contentOnly = true));
          $content.width(contentSize.width).height(contentSize.height);
        }
        return this.$tip.removeClass([this.classNames.north, this.classNames.south, this.classNames.east, this.classNames.west].join(' ')).addClass($.trim(_.reduce(compoundDirection, (function(_this) {
          return function(classListMemo, directionComponent) {
            return "" + classListMemo + " " + _this.classNames[directionComponent];
          };
        })(this), '')));
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
        return this.wakeByTrigger($trigger, event);
      };

      Tip.prototype._positionToTrigger = function($trigger, mouseEvent) {
        var offset, tipWidth, triggerWidth;
        if (mouseEvent == null) {
          return false;
        }
        offset = {
          top: mouseEvent.pageY,
          left: mouseEvent.pageX
        };
        offset = this.offsetOnTriggerMouseMove(mouseEvent, offset, $trigger) || offset;
        if (this.isDirection('north', $trigger)) {
          offset.top -= this.$tip.outerHeight() + this.cursorHeight;
        }
        if (this.isDirection('west', $trigger)) {
          tipWidth = this.$tip.outerWidth();
          triggerWidth = $trigger.outerWidth();
          offset.left -= tipWidth;
          if (tipWidth > triggerWidth) {
            offset.left += triggerWidth;
          }
        }
        if (this.isDirection('south', $trigger)) {
          offset.top += this.cursorHeight;
        }
        offset.top += this.cursorHeight;
        return this.$tip.css(offset);
      };

      Tip.prototype._updateDirectionByTrigger = function($trigger) {
        var component, edge, newDirection, ok, tipSize, triggerHeight, triggerPosition, triggerWidth, _i, _len, _ref, _results;
        if (this.autoDirection === false) {
          return false;
        }
        triggerPosition = $trigger.position();
        triggerWidth = $trigger.outerWidth();
        triggerHeight = $trigger.outerHeight();
        tipSize = this.sizeForTrigger($trigger);
        newDirection = _.clone(this.defaultDirection);
        this.debugLog({
          triggerPosition: triggerPosition,
          triggerWidth: triggerWidth,
          triggerHeight: triggerHeight,
          tipSize: tipSize
        });
        _ref = this.defaultDirection;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          component = _ref[_i];
          if (this._bounds == null) {
            this._setBounds();
          }
          ok = true;
          switch (component) {
            case 'south':
              ok = (edge = triggerPosition.top + triggerHeight + tipSize.height) && this._bounds.bottom > edge;
              break;
            case 'east':
              ok = (edge = triggerPosition.left + tipSize.width) && this._bounds.right > edge;
              break;
            case 'north':
              ok = (edge = triggerPosition.top - tipSize.height) && this._bounds.top < edge;
              break;
            case 'west':
              ok = (edge = triggerPosition.left - tipSize.width) && this._bounds.left < edge;
          }
          this.debugLog('checkDirectionComponent', {
            component: component,
            edge: edge
          });
          if (!ok) {
            switch (component) {
              case 'south':
                newDirection[0] = 'north';
                break;
              case 'east':
                newDirection[1] = 'west';
                break;
              case 'north':
                newDirection[0] = 'south';
                break;
              case 'west':
                newDirection[1] = 'east';
            }
            _results.push($trigger.data(this.attr('direction'), newDirection.join(' ')));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      Tip.prototype._setBounds = function() {
        var $context;
        $context = this.$context.is('body') ? $(window) : this.$context;
        return this._bounds = {
          top: $.css(this.$context[0], 'padding-top', true),
          left: $.css(this.$context[0], 'padding-left', true),
          bottom: $context.innerHeight(),
          right: $context.innerWidth()
        };
      };

      Tip.prototype._setState = function(state) {
        if (state === this._state) {
          return false;
        }
        this._state = state;
        return this.debugLog(this._state);
      };

      Tip.prototype.sizeForTrigger = function($trigger, contentOnly) {
        var $content, bottom, left, padding, right, side, size, top, _ref;
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
          this.$tip.css({
            display: 'block',
            visibility: 'hidden'
          });
          $trigger.data('width', (size.width = this.$tip.outerWidth()));
          $trigger.data('height', (size.height = this.$tip.outerHeight()));
          this.$tip.css({
            display: 'none',
            visibility: 'visible'
          });
        }
        if (contentOnly === true) {
          padding = $content.css('padding').split(' ');
          _ref = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = padding.length; _i < _len; _i++) {
              side = padding[_i];
              _results.push(parseInt(side, 10));
            }
            return _results;
          })(), top = _ref[0], right = _ref[1], bottom = _ref[2], left = _ref[3];
          if (bottom == null) {
            bottom = top;
          }
          if (left == null) {
            left = right;
          }
          size.width -= left + right;
          size.height -= top + bottom + this.selectByClass('stem').height();
        }
        return size;
      };

      Tip.prototype.isDirection = function(directionComponent, $trigger) {
        return this.$tip.hasClass(this.classNames[directionComponent]) || ((($trigger == null) || !$trigger.data(this.attr('direction'))) && _.include(this.defaultDirection, directionComponent));
      };

      Tip.prototype.wakeByTrigger = function($trigger, event, onWake) {
        var delay, duration, triggerChanged, wake, _ref;
        triggerChanged = !$trigger.is(this._$currentTrigger);
        if (triggerChanged) {
          this._inflateByTrigger($trigger);
          this._$currentTrigger = $trigger;
        }
        if (this._state === 'awake') {
          this._positionToTrigger($trigger, event);
          this.onShow(triggerChanged, event);
          if (onWake != null) {
            onWake();
          }
          this.debugLog('quick update');
          return true;
        }
        if (event != null) {
          this.debugLog(event.type);
        }
        if ((_ref = this._state) === 'awake' || _ref === 'waking') {
          return false;
        }
        delay = this.ms.delay["in"];
        duration = this.ms.duration["in"];
        wake = (function(_this) {
          return function() {
            _this._positionToTrigger($trigger, event);
            _this.onShow(triggerChanged, event);
            return _this.$tip.stop().fadeIn(duration, function() {
              if (triggerChanged) {
                if (onWake != null) {
                  onWake();
                }
              }
              if (_this.safeToggle === true) {
                _this.$tip.siblings(_this.classNames.tip).fadeOut();
              }
              _this.afterShow(triggerChanged, event);
              return _this._setState('awake');
            });
          };
        })(this);
        if (this._state === 'sleeping') {
          this.debugLog('clear sleep');
          clearTimeout(this._sleepCountdown);
          duration = 0;
          wake();
        } else if ((event != null) && event.type === 'truemouseenter') {
          triggerChanged = true;
          this._setState('waking');
          this._wakeCountdown = setTimeout(wake, delay);
        }
        return true;
      };

      Tip.prototype.sleepByTrigger = function($trigger) {
        var _ref;
        if ((_ref = this._state) === 'asleep' || _ref === 'sleeping') {
          return false;
        }
        this._setState('sleeping');
        clearTimeout(this._wakeCountdown);
        this._sleepCountdown = setTimeout((function(_this) {
          return function() {
            _this.onHide();
            return _this.$tip.stop().fadeOut(_this.ms.duration.out, function() {
              _this._setState('asleep');
              return _this.afterHide();
            });
          };
        })(this), this.ms.delay.out);
        return true;
      };

      Tip.prototype.onShow = function(triggerChanged, event) {
        return void 0;
      };

      Tip.prototype.onHide = $.noop;

      Tip.prototype.afterShow = function(triggerChanged, event) {
        return void 0;
      };

      Tip.prototype.afterHide = $.noop;

      Tip.prototype.htmlOnRender = $.noop;

      Tip.prototype.offsetOnTriggerMouseMove = function(event, offset, $trigger) {
        return false;
      };

      return Tip;

    })();
    SnapTip = (function(_super) {
      __extends(SnapTip, _super);

      function SnapTip() {
        return SnapTip.__super__.constructor.apply(this, arguments);
      }

      SnapTip.prototype.init = function() {
        var active, key, _ref, _results;
        SnapTip.__super__.init.call(this);
        if (this.snap.toTrigger === false) {
          this.snap.toTrigger = this.snap.toXAxis === true || this.snap.toYAxis === true;
        }
        if (this.snap.toXAxis === true) {
          this.cursorHeight = 0;
        }
        if (this.snap.toYAxis === true) {
          this.cursorHeight = 2;
        }
        this._offsetStart = null;
        _ref = this.snap;
        _results = [];
        for (key in _ref) {
          if (!__hasProp.call(_ref, key)) continue;
          active = _ref[key];
          if (active) {
            _results.push(this.$tip.addClass(this.classNames.snap[key]));
          }
        }
        return _results;
      };

      SnapTip.prototype._moveToTrigger = function($trigger, baseOffset) {
        var offset;
        offset = $trigger.offset();
        if (this.snap.toXAxis === true) {
          if (this.isDirection('south')) {
            offset.top += $trigger.outerHeight();
          }
          if (this.snap.toYAxis === false) {
            offset.left = baseOffset.left - (this.$tip.outerWidth() - 12) / 2;
          }
        }
        if (this.snap.toYAxis === true) {
          if (this.isDirection('east')) {
            offset.left += $trigger.outerWidth();
          }
          if (this.snap.toXAxis === false) {
            offset.top = baseOffset.top - this.$tip.outerHeight() / 2;
          }
        }
        return offset;
      };

      SnapTip.prototype._bindTrigger = function($trigger) {
        SnapTip.__super__._bindTrigger.call(this, $trigger);
        return $trigger.on(this.evt('truemouseleave'), (function(_this) {
          return function(event) {
            return _this._offsetStart = null;
          };
        })(this));
      };

      SnapTip.prototype.onShow = function(triggerChanged, event) {
        if (triggerChanged === true) {
          return this.$tip.css('visibility', 'hidden');
        }
      };

      SnapTip.prototype.afterShow = function(triggerChanged, event) {
        if (triggerChanged === true) {
          this.$tip.css('visibility', 'visible');
          return this._offsetStart = {
            top: event.pageY,
            left: event.pageX
          };
        }
      };

      SnapTip.prototype.offsetOnTriggerMouseMove = function(event, offset, $trigger) {
        var newOffset;
        newOffset = _.clone(offset);
        if (this.snap.toTrigger === true) {
          newOffset = this._moveToTrigger($trigger, newOffset);
        } else {
          if (this.snap.toXAxis === true) {
            newOffset.top = this._offsetStart.top;
            this.debugLog('xSnap');
          }
          if (this.snap.toYAxis === true) {
            newOffset.left = this._offsetStart.left;
            this.debugLog('ySnap');
          }
        }
        return newOffset;
      };

      return SnapTip;

    })(Tip);
    hlf.createPlugin({
      name: 'tip',
      namespace: hlf.tip,
      apiClass: Tip,
      asSingleton: true,
      baseMixins: ['selection'],
      compactOptions: true
    });
    return hlf.createPlugin({
      name: 'snapTip',
      namespace: hlf.tip.snap,
      apiClass: SnapTip,
      asSingleton: true,
      baseMixins: ['selection'],
      compactOptions: true
    });
  });

}).call(this);
