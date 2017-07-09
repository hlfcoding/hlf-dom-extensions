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
      init() {
        if (this.addEventListeners) {
          this.addEventListeners((() => {
            let listeners = {};
            listeners[this.eventName('someotherevent')] = this._onSomeOtherEvent;
            return listeners;
          })());
        }
      }
      _onSomeOtherEvent(event) {
        this._someOtherEventDetail = event.detail;
      }
    }

    // ---

    module('old extension core', {
      beforeEach() {
        this.namespace = {
          debug: false,
          toString() { return 'se'; },
          defaults: {},
        };
        this.createOptions = (testedOptions) => (Object.assign({}, {
          name: 'someExtension',
          namespace: this.namespace,
          apiClass: SomeExtension,
          autoBind: true,
          autoListen: true,
          compactOptions: true,
        }, testedOptions));
        this.someElement = document.createElement('div');
        this.someElement.setAttribute('data-se', '{ "someOption": "bar" }');
        document.getElementById('qunit-fixture').appendChild(this.someElement);
      },
    });

    function assertExtensionBase(module, extension, assert) {
      let { namespace, someElement } = module;
      let someExtension = extension(someElement);
      let instance = someExtension();
      assert.equal(instance.someOption, 'bar',
        'Extension allows custom options via element data attribute.');
      const data = { key: 'value' };
      instance.dispatchCustomEvent('someotherevent', data);
      assert.equal(instance._someOtherEventDetail, data,
        'Instance has added auto-bound methods (listeners) via helper.');
      return instance;
    }

    test('.createExtension with apiClass, additions', function(assert) {
      let extension = hlf.createExtension(this.createOptions());
      let instance = assertExtensionBase(this, extension, assert);
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
          createSomeChildElement() {
            let someElement = document.createElement('div');
            someElement.classList.add('foo');
            this.someElement.appendChild(someElement);
          },
          createTestExtension({ classAdditions, createOptions, defaults } = {}) {
            const { methods, onNew, staticMethods } = classAdditions || {};
            class SomeExtension {
              constructor(element, options, contextElement) {
                if (onNew) { onNew.apply(this, arguments); }
              }
            }
            Object.assign(SomeExtension.prototype, methods);
            Object.assign(SomeExtension, staticMethods);
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
          someData: { key: 'value' },
          someElement: document.createElement('div'),
        });
        document.getElementById('qunit-fixture').appendChild(this.someElement);
      },
    });

    test('initializers', function(assert) {
      let { extension, namespace } = this.createTestExtension({
        classAdditions: {
          methods: { init() { this._didInit = true; } },
          staticMethods: { init() { this._didInit = true; } },
        },
      });
      let instance = extension(this.someElement)();
      assert.ok(instance instanceof namespace.apiClass,
        'Extension returns instance upon re-invocation without any parameters.');
      assert.ok(instance._didInit,
        'Instance had initializer called.');
      assert.ok(namespace.apiClass._didInit,
        'Extension class had initializer called.');
      assert.equal(instance.element, this.someElement,
        'Extension stores the element as property.');
      assert.equal(instance.rootElement, instance.element,
        'Extension sets the element as root element.');
      assert.ok(instance.element.classList.contains('js-se'),
        'Extension gives the element the main class.');
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

    test('action methods', function(assert) {
      let { extension } = this.createTestExtension({
        classAdditions: { methods: {
          performSomeAction(payload) {
            this._someActionPayload = payload;
          },
        }},
      });
      let someExtension = extension(this.someElement);
      let instance = someExtension();
      someExtension('someAction', this.someData);
      assert.equal(instance._someActionPayload, this.someData,
        'Extension function can perform action, using default perform.');
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

    test('autoBind option', function(assert) {
      let { extension } = this.createTestExtension({
        classAdditions: { methods: {
          _onSomeEvent() {
            this.someContext = this;
          }
        }},
        createOptions: { autoBind: true },
      });
      let instance = extension(this.someElement)();
      let { _onSomeEvent } = instance;
      _onSomeEvent();
      assert.equal(instance.someContext, instance,
        'Instance has auto-bound methods.');
    });

    test('autoListen option', function(assert) {
      let { extension } = this.createTestExtension({
        classAdditions: {
          onNew() {
            this.eventListeners = {};
            this.eventListeners[this.eventName('someevent')] = this._onSomeEvent;
          },
          methods: {
            _onSomeEvent(event) {
              this._someEventDetail = event.detail;
            },
          },
        },
        createOptions: { autoListen: true },
      });
      let instance = extension(this.someElement)();
      this.assertInstanceMethods(instance,
        'addEventListeners', 'removeEventListeners', 'toggleEventListeners',
        'createCustomEvent', 'dispatchCustomEvent');
      instance.dispatchCustomEvent('someevent', this.someData);
      assert.equal(instance._someEventDetail, this.someData,
        'Instance has auto-added auto-bound listeners based on eventListeners.');
    });

    test('autoSelect option', function(assert) {
      let { extension } = this.createTestExtension({
        createOptions: { autoSelect: true },
        defaults: { selectors: { someElement: '.foo', someElements: '.foo' } },
      });
      this.createSomeChildElement();
      let instance = extension(this.someElement)();
      assert.ok(instance.someElement instanceof HTMLElement,
        'Instance has auto-selected sub element based on selectors option.');
      assert.ok(instance.someElements instanceof NodeList,
        'Instance has auto-selected sub elements based on selectors option.');
      this.assertInstanceMethods(instance,
        'selectByClass', 'selectAllByClass', 'selectToProperties');
    });

    // ---

    QUnit.start();
  });

}());
