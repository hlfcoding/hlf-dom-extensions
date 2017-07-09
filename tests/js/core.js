//
// HLF Extensions Core Tests
// =========================
// Offloads testing larger core components to other test modules.
//
// [Page](../../../tests/core.unit.html)
//
(function() {
  'use strict';
  if (window.guard && !guard.isNavigatorSupported) { return; }

  require.config({
    baseUrl: '../',
    paths: {
      hlf: 'src/js',
      test: 'tests/js',
    }
  });

  define(['hlf/core', 'test/base'], function(hlf, base) {
    const { module, test } = QUnit;

    // ---

    module('other');

    test('exports', function(assert) {
      assert.ok(hlf, 'Namespace should exist.');
      assert.ok(hlf.createExtension, 'Method should exist.');
    });

    class SomeExtension {
      static init() {
        const perform = this.prototype.perform;
        this.prototype.perform = function(action) {
          this._lastAction = action;
          return perform.call(this, action);
        };
      }
      constructor(element, options, contextElement) {
        this.eventListeners = {};
        this.eventListeners[this.eventName('someevent')] = this._onSomeEvent;
      }
      init() {
        this._didInit = true;
        if (this.addEventListeners) {
          this.addEventListeners((() => {
            let listeners = {};
            listeners[this.eventName('someotherevent')] = this._onSomeOtherEvent;
            return listeners;
          })());
        }
      }
      _onSomeEvent(event) {
        this._someEventDetail = event.detail;
      }
      _onSomeOtherEvent(event) {
        this._someOtherEventDetail = event.detail;
      }
      performSomeAction(payload) {
        this._someActionPayload = payload;
      }
    }

    // ---

    module('old extension core', {
      beforeEach() {
        this.namespace = {
          debug: false,
          toString() { return 'se'; },
          defaults: {
            someOption: 'foo',
            someOptionGroup: { someOption: 'bar' },
            selectors: { someOtherElement: '.foo', someOtherElements: '.foo' },
            classNames: { someOtherElement: 'foo' },
          },
        };
        this.createOptions = (testedOptions) => (Object.assign({}, {
          name: 'someExtension',
          namespace: this.namespace,
          apiClass: SomeExtension,
          autoBind: true,
          autoListen: true,
          autoSelect: true,
          compactOptions: true,
        }, testedOptions));
        this.someElement = document.createElement('div');
        this.someElement.setAttribute('data-se', '{ "someOption": "bar" }');
        document.getElementById('qunit-fixture').appendChild(this.someElement);
        let someOtherElement = document.createElement('div');
        someOtherElement.classList.add('foo');
        this.someElement.appendChild(someOtherElement);
      },
    });

    function assertExtensionBase(module, extension, assert) {
      let { namespace, someElement } = module;
      let someExtension = extension(someElement);
      let instance = someExtension();
      assert.ok(instance._didInit, 'Instance had initializer called.');
      assert.equal(instance.someOption, 'bar',
        'Extension allows custom options via element data attribute.');
      assert.ok(instance.someOtherElement instanceof HTMLElement,
        'Instance has auto-selected sub elements based on selectors option.');
      assert.ok(instance.someOtherElements instanceof NodeList,
        'Instance has auto-selected sub elements based on selectors option.');
      const data = { key: 'value' };
      instance.dispatchCustomEvent('someevent', data);
      assert.equal(instance._someEventDetail, data,
        'Instance has auto-added auto-bound listeners based on eventListeners.');
      instance.dispatchCustomEvent('someotherevent', data);
      assert.equal(instance._someOtherEventDetail, data,
        'Instance has added auto-bound methods (listeners) via helper.');
      someExtension('someAction', data);
      assert.equal(instance._someActionPayload, data,
        'Extension function can perform action, using default perform.');
      assert.equal(instance._lastAction.name, 'someAction',
        'Extension class had initializer called.');
      return instance;
    }

    test('.createExtension with apiClass, additions', function(assert) {
      let extension = hlf.createExtension(this.createOptions());
      let instance = assertExtensionBase(this, extension, assert);
      assert.ok(instance.element.classList.contains('js-se'),
        'Extension stores the element as property and gives it the main class.');
      assert.ok(instance instanceof SomeExtension,
        'Extension returns instance upon re-invocation without any parameters.');
    });

    // TODO: borked.
    /*
    test('.createExtension with apiClass, additions, asSharedInstance', function(assert) {
      let createOptions = Object.assign(this.createOptions(), { asSharedInstance: true });
      let extension = hlf.createExtension(createOptions);
      let instance = assertExtensionBase(this, extension, assert);
      assert.ok(instance.contextElement.classList.contains('js-se'),
        'Extension stores the context element as property and gives it the main class.');
      assert.strictEqual(instance.id,
        parseInt(document.body.getAttribute('data-se-instance-id')),
        'Extension stores singleton with context element.');
    });
    */

    module('extension core', {
      beforeEach(assert) {
        Object.assign(this, {
          assertInstanceMethods(instance, ...methodNames) {
            methodNames.forEach(methodName => assert.ok(
              typeof instance[methodName] === 'function',
              `Instance has generated API addition ${methodName}.`
            ));
          },
          createTestExtension({ createOptions, defaults } = {}) {
            createOptions = Object.assign({}, {
              name: 'someExtension',
              namespace: {
                debug: false,
                toString() { return 'se'; },
                defaults: Object.assign({}, defaults),
              },
              apiClass: SomeExtension,
            }, createOptions);
            return {
              extension: hlf.createExtension(createOptions),
              namespace: createOptions.namespace,
            };
          },
          someElement: document.createElement('div'),
        });
        document.getElementById('qunit-fixture').appendChild(this.someElement);
      },
    });

    test('naming methods', function(assert) {
      const methodNames = ['attrName', 'className', 'eventName'];
      let { extension, namespace } = this.createTestExtension();
      let instance = extension(this.someElement)();
      this.assertInstanceMethods(instance, ...methodNames);
      methodNames.forEach(methodName => assert.ok(
        typeof namespace[methodName] === 'function',
        `Namespace has generated API addition ${methodName}.`
      ));
    });

    test('compactOptions option', function(assert) {
      let { extension } = this.createTestExtension({
        createOptions: { compactOptions: true },
        defaults: { someOption: 'foo' },
      });
      let instance = extension(this.someElement, {
        someOtherOption: 'bar',
      })();
      assert.equal(instance.someOption, 'foo',
        'Instance has default option merged in as property.');
      assert.equal(instance.someOtherOption, 'bar',
        'Instance has custom option merged in as property.');
    });

    // ---

    QUnit.start();
  });

}());
