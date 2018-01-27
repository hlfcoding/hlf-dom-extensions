//
// HLF Extensions Core
// ===================
// [Tests](../../tests/js/core.html)
//
// The extensions core provides shared functionality for extension classes to
// reduce boilerplate around common tasks. Static methods like `extend` and
// helpers as added, and instance methods are mixed onto the prototype.
//
(function(root, namespace) {
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
  //
  // - The __debug__ flag here toggles debug logging for everything in the
  //   library that doesn't have a custom debug flag in its namespace.
  //
  // - __toPrefix__ is mainly for extension namespacing. For now, its base form
  //   is very simple.
  //
  // - __debugLog__ in its base form just wraps around `console.log` and links
  //   to the `debug` flag. However, `debugLog` conventionally becomes a no-op
  //   if the `debug` flag is off.
  //
  let HLF = {
    debug: true,
    toPrefix() { return 'hlf'; },
  };
  HLF.debugLog = (HLF.debug === false) ? function(){} :
    (console.log.bind ? console.log.bind(console) : console.log);
  //
  // buildExtension
  // --------------
  //
  // Further binding state and functionality to DOM elements is a common task
  // that should be abstracted away, with common patterns and conventions.
  // Also, instead of extension subclasses inheriting from a base class, the
  // `extensionClass` is extended upon based on build options. This method will
  // add a static `extend` factory method for extension instances. How
  // instances are built is configurable via `options`.
  //
  // `buildExtension` will decorate the class with additional mixins if
  // fitting. If the class has a static `init` method, it will be called.
  //
  // __extend__ ultimately returns a new extension instance for a `subject` and
  // any `options`. It will:
  //
  // 1. Parse the `subject` to be either `element` or `elements`. If it is a
  //    function, invoke and save the original function as a `querySelector`
  //    option. See `_parseSubject`.
  //
  // 2. Check if element has options set in its root data attribute. If
  //    so, merge those options into `options`.
  //
  //    If the `compactOptions` option is toggled, `options` will be merged
  //    into the instance. This makes accessing options more convenient, but
  //    can cause conflicts with larger existing APIs that don't account for
  //    such naming conflicts, since _we don't handle conflicts here_. Else,
  //    the `options` is added as an instance property. See `_assignOptions`.
  //
  // 3. Also decide the `rootElement` based on the situation. If the
  //    `contextElement` option has a value, that element will be the root, so
  //    several elements all 'share' the same extension instance. Add the root
  //    class to the decided `rootElement` before initialization. All element
  //    values are attached onto the instance as properties.
  //
  // 4. If the `autoBind` option is toggled, bind the class' own methods onto
  //    the instance. See `_bindMethods`.
  //
  // 5. If the `autoListen` option is toggled, call the `addEventListeners`
  //    method (ie. via `event` mixin), to set up element event listening
  //    before initialization. The `eventListeners` property must be set.
  //    Cleanup is automatic. If `_onWindowResize` and `resizeDelay` are
  //    defined, a listener with the handler will be added to the window
  //    resize event, with calls throttled per the delay. See `_listen`.
  //
  // 6. If the `autoSelect` option is toggled, call the `selectToProperties`
  //    method (ie. via `selection` mixin), to set up element references before
  //    initialization.
  //
  // 7. If an `init` method is provided, call it. Convention is to always
  //    provide it.
  //
  // ___mixins__ is an internal general mixin collection for writing DOM
  // extensions. Mixins either required or opt-in via the `mixinNames` build
  // option. They are applied via `_mix`. Some mixins are factory methods
  // requiring certain parameters.
  //
  // - __css__, sugar around accessing element style property values.
  //
  // - __debug__, mostly the __debugLog__ method, and will return no-op
  //   depending on the `debug` flag value.
  //
  // - __event__, sugar around mass-listening to `rootElement` events and
  //   dispatching custom `rootElement` events.
  //
  // - __naming__, allows namespacing an `attrName`, `className`, `eventName`,
  //   or `varName`.
  //
  // - __options__, mostly the __configure__ method, which allows updating
  //   options after initialization.
  //
  // - __remove__, mostly the __remove__ method, which calls the `deinit`
  //   method if provided. Convention is to always provide it for proper
  //   resource cleanup.
  //
  // - __selection__, sugar around selecting `rootElement` descendants and
  //   selecting to properties based on `selectors`.
  //
  // - __timing__, sugar around clearTimeout, setTimeout to allow named, stored
  //   timeouts.
  //
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
      .filter((name) => {
        try {
          return (
            typeof object[name] === 'function' &&
            ['constructor', 'debugLog', 'debugLogGroup'].indexOf(name) === -1
          );
        } catch (error) {
          console.log(`Error checking method ${name}, skipping binding...`);
          return false;
        }
      }).forEach((name) => {
        object[name] = object[name].bind(context || object);
      });
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
      return Array.from(element.querySelectorAll(`.${this.className(name)}`));
    },
    selectToProperties() {
      const selectors = this.options ? this.options.selectors : this.selectors;
      if (!this.rootElement || !selectors) {
        throw 'Missing requirements.';
      }
      Object.keys(selectors).forEach((name) => {
        const selector = selectors[name];
        if (name.substr(-1) === 's') {
          this[name] = Array.from(this.rootElement.querySelectorAll(selector));
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

    const persistenceKey = `${extensionClass.toPrefix('data')}-debug`;
    Object.assign(extensionClass, {
      setDebug(debug, persistent = false) {
        this.debug = debug;
        Object.assign(this.prototype, _mixins.debug(debug, toPrefix));
        if (persistent) {
          try {
            localStorage.setItem(persistenceKey, debug);
          } catch(e) {}
        }
      }
    });
    try {
      extensionClass.setDebug(localStorage.getItem(persistenceKey) === 'true');
    } catch(e) {}
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

  Object.assign(HLF, { buildExtension });

  if (HLF.debug && typeof window === 'object') {
    Object.assign(window, { HLF });
  }

  return HLF;
});
