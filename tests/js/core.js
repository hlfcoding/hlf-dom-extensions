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

    // ---

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
            Object.assign(this, {
              extension: hlf.createExtension(createOptions),
              namespace: createOptions.namespace,
            });
          },
          someData: { key: 'value' },
          someElement: document.createElement('div'),
          someExtension: null,
        });
        document.getElementById('qunit-fixture').appendChild(this.someElement);
      },
      afterEach() {
        if (this.someExtension) {
          this.someExtension('remove');
        }
        if (this.extension) {
          this.extension._deleteInstances();
        }
      },
    });

    test('initializers', function(assert) {
      this.createTestExtension({
        classAdditions: {
          methods: { init() { this._didInit = true; } },
          staticMethods: { init() { this._didInit = true; } },
        },
      });
      this.someExtension = this.extension(this.someElement);
      let instance = this.someExtension();
      assert.ok(instance instanceof this.namespace.apiClass,
        'Extension returns instance upon re-invocation without any parameters.');
      assert.ok(instance._didInit,
        'Instance had initializer called.');
      assert.ok(this.namespace.apiClass._didInit,
        'Extension class had initializer called.');
      assert.strictEqual(instance.element, this.someElement,
        'Extension stores the element as property.');
      assert.strictEqual(instance.rootElement, instance.element,
        'Extension sets the element as root element.');
      assert.ok(instance.element.classList.contains('js-se'),
        'Extension gives the element the main class.');
    });

    test('de-initializers', function(assert) {
      let didDeinit = false;
      let didReceiveEvent = false;
      this.createTestExtension({
        classAdditions: {
          onNew() {
            this.eventListeners = {};
            this.eventListeners[this.eventName('someevent')] = this._onSomeEvent;
            this.resizeDelay = 100;
          },
          methods: {
            deinit() { didDeinit = true; },
            _onSomeEvent(event) { didReceiveEvent = true; },
            _onWindowResize(event) { didReceiveEvent = true; },
          },
        },
        createOptions: { autoListen: true },
      });
      this.someExtension = this.extension(this.someElement);
      this.someExtension('remove');
      assert.ok(didDeinit, 'Extension calls custom deinit, if any.');
      assert.notOk(this.extension._getInstance(this.someElement),
        'Extension de-registers and frees instance.');
      this.someElement.dispatchEvent(new CustomEvent('sesomeevent'));
      window.dispatchEvent(new Event('resize'));
      assert.notOk(didReceiveEvent,
        'Extension automatically removes listeners from autoListen.');
      this.someExtension = null;
    });

    test('compacted options', function(assert) {
      this.createTestExtension({
        defaults: { classNames: {}, selectors: {} },
      });
      this.someExtension = this.extension(this.someElement);
      let instance = this.someExtension();
      assert.deepEqual(instance.options, this.namespace.defaults,
        'Extension stores the final options as property.');
      assert.deepEqual(instance.classNames, this.namespace.defaults.classNames,
        'Extension stores the classNames option as property.');
      assert.deepEqual(instance.selectors, this.namespace.defaults.selectors,
        'Extension stores the selectors option as property.');
    });

    test('custom options', function(assert) {
      this.createTestExtension({
        createOptions: { compactOptions: true },
      });
      const options = { someOption: 'bar' };
      this.someElement.setAttribute('data-se', JSON.stringify(options));
      this.someExtension = this.extension(this.someElement);
      let instance = this.someExtension();
      assert.equal(instance.someOption, options.someOption,
        'Extension allows custom options via element data attribute.');
    });

    test('action methods', function(assert) {
      this.createTestExtension({
        classAdditions: { methods: {
          performSomeAction(payload) {
            this._someActionPayload = payload;
          },
        }},
      });
      this.someExtension = this.extension(this.someElement);
      let instance = this.someExtension();
      this.someExtension('someAction', this.someData);
      assert.equal(instance._someActionPayload, this.someData,
        'Extension function can perform action, using default perform.');
    });

    test('naming methods', function(assert) {
      const methodNames = ['attrName', 'className', 'eventName'];
      this.createTestExtension();
      this.someExtension = this.extension(this.someElement);
      let instance = this.someExtension();
      this.assertInstanceMethods(instance, ...methodNames);
      methodNames.forEach(methodName => assert.ok(
        typeof this.namespace[methodName] === 'function',
        `Namespace has generated API addition ${methodName}.`
      ));
    });

    test('asSharedInstance option', function(assert) {
      this.createTestExtension({
        createOptions: { asSharedInstance: true },
      });
      this.createSomeChildElement();
      this.someExtension = this.extension(this.someElement.children, this.someElement);
      let instance = this.someExtension();
      assert.equal(instance.elements, this.someElement.children,
        'Extension stores the elements as property.');
      assert.strictEqual(instance.contextElement, this.someElement,
        'Extension stores the context element as property.');
      assert.strictEqual(instance.rootElement, instance.contextElement,
        'Extension sets the context element as root element.');
      assert.ok(instance.contextElement.classList.contains('js-se'),
        'Extension gives the context element the main class.');
      assert.equal(instance.id,
        parseInt(this.someElement.getAttribute('data-se-instance-id')),
        'Extension stores singleton with context element.');
    });

    test('compactOptions option', function(assert) {
      this.createTestExtension({
        createOptions: { compactOptions: true },
        defaults: { someOption: 'foo' },
      });
      this.someExtension = this.extension(this.someElement, {
        someOtherOption: 'bar',
      });
      let instance = this.someExtension();
      assert.equal(instance.someOption, 'foo',
        'Instance has default options merged in as properties.');
      assert.equal(instance.someOtherOption, 'bar',
        'Instance has custom options merged in as properties.');
    });

    test('autoBind option', function(assert) {
      this.createTestExtension({
        classAdditions: { methods: {
          _onSomeEvent() {
            this.someContext = this;
          }
        }},
        createOptions: { autoBind: true },
      });
      this.someExtension = this.extension(this.someElement);
      let instance = this.someExtension();
      let { _onSomeEvent } = instance;
      _onSomeEvent();
      assert.strictEqual(instance.someContext, instance,
        'Instance has auto-bound methods.');
    });

    test('autoListen option', function(assert) {
      this.createTestExtension({
        classAdditions: {
          onNew() {
            this.eventListeners = {};
            this.eventListeners[this.eventName('someevent')] = this._onSomeEvent;
            this.resizeDelay = 100;
            this._resizeCount = 0;
          },
          methods: {
            _onSomeEvent(event) {
              this._someEventDetail = event.detail;
            },
            _onWindowResize(event) {
              this._resizeCount += 1;
            },
          },
        },
        createOptions: { autoListen: true },
      });
      this.someExtension = this.extension(this.someElement);
      let instance = this.someExtension();
      this.assertInstanceMethods(instance,
        'addEventListeners', 'removeEventListeners', 'toggleEventListeners',
        'createCustomEvent', 'dispatchCustomEvent');
      instance.dispatchCustomEvent('someevent', this.someData);
      assert.equal(instance._someEventDetail, this.someData,
        'Instance has auto-added auto-bound listeners based on eventListeners.');
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      assert.equal(instance._resizeCount, 1,
        'Instance has auto-bound and throttled _onWindowResize listener.');
    });

    test('autoSelect option', function(assert) {
      this.createTestExtension({
        createOptions: { autoSelect: true },
        defaults: { selectors: { someElement: '.foo', someElements: '.foo' } },
      });
      this.createSomeChildElement();
      this.someExtension = this.extension(this.someElement);
      let instance = this.someExtension();
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
