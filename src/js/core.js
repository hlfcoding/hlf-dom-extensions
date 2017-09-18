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
    window.hlf = namespace();
  }
})(this, function() {
  'use strict';
  //
  // Namespace
  // ---------
  // It takes some more boilerplate and helpers to write DOM extensions. That
  // code and set of conventions is here in the root namespace __hlf__. Child
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
  let hlf = {
    debug: true,
    toString() { return 'hlf'; },
  };
  hlf.debugLog = (hlf.debug === false) ? function(){} :
    (console.log.bind ? console.log.bind(console) : console.log);
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
  function createExtension(args) {
    const { name, namespace } = args;

    const { apiClass, autoBind, autoListen, autoSelect } = args;
    let groups = args.baseMethodGroups || [];
    groups.push('action', 'naming', 'timeout');
    if (autoListen) {
      groups.push('event');
    }
    if (autoSelect) {
      groups.push('selection');
    }
    let baseMethods = createExtensionBaseMethods(namespace, groups);
    if (apiClass) {
      namespace.apiClass = apiClass;
      Object.assign(apiClass.prototype, baseMethods);
      if (apiClass.init) {
        apiClass.init();
      }
    }
    const { attrName } = baseMethods;

    const { compactOptions } = args;
    let idCounter = 0;
    let instances = {};

    const { defaults } = namespace;
    let optionGroupNames = ['classNames', 'selectors'].filter(name => name in defaults);
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
    function extension(subject, ...args) {
      let { action, options, contextElement } = extension._parseArguments(args);

      if (action) {
        extension._dispatchAction(action, subject);
        return;

      } else if (!options) {
        let result = extension._getInstanceOrInstances(subject);
        if (result) {
          return result;
        }

      } else if (Object.keys(instances).length) {
        instances = {};
      }

      options = Object.assign({}, defaults, options);
      optionGroupNames.forEach((name) => {
        options[name] = Object.assign({}, defaults[name], options[name]);
      });

      let finalSubject = contextElement || subject;
      if (finalSubject === contextElement) {
        extension._buildInstance(subject, options, contextElement);
      } else {
        if (finalSubject instanceof HTMLElement) {
          extension._buildInstance(finalSubject, options);
        } else {
          finalSubject.forEach((element) => {
            extension._buildInstance(element, options);
          });
        }
      }

      return extension.bind(null, finalSubject);
    }

    Object.assign(extension, {
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
      _buildInstance(subject, options, contextElement) {
        let element, elements;
        if (subject instanceof HTMLElement) {
          element = subject;
        } else {
          elements = Array.from(subject);
        }
        let attrOptions;
        let rootElement = contextElement || element;
        if (rootElement.hasAttribute(attrName())) {
          try {
            attrOptions = JSON.parse(element.getAttribute(attrName()));
          } catch (error) {}
        }
        let finalOptions = Object.assign({}, options, attrOptions);
        let instance = new apiClass(element || elements, finalOptions, contextElement);
        extension._setInstance(rootElement, instance);
        instance.rootElement = rootElement;
        if (element) {
          instance.element = element;
        } else {
          instance.contextElement = contextElement;
          instance.elements = elements;
        }
        if (compactOptions) {
          Object.assign(instance, finalOptions);
        } else {
          instance.options = finalOptions;
          optionGroupNames.forEach((name) => {
            instance[name] = finalOptions[name];
          });
        }
        let cleanupTasks = [];
        Object.assign(instance, {
          destructor() {
            cleanupTasks.forEach(task => task(this));
            if (this.deinit) {
              this.deinit();
            }
          }
        });
        if (autoBind) {
          Object.getOwnPropertyNames(apiClass.prototype)
            .filter(name => (
              typeof instance[name] === 'function' && name !== 'constructor'
            ))
            .forEach((name) => {
              instance[name] = instance[name].bind(instance);
            });
        }
        if (autoListen && instance.addEventListeners && instance.eventListeners) {
          const { eventListeners } = instance;
          Object.getOwnPropertyNames(eventListeners)
            .forEach((name) => {
              eventListeners[name] = eventListeners[name].bind(instance);
            });
          instance.addEventListeners(eventListeners);
          cleanupTasks.push(() => {
            instance.removeEventListeners(eventListeners);
          });
          if (instance._onWindowResize && instance.resizeDelay) {
            let ran, { _onWindowResize } = instance;
            instance._onWindowResize = function(event) {
              if (ran && Date.now() < ran + this.resizeDelay) { return; }
              ran = Date.now();
              _onWindowResize.call(instance, event);
            }.bind(instance);
            window.addEventListener('resize', instance._onWindowResize);
            cleanupTasks.push(() => {
              window.removeEventListener('resize', instance._onWindowResize);
            });
          }
        }
        if (autoSelect && instance.selectToProperties) {
          instance.selectToProperties();
        }
        if (instance.className) {
          rootElement.classList.add(instance.className());
        }
        if (instance.init) {
          instance.init();
        }
        return instance;
      },
      _deleteInstance(element) {
        const id = element.getAttribute(attrName('instance-id'));
        element.removeAttribute(attrName('instance-id'));
        delete instances[id];
      },
      _deleteInstances() {
        Object.keys(instances).forEach((id) => {
          delete instances[id];
        });
      },
      _dispatchAction(action, target) {
        if (target instanceof HTMLElement) {
          extension._getInstance(target).perform(action);
        } else {
          Array.from(target).map(extension._getInstance)
            .forEach((instance) => instance.perform(action));
        }
      },
      _getInstance(element) {
        const id = element.getAttribute(attrName('instance-id'));
        return instances[id];
      },
      _getInstanceOrInstances(source) {
        let instance, instances;
        if (source instanceof HTMLElement &&
          (instance = extension._getInstance(source))
        ) {
          return instance;
        } else if ((instances = Array.from(source).map(extension._getInstance)
          .filter(i => i != null)) &&
          instances.length
        ) {
          return instances;
        }
      },
      _parseArguments(args) {
        let action, options, contextElement;
        const [first, second] = args;
        if (typeof first === 'string') {
          action = { name: first, payload: second };
        } else {
          if (first instanceof HTMLElement) {
            contextElement = first;
          } else {
            options = first;
            if (second) {
              contextElement = second;
            }
          }
        }
        return { action, options, contextElement };
      },
      _setInstance(element, instance) {
        const id = idCounter;
        idCounter += 1;
        instance.id = id;
        instances[id] = instance;
        element.setAttribute(attrName('instance-id'), id);
      },
    });

    namespace.extension = extension;

    return extension;
  }
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
  function createExtensionBaseMethods(namespace, groups) {
    let methods = {};
    function debugPrefixes(instance) {
      return [
        namespace.toString('log'),
        instance.rootElement.getAttribute(instance.attrName('instance-id')),
      ];
    }
    Object.assign(methods, !namespace.debug ? {
      debugLog() {},
      debugLogGroup() {},
    } : {
      debugLog(...args) {
        if (!this._hasDebugLogGroup) {
          args.unshift(...debugPrefixes(this));
        }
        hlf.debugLog(...args);
      },
      debugLogGroup(arg) {
        if (arg === false) {
          console.groupEnd();
          this._hasDebugLogGroup = false;
        } else {
          let args = debugPrefixes(this);
          if (arg) {
            args.push(arg);
          }
          console.group(...args);
          this._hasDebugLogGroup = true;
        }
      },
    });
    if (groups.indexOf('action') !== -1) {
      Object.assign(methods, {
        perform(action) {
          const { name, payload } = action;
          let methodName = `perform${name[0].toUpperCase()}${name.substr(1)}`;
          if (!this[methodName]) { return; }
          this[methodName](payload);
        },
        performConfigure(properties) {
          Object.keys(properties)
            .filter(name => properties[name] === 'default')
            .forEach(name => properties[name] = namespace.defaults[name]);
          Object.assign(this, properties);
        },
        performRemove() {
          namespace.extension._deleteInstance(this.rootElement);
          this.destructor();
        },
      });
    }
    if (groups.indexOf('naming') !== -1) {
      const naming = {
        attrName(name = '') {
          if (name.length) {
            name = `-${name}`;
          }
          return `data-${namespace.toString('data')}${name}`;
        },
        className(name = '') {
          if (name.length) {
            name = `-${name}`;
          }
          return `js-${namespace.toString('class')}${name}`;
        },
        eventName(name) {
          return `${namespace.toString('event')}${name}`;
        },
        varName(name) {
          return `--${namespace.toString('var')}-${name}`;
        },
      };
      Object.assign(methods, naming);
      Object.assign(namespace, naming);
    }
    if (groups.indexOf('timeout') !== -1) {
      Object.assign(methods, {
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
      });
    }
    if (groups.indexOf('css') !== -1) {
      Object.assign(methods, {
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
      });
    }
    if (groups.indexOf('event') !== -1) {
      let normalizeInfos = function(infos) {
        Object.keys(infos).forEach((type) => {
          if (typeof infos[type] !== 'function') { return; }
          infos[type] = [infos[type]];
        });
      };
      Object.assign(methods, {
        addEventListeners(infos, target) {
          target = target || this.rootElement;
          normalizeInfos(infos);
          Object.keys(infos).forEach((type) => {
            const [handler, options] = infos[type];
            target.addEventListener(type, handler, options);
          });
        },
        removeEventListeners(infos, target) {
          target = target || this.rootElement;
          normalizeInfos(infos);
          Object.keys(infos).forEach((type) => {
            const [handler, options] = infos[type];
            target.removeEventListener(type, handler, options);
          });
        },
        toggleEventListeners(on, infos, target) {
          this[`${on ? 'add' : 'remove'}EventListeners`](infos, target);
        },
        createCustomEvent(type, detail) {
          let initArgs = { detail };
          initArgs.bubbles = true;
          return new CustomEvent(this.eventName(type), initArgs);
        },
        dispatchCustomEvent(type, detail = {}) {
          return this.rootElement.dispatchEvent(this.createCustomEvent(type, detail));
        },
      });
    }
    if (groups.indexOf('selection') !== -1) {
      Object.assign(methods, {
        selectByClass(name, element) {
          if (!element) { element = this.rootElement; }
          return element.querySelector(`.${this.className(name)}`);
        },
        selectAllByClass(name, element) {
          if (!element) { element = this.rootElement; }
          return element.querySelectorAll(`.${this.className(name)}`);
        },
        selectToProperties() {
          if (!this.rootElement || !this.selectors) {
            throw 'Missing requirements.';
          }
          Object.keys(this.selectors).forEach((name) => {
            const selector = this.selectors[name];
            if (name.substr(-1) === 's') {
              this[name] = this.rootElement.querySelectorAll(selector);
            } else {
              this[name] = this.rootElement.querySelector(selector);
            }
          });
        },
      });
    }
    return methods;
  }

  Object.assign(hlf, { createExtension });

  if (hlf.debug && typeof window === 'object') {
    Object.assign(window, { hlf });
  }

  return hlf;
});
