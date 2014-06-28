
/*
HLF Core jQuery Extension
=========================
Released under the MIT License  
Written with jQuery 1.7.2
 */

(function() {
  var __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  (function(extension) {
    if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
      return define(['jquery', 'underscore'], extension);
    } else {
      return extension(jQuery, _);
    }
  })(function($, _) {
    var hlf, safeSet, _createPluginAPIAdditions, _createPluginInstance, _noConflicts;
    hlf = {
      debug: true,
      toString: _.memoize(function(context) {
        return 'hlf';
      })
    };
    _noConflicts = [];
    _.extend(hlf, {
      noConflict: function() {
        var fn;
        return ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = _noConflicts.length; _i < _len; _i++) {
            fn = _noConflicts[_i];
            _results.push(fn());
          }
          return _results;
        })()).length;
      },
      debugLog: hlf.debug === false ? $.noop : (console.log.bind ? console.log.bind(console) : console.log)
    });
    _createPluginInstance = function($el, options, $context, namespace, apiClass, apiMixins, mixinFilter, createOptions) {
      var $root, data, deep, finalOptions, instance, otherMixins;
      data = $el.data(namespace.toString('data'));
      finalOptions = options;
      if ($.isPlainObject(data)) {
        finalOptions = $.extend((deep = true), {}, options, data);
        $root = $el;
      } else if (createOptions.asSharedInstance) {
        $root = $context;
      } else {
        $root = $el;
      }
      if (apiClass != null) {
        instance = new apiClass($el, finalOptions, $context);
        if (createOptions.baseMixins != null) {
          hlf.applyMixins.apply(hlf, [instance, namespace].concat(__slice.call(createOptions.baseMixins)));
        }
        if (createOptions.apiMixins != null) {
          hlf.applyMixins.apply(hlf, [instance, namespace].concat(__slice.call(createOptions.apiMixins)));
        }
      } else if (apiMixins != null) {
        instance = {
          $el: $el,
          options: finalOptions
        };
        if (createOptions.baseMixins != null) {
          hlf.applyMixins.apply(hlf, [instance, namespace].concat(__slice.call(createOptions.baseMixins)));
        }
        hlf.applyMixin(instance, namespace, apiMixins.base);
        otherMixins = _.chain(apiMixins).filter(mixinFilter, instance).values().without(apiMixins.base).value();
        hlf.applyMixins.apply(hlf, [instance, namespace].concat(__slice.call(otherMixins)));
      }
      if (createOptions.compactOptions === true) {
        $.extend((deep = true), instance, finalOptions);
        delete instance.options;
      } else {
        if (finalOptions.selectors != null) {
          instance.selectors = finalOptions.selectors;
        }
        if (finalOptions.classNames != null) {
          instance.classNames = finalOptions.classNames;
        }
      }
      if (createOptions.autoSelect === true && _.isFunction(instance.select)) {
        instance.select();
      }
      if (instance.cls !== $.noop) {
        $root.addClass(instance.cls());
      }
      if (_.isFunction(instance.init)) {
        instance.init();
      } else if (apiClass == null) {
        hlf.debugLog('ERROR: No `init` method on instance.', instance);
      }
      return $root.data(instance.attr(), instance);
    };
    _createPluginAPIAdditions = function(name, namespace) {
      return {
        evt: _.memoize(function(name) {
          return "" + name + (namespace.toString('event'));
        }),
        attr: _.memoize(function(name) {
          name = name != null ? "-" + name : '';
          return namespace.toString('data') + name;
        }),
        cls: namespace.toString('class') === namespace.toString() ? $.noop : _.memoize(function(name) {
          name = name != null ? "-" + name : '';
          return namespace.toString('class') + name;
        }),
        debugLog: namespace.debug === false ? $.noop : function() {
          return hlf.debugLog.apply(hlf, [namespace.toString('log')].concat(__slice.call(arguments)));
        }
      };
    };
    _.extend(hlf, {
      createPlugin: function(createOptions) {
        var apiAdditions, apiClass, apiMixins, deep, mixinFilter, name, namespace, plugin, safeName, _noConflict, _plugin;
        name = createOptions.name;
        safeName = "" + (this.toString()) + (name[0].toUpperCase()) + name.slice(1);
        namespace = createOptions.namespace;
        apiAdditions = _createPluginAPIAdditions(name, namespace);
        if (createOptions.apiClass != null) {
          apiClass = namespace.apiClass = createOptions.apiClass;
          _.extend(apiClass.prototype, apiAdditions);
        }
        if (createOptions.apiMixins != null) {
          mixinFilter = createOptions.mixinFilter;
          if (mixinFilter == null) {
            mixinFilter = function(mixin) {
              return mixin;
            };
          }
          apiMixins = namespace.apiMixins = createOptions.apiMixins;
          $.extend((deep = true), apiMixins, {
            base: apiAdditions
          });
        }
        _noConflict = namespace.noConflict;
        _plugin = $.fn[name];
        _noConflicts.push((namespace.noConflict = function() {
          if (_.isFunction(_noConflict)) {
            _noConflict();
          }
          return $.fn[name] = _plugin;
        }));
        return plugin = $.fn[name] = $.fn[safeName] = function() {
          var $context, $el, command, instance, options;
          if (_.isString(arguments[0])) {
            command = {
              type: arguments[0],
              userInfo: arguments[1]
            };
          } else {
            options = arguments[0];
            if (arguments[1] != null) {
              $context = arguments[1];
            }
          }
          if ($context == null) {
            $context = $('body');
          }
          if (command != null) {
            this.each(function() {
              var $el, instance, sender;
              $el = $(this);
              instance = $el.data(namespace.toString('data'));
              if (_.isFunction(instance.handleCommand)) {
                if (_.isFunction(command.userInfo)) {
                  command.userInfo($el);
                }
                sender = null;
                return instance.handleCommand(command, sender);
              }
            });
            return this;
          } else {
            $el = createOptions.asSharedInstance === true ? $context : this.first();
            instance = $el.data(namespace.toString('data'));
            if ((instance != null) && (instance.$el != null) && !arguments.length) {
              return instance;
            }
          }
          options = $.extend((deep = true), {}, namespace.defaults, options);
          $el = this;
          (function() {
            var args;
            args = arguments;
            if (createOptions.asSharedInstance === true) {
              return _createPluginInstance.apply(null, [$el].concat(__slice.call(args)));
            } else {
              return $el.each(function() {
                return _createPluginInstance.apply(null, [$(this)].concat(__slice.call(args)));
              });
            }
          })(options, $context, namespace, apiClass, apiMixins, mixinFilter, createOptions);
          return this;
        };
      }
    });
    _.bindAll(hlf, 'createPlugin');
    _.extend(hlf, {
      applyMixin: function(context, dependencies, mixin) {
        var handlerNames, method, mixinToApply, name, onceMethods, prop, _i, _len;
        if (_.isString(mixin)) {
          mixin = this.mixins[mixin];
        }
        if (mixin == null) {
          return;
        }
        if (_.isFunction(mixin)) {
          mixin = mixin(dependencies);
        }
        onceMethods = [];
        handlerNames = [];
        for (name in mixin) {
          if (!__hasProp.call(mixin, name)) continue;
          prop = mixin[name];
          if (!(_.isFunction(prop))) {
            continue;
          }
          if (__indexOf.call(this.mixinOnceNames, name) >= 0) {
            onceMethods.push(prop);
          }
          if (name.indexOf('handle') === 0 && name !== 'handleCommand') {
            handlerNames.push(name);
          }
        }
        mixinToApply = _.omit(mixin, this.mixinOnceNames);
        _.extend(context, mixinToApply);
        for (_i = 0, _len = onceMethods.length; _i < _len; _i++) {
          method = onceMethods[_i];
          method.call(context);
        }
        if (handlerNames.length) {
          return _.bindAll.apply(_, [context].concat(__slice.call(handlerNames)));
        }
      },
      applyMixins: function() {
        var context, dependencies, mixin, mixins, _i, _len, _results;
        context = arguments[0], dependencies = arguments[1], mixins = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
        _results = [];
        for (_i = 0, _len = mixins.length; _i < _len; _i++) {
          mixin = mixins[_i];
          _results.push(this.applyMixin(context, dependencies, mixin));
        }
        return _results;
      },
      createMixin: function(mixins, name, mixin) {
        var k, prop;
        if (mixins == null) {
          mixins = hlf.mixins;
        }
        if (name in mixins) {
          return false;
        }
        mixins[name] = mixin;
        if ($.isPlainObject(mixin)) {
          for (k in mixin) {
            if (!__hasProp.call(mixin, k)) continue;
            prop = mixin[k];
            if (_.isFunction(prop)) {
              prop.mixin = name;
            }
          }
        }
        return mixin;
      },
      mixinOnceNames: ['decorate', 'decorateOptions'],
      mixins: {
        data: function() {
          return {
            data: function() {
              var first, k, pairs, v;
              if (arguments.length) {
                first = arguments[0];
                if (_.isString(first)) {
                  arguments[0] = this.attr(first);
                } else if (_.isObject(first)) {
                  pairs = {};
                  for (k in first) {
                    if (!__hasProp.call(first, k)) continue;
                    v = first[k];
                    pairs[attr(k)] = v;
                  }
                  arguments[0] = pairs;
                }
              }
              return this.$el.data.apply(this.$el, arguments);
            }
          };
        },
        event: function() {
          return {
            on: function(name) {
              if (name != null) {
                name = this.evt(name);
              }
              return this.$el.on.apply(this.$el, arguments);
            },
            off: function(name) {
              if (name != null) {
                name = this.evt(name);
              }
              return this.$el.off.apply(this.$el, arguments);
            },
            trigger: function(name, userInfo) {
              var type;
              type = this.evt(name);
              return this.$el.trigger({
                type: type,
                userInfo: userInfo
              });
            }
          };
        },
        selection: function() {
          return {
            select: function() {
              var name, result, selector, _ref, _results;
              _ref = this.selectors;
              _results = [];
              for (name in _ref) {
                if (!__hasProp.call(_ref, name)) continue;
                selector = _ref[name];
                if ((result = this.$el.find(selector)) != null) {
                  _results.push(this["$" + name] = result);
                } else {
                  _results.push(void 0);
                }
              }
              return _results;
            },
            selectByClass: function(className) {
              var classNames, _ref;
              classNames = (_ref = this.options) != null ? _ref.classNames : void 0;
              if (classNames == null) {
                classNames = this.classNames;
              }
              return this.$el.find("." + this.classNames[className]);
            }
          };
        }
      }
    });
    safeSet = function(key, toContext, fromContext) {
      var _oldValue;
      if (toContext == null) {
        toContext = $;
      }
      if (fromContext == null) {
        fromContext = hlf;
      }
      _oldValue = toContext[key];
      toContext[key] = fromContext[key];
      return _noConflicts.push(function() {
        return toContext[key] = _oldValue;
      });
    };
    safeSet('applyMixin');
    safeSet('applyMixins');
    safeSet('createMixin');
    safeSet('createPlugin');
    safeSet('mixinOnceNames');
    safeSet('mixins');
    $.hlf = hlf;
    return $.hlf;
  });

}).call(this);
