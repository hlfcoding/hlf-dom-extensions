
/*
HLF Core jQuery Extension
=========================
Released under the MIT License  
Written with jQuery 1.7.2
 */

(function() {
  var extension,
    __slice = [].slice;

  extension = function($, _, hlf) {
    var _createPlugin;
    _.templateSettings = {
      interpolate: /\{\{(.+?)\}\}/g
    };
    $.hlf = {
      createPlugin: function(options) {
        var apiClass, name, namespace, plugin, safeName, _noConflict, _plugin;
        name = options.name;
        safeName = "" + (this.toString()) + (name[0].toUpperCase()) + name.slice(1);
        namespace = options.namespace;
        apiClass = namespace.apiClass = options.apiClass;
        _noConflict = namespace.noConflict;
        this.noConflicts.push((namespace.noConflict = function() {
          if (_.isFunction(_noConflict)) {
            _noConflict();
          }
          return $.fn[name] = _plugin;
        }));
        _plugin = $.fn[name];
        plugin = $.fn[name] = $.fn[safeName] = function(options, $context) {
          var $el, api, boilerplate, deep;
          $el = null;
          boilerplate = function() {
            var $root, _base, _base1, _base2;
            $root = options.asSingleton === false ? $el : $context;
            $root.addClass(namespace.toString('class'));
            if ((_base = apiClass.prototype).evt == null) {
              _base.evt = _.memoize(function(name) {
                return "" + name + (namespace.toString('event'));
              });
            }
            if ((_base1 = apiClass.prototype).attr == null) {
              _base1.attr = _.memoize(function(name) {
                return "" + (namespace.toString('data')) + name;
              });
            }
            if ((_base2 = apiClass.prototype).debugLog == null) {
              _base2.debugLog = namespace.debug === false ? $.noop : function() {
                var _ref;
                return (_ref = $.hlf).debugLog.apply(_ref, [namespace.toString('log')].concat(__slice.call(arguments)));
              };
            }
            return $root.data(namespace.toString('data'), new apiClass($el, options, $context));
          };
          if ($context == null) {
            $context = $('body');
          }
          api = this.first().data(namespace.toString('data'));
          if ((api != null) && (options == null)) {
            return api;
          }
          options = $.extend((deep = true), {}, namespace.defaults, options);
          if (options.asSingleton === false) {
            return this.each(function() {
              $el = $(this);
              return boilerplate();
            });
          } else {
            $el = this;
            boilerplate();
          }
          return this;
        };
        return plugin;
      },
      noConflicts: [],
      noConflict: function() {
        var fn;
        return ((function() {
          var _i, _len, _ref, _results;
          _ref = this.noConflicts;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            fn = _ref[_i];
            _results.push(fn());
          }
          return _results;
        }).call(this)).length;
      },
      debug: true,
      toString: _.memoize(function(context) {
        return 'hlf';
      })
    };
    $.hlf.debugLog = $.hlf.debug === false ? $.noop : (console.log.bind ? console.log.bind(console) : console.log);
    _.bindAll($.hlf, 'createPlugin');
    _createPlugin = $.createPlugin;
    $.createPlugin = $.hlf.createPlugin;
    $.hlf.noConflicts.push(function() {
      return $.createPlugin = _createPlugin;
    });
    return $.hlf;
  };

  if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
    define(['jquery', 'underscore'], extension);
  } else {
    extension(jQuery, _);
  }

}).call(this);
