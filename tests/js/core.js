//
// HLF Core Unit Tests
// ===================
// Offloads testing larger corer components to other test modules.
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

  require(['hlf/core'], (hlf) => {
    const { module, test } = QUnit;

    // ---

    module('other');

    test('exports', (assert) => {
      assert.ok(hlf, 'Namespace should exist.');
      assert.ok(hlf.createExtensionConstructor, 'Method should exist.');
    });

    class SomeExtension {
      constructor(element, options, contextElement) {
        this.eventListeners = {
          someevent: this.handleSomeEvent.bind(this),
        };
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
        document.getElementById('qunit-fixture').appendChild(this.someElement);
        let fragment = document.createDocumentFragment();
        fragment.appendChild(this.someElement);
        this.someNodeList = fragment.childNodes;
      },
    });

    function assertExtensionBase(module, extension, assert) {
      let someExtension = extension(module.someElement);
      let instance = someExtension();
      ['attrName', 'className', 'eventName']
        .forEach((methodName) => {
          assert.ok(typeof instance[methodName] === 'function',
            'Instance has generated API addition.');
        });
      ['someOption', 'someOptionGroup', 'selectors', 'classNames']
        .forEach((propertyName) => {
          assert.ok(propertyName in instance,
            'Instance has options merged in as property.');
        });
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

    test('.createExtensionConstructor with apiClass, additions', function(assert) {
      let extension = hlf.createExtensionConstructor(this.createOptions());
      let instance = assertExtensionBase(this, extension, assert);
      assert.ok(instance instanceof SomeExtension,
        'It returns instance upon re-invocation without any parameters.');
    });

    test('.createPlugin with apiClass, additions, asSharedInstance', function(assert) {
      let createOptions = Object.assign(this.createOptions(), { asSharedInstance: true });
      let extension = hlf.createExtensionConstructor(createOptions);
      let instance = assertExtensionBase(this, extension, assert);
      assert.strictEqual(instance.id,
        parseInt(document.body.getAttribute('data-se-instance-id')),
        'It stores plugin singleton with context element.');
    });

    // ---

    QUnit.start();
  });

}());
