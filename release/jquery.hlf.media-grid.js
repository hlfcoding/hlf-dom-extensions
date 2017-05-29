
/*
HLF Media Grid jQuery Plugin
============================
 */

(function() {
  (function(root, attach) {
    if (typeof define === 'function' && (define.amd != null)) {
      define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core'], attach);
    } else if (typeof module === 'object' && (module.exports != null)) {
      module.exports = attach(require('jquery', require('underscore', require('hlf/jquery.extension.hlf.core'))));
    } else {
      attach(jQuery, _, jQuery.hlf);
    }
  })(this, function($, _, hlf) {
    var MediaGrid;
    hlf.mediaGrid = {
      debug: false,
      toString: _.memoize(function(context) {
        switch (context) {
          case 'event':
            return '.hlf.mg';
          case 'data':
            return 'hlf-mg';
          case 'class':
            return 'js-mg';
          default:
            return 'hlf.mg';
        }
      }),
      defaults: (function(pre) {
        return {
          autoReady: false,
          resizeDelay: 100,
          undimDelay: 1000,
          classNames: (function() {
            var classNames, j, key, keys, len;
            classNames = {};
            keys = ['item', 'sample', 'transitioning', 'expanded', 'dimmed', 'focused', 'ready'];
            for (j = 0, len = keys.length; j < len; j++) {
              key = keys[j];
              classNames[key] = "" + pre + key;
            }
            return classNames;
          })()
        };
      })('js-mg-')
    };
    MediaGrid = (function() {
      function MediaGrid($el, options) {
        this.$el = $el;
      }

      MediaGrid.prototype.init = function() {
        if (this.$items == null) {
          this.$items = this.selectByClass('item');
        }
        this.$sampleItem = this.$items.first();
        this.expandDuration = 1000 * parseFloat(this.$sampleItem.css('transition-duration'));
        this.$items.on('click', (function(_this) {
          return function(e) {
            _this.toggleItemExpansion($(e.currentTarget));
          };
        })(this));
        this.$expandedItem = null;
        this.on({
          mouseenter: (function(_this) {
            return function(e) {
              _this.toggleExpandedItemFocus($(e.currentTarget), true);
            };
          })(this),
          mouseleave: (function(_this) {
            return function(e) {
              _this.toggleExpandedItemFocus($(e.currentTarget), false);
            };
          })(this),
          expand: (function(_this) {
            return function(e, expanded) {
              _this.toggleItemFocus($(e.currentTarget), expanded, _this.expandDuration);
            };
          })(this)
        }, "." + this.classNames.item);
        this.on('mouseleave', (function(_this) {
          return function() {
            if (_this.$expandedItem != null) {
              _this.toggleItemFocus(_this.$expandedItem, false, 0);
            }
          };
        })(this));
        this.metrics = {};
        this.on('ready', (function(_this) {
          return function() {
            _this._updateMetrics();
            _this._layoutItems();
            _this.$el.addClass(_this.classNames.ready);
          };
        })(this));
        if (this.autoReady === true) {
          this.trigger('ready');
        }
        $(window).resize(_.debounce((function(_this) {
          return function() {
            _this._updateMetrics(false);
            if (_this.$expandedItem != null) {
              _this.toggleItemExpansion(_this.$expandedItem, false);
              _this._reLayoutItems(_this.expandDuration);
            } else {
              _this._reLayoutItems();
            }
          };
        })(this), this.resizeDelay));
      };

      MediaGrid.prototype.toggleItemExpansion = function($item, expanded) {
        var i;
        if (expanded == null) {
          expanded = !$item.hasClass(this.classNames.expanded);
        }
        if (expanded) {
          if (this.$expandedItem != null) {
            this.toggleItemExpansion(this.$expandedItem, false);
          }
          i = $item.index();
          if (this._isRightEdgeItem(i)) {
            this._adjustItemToRightEdge($item);
          }
          if (this._isBottomEdgeItem(i)) {
            this._adjustItemToBottomEdge($item);
          }
        }
        $item.addClass(this.classNames.transitioning);
        clearTimeout($item.data(this.attr('expand-timeout')));
        $item.data(this.attr('expand-timeout'), setTimeout((function(_this) {
          return function() {
            $item.removeClass(_this.classNames.transitioning);
          };
        })(this), this.expandDuration));
        $item.toggleClass(this.classNames.expanded, expanded);
        this.$expandedItem = expanded ? $item : null;
        $item.trigger(this.evt('expand'), [expanded]);
      };

      MediaGrid.prototype.toggleExpandedItemFocus = function($item, focused) {
        var delay;
        if (!($item != null ? $item.hasClass(this.classNames.expanded) : void 0)) {
          return;
        }
        delay = focused ? 0 : this.undimDelay;
        this.toggleItemFocus($item, focused, delay);
      };

      MediaGrid.prototype.toggleItemFocus = function($item, focused, delay) {
        if (focused) {
          this.$items.removeClass(this.classNames.focused);
        }
        $item.toggleClass(this.classNames.focused, focused);
        clearTimeout(this._dimTimeout);
        this._dimTimeout = setTimeout((function(_this) {
          return function() {
            _this.$el.toggleClass(_this.classNames.dimmed, focused);
          };
        })(this), delay);
      };

      MediaGrid.prototype._adjustItemToBottomEdge = function($item) {
        $item.css({
          top: 'auto',
          bottom: 0
        });
      };

      MediaGrid.prototype._adjustItemToRightEdge = function($item) {
        $item.css({
          left: 'auto',
          right: 0
        });
      };

      MediaGrid.prototype._getMetricSamples = function() {
        var $expanded, $item, ref;
        if ((ref = this.selectByClass('sample')) != null) {
          ref.remove();
        }
        $item = this.$sampleItem.clone();
        $expanded = this.$sampleItem.clone().addClass(this.classNames.expanded);
        $('<div>').addClass(this.classNames.sample).css({
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0
        }).css({
          visibility: 'hidden',
          zIndex: 0
        }).append($item, $expanded).appendTo(this.$el);
        return {
          $item: $item,
          $expanded: $expanded
        };
      };

      MediaGrid.prototype._isBottomEdgeItem = function(i) {
        return (i + 1) > (this.$items.length - this.metrics.rowSize);
      };

      MediaGrid.prototype._isRightEdgeItem = function(i) {
        return (i + 1) % this.metrics.rowSize === 0;
      };

      MediaGrid.prototype._layoutItems = function() {
        this.$items.get().reverse().forEach((function(_this) {
          return function(item, i) {
            var $item, offset;
            $item = $(item);
            offset = $item.position();
            if ($item.data(_this.attr('original-position')) == null) {
              $item.data(_this.attr('original-position'), $item.css('position'));
            }
            return $item.css($.extend(offset, {
              position: 'absolute'
            }));
          };
        })(this));
        this.$el.css({
          width: this.metrics.wrapWidth,
          height: this.metrics.wrapHeight
        });
      };

      MediaGrid.prototype._reLayoutItems = function(delay) {
        if (delay == null) {
          delay = 0;
        }
        clearTimeout(this._layoutTimeout);
        this._layoutTimeout = setTimeout((function(_this) {
          return function() {
            var key;
            key = _this.attr('original-position');
            _this.$items.css({
              top: 'auto',
              left: 'auto',
              bottom: 'auto',
              right: 'auto',
              position: function() {
                return $(this).data(key);
              }
            });
            return _this._layoutItems();
          };
        })(this), delay);
      };

      MediaGrid.prototype._updateMetrics = function(hard) {
        var $expanded, $item, colSize, fullHeight, fullWidth, gutter, ref, rowSize;
        if (hard == null) {
          hard = true;
        }
        if (hard === true) {
          ref = this._getMetricSamples(), $item = ref.$item, $expanded = ref.$expanded;
          this.metrics = {
            itemWidth: $item.outerWidth(),
            itemHeight: $item.outerHeight(),
            expandedWidth: $expanded.outerWidth(),
            expandedHeight: $expanded.outerHeight()
          };
        }
        gutter = Math.round(parseFloat(this.$sampleItem.css('margin-right')));
        fullWidth = this.metrics.itemWidth + gutter;
        fullHeight = this.metrics.itemHeight + gutter;
        this.$el.css({
          width: 'auto',
          height: 'auto'
        });
        rowSize = parseInt((this.$el.outerWidth() + gutter) / fullWidth, 10);
        colSize = Math.ceil(this.$items.length / rowSize);
        $.extend(this.metrics, {
          gutter: gutter,
          rowSize: rowSize,
          colSize: colSize
        }, {
          wrapWidth: fullWidth * rowSize,
          wrapHeight: fullHeight * colSize
        });
      };

      return MediaGrid;

    })();
    hlf.createPlugin({
      name: 'mediaGrid',
      namespace: hlf.mediaGrid,
      apiClass: MediaGrid,
      baseMixins: ['data', 'event', 'selection'],
      compactOptions: true
    });
    return true;
  });

}).call(this);
