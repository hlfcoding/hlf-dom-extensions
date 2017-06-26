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
        this.eventListeners[this.eventName('someevent')] =
          this.handleSomeEvent.bind(this);
      }
      init() {
        this._didInit = true;
      }
      handleSomeEvent(event) {
        this._someEventDetail = event.detail;
      }
      performSomeAction(payload) {
        this._someActionPayload = payload;
      }
    }

    // ---

    module('extension core', {
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
          autoListen: true,
          autoSelect: true,
          compactOptions: true,
        }, testedOptions));
        this.someElement = document.createElement('div');
        this.someElement.setAttribute('data-se', '{ "someOption": "bar" }');
        document.getElementById('qunit-fixture').appendChild(this.someElement);
        this.someOtherElement = document.createElement('div');
        this.someOtherElement.classList.add('foo');
        this.someElement.appendChild(this.someOtherElement);
      },
    });

    function assertExtensionBase(module, extension, assert) {
      let someExtension = extension(module.someElement);
      let instance = someExtension();
      assert.ok(instance._didInit, 'Instance had initializer called.');
      ['attrName', 'className', 'eventName']
        .forEach((methodName) => {
          assert.ok(typeof instance[methodName] === 'function',
            `Instance has generated API addition ${methodName}.`);
          assert.ok(typeof module.namespace[methodName] === 'function',
            `Namespace has generated API addition ${methodName}.`);
        });
      Object.keys(module.namespace.defaults)
        .forEach((propertyName) => {
          assert.ok(propertyName in instance,
            `Instance has option ${propertyName} merged in as property.`);
        });
      assert.equal(instance.someOption, 'bar',
        'Extension allows custom options via element data attribute.');
      assert.ok(instance.someOtherElement instanceof HTMLElement,
        'Instance has auto-selected sub elements based on selectors option.');
      assert.ok(instance.someOtherElements instanceof NodeList,
        'Instance has auto-selected sub elements based on selectors option.');
      const data = { key: 'value' };
      instance.dispatchCustomEvent('someevent', data);
      assert.equal(instance._someEventDetail, data,
        'Instance has auto-added listeners based on eventListeners.');
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

    // ---

    QUnit.start();
  });

}());
