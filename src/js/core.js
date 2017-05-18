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

    let namingMethods = createExtensionNamingMethods(namespace);
    const { attrName } = namingMethods;
    const { apiClass, apiMixins } = args;
    if (apiClass) {
      namespace.apiClass = apiClass;
      Object.assign(apiClass.prototype, namingMethods);
    } else if (apiMixins) {
      namespace.apiMixins = apiMixins;
      Object.assign(apiMixins.base, namingMethods);
    }

    let idCounter = 0;
    let instances = {};
    const { asSharedInstance, autoSelect, compactOptions } = args;

    function extension(elements, ...args) {
      let { command, options, contextElement } = parseExtensionArguments(args);
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
        if (autoSelect && typeof instance.select === 'function') {
          instance.select();
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

      if (command) {
        elements.forEach((element) => {
          let instance = getExtensionInstance(element);
          instance.handleCommand(command);
        });
        return;
      } else {
        let element = asSharedInstance ? contextElement : elements[0];
        let instance = getExtensionInstance(element);
        if (instance && !options) {
          return instance;
        }
      }
      options = Object.assign({}, namespace.defaults, options);
      return Array.from(elements).map(createExtensionInstance);
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
    let command, options, contextElement;
    let [first, second] = args;
    if (typeof first === 'string') {
      command = { type: first, userInfo: second };
    } else {
      options = first;
      if (second) {
        contextElement = second;
      }
    }
    return { command, options, contextElement };
  }

  function createExtensionNamingMethods(namespace) {
    return {
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
    };
  }

  Object.assign(hlf, { createExtensionConstructor });

  return hlf;

}());
