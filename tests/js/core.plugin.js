
/*
HLF Core Plugin Unit Tests
==========================
 */

(function() {
  define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core', 'test/base'], function($, _, hlf) {
    var SomePlugin, assertGeneralPlugin;
    SomePlugin = (function() {
      function SomePlugin($el, options, $context) {
        this.$el = $el;
        this.$context = $context;
      }

      return SomePlugin;

    })();
    QUnit.module('plugin', {
      setup: function() {
        this.namespace = {
          debug: false,
          toString: _.memoize(function(context) {
            switch (context) {
              case 'event':
                return '.some-plugin';
              case 'data':
                return 'some-plugin';
              default:
                return 'somePlugin';
            }
          }),
          defaults: {
            someOption: 'foo',
            someOptionGroup: {
              someOption: 'bar'
            },
            selectors: {
              someElement: '.foo'
            },
            classNames: {
              someElement: 'foo'
            }
          }
        };
        this.mixins = {};
        $.createMixin(this.mixins, 'base', {
          init: function() {
            return this.trigger('did-init');
          }
        });
        $.createMixin(this.mixins, 'someMixin', {
          decorate: function() {
            return this.on('did-init', (function(_this) {
              return function() {
                return _this.initSomeMixin();
              };
            })(this));
          },
          initSomeMixin: function() {
            return this.someMixinProperty = 'foo';
          },
          someMixinMethod: function() {
            return 'foo';
          }
        });
        $.createMixin(this.mixins, 'someOtherMixin', {
          decorate: function() {
            return this.on('did-init', (function(_this) {
              return function() {
                return _this.initSomeOtherMixin();
              };
            })(this));
          },
          initSomeOtherMixin: function() {
            return this.someOtherMixinProperty = 'bar';
          },
          someOtherMixinMethod: function() {
            return 'bar';
          }
        });
        this.baseCreateOptions = {
          name: 'somePlugin',
          namespace: this.namespace,
          apiClass: SomePlugin,
          baseMixins: ['selection'],
          autoSelect: true,
          compactOptions: true
        };
        return this.$someElement = $('<div>');
      }
    });
    assertGeneralPlugin = function(assert) {
      var result;
      assert.ok(this.$someElement.somePlugin, 'Plugin method should have been created and attached to jQuery elements.');
      this.$someElement.somePlugin();
      result = this.$someElement.somePlugin();
      assert.hasFunctions(result, ['evt', 'attr', 'cls', 'debugLog', 'select'], 'Plugin instance should have generated API additions.');
      assert.hasOwnProperties(result, _.keys(this.namespace.defaults), 'Plugin instance should have options merged in as properties.');
      assert.ok(result.$someElement, 'Plugin instance should have auto-selected sub elements based on selectors option.');
      return result;
    };
    QUnit.test('createPlugin with apiClass and baseMixins', function(assert) {
      var result;
      hlf.createPlugin(this.baseCreateOptions);
      result = assertGeneralPlugin.call(this, assert);
      return assert.ok(result instanceof SomePlugin, 'Plugin method should return instance upon re-invocation without any parameters.');
    });
    QUnit.test('createPlugin with apiMixins and baseMixins', function(assert) {
      var createOptions, result;
      createOptions = this.baseCreateOptions;
      createOptions.apiClass = null;
      createOptions.apiMixins = this.mixins;
      createOptions.baseMixins.push('data', 'event');
      hlf.createPlugin(createOptions);
      result = assertGeneralPlugin.call(this, assert);
      assert.hasFunctions(result, ['data', 'on', 'off', 'trigger'], 'Base mixin methods should have been added to instance.');
      assert.strictEqual(result.someMixinMethod(), 'foo', 'Mixin method attached to instance should work.');
      assert.strictEqual(result.someOtherMixinMethod(), 'bar', 'Mixin method attached to instance should work.');
      assert.strictEqual(result.someMixinProperty, 'foo', 'Mixin property should have been set on deferred initialization.');
      return assert.strictEqual(result.someOtherMixinProperty, 'bar', 'Mixin property should have been set on deferred initialization.');
    });
    QUnit.test('createPlugin with apiClass and baseMixins and asSharedInstance', function(assert) {
      var createOptions, result;
      createOptions = this.baseCreateOptions;
      createOptions.asSharedInstance = true;
      hlf.createPlugin(createOptions);
      result = assertGeneralPlugin.call(this, assert);
      return assert.strictEqual(result, $('body').data('somePlugin'), 'Plugin singleton should be stored with context element.');
    });
    return true;
  });

}).call(this);
