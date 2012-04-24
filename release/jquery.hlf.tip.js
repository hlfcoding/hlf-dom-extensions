// Generated by CoffeeScript 1.3.1

/*
HLF Tip jQuery Plugin v1.2
Released under the MIT License
Written with jQuery 1.7.2
*/


(function() {
  var $, SnapTip, Tip, ns,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  $ = jQuery;

  ns = $.hlf;

  /*
  Tip
  ---
  */


  ns.tip = {
    toString: function(context) {
      switch (context) {
        case 'event':
          return '.hlf.tip';
        case 'data':
          return 'hlfTip';
        case 'class':
          return 'js-tips';
        default:
          return 'hlf.tip';
      }
    },
    defaults: (function(pre) {
      return {
        ms: {
          duration: {
            "in": 300,
            out: 300
          },
          delay: {
            "in": 0,
            out: 500
          }
        },
        cursorHeight: 6,
        cls: (function() {
          var cls;
          cls = {};
          _.each(['inner', 'content', 'stem', 'north', 'east', 'south', 'west', 'follow'], function(key) {
            return cls[key] = "" + pre + key;
          });
          cls.tip = 'js-tip';
          return cls;
        })()
      };
    })('js-tip-')
  };

  /*
  Tip API
  -------
  */


  Tip = (function() {

    Tip.name = 'Tip';

    function Tip($ts, o, $ctx) {
      var _this = this;
      this.$ts = $ts;
      this.o = o;
      this.$ctx = $ctx;
      this.$tip = $('<div>');
      this.doStem = this.o.cls.stem !== '';
      this.doFollow = this.o.cls.follow !== '' && this.o.cursorHeight > 0;
      this._visibility = 'truehidden';
      this._p = {
        $t: null
      };
      this.$ts.each(function(idx, el) {
        var $t;
        $t = $(el);
        _this._saveTriggerContent($t);
        _this._bindTrigger($t);
        return _this._bind($t);
      });
      this._render();
    }

    Tip.prototype._defaultHtml = function() {
      var containerClass, html, stemHtml;
      containerClass = $.trim([this.o.cls.tip, this.o.cls.follow].join(' '));
      if (this.doStem === true) {
        stemHtml = "<div class='" + this.o.cls.stem + "'></div>";
      }
      return html = "<div class=\"" + containerClass + "\">\n<div class=\"" + this.o.cls.inner + "\">\n" + stemHtml + "\n<div class=\"" + this.o.cls.content + "\"></div>\n</div>\n</div>";
    };

    Tip.prototype._saveTriggerContent = function($t) {
      var title;
      title = $t.attr('title');
      if (title) {
        return $t.data(this._dat('Content'), title).attr('data-tip-content', title).removeAttr('title');
      }
    };

    Tip.prototype._bindTrigger = function($t) {
      var _this = this;
      $t.on(this._evt('truemouseenter'), function(evt) {
        return _this.wake($t.on(_this._evt('truemouseleave'), function(evt) {
          return _this.sleep($t);
        }));
      });
      if (this.doFollow === true) {
        return $t.on(this._evt('mousemove'), $.proxy(this._onMouseMove, this));
      }
    };

    Tip.prototype._bind = function($t) {
      var _this = this;
      return this.$tip.on(this._evt('mouseenter'), function(evt) {
        console.log('enter tip');
        return $t.data('activeState', true);
      }).on(this._evt('mouseleave'), function(evt) {
        console.log('leave tip');
        return $t.data('activeState', false);
      });
    };

    Tip.prototype._render = function($t) {
      var html, isCustom;
      if (this.$tip.html().length) {
        return false;
      }
      html = this.onRender();
      isCustom = (html != null) && html.length;
      if (!isCustom) {
        html = this._defaultHtml();
      }
      this.$tip = $(html).toggleClass(this.o.cls.follow, isCustom);
      return this.$tip.prependTo(this.$ctx);
    };

    Tip.prototype._position = function($t) {
      var offset;
      offset = this.onPosition($t.offset());
      if (this.doFollow === true) {
        $t.trigger(this._evt('mousemove'));
        return false;
      }
      offset.top += this.o.cursorHeight;
      this.$tip.css(offset);
      return console.log('_position');
    };

    Tip.prototype._inflate = function($t) {
      return this.$tip.find("." + this.o.cls.content).text($t.data(this._dat('Content')));
    };

    Tip.prototype._onMouseMove = function(evt) {
      var offset;
      if (!(evt.pageX != null)) {
        return false;
      }
      if (this.isAsleep()) {
        this.wake($(evt.target));
      }
      offset = {
        top: evt.pageY,
        left: evt.pageX
      };
      offset = this.onMouseMove(evt, offset) || offset;
      offset.top += this.o.cursorHeight;
      this.$tip.css(offset);
      return console.log('_onMouseMove');
    };

    Tip.prototype.options = function() {
      return this.o;
    };

    Tip.prototype.tip = function() {
      return this.$tip;
    };

    Tip.prototype.isAwake = function() {
      return this._visibility === 'truevisible';
    };

    Tip.prototype.isAsleep = function() {
      return this._visibility === 'truehidden';
    };

    Tip.prototype.wake = function($t) {
      var _this = this;
      if ($t !== this._p.$t) {
        this._inflate($t);
        this._position($t);
      }
      this._wakeCountdown = setTimeout(function() {
        clearTimeout(_this._sleepCountdown);
        if (_this.isAwake()) {
          return false;
        }
        _this.onShow();
        return _this.$tip.fadeIn(_this.o.ms.duration["in"], function() {
          _this._visibility = 'truevisible';
          return _this.afterShow();
        });
      }, this.o.ms.delay["in"]);
      return true;
    };

    Tip.prototype.sleep = function($t) {
      var _this = this;
      if ($t !== this._p.$t) {
        this._p.$t = $t;
      }
      return this._sleepCountdown = setTimeout(function() {
        clearTimeout(_this._wakeCountdown);
        if (_this.isAsleep()) {
          return false;
        }
        _this.onHide();
        return _this.$tip.fadeOut(_this.o.ms.duration.out, function() {
          _this._visibility = 'truehidden';
          return _this.afterHide();
        });
      }, this.o.ms.delay.out);
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

  /*
  SnapTip API
  -----------
  */


  SnapTip = (function(_super) {

    __extends(SnapTip, _super);

    SnapTip.name = 'SnapTip';

    function SnapTip($ts, o, $ctx) {
      var _this = this;
      SnapTip.__super__.constructor.call(this, $ts, o, $ctx);
      this.doXSnap = this.o.cls.xsnap !== '';
      this.doYSnap = this.o.cls.ysnap !== '';
      this.doSnap = this.o.cls.snap !== '' && (this.doXSnap || this.doYSnap);
      this._offsetStart = null;
      this.$ts.each(function(idx, el) {
        var trigger;
        trigger = $(el);
        return _this._bindTrigger(trigger);
      });
    }

    SnapTip.prototype._move = function() {};

    SnapTip.prototype._bindTrigger = function($t) {
      SnapTip.__super__._bindTrigger.call(this, $t);
      return $t.on(this._evt('truemouseenter'), function(evt) {
        this._offsetStart = {
          top: evt.pageX,
          left: evt.pageY
        };
        return console.log('truemouseenter');
      }).on(this._evt('truemouseleave'), function(evt) {
        this._offsetStart = null;
        return console.log('truemouseleave');
      });
    };

    SnapTip.prototype.onPosition = function(offset) {
      console.log('onPosition');
      return offset;
    };

    SnapTip.prototype.onMouseMove = function(evt, offset) {
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

  })(Tip);

  $.fn.tip = ns.createPlugin(ns.tip, Tip);

  $.fn.snapTip = ns.createPlugin(ns.tip, SnapTip);

}).call(this);
