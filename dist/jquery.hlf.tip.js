
/*
HLF Tip jQuery Plugin
=====================
Released under the MIT License  
Written with jQuery 1.7.2
 */

(function() {
  var plugin,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  plugin = function($, _, hlf) {
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
              out: 200
            },
            delay: {
              "in": 300,
              out: 300
            }
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
        var deep;
        this.$triggers = $triggers;
        this.$context = $context;
        _.bindAll(this, '_onTriggerMouseMove', '_setBounds');
        $.extend((deep = true), this, options);
        this.$tip = $('<div>');
        this.doStem = this.classNames.stem !== '';
        this.doFollow = this.classNames.follow !== '';
        this._state = 'asleep';
        this._wakeCountdown = null;
        this._sleepCountdown = null;
        this._$currentTrigger = null;
        this._render();
        this._bind();
        this.$triggers.each((function(_this) {
          return function(i, el) {
            var $trigger;
            $trigger = $(el);
            $trigger.addClass(_this.classNames.trigger);
            _this._saveTriggerContent($trigger);
            _this._bindTrigger($trigger);
            return _this._updateDirectionByTrigger($trigger);
          };
        })(this));
      }

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
            _this.debugLog(event);
            return _this._onTriggerMouseMove(event);
          };
        })(this));
        $trigger.on(this.evt('truemouseleave'), (function(_this) {
          return function(event) {
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
        var html;
        if (this.$tip.html().length) {
          return false;
        }
        html = this.htmlOnRender();
        if (!((html != null) && html.length)) {
          html = this._defaultHtml();
        }
        this.$tip = $(html).addClass(this.classNames.follow);
        return this.$tip.prependTo(this.$context);
      };

      Tip.prototype._inflateByTrigger = function($trigger) {
        var compoundDirection;
        compoundDirection = $trigger.data(this.attr('direction')) ? $trigger.data(this.attr('direction')).split(' ') : this.defaultDirection;
        this.debugLog('update direction class', compoundDirection);
        return this.$tip.find("." + this.classNames.content).text($trigger.data(this.attr('content'))).end().removeClass([this.classNames.north, this.classNames.south, this.classNames.east, this.classNames.west].join(' ')).addClass($.trim(_.reduce(compoundDirection, (function(_this) {
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
        return this.wakeByTrigger($trigger, event, (function(_this) {
          return function() {
            var offset;
            offset = {
              top: event.pageY,
              left: event.pageX
            };
            offset = _this.offsetOnTriggerMouseMove(event, offset, $trigger) || offset;
            if (_this.isDirection('north', $trigger)) {
              offset.top -= _this.$tip.outerHeight() + _this.cursorHeight;
            }
            if (_this.isDirection('west', $trigger)) {
              offset.left -= _this.$tip.outerWidth();
            }
            if (_this.isDirection('south', $trigger)) {
              offset.top += _this.cursorHeight;
            }
            offset.top += _this.cursorHeight;
            _this.$tip.css(offset);
            return _this.debugLog('_onTriggerMouseMove', _this._state, offset);
          };
        })(this));
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
          this.debugLog('checkDirectionComponent', "'" + ($trigger.html()) + "'", component, edge, tipSize);
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
          top: parseInt(this.$context.css('padding-top'), 10),
          left: parseInt(this.$context.css('padding-left'), 10),
          bottom: $context.innerHeight(),
          right: $context.innerWidth()
        };
      };

      Tip.prototype.sizeForTrigger = function($trigger, force) {
        var size;
        if (force == null) {
          force = false;
        }
        size = {
          width: $trigger.data(this.attr('width')),
          height: $trigger.data(this.attr('height'))
        };
        if (size.width && size.height) {
          return size;
        }
        this.$tip.find("." + this.classNames.content).text($trigger.data(this.attr('content'))).end().css({
          display: 'block',
          visibility: 'hidden'
        });
        $trigger.data(this.attr('width'), (size.width = this.$tip.outerWidth()));
        $trigger.data(this.attr('height'), (size.height = this.$tip.outerHeight()));
        this.$tip.css({
          display: 'none',
          visibility: 'visible'
        });
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
        if (this._state === 'awake' && (onWake != null)) {
          onWake();
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
            _this.onShow(triggerChanged, event);
            return _this.$tip.fadeIn(duration, function() {
              if (triggerChanged) {
                if (onWake != null) {
                  onWake();
                }
              }
              if (_this.safeToggle === true) {
                _this.$tip.siblings(_this.classNames.tip).fadeOut();
              }
              _this.afterShow(triggerChanged, event);
              return _this._state = 'awake';
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
          this._state = 'waking';
          this._wakeCountdown = setTimeout(wake, delay);
        }
        return true;
      };

      Tip.prototype.sleepByTrigger = function($trigger) {
        if (this._state !== 'awake') {
          return false;
        }
        this._state = 'sleeping';
        clearTimeout(this._wakeCountdown);
        this._sleepCountdown = setTimeout((function(_this) {
          return function() {
            _this.onHide();
            return _this.$tip.fadeOut(_this.ms.duration.out, function() {
              _this._state = 'asleep';
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

      function SnapTip($triggers, options, $context) {
        var active, key, _ref;
        SnapTip.__super__.constructor.call(this, $triggers, options, $context);
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
        for (key in _ref) {
          active = _ref[key];
          if (active) {
            this.$tip.addClass(this.classNames.snap[key]);
          }
        }
      }

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
      asSingleton: true
    });
    return hlf.createPlugin({
      name: 'snapTip',
      namespace: hlf.tip.snap,
      apiClass: SnapTip,
      asSingleton: true
    });
  };

  if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
    define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core', 'hlf/jquery.extension.hlf.event'], plugin);
  } else {
    plugin(jQuery, _, jQuery.hlf);
  }

}).call(this);
