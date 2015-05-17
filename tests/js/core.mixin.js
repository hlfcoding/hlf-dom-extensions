
/*
HLF Core Mixin Unit Tests
=========================
 */

(function() {
  var slice = [].slice;

  define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core'], function($, _, hlf) {
    var assertDynamicMixinInstance, assertMixinInstance;
    QUnit.module('mixin', {
      setup: function() {
        this.mixins = {};
        this.mixin = {
          decorate: function() {
            return this.someOtherProperty = 'baz';
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
        return this.dependencies = {
          valueA: 'foo',
          valueB: 'bar'
        };
      }
    });
    QUnit.test('createMixin', function(assert) {
      var result;
      result = hlf.createMixin(this.mixins, this.mixinName, this.mixin);
      assert.strictEqual(result, this.mixin, 'Mixin should have been added to mixin collection.');
      assert.strictEqual(this.mixins[this.mixinName], this.mixin, 'Mixin should be accessible.');
      assert.strictEqual(this.mixins[this.mixinName].someMethod.mixin, this.mixinName, 'Mixin method should have mixin name attached.');
      result = hlf.createMixin(this.mixins, this.mixinName, this.mixin);
      return assert.strictEqual(result, false, 'Mixin should not have been re-added to mixin collection.');
    });
    assertMixinInstance = function(assert) {
      assert.ok(this.instance.someMethod, 'Mixin method should have been added to instance.');
      assert.strictEqual(this.instance.someMethod(), 'foo', 'Mixin method should have been generated properly.');
      assert.strictEqual(this.instance.decorate, void 0, 'Mixin once method should have been removed after invoking.');
      return assert.strictEqual(this.instance.someOtherProperty, 'baz', 'Mixin once method should have invoked properly.');
    };
    QUnit.test('applyMixin', function(assert) {
      var result;
      result = hlf.createMixin(this.mixins, this.mixinName, this.mixin);
      hlf.applyMixins(this.instance, this.dependencies, this.mixin);
      return assertMixinInstance.call(this, assert);
    });
    assertDynamicMixinInstance = function(assert) {
      assert.ok(this.instance.someMethod, 'Dynamic mixin method should have been added to instance.');
      return assert.strictEqual(this.instance.someMethod(), this.dependencies.valueA, 'Dynamic mixin method should have been generated properly.');
    };
    QUnit.test('applyMixin with dynamicMixin', function(assert) {
      var result;
      result = hlf.createMixin(this.mixins, this.dynamicMixinName, this.dynamicMixin);
      hlf.applyMixins(this.instance, this.dependencies, this.dynamicMixin);
      return assertDynamicMixinInstance.call(this, assert);
    });
    QUnit.test('applyMixins', function(assert) {
      hlf.createMixin(this.mixins, this.mixinName, this.mixin);
      hlf.createMixin(this.mixins, this.dynamicMixinName, this.dynamicMixin);
      hlf.applyMixins.apply(hlf, [this.instance, this.dependencies].concat(slice.call(_.values(this.mixins))));
      assertMixinInstance.call(this, assert);
      return assertDynamicMixinInstance.call(this, assert);
    });
    return true;
  });

}).call(this);

//# sourceMappingURL=core.mixin.js.map
