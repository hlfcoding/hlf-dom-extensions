
/*
HLF Core Mixin Unit Tests
=========================
 */

(function() {
  var slice = [].slice,
    hasProp = {}.hasOwnProperty;

  define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core', 'test/base'], function($, _, hlf) {
    'use strict';
    var assertDynamicMixinInstance, assertMixinInstance, module, test;
    module = QUnit.module, test = QUnit.test;
    module('mixin core', {
      beforeEach: function() {
        this.mixins = {};
        this.mixin = {
          decorate: function() {
            this.someOtherProperty = 'baz';
          },
          someMethod: function() {
            return 'foo';
          },
          someProperty: 'bar'
        };
        this.dynamicMixin = function(dependencies) {
          return {
            someMethod: function() {
              return dependencies.valueA;
            },
            someProperty: dependencies.valueB
          };
        };
        this.mixinName = 'foo';
        this.dynamicMixinName = 'bar';
        this.instance = {};
        this.dependencies = {
          valueA: 'foo',
          valueB: 'bar'
        };
      }
    });
    test('.createMixin', function(assert) {
      var result;
      result = hlf.createMixin(this.mixins, this.mixinName, this.mixin);
      assert.strictEqual(result, this.mixin, 'Mixin is added to mixin collection.');
      assert.strictEqual(this.mixins[this.mixinName], this.mixin, 'Mixin is accessible.');
      assert.strictEqual(this.mixins[this.mixinName].someMethod.mixin, this.mixinName, 'Mixin method has mixin name attached.');
      result = hlf.createMixin(this.mixins, this.mixinName, this.mixin);
      assert.strictEqual(result, false, 'Mixin is not re-added to mixin collection.');
    });
    assertMixinInstance = function(assert) {
      assert.ok(this.instance.someMethod, 'Mixin method is added to instance.');
      assert.strictEqual(this.instance.someMethod(), 'foo', 'Mixin method is generated properly.');
      assert.strictEqual(this.instance.decorate, void 0, 'Mixin once method is removed after invoking.');
      assert.strictEqual(this.instance.someOtherProperty, 'baz', 'Mixin once method is invoked properly.');
    };
    test('.applyMixins', function(assert) {
      var result;
      result = hlf.createMixin(this.mixins, this.mixinName, this.mixin);
      hlf.applyMixins(this.instance, this.dependencies, this.mixin);
      assertMixinInstance.call(this, assert);
    });
    assertDynamicMixinInstance = function(assert) {
      assert.ok(this.instance.someMethod, 'Dynamic mixin method is added to instance.');
      assert.strictEqual(this.instance.someMethod(), this.dependencies.valueA, 'Dynamic mixin method is generated properly.');
    };
    test('.applyMixins with dynamicMixin', function(assert) {
      var result;
      result = hlf.createMixin(this.mixins, this.dynamicMixinName, this.dynamicMixin);
      hlf.applyMixins(this.instance, this.dependencies, this.dynamicMixin);
      assertDynamicMixinInstance.call(this, assert);
    });
    test('.applyMixins', function(assert) {
      hlf.createMixin(this.mixins, this.mixinName, this.mixin);
      hlf.createMixin(this.mixins, this.dynamicMixinName, this.dynamicMixin);
      hlf.applyMixins.apply(hlf, [this.instance, this.dependencies].concat(slice.call(_.values(this.mixins))));
      assertMixinInstance.call(this, assert);
      assertDynamicMixinInstance.call(this, assert);
    });
    module('hlf.mixins.data', {
      beforeEach: function() {
        this.instance = {
          attr: function(name) {
            return "some-ns-" + name;
          },
          $el: $('<div>')
        };
        hlf.applyMixin(this.instance, [], 'data');
      }
    });
    test('#data', function(assert) {
      var key, pairs, value;
      this.instance.$el.data('some-ns-some-attr', 'some-value');
      assert.strictEqual(this.instance.data('some-attr'), 'some-value', 'It namespaces key and gets value for single key via $.fn.data.');
      this.instance.data('some-attr', 'some-value');
      assert.strictEqual(this.instance.$el.data('some-ns-some-attr'), 'some-value', 'It namespaces key and sets value for single key via $.fn.data.');
      pairs = {
        'some-attr': 'some-value',
        'other-attr': 'other-value'
      };
      this.instance.data(pairs);
      for (key in pairs) {
        if (!hasProp.call(pairs, key)) continue;
        value = pairs[key];
        assert.strictEqual(this.instance.$el.data("some-ns-" + key), value, 'It namespaces keys and sets values in pairs object via $.fn.data.');
      }
    });
    module('hlf.mixins.event', {
      beforeEach: function() {
        var additions;
        additions = hlf._createPluginAPIAdditions('some-plugin', {
          toString: function() {
            return '.some-ns';
          }
        });
        this.instance = {
          evt: additions.evt,
          $el: $('<div><div></div></div>')
        };
        hlf.applyMixin(this.instance, [], 'event');
      }
    });
    test("#on", function(assert) {
      var handler;
      assert.expect(10);
      this.instance.on('some-event other-event', function(e) {
        assert.ok(e, 'It namespaces, binds event(s) with handler via $.fn.on.');
      });
      this.instance.$el.trigger('some-event.some-ns').trigger('other-event.some-ns').off();
      handler = function(e) {
        assert.ok(e, 'It namespaces, binds from event(s)-handler map via $.fn.on.');
      };
      this.instance.on({
        'some-event': handler,
        'other-event': handler
      });
      this.instance.$el.trigger('some-event.some-ns').trigger('other-event.some-ns').off();
      handler = function(e, data) {
        assert.ok(e, 'It supports selector filter (event delegation) via $.fn.on.');
        assert.strictEqual(data, 'some-value', 'It supports event data via $.fn.on.');
      };
      this.instance.on('some-event', 'div', handler);
      this.instance.$el.find('div').trigger('some-event.some-ns', 'some-value').end().off();
      this.instance.on({
        'some-event': handler,
        'other-event': handler
      }, 'div');
      this.instance.$el.find('div').trigger('some-event.some-ns', 'some-value').trigger('other-event.some-ns', 'some-value').end().off();
    });
    test('#off', function(assert) {
      var boilerplated, handled, handler, handlers;
      handled = {
        'some-event.some-ns': 0,
        'other-event.some-ns': 0,
        total: function() {
          return this['some-event.some-ns'] + this['other-event.some-ns'];
        }
      };
      handler = function(e) {
        handled[e.type + "." + e.namespace] += 1;
      };
      handlers = {
        'some-event.some-ns': handler,
        'other-event.some-ns': handler
      };
      boilerplated = (function(_this) {
        return function(test) {
          _this.instance.$el.on(handlers);
          test();
          _this.instance.$el.trigger('some-event.some-ns').trigger('other-event.some-ns');
          _this.instance.$el.off();
        };
      })(this);
      boilerplated((function(_this) {
        return function() {
          _this.instance.off();
        };
      })(this));
      assert.strictEqual(handled.total(), 0, 'It unbinds all events via $.fn.off.');
      boilerplated((function(_this) {
        return function() {
          _this.instance.off({
            'some-event': handler,
            'other-event': handler
          });
        };
      })(this));
      assert.strictEqual(handled.total(), 0, 'It namespaces, unbinds from event(s)-handler map via $.fn.off.');
      boilerplated((function(_this) {
        return function() {
          _this.instance.off('some-event', handler);
        };
      })(this));
      assert.ok(handled.total() === 1 && handled['other-event.some-ns'] === 1, 'It namespaces, unbinds event(s) from handler via $.fn.off.');
      boilerplated((function(_this) {
        return function() {
          _this.instance.off('some-event');
        };
      })(this));
      assert.ok(handled.total() === 2 && handled['other-event.some-ns'] === 2, 'It namespaces, unbinds event(s) from all handlers via $.fn.off.');
      this.instance.$el.on(handlers, 'div');
      this.instance.off('some-event', 'div', handler);
      this.instance.$el.trigger('some-event.some-ns').trigger('other-event.some-ns').find('div').trigger('some-event.some-ns').trigger('other-event.some-ns');
      assert.ok(handled.total() === 3 && handled['other-event.some-ns'] === 3, 'It supports selector filter (event delegation) via $.fn.off.');
    });
    module('hlf.mixins.selection', {
      beforeEach: function() {
        this.instance = {
          classNames: {
            'some-child': 'js-ns-some-child',
            'other-child': 'js-ns-other-child'
          },
          selectors: {
            someChild: '.js-ns-some-child',
            otherChild: '.js-ns-other-child'
          },
          $el: $("<div>\n  <div class=\"js-ns-some-child\"></div>\n  <div class=\"js-ns-other-child\"></div>\n</div>")
        };
        hlf.applyMixin(this.instance, [], 'selection');
      }
    });
    test('#select', function(assert) {
      this.instance.select();
      assert.ok(this.instance.$someChild.is('.js-ns-some-child'), "It sets a property for each 'selectors' prop-class-name pair.");
      assert.ok(this.instance.$otherChild.is('.js-ns-other-child'), "It sets a property for each 'selectors' prop-class-name pair.");
    });
    test('#selectByClass', function(assert) {
      assert.ok(this.instance.selectByClass('some-child').is('.js-ns-some-child'), "It returns selector results using full 'classNames' value for key.");
      assert.ok(this.instance.selectByClass('other-child').is('.js-ns-other-child'), "It returns selector results using full 'classNames' value for key.");
    });
    return true;
  });

}).call(this);

//# sourceMappingURL=core.mixin.js.map
