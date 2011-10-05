(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  (function(global, $) {
    var SnapTip, Tip;
    Tip = (function() {
      Tip.defaults = {
        inDuration: 300,
        inDelay: 0,
        outDuration: 300,
        outDelay: 500,
        cursorHeight: 6,
        innerClass: 'inner',
        contentClass: 'content',
        stemClass: 'stem',
        northClass: 'north',
        eastClass: 'east',
        southClass: 'south',
        westClass: 'west',
        followClass: 'tip-follow',
        tipClass: 'tip'
      };
      function Tip(_context, _triggers, _options) {
        this._context = _context;
        this._triggers = _triggers;
        this._options = _options;
        this._tip = $('<div>');
        this.doStem = this._options.stemClass !== '';
        this.doFollow = this._options.followClass !== '' && this._options.cursorHeight > 0;
        this._visibility = 'truehidden';
        this._triggers.each(__bind(function(index, element) {
          var trigger;
          trigger = $(element);
          this._saveTriggerContent(trigger);
          this._bindTrigger(trigger);
          return this._bind(trigger);
        }, this));
        this._render();
      }
      Tip.prototype._defaultHtml = function() {
        var containerClass, html, stemHtml;
        containerClass = $.trim([this._options.tipClass, this._options.followClass].join(' '));
        if (this.doStem === true) {
          stemHtml = "<div class='" + this._options.stemClass + "'></div>";
        }
        return html = "  <div class='" + containerClass + "'>  <div class='" + this._options.innerClass + "'>  " + stemHtml + "  <div class='" + this._options.contentClass + "'></div>  </div>  </div>";
      };
      Tip.prototype._saveTriggerContent = function(trigger) {
        var title;
        title = trigger.attr('title');
        if (title) {
          return trigger.data('hlfTipContent', title).attr('data-tip-content', title).removeAttr('title');
        }
      };
      Tip.prototype._bindTrigger = function(trigger) {
        trigger.bind({
          'truemouseenter.hlf.tip': __bind(function(event) {
            return this.wake(trigger);
          }, this),
          'truemouseleave.hlf.tip': __bind(function(event) {
            return this.sleep(trigger);
          }, this)
        });
        if (this.doFollow === true) {
          return trigger.bind('mousemove.hlf.tip', $.proxy(this._onMouseMove, this));
        }
      };
      Tip.prototype._bind = function(trigger) {
        return this._tip.bind({
          'mouseenter.hlf.tip': __bind(function(event) {
            console.log('enter tip');
            return trigger.data('activeState', true);
          }, this),
          'mouseleave.hlf.tip': __bind(function(event) {
            console.log('leave tip');
            return trigger.data('activeState', false);
          }, this)
        });
      };
      Tip.prototype._render = function(trigger) {
        var html, isCustom;
        if (this._tip.html().length !== 0) {
          return false;
        }
        html = this.onRender();
        isCustom = (html != null) && html.length !== 0;
        if (!isCustom) {
          html = this._defaultHtml();
        }
        this._tip = $(html).toggleClass(this._options.followClass, isCustom);
        return this._tip.prependTo(this._context);
      };
      Tip.prototype._position = function(trigger) {
        var offset;
        offset = this.onPosition(trigger.offset());
        if (this.doFollow === true) {
          trigger.trigger('mousemove.hlf.tip');
          return false;
        }
        offset.top += this._options.cursorHeight;
        this._tip.css(offset);
        return console.log('_position');
      };
      Tip.prototype._inflate = function(trigger) {
        return this._tip.find("." + this._options.contentClass).text(trigger.data('hlfTipContent'));
      };
      Tip.prototype._onMouseMove = function(event) {
        var offset;
        if (!(event.pageX != null)) {
          return false;
        }
        if (this.isAsleep()) {
          this.wake($(event.target));
        }
        offset = {
          top: event.pageY,
          left: event.pageX
        };
        offset = this.onMouseMove(event, offset) || offset;
        offset.top += this._options.cursorHeight;
        this._tip.css(offset);
        return console.log('_onMouseMove');
      };
      Tip.prototype.options = function() {
        return this._options;
      };
      Tip.prototype.tip = function() {
        return this._tip;
      };
      Tip.prototype.isAwake = function() {
        return this._visibility === 'truevisible';
      };
      Tip.prototype.isAsleep = function() {
        return this._visibility === 'truehidden';
      };
      Tip.prototype.wake = function(trigger) {
        if (trigger !== this._triggerP) {
          this._inflate(trigger);
          this._position(trigger);
        }
        this._wakeCountdown = setTimeout(__bind(function() {
          clearTimeout(this._sleepCountdown);
          if (this.isAwake()) {
            return false;
          }
          this.onShow();
          return this._tip.fadeIn(this._options.inDuration, __bind(function() {
            this._visibility = 'truevisible';
            return this.afterShow();
          }, this));
        }, this), this._options.inDelay);
        return true;
      };
      Tip.prototype.sleep = function(trigger) {
        if (trigger !== this._triggerP) {
          this._triggerP = trigger;
        }
        return this._sleepCountdown = setTimeout(__bind(function() {
          clearTimeout(this._wakeCountdown);
          if (this.isAsleep()) {
            return false;
          }
          this.onHide();
          return this._tip.fadeOut(this._options.outDuration, __bind(function() {
            this._visibility = 'truehidden';
            return this.afterHide();
          }, this));
        }, this), this._options.outDelay);
      };
      Tip.prototype.onShow = $.noop;
      Tip.prototype.onHide = $.noop;
      Tip.prototype.afterShow = $.noop;
      Tip.prototype.afterHide = $.noop;
      Tip.prototype.onRender = $.noop;
      Tip.prototype.onPosition = $.noop;
      Tip.prototype.onMouseMove = $.noop;
      return Tip;
    })();
    SnapTip = (function() {
      __extends(SnapTip, Tip);
      function SnapTip(context, triggers, options) {
        SnapTip.__super__.constructor.call(this, context, triggers, options);
        this.doXSnap = this._options.xSnapClass !== '';
        this.doYSnap = this._options.ySnapClass !== '';
        this.doSnap = this._options.snapClass !== '' && (this.doXSnap || this.doYSnap);
        this._offsetStart = null;
        this._triggers.each(__bind(function(index, element) {
          var trigger;
          trigger = $(element);
          return this._bindTrigger(trigger);
        }, this));
      }
      SnapTip.prototype._move = function() {};
      SnapTip.prototype._bindTrigger = function(trigger) {
        SnapTip.__super__._bindTrigger.call(this, trigger);
        return trigger.bind({
          'truemouseenter.hlf.tip': function(event) {
            this._offsetStart = {
              top: event.pageX,
              left: event.pageY
            };
            return console.log('truemouseenter');
          },
          'truemouseleave.hlf.tip': function(event) {
            this._offsetStart = null;
            return console.log('truemouseleave');
          }
        });
      };
      SnapTip.prototype.onPosition = function(offset) {
        console.log('onPosition');
        return offset;
      };
      SnapTip.prototype.onMouseMove = function(event, offset) {
        if (!(this._offsetStart != null)) {
          return offset;
        }
        if (this.doXSnap) {
          offset.top = this._offsetStart.top;
          console.log('xSnap');
        } else if (this.doYSnap) {
          offset.left = this._offsetStart.left;
          console.log('ySnap');
        }
        return offset;
      };
      return SnapTip;
    })();
    $.hlf.Tip = Tip;
    $.hlf.SnapTip = SnapTip;
    $.hlf.createPluginForClass('Tip', 'manyElementsOneContext');
    $.hlf.createPluginForClass('SnapTip', 'manyElementsOneContext');
    return true;
  })(window, jQuery);
}).call(this);
