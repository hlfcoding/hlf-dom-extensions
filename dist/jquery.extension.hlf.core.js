
/*
HLF Core jQuery Extension
=========================
 */

(function() {
  var slice = [].slice,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  (function(root, factory) {
    if (typeof define === 'function' && (define.amd != null)) {
      return define(['jquery', 'underscore'], factory);
    } else if (typeof exports === 'object') {
      return module.exports = factory(require('jquery', require('underscore')));
    } else {
      return factory(jQuery, _, jQuery.hlf);
    }
  })(this, function($, _) {
    var _createPluginAPIAdditions, _createPluginInstance, _noConflicts, _safeSet, hlf;
    hlf = {
      debug: true,
      toString: _.memoize(function(context) {
        return 'hlf';
      }),
      noConflict: function() {
        var fn;
        return ((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = _noConflicts.length; i < len; i++) {
            fn = _noConflicts[i];
            results.push(fn());
          }
          return results;
        })()).length;
      }
    };
    hlf.debugLog = hlf.debug === false ? $.noop : (console.log.bind ? console.log.bind(console) : console.log);
    _noConflicts = [];
    _.extend(hlf, {
      createPlugin: function(createOptions) {
        var _noConflict, _plugin, apiAdditions, apiClass, apiMixins, deep, mixinFilter, name, namespace, plugin, safeName;
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
              return _createPluginInstance.apply(null, [$el].concat(slice.call(args)));
            } else {
              return $el.each(function() {
                return _createPluginInstance.apply(null, [$(this)].concat(slice.call(args)));
              });
            }
          })(options, $context, namespace, apiClass, apiMixins, mixinFilter, createOptions);
          return this;
        };
      }
    });
    _.bindAll(hlf, 'createPlugin');
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
          hlf.applyMixins.apply(hlf, [instance, namespace].concat(slice.call(createOptions.baseMixins)));
        }
        if (createOptions.apiMixins != null) {
          hlf.applyMixins.apply(hlf, [instance, namespace].concat(slice.call(createOptions.apiMixins)));
        }
      } else if (apiMixins != null) {
        instance = {
          $el: $el,
          options: finalOptions
        };
        if (createOptions.baseMixins != null) {
          hlf.applyMixins.apply(hlf, [instance, namespace].concat(slice.call(createOptions.baseMixins)));
        }
        hlf.applyMixin(instance, namespace, apiMixins.base);
        otherMixins = _.chain(apiMixins).filter(mixinFilter, instance).values().without(apiMixins.base).value();
        hlf.applyMixins.apply(hlf, [instance, namespace].concat(slice.call(otherMixins)));
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
          return hlf.debugLog.apply(hlf, [namespace.toString('log')].concat(slice.call(arguments)));
        }
      };
    };
    _.extend(hlf, {
      applyMixin: function(context, dependencies, mixin) {
        var handlerNames, i, len, method, mixinToApply, name, onceMethods, prop;
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
          if (!hasProp.call(mixin, name)) continue;
          prop = mixin[name];
          if (!(_.isFunction(prop))) {
            continue;
          }
          if (indexOf.call(this.mixinOnceNames, name) >= 0) {
            onceMethods.push(prop);
          }
          if (name.indexOf('handle') === 0 && name !== 'handleCommand') {
            handlerNames.push(name);
          }
        }
        mixinToApply = _.omit(mixin, this.mixinOnceNames);
        _.extend(context, mixinToApply);
        for (i = 0, len = onceMethods.length; i < len; i++) {
          method = onceMethods[i];
          method.call(context);
        }
        if (handlerNames.length) {
          return _.bindAll.apply(_, [context].concat(slice.call(handlerNames)));
        }
      },
      applyMixins: function() {
        var context, dependencies, i, len, mixin, mixins, results;
        context = arguments[0], dependencies = arguments[1], mixins = 3 <= arguments.length ? slice.call(arguments, 2) : [];
        results = [];
        for (i = 0, len = mixins.length; i < len; i++) {
          mixin = mixins[i];
          results.push(this.applyMixin(context, dependencies, mixin));
        }
        return results;
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
            if (!hasProp.call(mixin, k)) continue;
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
                    if (!hasProp.call(first, k)) continue;
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
              var name, ref, result, results, selector;
              ref = this.selectors;
              results = [];
              for (name in ref) {
                if (!hasProp.call(ref, name)) continue;
                selector = ref[name];
                if ((result = this.$el.find(selector)) != null) {
                  results.push(this["$" + name] = result);
                } else {
                  results.push(void 0);
                }
              }
              return results;
            },
            selectByClass: function(className) {
              var classNames, ref;
              classNames = (ref = this.options) != null ? ref.classNames : void 0;
              if (classNames == null) {
                classNames = this.classNames;
              }
              return this.$el.find("." + this.classNames[className]);
            }
          };
        }
      }
    });
    _safeSet = function(key, toContext, fromContext) {
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
    _safeSet('applyMixin');
    _safeSet('applyMixins');
    _safeSet('createMixin');
    _safeSet('createPlugin');
    _safeSet('mixinOnceNames');
    _safeSet('mixins');
    $.hlf = hlf;
    return $.hlf;
  });

}).call(this);
