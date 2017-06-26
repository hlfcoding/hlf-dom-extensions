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

    const { apiClass, autoListen, autoSelect } = args;
    let groups = args.baseMethodGroups || [];
    groups.push('action', 'naming');
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

    const { asSharedInstance, compactOptions } = args;
    let idCounter = 0;
    let instances = {};
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
    // Otherwise if the instance exists, it is returned. __asSharedInstance__
    // will decide what the extension instance's main element will be. The idea
    // is several elements all share the same extension instance.
    //
    // Otherwise, continue creating the instance by preparing the options and
    // deciding the main element before passing over to `_buildInstance`.
    //
    function extension(subject, ...args) {
      let { action, options, contextElement } = extension._parseArguments(args);
      contextElement = contextElement || document.body;

      if (action) {
        let target = asSharedInstance ? contextElement : subject;
        extension._dispatchAction(action, target);
        return;

      } else if (!options) {
        let source = asSharedInstance ? contextElement : subject;
        let result = extension._getInstanceOrInstances(source);
        if (result) {
          return result;
        }

      } else if (Object.keys(instances).length) {
        instances = {};
      }

      options = Object.assign({}, namespace.defaults, options);
      if (subject instanceof HTMLElement) {
        extension._buildInstance(subject, options, contextElement);
      } else {
        subject.forEach((element) => {
          extension._buildInstance(element, options, contextElement);
        });
      }

      return extension.bind(null, subject);
    }

    Object.assign(extension, {
      baseMethods,
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
      _buildInstance(element, options, contextElement) {
        let attrOptions;
        if (element.hasAttribute(attrName())) {
          try {
            attrOptions = JSON.parse(element.getAttribute(attrName()));
          } catch (error) {}
        }
        let finalOptions = Object.assign({}, options, attrOptions);
        let rootElement = asSharedInstance ? contextElement : element;
        let instance = new apiClass(element, finalOptions, contextElement);
        instance.element = element;
        if (contextElement) {
          instance.contextElement = contextElement;
        }
        if (compactOptions) {
          Object.assign(instance, finalOptions);
          delete instance.options;
        } else {
          if (finalOptions.selectors) {
            instance.selectors = finalOptions.selectors;
          }
          if (finalOptions.classNames) {
            instance.classNames = finalOptions.classNames;
          }
        }
        if (autoListen && instance.addEventListeners && instance.eventListeners) {
          instance.addEventListeners(instance.eventListeners);
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
        extension._setInstance(rootElement, instance);
        return instance;
      },
      _deleteInstance(element) {
        const id = element.getAttribute(attrName('instance-id'));
        delete instances[id];
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
        } else if ((instances = Array.from(source).map(extension._getInstance)) &&
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
          options = first;
          if (second) {
            contextElement = second;
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
  // - __action__, allows performing actions by calling action methods.
  //
  // - __naming__, allows namespacing an `attrName`, `className`, or `eventName`.
  //
  // - __event__, sugar around mass-listening to `element` events and
  //   dispatching custom `element` events.
  //
  // - __selection__, sugar around selecting `element` descendants and selecting
  //   to properties based on `selectors`.
  //
  function createExtensionBaseMethods(namespace, groups) {
    let methods = {};
    methods.debugLog = (!namespace.debug ? function(){} :
      hlf.debugLog.bind(null, namespace.toString('log'))
    );
    if (groups.indexOf('action') !== -1) {
      Object.assign(methods, {
        perform(action) {
          const { name, payload } = action;
          let methodName = `perform${name[0].toUpperCase()}${name.substr(1)}`;
          if (!this[methodName]) { return; }
          this[methodName](payload);
        },
        performRemove() {
          namespace.extension._deleteInstance(this.element);
          this.deinit();
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
      };
      Object.assign(methods, naming);
      Object.assign(namespace, naming);
      if (groups.indexOf('css') !== -1) {
        Object.assign(methods, {
          cssVariable(name) {
            return getComputedStyle(this.element)
              .getPropertyValue(`--${namespace.toString('class')}-${name}`);
          }
        });
      }
      if (groups.indexOf('event') !== -1) {
        let normalizeInfos = function(infos) {
          for (const type in infos) {
            if (!infos.hasOwnProperty(type)) { continue; }
            if (typeof infos[type] !== 'function') { continue; }
            infos[type] = [infos[type]];
          }
        };
        Object.assign(methods, {
          addEventListeners(infos, target) {
            target = target || this.element;
            normalizeInfos(infos);
            for (const type in infos) {
              if (!infos.hasOwnProperty(type)) { continue; }
              const [handler, options] = infos[type];
              target.addEventListener(type, handler, options);
            }
          },
          removeEventListeners(infos, target) {
            target = target || this.element;
            normalizeInfos(infos);
            for (const type in infos) {
              if (!infos.hasOwnProperty(type)) { continue; }
              const [handler, options] = infos[type];
              target.removeEventListener(type, handler, options);
            }
          },
          createCustomEvent(type, detail) {
            let initArgs = { detail };
            initArgs.bubbles = true;
            return new CustomEvent(this.eventName(type), initArgs);
          },
          dispatchCustomEvent(type, detail = {}) {
            return this.element.dispatchEvent(this.createCustomEvent(type, detail));
          },
        });
      }
      if (groups.indexOf('selection') !== -1) {
        Object.assign(methods, {
          selectByClass(name) {
            return this.element.querySelector(`.${this.className(name)}`);
          },
          selectAllByClass(name) {
            return this.element.querySelectorAll(`.${this.className(name)}`);
          },
          selectToProperties() {
            if (!this.element || !this.selectors) {
              throw 'Missing requirements.';
            }
            for (const name in this.selectors) {
              if (!this.selectors.hasOwnProperty(name)) { continue; }
              const selector = this.selectors[name];
              if (name.substr(-1) === 's') {
                this[name] = this.element.querySelectorAll(selector);
              } else {
                this[name] = this.element.querySelector(selector);
              }
            }
          },
        });
      }
    }
    return methods;
  }

  Object.assign(hlf, { createExtension });

  return hlf;

});
