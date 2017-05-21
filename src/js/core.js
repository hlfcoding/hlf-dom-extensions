(function(root, namespace) {
  if (typeof define === 'function' && define.amd) {
    define([], namespace);
  } else if (typeof exports === 'object') {
    module.exports = namespace();
  } else {
    window.hlf = namespace();
  }
})(this, function() {
  'use strict';

  let hlf = {
    debug: true,
    toString() { return 'hlf'; },
  };

  hlf.debugLog = (hlf.debug === false) ? function(){} :
    (console.log.bind ? console.log.bind(console) : console.log);

  function createExtensionConstructor(args) {
    const { name, namespace } = args;

    const { apiClass, apiMixins, autoSelect } = args;
    let groups = args.baseMethodGroups || [];
    groups.push('action', 'naming');
    if (autoSelect) {
      groups.push('selection');
    }
    let baseMethods = createExtensionBaseMethods(namespace, groups);
    if (apiClass) {
      namespace.apiClass = apiClass;
      Object.assign(apiClass.prototype, baseMethods);
    } else if (apiMixins) {
      namespace.apiMixins = apiMixins;
      Object.assign(apiMixins.base, baseMethods);
    }
    const { attrName } = baseMethods;

    const { asSharedInstance, compactOptions } = args;
    let idCounter = 0;
    let instances = {};
    function extension(subject, ...args) {
      let { action, options, contextElement } = parseExtensionArguments(args);
      contextElement = contextElement || document.body;

      function createExtensionInstance(element) {
        let finalOptions = Object.assign({}, options);
        let attrOptions = JSON.parse(element.getAttribute(attrName('instance-id')));
        if (attrOptions) {
          Object.assign(finalOptions, attrOptions);
        }
        let rootElement = asSharedInstance ? contextElement : element;
        let instance = new apiClass(element, finalOptions, contextElement);
        if (compactOptions) {
          Object.assign(instance, finalOptions);
          delete instance.options;
        }
        if (autoSelect && typeof instance.selectToProperties === 'function') {
          instance.selectToProperties();
        }
        if (instance.className) {
          rootElement.classList.add(instance.className());
        }
        if (typeof instance.init === 'function') {
          instance.init();
        }
        setExtensionInstance(rootElement, instance);
        return instance;
      }

      function dispatchAction() {
        let target = asSharedInstance ? contextElement : subject;
        if (target instanceof HTMLElement) {
          getExtensionInstance(target).perform(action);
        } else {
          Array.from(target).map(getExtensionInstance)
            .forEach((instance) => instance.perform(action));
        }
      }

      function getInstanceOrInstances() {
        let source = asSharedInstance ? contextElement : subject;
        let instance, instances;
        if (source instanceof HTMLElement &&
          (instance = getExtensionInstance(source))
        ) {
          return instance;
        } else if ((instances = Array.from(source).map(getExtensionInstance)) &&
          instances.length
        ) {
          return instances;
        }
      }

      if (action) {
        dispatchAction();
        return;

      } else if (!options) {
        let result = getInstanceOrInstances(subject);
        if (result) {
          return result;
        }

      } else if (Object.keys(instances).length) {
        instances = {};
      }

      options = Object.assign({}, namespace.defaults, options);
      if (subject instanceof HTMLElement) {
        createExtensionInstance(subject);
      } else {
        subject.forEach(createExtensionInstance);
      }

      return extension.bind(null, subject);
    }

    function getExtensionInstance(element) {
      let id = element.getAttribute(attrName('instance-id'));
      return instances[id];
    }

    function setExtensionInstance(element, instance) {
      let id = idCounter;
      idCounter += 1;
      instance.id = id;
      instances[id] = instance;
      element.setAttribute(attrName('instance-id'), id);
    }

    return extension;
  }

  function parseExtensionArguments(args) {
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
  }

  function createExtensionBaseMethods(namespace, groups) {
    let methods = {};
    if (groups.indexOf('action') !== -1) {
      Object.assign(methods, {
        perform(action) {
          const { name, payload } = action;
          if (this[name]) {
            this[name](payload);
          }
        }
      });
    }
    if (groups.indexOf('naming') !== -1) {
      Object.assign(methods, {
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
      });
      if (groups.indexOf('selection') !== -1) {
        Object.assign(methods, {
          selectByClass(name) {
            let selector = `.${this.classNames[name]}`;
            return this.element.querySelector(selector);
          },
          selectToProperties() {
            if (!this.element || !this.selectors) {
              throw 'Missing requirements.';
            }
            for (let name in this.selectors) {
              if (!this.selectors.hasOwnProperty(name)) {
                continue;
              }
              let selector = this.selectors[name];
              this[name] = this.element.querySelector(selector);
            }
          },
        });
      }
    }
    return methods;
  }

  Object.assign(hlf, { createExtensionConstructor });

  return hlf;

}());
