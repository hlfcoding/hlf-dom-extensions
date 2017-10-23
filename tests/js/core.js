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

  require.config({ baseUrl: '../', paths: { hlf: 'dist', test: 'tests/js' } });
  define(['hlf/core', 'test/base'], function(HLF, base) {
    const { module, test } = QUnit;

    // ---

    module('other');

    test('exports', function(assert) {
      assert.ok(HLF, 'Namespace should exist.');
      assert.ok(HLF.buildExtension, 'Method should exist.');
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
          buildTestExtension(extensionClass, options) {
            options = Object.assign({}, options);
            HLF.buildExtension(extensionClass, options);
            this.SomeExtension = extensionClass;
          },
          createSomeChildElement() {
            let someElement = document.createElement('div');
            someElement.classList.add('foo');
            this.someElement.appendChild(someElement);
            return someElement;
          },
          createTestExtensionClass(additions, defaults) {
            const { methods, onNew, staticMethods } = additions || {};
            class SomeExtension {
              constructor(element, options, contextElement) {
                if (onNew) { onNew.apply(this, arguments); }
              }
            }
            Object.assign(SomeExtension.prototype, methods);
            Object.assign(SomeExtension, staticMethods, {
              debug: false,
              defaults: Object.assign({}, defaults),
              toPrefix() { return 'se'; },
            });
            return SomeExtension;
          },
          createTestExtension({ classAdditions, createOptions, defaults } = {}) {
            createOptions = Object.assign({}, {
              name: 'someExtension',
              namespace: {
                debug: false,
                toString() { return 'se'; },
                defaults: Object.assign({}, defaults),
              },
              apiClass: this.createTestExtensionClass(classAdditions, defaults),
            }, createOptions);
            Object.assign(this, {
              extension: HLF.createExtension(createOptions),
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
        if (typeof this.someExtension === 'function') {
          this.someExtension('remove');
        }
        if (this.extension) {
          this.extension._deleteInstances();
        }
      },
    });

    test('initializers', function(assert) {
      this.buildTestExtension(this.createTestExtensionClass({
        methods: { init() { this._didInit = true; } },
        staticMethods: { init() { this._didInit = true; } },
      }));
      this.someExtension = this.SomeExtension.extend(this.someElement);
      const { someExtension, SomeExtension } = this;
      assert.ok(someExtension._didInit,
        'Instance had initializer called.');
      assert.ok(SomeExtension._didInit,
        'Extension class had initializer called.');
      assert.strictEqual(someExtension.element, this.someElement,
        'Extension stores the element as property.');
      assert.strictEqual(someExtension.rootElement, someExtension.element,
        'Extension sets the element as root element.');
      assert.ok(someExtension.element.classList.contains('js-se'),
        'Extension gives the element the main class.');
    });

    test('de-initializers', function(assert) {
      let didDeinit = false;
      let didReceiveEvent = false;
      this.buildTestExtension(this.createTestExtensionClass({
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
      }), { autoListen: true });
      this.someExtension = this.SomeExtension.extend(this.someElement);
      this.someExtension.remove();
      assert.ok(didDeinit,
        'Extension performs "remove" action, calls custom deinit, if any.');
      this.someElement.dispatchEvent(new CustomEvent('sesomeevent'));
      window.dispatchEvent(new Event('resize'));
      assert.notOk(didReceiveEvent,
        'Extension automatically removes listeners from autoListen.');
      this.someExtension = null;
    });

    test('compacted options', function(assert) {
      const defaultSelectors = { someElement: '.foo' };
      const optionSelectors = { someOtherElement: '.bar' };
      this.buildTestExtension(this.createTestExtensionClass(
        null, { classNames: {}, selectors: defaultSelectors }
      ), { compactOptions: true });
      this.someExtension = this.SomeExtension.extend(this.someElement, { selectors: optionSelectors });
      assert.notOk(this.someExtension.options,
        'Extension no longer stores the final options as property.');
      assert.deepEqual(this.someExtension.classNames, this.SomeExtension.defaults.classNames,
        'Extension stores the classNames option as property.');
      assert.deepEqual(this.someExtension.selectors, Object.assign({}, defaultSelectors, optionSelectors),
        'Extension stores the selectors option as property.');
      const configureSelectors = { someOtherElement: '.baz' };
      this.someExtension.configure({ selectors: configureSelectors });
      assert.deepEqual(this.someExtension.selectors,
        Object.assign({}, defaultSelectors, optionSelectors, configureSelectors),
        'Extension performs "configure" action, compacts new options.');
      this.someExtension.configure({ selectors: 'default' });
      assert.deepEqual(this.someExtension.selectors, defaultSelectors,
        'Extension performs "configure" action, restores default options.');
    });

    test('custom options', function(assert) {
      this.buildTestExtension(this.createTestExtensionClass(), { compactOptions: true });
      const options = { someOption: 'bar' };
      this.someElement.setAttribute('data-se', JSON.stringify(options));
      this.someExtension = this.SomeExtension.extend(this.someElement);
      assert.equal(this.someExtension.someOption, options.someOption,
        'Extension allows custom options via element data attribute.');
    });

    test('naming methods', function(assert) {
      const methodNames = ['attrName', 'className', 'eventName', 'varName'];
      this.buildTestExtension(this.createTestExtensionClass());
      this.someExtension = this.SomeExtension.extend(this.someElement);
      this.assertInstanceMethods(this.someExtension, ...methodNames);
      methodNames.forEach(methodName => assert.ok(
        typeof this.SomeExtension[methodName] === 'function',
        `Namespace has generated API addition ${methodName}.`
      ));
      assert.equal(this.someExtension.attrName('some-attribute'), 'data-se-some-attribute',
        'attrName namespaces attribute names correctly.');
      assert.equal(this.someExtension.className('some-class'), 'js-se-some-class',
        'className namespaces class names correctly.');
      assert.equal(this.someExtension.eventName('someevent'), 'sesomeevent',
        'eventName namespaces event names correctly.');
      assert.equal(this.someExtension.varName('some-var'), '--se-some-var',
        'varName namespaces CSS var names correctly.');
    });

    test('timing methods', function(assert) {
      this.buildTestExtension(this.createTestExtensionClass());
      this.someExtension = this.SomeExtension.extend(this.someElement);
      let done = assert.async();
      const duration = 50;

      let elementTimeoutCompleted = false;
      this.someExtension.setElementTimeout(this.someElement, 'some-timeout', duration,
        () => { elementTimeoutCompleted = true; });
      assert.ok(this.someElement.hasAttribute('data-se-some-timeout'),
        'setElementTimeout stores timeout as element data attribute per name.');

      let timeoutCompleted = false;
      this.someExtension.setTimeout('_someTimeout', duration,
        () => { timeoutCompleted = true; });
      assert.ok(this.someExtension._someTimeout,
        'setTimeout stores timeout as property value per name.');

      let elementTimeoutCleared = true;
      this.someExtension.setElementTimeout(this.someElement, 'some-timeout-to-clear', duration,
        () => { elementTimeoutCleared = false; });
      this.someExtension.setElementTimeout(this.someElement, 'some-timeout-to-clear', null);
      assert.notOk(this.someElement.hasAttribute('data-se-some-timeout-to-clear'),
        'setElementTimeout clears timeout if value is null.');

      let timeoutCleared = true;
      this.someExtension.setTimeout('_someTimeoutToClear', duration,
        () => { timeoutCleared = false; });
      this.someExtension.setTimeout('_someTimeoutToClear', null);
      assert.notOk(this.someExtension._someTimeoutToClear,
        'setTimeout clears timeout if value is null.');

      setTimeout(() => {

        assert.ok(elementTimeoutCompleted, 'setElementTimeout calls callback.');
        assert.notOk(this.someElement.hasAttribute('data-se-some-timeout'),
          'setElementTimeout removes element data attribute upon completion.');

        assert.ok(timeoutCompleted, 'setTimeout calls callback.');
        assert.notOk(this.someExtension._someTimeout,
          'setTimeout removes property value upon completion.');

        assert.ok(elementTimeoutCleared,
          'setElementTimeout clears timeout if value is null.');
        assert.ok(timeoutCleared,
          'setTimeout clears timeout if value is null.');

        done();
      }, duration + 50);
    });

    test('css methods', function(assert) {
      this.buildTestExtension(this.createTestExtensionClass(), { mixinNames: ['css'] });
      this.someExtension = this.SomeExtension.extend(this.someElement);
      let childElement = this.createSomeChildElement();

      this.someElement.style.setProperty('--se-some-size', '1px');
      assert.equal(this.someExtension.cssVariable('some-size'), '1px',
        'cssVariable returns variable value on root element by default.');
      childElement.style.setProperty('--se-some-size', '2px');
      assert.equal(this.someExtension.cssVariable('some-size', childElement), '2px',
        'cssVariable returns variable value on given element if any.');

      this.someElement.style.setProperty('transition-duration', '0.1s');
      assert.equal(this.someExtension.cssDuration('transition-duration'), 100,
        'cssDuration returns converted duration on root element by default.');
      childElement.style.setProperty('transition-duration', '0.2s');
      assert.equal(this.someExtension.cssDuration('transition-duration', childElement), 200,
        'cssDuration returns converted duration on given element if any.');
    });

    test('as shared instance', function(assert) {
      this.createSomeChildElement();
      this.buildTestExtension(this.createTestExtensionClass());
      let subject = (contextElement) => (contextElement.querySelectorAll('.foo'));
      this.someExtension = this.SomeExtension.extend(subject, { contextElement: this.someElement });
      assert.deepEqual(this.someExtension.elements, Array.from(subject(this.someElement)),
        'Extension stores the elements as property.');
      assert.deepEqual(this.someExtension.options.querySelector(this.someElement), subject(this.someElement),
        'Extension stores custom query-selector subject as option.');
      assert.strictEqual(this.someExtension.contextElement, this.someElement,
        'Extension stores the context element as property.');
      assert.strictEqual(this.someExtension.rootElement, this.someExtension.contextElement,
        'Extension sets the context element as root element.');
      assert.ok(this.someExtension.contextElement.classList.contains('js-se'),
        'Extension gives the context element the main class.');
    });

    test('compactOptions option', function(assert) {
      this.buildTestExtension(this.createTestExtensionClass(
        null, { someOption: 'foo' }
      ), { compactOptions: true });
      this.someExtension = this.SomeExtension.extend(this.someElement, { someOtherOption: 'bar' });
      assert.equal(this.someExtension.someOption, 'foo',
        'Instance has default options merged in as properties.');
      assert.equal(this.someExtension.someOtherOption, 'bar',
        'Instance has custom options merged in as properties.');
    });

    test('autoBind option', function(assert) {
      this.buildTestExtension(this.createTestExtensionClass({
        methods: {
          _onSomeEvent() { this.someContext = this; }
        }
      }), { autoBind: true });
      this.someExtension = this.SomeExtension.extend(this.someElement);
      let { _onSomeEvent } = this.someExtension;
      _onSomeEvent();
      assert.strictEqual(this.someExtension.someContext, this.someExtension,
        'Instance has auto-bound methods.');
    });

    test('autoListen option', function(assert) {
      this.buildTestExtension(this.createTestExtensionClass({
        onNew() {
          this.eventListeners = {};
          this.eventListeners[this.eventName('someevent')] = this._onSomeEvent;
          this.resizeDelay = 100;
          this._resizeCount = 0;
        },
        methods: {
          _onSomeEvent(event) { this._someEventDetail = event.detail; },
          _onWindowResize(event) { this._resizeCount += 1; },
        },
      }), { autoListen: true });
      this.someExtension = this.SomeExtension.extend(this.someElement);
      this.assertInstanceMethods(this.someExtension,
        'addEventListeners', 'removeEventListeners', 'toggleEventListeners',
        'createCustomEvent', 'dispatchCustomEvent');
      this.someExtension.dispatchCustomEvent('someevent', this.someData);
      assert.equal(this.someExtension._someEventDetail, this.someData,
        'Instance has auto-added auto-bound listeners based on eventListeners.');
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      assert.equal(this.someExtension._resizeCount, 1,
        'Instance has auto-bound and throttled _onWindowResize listener.');
    });

    test('autoSelect option', function(assert) {
      this.buildTestExtension(this.createTestExtensionClass(
        null, { selectors: { someElement: '.foo', someElements: '.foo' } }
      ), { autoSelect: true });
      this.createSomeChildElement();
      this.someExtension = this.SomeExtension.extend(this.someElement);
      assert.ok(this.someExtension.someElement instanceof HTMLElement,
        'Instance has auto-selected sub element based on selectors option.');
      assert.ok(this.someExtension.someElements instanceof NodeList,
        'Instance has auto-selected sub elements based on selectors option.');
      this.assertInstanceMethods(this.someExtension,
        'selectByClass', 'selectAllByClass', 'selectToProperties');
    });

    // ---

    QUnit.start();
  });

}());
