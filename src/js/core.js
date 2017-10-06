//
// HLF Extensions Core
// ===================
// [Tests](../../tests/js/core.html)
//
(function(root, namespace) {
  //
  // § __UMD__
  // - When AMD, register the attacher as an anonymous module.
  // - When Node or Browserify, set module exports to the attach result.
  // - When browser globals (root is window), Just run the attach function.
  //
  if (typeof define === 'function' && define.amd) {
    define(namespace);
  } else if (typeof exports === 'object') {
    module.exports = namespace();
  } else {
    window.HLF = namespace();
  }
})(this, function() {
  'use strict';
  //
  // Namespace
  // ---------
  // It takes some more boilerplate and helpers to write DOM extensions. That
  // code and set of conventions is here in the root namespace __HLF__. Child
  // namespaces follow suit convention.
  //
  // - The __debug__ flag here toggles debug logging for everything in the library
  //   that doesn't have a custom debug flag in its namespace.
  //
  // - __toString__ is mainly for extension namespacing. For now, its base form
  //   is very simple.
  //
  // - __debugLog__ in its base form just wraps around `console.log` and links to
  //   the `debug` flag. However, `debugLog` conventionally becomes a no-op if
  //   the `debug` flag is off.
  //
  let HLF = {
    debug: true,
    toPrefix() { return 'hlf'; },
  };
  HLF.debugLog = (HLF.debug === false) ? function(){} :
    (console.log.bind ? console.log.bind(console) : console.log);

  function buildExtension(extensionClass, options) {
    const { defaults } = extensionClass;
    const { autoBind, autoListen, autoSelect, compactOptions } = options;
    const optionGroupNames = ['classNames', 'selectors'].filter(name => name in defaults);

    Object.assign(extensionClass, {
      extend(subject, options = {}) {
        let { element, elements } = _parseSubject(subject, options);
        let { contextElement: context } = options;
        let root = (context || element);
        root.classList.add(this.className());
        options = _assignOptions(options,
          defaults, optionGroupNames, root.getAttribute(this.attrName())
        );
        let instance = new this(
          element || elements, Object.assign({}, options), context
        );
        instance._setUpCleanupTasks();
        Object.assign(instance, compactOptions ? options : { options });
        Object.assign(instance, {
          element, elements, contextElement: context, rootElement: root,
        });
        if (autoBind) {
          _bindMethods(instance, { properties: this.prototype });
        }
        if (autoListen) {
          _listen(instance);
        }
        if (autoSelect) {
          instance.selectToProperties();
        }
        if (instance.init) {
          instance.init();
        }
        return instance;
      },
    });

    _mix(extensionClass, options, optionGroupNames);

    if (extensionClass.init) {
      extensionClass.init();
    }
  }

  function _assignOptions(options, defaults, groupNames, attribute) {
    if (attribute) {
      try { Object.assign(options, JSON.parse(attribute)); } catch (error) {}
    }
    options = Object.assign({}, defaults, options);
    groupNames.forEach((g) => options[g] = Object.assign({}, defaults[g], options[g]));
    return options;
  }

  function _bindMethods(object, { context, properties }) {
    Object.getOwnPropertyNames(properties || object)
      .filter(name => typeof object[name] === 'function' && name !== 'constructor')
      .forEach(name => object[name] = object[name].bind(context || object));
  }

  function _listen(instance) {
    if (!instance.addEventListeners || !instance.eventListeners) {
      throw 'Missing requirements.';
    }
    const { eventListeners } = instance;
    _bindMethods(eventListeners, { context: instance });
    instance.addEventListeners(eventListeners);
    instance._cleanupTasks.push(() => {
      instance.removeEventListeners(eventListeners);
    });
    if (instance._onWindowResize && instance.resizeDelay) {
      let ran, { _onWindowResize } = instance;
      instance._onWindowResize = function(event) {
        if (ran && Date.now() < ran + this.resizeDelay) { return; }
        ran = Date.now();
        _onWindowResize.call(this, event);
      }.bind(instance);
      window.addEventListener('resize', instance._onWindowResize);
      instance._cleanupTasks.push(() => {
        window.removeEventListener('resize', instance._onWindowResize);
      });
    }
  }

  const _mixins = {};

  _mixins.css = {
    cssDuration(name, element) {
      if (!element) { element = this.rootElement; }
      return 1000 * parseFloat(getComputedStyle(element)[name]);
    },
    cssVariable(name, element) {
      if (!element) { element = this.rootElement; }
      return getComputedStyle(element).getPropertyValue(this.varName(name));
    },
    cssVariableDuration(name, element) {
      return 1000 * parseFloat(this.cssVariable(name, element));
    },
    swapClasses(nameFrom, nameTo, element) {
      if (!element) { element = this.rootElement; }
      element.classList.remove(this.className(nameFrom));
      element.classList.add(this.className(nameTo));
    },
  };

  _mixins.debug = (debug, toPrefix) => (debug ? {
    debugLog(...args) {
      if (!this._hasDebugLogGroup) {
        args.unshift(toPrefix('log'));
      }
      HLF.debugLog(...args);
    },
    debugLogGroup(arg) {
      if (arg === false) {
        console.groupEnd();
        this._hasDebugLogGroup = false;
      } else {
        let args = [toPrefix('log')];
        if (arg) { args.push(arg); }
        console.group(...args);
        this._hasDebugLogGroup = true;
      }
    },
  } : {
    debugLog() {},
    debugLogGroup() {},
  });

  _mixins.event = {
    addEventListeners(info, target) {
      target = target || this.rootElement;
      _normalizeEventListenersInfo(info);
      Object.keys(info).forEach((type) => {
        const [handler, options] = info[type];
        target.addEventListener(type, handler, options);
      });
    },
    removeEventListeners(info, target) {
      target = target || this.rootElement;
      _normalizeEventListenersInfo(info);
      Object.keys(info).forEach((type) => {
        const [handler, options] = info[type];
        target.removeEventListener(type, handler, options);
      });
    },
    toggleEventListeners(on, info, target) {
      this[`${on ? 'add' : 'remove'}EventListeners`](info, target);
    },
    createCustomEvent(type, detail) {
      let initArgs = { detail };
      initArgs.bubbles = true;
      return new CustomEvent(this.eventName(type), initArgs);
    },
    dispatchCustomEvent(type, detail = {}) {
      return this.rootElement.dispatchEvent(this.createCustomEvent(type, detail));
    },
  };

  _mixins.naming = (toPrefix) => ({
    attrName(name = '') {
      if (name.length) {
        name = `-${name}`;
      }
      return `data-${toPrefix('data')}${name}`;
    },
    className(name = '') {
      if (name.length) {
        name = `-${name}`;
      }
      return `js-${toPrefix('class')}${name}`;
    },
    eventName(name) {
      return `${toPrefix('event')}${name}`;
    },
    varName(name) {
      return `--${toPrefix('var')}-${name}`;
    },
  });

  _mixins.options = (defaults, groupNames) => ({
    configure(options) {
      Object.keys(options).forEach((name) => {
        if (name in this || (this.options && name in this.options)) { return; }
        delete options[name];
        throw 'Not an existing option.';
      });
      let store = this.options || this;
      Object.keys(options).filter(name => options[name] === 'default').forEach((name) => {
        options[name] = defaults[name];
        delete store[name];
      });
      groupNames.forEach((name) => {
        store[name] = Object.assign({}, store[name], options[name]);
        delete options[name];
      });
      Object.assign(store, options);
    },
  });

  _mixins.remove = {
    remove() {
      this._cleanupTasks.forEach(task => task(this));
      if (this.deinit) {
        this.deinit();
      }
    },
    _setUpCleanupTasks() {
      this._cleanupTasks = [];
    },
  };

  _mixins.selection = {
    selectByClass(name, element) {
      if (!element) { element = this.rootElement; }
      return element.querySelector(`.${this.className(name)}`);
    },
    selectAllByClass(name, element) {
      if (!element) { element = this.rootElement; }
      return element.querySelectorAll(`.${this.className(name)}`);
    },
    selectToProperties() {
      const selectors = this.options ? this.options.selectors : this.selectors;
      if (!this.rootElement || !selectors) {
        throw 'Missing requirements.';
      }
      Object.keys(selectors).forEach((name) => {
        const selector = selectors[name];
        if (name.substr(-1) === 's') {
          this[name] = this.rootElement.querySelectorAll(selector);
        } else {
          this[name] = this.rootElement.querySelector(selector);
        }
      });
    },
  };

  _mixins.timing = {
    setElementTimeout(element, name, duration, callback) {
      name = this.attrName(name);
      if (element.getAttribute(name)) {
        clearTimeout(element.getAttribute(name));
      }
      let timeout = null;
      if (duration != null && callback) {
        timeout = setTimeout(() => {
          callback();
          element.removeAttribute(name);
        }, duration);
      }
      if (timeout) {
        element.setAttribute(name, timeout);
      } else {
        element.removeAttribute(name);
      }
    },
    setTimeout(name, duration, callback) {
      if (this[name]) {
        clearTimeout(this[name]);
      }
      let timeout = null;
      if (duration != null && callback) {
        timeout = setTimeout(() => {
          callback();
          this[name] = null;
        }, duration);
      }
      this[name] = timeout;
    },
  };

  function _mix(extensionClass, options, optionGroupNames) {
    const { debug, defaults, toPrefix } = extensionClass;
    Object.assign(extensionClass, _mixins.naming(toPrefix));

    let { autoListen, autoSelect, mixinNames: names } = options, flags = {};
    Object.keys(_mixins).forEach(n => flags[n] = false);
    (names || []).concat('debug', 'naming', 'options', 'remove', 'timing')
      .forEach(n => flags[n] = true);
    if (autoListen) { flags.event = true; }
    if (autoSelect) { flags.selection = true; }
    names = Object.keys(flags).filter(n => flags[n]);
    Object.assign(extensionClass.prototype, ...names.map((name) => {
      let mixin = _mixins[name];
      if (typeof mixin === 'function') {
        if (name === 'debug') { mixin = mixin(debug, toPrefix); }
        else if (name === 'naming') { mixin = mixin(toPrefix); }
        else if (name === 'options') { mixin = mixin(defaults, optionGroupNames); }
        else { mixin = mixin(); }
      }
      return mixin;
    }));
  }

  function _normalizeEventListenersInfo(info) {
    Object.keys(info).forEach((type) => {
      if (typeof info[type] !== 'function') { return; }
      info[type] = [info[type]];
    });
  }

  function _parseSubject(subject, options) {
    let element, elements;
    if (subject instanceof HTMLElement) {
      element = subject;
    } else if (typeof subject === 'function') {
      Object.assign(options, { querySelector: subject });
      return _parseSubject(subject(options.contextElement), options);
    } else {
      elements = Array.from(subject);
    }
    return { element, elements };
  }

  //
  // createExtension
  // ---------------
  // Further binding state and functionality to DOM elements is a common task
  // that should be abstracted away, with common patterns and conventions around
  // logging, namespacing, instance access, and sending actions. Also, instead
  // of API classes and instances inheriting from a base layer, that base layer
  // should be integrated on instantiation.
  //
  // __createExtension__ will return an appropriate, multi-purpose function for
  // the given `createOptions`, comprised of:
  //
  // - The __name__ of the method is required.
  //
  // - __namespace__ is required and must correctly implement `debug`,
  //   `toString`, and `defaults`.
  //
  // - An __apiClass__ definition. It will get modified with base API additions.
  //   Also note that `apiClass` will get published into the namespace, so more
  //   flexibility is possible.
  //

    //
    // The __extension__ function handles two variations of input. An action
    // `name` and `payload` can be passed in to trigger the action route. The
    // latter is typically additional, action-specific parameters. Otherwise,
    // if the first argument is an options collection, the normal route is
    // triggered.
    //
    // With the action route, if there is a extension instance and it can
    // __perform__ (`action` mixin), call the method. With the normal route,
    // if there is a extension instance and no arguments are provided we assume
    // the call is to access the instance, not reset it.
    //
    // Otherwise if the instance exists, it is returned. __contextElement__
    // will decide what the extension instance's main element will be. The idea
    // is several elements all share the same extension instance.
    //
    // Otherwise, continue creating the instance by preparing the options and
    // deciding the main element before passing over to `_buildInstance`.
    //

      //
      // ___buildInstance__ is a subroutine that's part of `createExtension`,
      // which has more details on its required input.
      //
      // 1. Check if element has options set in its root data attribute. If
      //    so, merge those options into our own `finalOptions`.
      //
      // 2. Also decide the `rootElement` based on the situation. It's where the
      //    extension instance id gets stored and the root class gets added. A
      //    shared instance, for example, gets stored on the `contextElement`.
      //
      // 3. If we're provided with a class for the API, instantiate it. Decorate
      //    the instance with additional mixins if fitting.
      //
      // 4. If the `compactOptions` flag is toggled, `finalOptions` will be merged
      //    into the instance. This makes accessing options more convenient, but
      //    can cause conflicts with larger existing APIs that don't account for
      //    such naming conflicts, since _we don't handle conflicts here_. Else,
      //    just alias the conventional `selectors` and `classNames` option groups.
      //
      // 5. If the `autoListen` flag is toggled, add and call the `addEventListeners`
      //    method (ie. via `selection` mixin), to set up element event listening
      //    before initialization. The `eventListeners` property must be set.
      //    Cleanup is automatic. If `_onWindowResize` and `resizeDelay` are
      //    defined, a listener with the handler will be added to the window
      //    resize event, with calls throttled per the delay.
      //
      // 6. If the `autoSelect` flag is toggled, add and call the `select` method
      //    (ie. via `selection` mixin), to set up element references before
      //    initialization.
      //
      // 7. If the `className` API addition exists and provides the root class,
      //    add the root class to the decided `rootElement` before initialization.
      //
      // 8. If an `init` method is provided, call it. Convention is to always
      //    provide it.
      //
      // 9. Lastly, store the instance id on `rootElement`.
      //

  //
  // __createExtensionBaseMethods__ is an internal subroutine that selectively
  // applies a general mixin collection for writing DOM extensions. It's part of
  // `createExtension`, which has more details on its required input.
  //
  // - Add the __debugLog__ method and attach functionality instead of a no-op
  //   only if namespace `debug` is on.
  //
  // - __action__, allows performing actions by calling action methods. The
  //   default implementation checks for a method of the name of the action
  //   prefixed by `perform`. This mixin allows extensions to support the
  //   `remove` action by default via `performRemove`.
  //
  // - __naming__, allows namespacing an `attrName`, `className`, or `eventName`.
  //
  // - __timeout__, sugar around clearTimeout, setTimeout to allow named, stored
  //   timeouts.
  //
  // - __css__, sugar around accessing element style property values.
  //
  // - __event__, sugar around mass-listening to `rootElement` events and
  //   dispatching custom `rootElement` events.
  //
  // - __selection__, sugar around selecting `rootElement` descendants and
  //   selecting to properties based on `selectors`.
  //

  Object.assign(HLF, { buildExtension });

  if (HLF.debug && typeof window === 'object') {
    Object.assign(window, { HLF });
  }

  return HLF;
});
