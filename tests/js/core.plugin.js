
/*
HLF Core Plugin Unit Tests
==========================
 */

(function() {
  define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core', 'test/base'], function($, _, hlf) {
    'use strict';
    var SomePlugin, assertGeneralPlugin, module, test;
    module = QUnit.module, test = QUnit.test;
    SomePlugin = (function() {
      function SomePlugin($el, options, $context) {
        this.$el = $el;
        this.$context = $context;
      }

      return SomePlugin;

    })();
    module('plugin core', {
      beforeEach: function() {
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
            this.trigger('did-init');
          }
        });
        $.createMixin(this.mixins, 'someMixin', {
          decorate: function() {
            this.on('did-init', (function(_this) {
              return function() {
                return _this.initSomeMixin();
              };
            })(this));
          },
          initSomeMixin: function() {
            this.someMixinProperty = 'foo';
          },
          someMixinMethod: function() {
            return 'foo';
          }
        });
        $.createMixin(this.mixins, 'someOtherMixin', {
          decorate: function() {
            this.on('did-init', (function(_this) {
              return function() {
                return _this.initSomeOtherMixin();
              };
            })(this));
          },
          initSomeOtherMixin: function() {
            this.someOtherMixinProperty = 'bar';
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
        this.$someElement = $('<div>');
      }
    });
    assertGeneralPlugin = function(assert) {
      var result;
      assert.ok(this.$someElement.somePlugin, 'Plugin method is created and attached to jQuery elements.');
      this.$someElement.somePlugin();
      result = this.$someElement.somePlugin();
      assert.hasFunctions(result, ['evt', 'attr', 'cls', 'debugLog', 'select'], 'Instance has generated API additions.');
      assert.hasOwnProperties(result, _.keys(this.namespace.defaults), 'Instance has options merged in as properties.');
      assert.ok(result.$someElement, 'Instance has auto-selected sub elements based on selectors option.');
      return result;
    };
    test('.createPlugin with apiClass, baseMixins', function(assert) {
      var result;
      hlf.createPlugin(this.baseCreateOptions);
      result = assertGeneralPlugin.call(this, assert);
      assert.ok(result instanceof SomePlugin, 'It returns instance upon re-invocation without any parameters.');
    });
    test('.createPlugin with apiMixins, baseMixins', function(assert) {
      var createOptions, result;
      createOptions = this.baseCreateOptions;
      createOptions.apiClass = null;
      createOptions.apiMixins = this.mixins;
      createOptions.baseMixins.push('data', 'event');
      hlf.createPlugin(createOptions);
      result = assertGeneralPlugin.call(this, assert);
      assert.hasFunctions(result, ['data', 'on', 'off', 'trigger'], 'It adds base mixin methods to instance.');
      assert.strictEqual(result.someMixinMethod(), 'foo', 'Mixin method attached to instance works.');
      assert.strictEqual(result.someOtherMixinMethod(), 'bar', 'Mixin method attached to instance works.');
      assert.strictEqual(result.someMixinProperty, 'foo', 'Mixin property is set on deferred initialization.');
      assert.strictEqual(result.someOtherMixinProperty, 'bar', 'Mixin property is set on deferred initialization.');
    });
    test('.createPlugin with apiClass, baseMixins, asSharedInstance', function(assert) {
      var createOptions, result;
      createOptions = this.baseCreateOptions;
      createOptions.asSharedInstance = true;
      hlf.createPlugin(createOptions);
      result = assertGeneralPlugin.call(this, assert);
      assert.strictEqual(result, $('body').data('somePlugin'), 'It stores plugin singleton with context element.');
    });
    return true;
  });

}).call(this);

//# sourceMappingURL=core.plugin.js.map
