(function() {
  (function(global, $) {
    var checkHoverIntent, clearHoverIntent, trackHoverIntent;
    $.extend(true, $, {
      hlf: {
        titleCase: function(name) {
          return name.replace(/^\w/, function(firstLetter) {
            return firstLetter.toUpperCase();
          });
        }
      }
    });
    $.extend(true, $, {
      hlf: {
        createPluginForClass: function(name, type) {
          var class_, nsName;
          class_ = $.hlf[name];
          if (!class_) {
            throw 'No such module';
          }
          nsName = "hlf" + ($.hlf.titleCase(name));
          if ($.fn[nsName]) {
            throw 'Plugin already exists';
          }
          switch (type) {
            case 'singleElement':
              return $.fn[nsName] = function(options) {
                var instance;
                if (this.length > 1) {
                  return false;
                }
                instance = this.data(nsName);
                if (instance != null) {
                  return instance;
                }
                options = $.extend(true, {}, class_.defaults, options);
                instance = new class_(this, options);
                this.data(nsName, instance);
                return this;
              };
            case 'manyElementsOneContext':
              return $.fn[nsName] = function(options, context) {
                var instance;
                if (context == null) {
                  context = $('body');
                }
                instance = context.data(nsName);
                if (instance != null) {
                  return instance;
                }
                options = $.extend(true, {}, class_.defaults, options);
                instance = new class_(context, this, options);
                context.data(nsName, instance);
                return this;
              };
          }
        }
      }
    });
    $.extend(true, $, {
      hoverIntent: {
        sensitivity: 8,
        interval: 300
      },
      mouse: {
        x: {
          current: 0,
          previous: 0
        },
        y: {
          current: 0,
          previous: 0
        }
      }
    });
    checkHoverIntent = function(event) {
      var intentional, interval, m, sensitivity, timer, trigger;
      trigger = $(this);
      intentional = trigger.data('hoverIntent') || true;
      timer = trigger.data('hoverIntentTimer') || null;
      sensitivity = trigger.data('hoverIntentSensitivity') || $.hoverIntent.sensitivity;
      interval = trigger.data('hoverIntentInterval') || $.hoverIntent.interval;
      m = $.mouse;
      return trigger.data('hoverIntentTimer', setTimeout(function() {
        var eventType;
        intentional = Math.abs(m.x.previous - m.x.current) + Math.abs(m.y.previous - m.y.current) > sensitivity;
        intentional = intentional || event.type === 'mouseleave';
        m.x.previous = event.pageX;
        m.y.previous = event.pageY;
        trigger.data('hoverIntent', intentional);
        if (intentional) {
          switch (event.type) {
            case 'mouseleave':
              if (trigger.data('activeState') === true) {
                return console.log('activeState');
              }
              clearHoverIntent(trigger);
              break;
            case 'mouseout':
              eventType = 'mouseleave';
              break;
            case 'mouseover':
              eventType = 'mouseenter';
          }
          trigger.trigger("true" + eventType);
          return console.log("true" + eventType);
        }
      }, interval));
    };
    trackHoverIntent = function(event) {
      $.mouse.x.current = event.pageX;
      return $.mouse.y.current = event.pageY;
    };
    clearHoverIntent = function(trigger) {
      return clearTimeout(trigger.data('hoverIntentTimer'));
    };
    $.event.special.truemouseenter = {
      setup: function(data, namespaces) {
        return $(this).bind({
          mouseenter: checkHoverIntent,
          mousemove: trackHoverIntent
        });
      },
      teardown: function(data, namespaces) {
        return $(this).unbind({
          mouseenter: checkHoverIntent,
          mousemove: trackHoverIntent
        });
      }
    };
    return $.event.special.truemouseleave = {
      setup: function(data, namespaces) {
        return $(this).bind('mouseleave', checkHoverIntent);
      },
      teardown: function(data, namespaces) {
        return $(this).unbind('mouseleave', checkHoverIntent);
      }
    };
  })(window, jQuery);
}).call(this);
