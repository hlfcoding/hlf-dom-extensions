//
// HLF Extensions Core Tests
// =========================
// Offloads testing larger core components to other test modules.
//
// [Page](../../../tests/core.unit.html)

(function() {
  'use strict';

  require.config({
    baseUrl: '../lib',
    paths: {
      hlf: '../src/js',
      test: '../tests/js',
    },
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
      constructor(element, options, contextElement) {
        this.eventListeners = {
          someevent: this.handleSomeEvent.bind(this),
        };
      }
      init() {
        this.didInit = true;
      }
      handleSomeEvent(event) {
        this.someEventDetail = event.detail;
      }
      performSomeAction(payload) {
        this.someActionPayload = payload;
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
            selectors: { someElement: '.foo' },
            classNames: { someElement: 'foo' },
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
        let fragment = document.createDocumentFragment();
        fragment.appendChild(this.someElement);
        this.someNodeList = fragment.childNodes;
      },
    });

    function assertExtensionBase(module, extension, assert) {
      let someExtension = extension(module.someElement);
      let instance = someExtension();
      assert.ok(instance.didInit, 'Instance had initialization method called.');
      ['attrName', 'className', 'eventName']
        .forEach((methodName) => {
          assert.ok(typeof instance[methodName] === 'function',
            `Instance has generated API addition ${methodName}.`);
        });
      Object.keys(module.namespace.defaults)
        .forEach((propertyName) => {
          assert.ok(propertyName in instance,
            `Instance has option ${propertyName} merged in as property.`);
        });
      assert.equal(instance.someOption, 'bar',
        'Extension allows custom options via element data attribute.');
      assert.ok('someElement' in instance,
        'Instance has auto-selected sub elements based on selectors option.');
      const data = { key: 'value' };
      instance.dispatchCustomEvent('someevent', data);
      assert.equal(instance.someEventDetail, data,
        'Instance has auto-added listeners based on eventListeners.');
      someExtension('performSomeAction', data);
      assert.equal(instance.someActionPayload, data,
        'Extension function can perform action, using default perform.');
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
        'Extension stores plugin singleton with context element.');
    });

    // ---

    QUnit.start();
  });

}());
