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

    Object.assign(extensionClass, {
      setDebug(debug) {
        this.debug = debug;
        Object.assign(this.prototype, _mixins.debug(debug, toPrefix));
      }
    });
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
(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(HLF);
  }
})(this, function(HLF) {
  'use strict';
  class Accordion {
    static get defaults() {
      return {
        autoCollapse: true,
        cursorItemClass: 'active',
        featureCount: 1,
        itemsSelector: 'li:not(:first-child)',
        sectionSelector: 'ul',
        triggerSelector: '.accordion-trigger',
      };
    }
    static toPrefix(context) {
      switch (context) {
        case 'event': return 'hlfac';
        case 'data': return 'hlf-ac';
        case 'class': return 'ac';
        case 'var': return 'ac';
        default: return 'hlf-ac';
      }
    }
    init() {
      this._sections = [];
      Array.from(this.element.querySelectorAll(this.sectionSelector))
        .forEach(this._setUpSection);
    }
    deinit() {
      this._sections.forEach(this._tearDownSection);
      this._sections = [];
    }
    _onTriggerClick(event) {
      let section = this._sections.find(section => section.triggerElement === event.currentTarget);
      this._toggleSectionFolding(section);
    }
    _setUpSection(sectionElement) {
      let itemElements = Array.from(sectionElement.querySelectorAll(this.itemsSelector));
      let section = {
        hasCursor: itemElements.some(el => el.classList.contains(this.cursorItemClass)),
        isFolded: false,
        itemElements,
        sectionElement,
        triggerElement: sectionElement.querySelector(this.triggerSelector),
      };
      this._sections.push(section);
      this._toggleSectionFolding(section, !section.hasCursor);
      this._toggleSectionEventListeners(true, section);
    }
    _tearDownSection(section) {
      this._toggleSectionEventListeners(false, section);
    }
    _toggleSectionFolding(section, folded) {
      const { hasCursor, isFolded } = section;
      if (hasCursor && folded) { return; }
      if (folded == null) { folded = !isFolded; }
      else if (isFolded === folded) { return; }
      if (this.autoCollapse && !folded) {
        this._sections.filter(s => s !== section)
          .forEach(s => this._toggleSectionFolding(s, true));
      }
      let { itemElements, sectionElement, triggerElement } = section;
      let featureCount = this.featureCount;
      if (triggerElement === itemElements[0].previousElementSibling) {
        featureCount -= 1;
      }
      itemElements.slice(featureCount)
        .forEach(el => el.style.display = folded ? 'none' : 'block');
      sectionElement.classList.toggle(this.className('folded'), folded);
      section.isFolded = folded;
    }
    _toggleSectionEventListeners(on, section) {
      let { triggerElement } = section;
      this.toggleEventListeners(on, {
        'click': this._onTriggerClick,
      }, triggerElement);
    }
  }
  Accordion.debug = false;
  HLF.buildExtension(Accordion, {
    autoBind: true,
    compactOptions: true,
    mixinNames: ['event'],
  });
  Object.assign(HLF, { Accordion });
  return Accordion;
});
(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(HLF);
  }
})(this, function(HLF) {
  'use strict';
  class HoverIntent {
    static get defaults() {
      return {
        interval: 300,
        sensitivity: 2,
      };
    }
    static toPrefix(context) {
      switch (context) {
        case 'event': return 'hlfhi';
        case 'data': return 'hlf-hi';
        default: return 'hlf-hi';
      }
    }
    constructor(elementOrElements, options, contextElement) {
      this.eventListeners = {
        'mousemove': this._onMouseMove,
        'mouseout': this._onMouseOut,
        'mouseover': this._onMouseOver,
      };
    }
    init() {
      this._resetState();
    }
    deinit() {
      this._resetState();
    }
    _checkEventElement(event) {
      const { relatedTarget, target, type } = event;
      if (type === 'mouseout' && target.contains(relatedTarget)) {
        return false;
      }
      if (this.contextElement) {
        if (Array.from(this.elements).indexOf(target) === -1) { return false; }
      } else {
        if (target !== this.rootElement) { return false; }
      }
      return true;
    }
    _dispatchHoverEvent(on, event) {
      const { mouse: { x, y } } = this;
      const { pageX, pageY, relatedTarget, target } = event;
      let type = on ? 'enter' : 'leave';
      target.dispatchEvent(this.createCustomEvent(type, {
        pageX: (x.current == null) ? pageX : x.current,
        pageY: (y.current == null) ? pageY : y.current,
        relatedTarget
      }));
      this.debugLog(type, pageX, pageY, Date.now() % 100000);
    }
    _dispatchTrackEvent(event) {
      event.target.dispatchEvent(this.createCustomEvent('track', {
        pageX: event.pageX,
        pageY: event.pageY,
      }));
    }
    _onMouseMove(event) {
      this._updateState(event);
      requestAnimationFrame((_) => {
        if (this.intentional) {
          this.debugLog('track', event.pageX, event.pageY);
        }
        this._dispatchTrackEvent(event);
      });
    }
    _onMouseOut(event) {
      if (!this._checkEventElement(event)) { return; }
      if (this.intentional) {
        this._dispatchHoverEvent(false, event);
      }
      this._resetState();
      this.debugLogGroup(false);
    }
    _onMouseOver(event) {
      if (this.intentional) { return; }
      if (this._timeout) { return; }
      if (!this._checkEventElement(event)) { return; }
      this.debugLogGroup();
      this._updateState(event);
      this.setTimeout('_timeout', this.interval, () => {
        this._updateState(event);
        if (this.intentional) {
          this._dispatchHoverEvent(true, event);
        }
      });
    }
    _resetState() {
      this.debugLog('reset');
      this.intentional = false;
      this.mouse = {
        x: { current: null, previous: null },
        y: { current: null, previous: null },
      };
      this.setTimeout('_timeout', null);
    }
    _updateState(event) {
      const { pageX, pageY } = event;
      if (event.type === 'mousemove') {
        let { mouse: { x, y } } = this;
        x.current = pageX;
        y.current = pageY;
        return;
      }
      let { mouse: { x, y } } = this;
      if (!this._timeout) {
        x.previous = pageX;
        y.previous = pageY;
        return;
      }
      const { pow, sqrt } = Math;
      let dMove;
      this.intentional = x.current == null || y.current == null;
      if (!this.intentional) {
        dMove = sqrt(
          pow(x.current - x.previous, 2) + pow(y.current - y.previous, 2)
        );
        this.intentional = dMove > this.sensitivity;
      }
      this.debugLog('checked', dMove);
    }
  }
  HoverIntent.debug = false;
  HLF.buildExtension(HoverIntent, {
    autoBind: true,
    autoListen: true,
    compactOptions: true,
  });
  Object.assign(HLF, { HoverIntent });
  return HoverIntent;
});
(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(HLF);
  }
})(this, function(HLF) {
  'use strict';
  class MediaGrid {
    static get defaults() {
      return {
        autoReady: false,
        resizeDelay: 100,
        undimDelay: 1000,
      };
    }
    static toPrefix(context) {
      switch (context) {
        case 'event': return 'hlfmg';
        case 'data': return 'hlf-mg';
        case 'class': return 'mg';
        case 'var': return 'mg';
        default: return 'hlf-mg';
      }
    }
    constructor(element, options) {
      this.eventListeners = { mouseleave: this._onMouseLeave };
      this.eventListeners[this.eventName('expand')] = this._onItemExpand;
    }
    init() {
      if (!this.itemElements) {
        this._selectItemElements();
      }
      this.itemElements.forEach(this._toggleItemEventListeners.bind(this, true));
      this.sampleItemElement = this.itemElements[0];
      this.expandDuration = this.cssDuration('transitionDuration', this.sampleItemElement);
      this.expandedItemElement = null;
      this._itemsObserver = new MutationObserver(this._onItemsMutation);
      this._itemsObserver.connect = () => {
        this._itemsObserver.observe(this.element, { childList: true });
      };
      this.metrics = {};
      if (this.autoReady) {
        this.load();
      }
    }
    deinit() {
      this.itemElements.forEach(this._toggleItemEventListeners.bind(this, false));
      this._itemsObserver.disconnect();
    }
    createPreviewImagesPromise() {
      const selector = `.${this.className('preview')} img`;
      const imageElements = Array.from(this.element.querySelectorAll(selector));
      let teardownTasks = [];
      return Promise.all(imageElements.map((element) => new Promise((resolve, reject) => {
        element.addEventListener('load', resolve);
        element.addEventListener('error', reject);
        teardownTasks.push(() => {
          element.removeEventListener('load', resolve);
          element.removeEventListener('error', reject);
        });
      }))).then(() => {
        teardownTasks.forEach(task => task());
      }, () => {
        teardownTasks.forEach(task => task());
      });
    }
    load() {
      this._updateMetrics({ hard: true });
      this._layoutItems();
      this._itemsObserver.connect();
      this.element.classList.add(this.className('ready'));
      this.dispatchCustomEvent('ready');
    }
    toggleItemExpansion(itemElement, expanded, completion) {
      if (typeof expanded === 'undefined') {
        expanded = !(
          itemElement.classList.contains(this.className('expanded')) ||
          itemElement.classList.contains(this.className('expanding'))
        );
      }
      let index = this.itemElements.indexOf(itemElement);
      if (expanded) {
        if (this.expandedItemElement) {
          this.toggleItemExpansion(this.expandedItemElement, false);
        }
        if (this._isRightEdgeItem(index)) {
          this._adjustItemToRightEdge(itemElement);
        }
        if (this._isBottomEdgeItem(index)) {
          this._adjustItemToBottomEdge(itemElement);
        }
      }
      this._toggleNeighborItemsRecessed(index, expanded);
      itemElement.classList.remove(
        this.className('expanding'), this.className('contracting')
      );
      let classNames = [
        this.className('transitioning'),
        this.className(expanded ? 'expanding' : 'contracting')
      ];
      itemElement.classList.add(...classNames);
      this.setElementTimeout(itemElement, 'expand-timeout', this.expandDuration, () => {
        itemElement.classList.remove(...classNames);
        itemElement.classList.toggle(this.className('expanded'), expanded);
        if (completion) {
          completion();
        }
      });

      this.expandedItemElement = expanded ? itemElement : null;

      itemElement.dispatchEvent(this.createCustomEvent('expand', { expanded }));
    }
    toggleExpandedItemFocus(itemElement, focused) {
      if (!itemElement.classList.contains(this.className('expanded'))) { return; }
      let delay = focused ? 0 : this.undimDelay;
      this.toggleItemFocus(itemElement, focused, delay);
    }
    toggleItemFocus(itemElement, focused, delay = 0) {
      if (focused) {
        this.itemElements.forEach((itemElement) => {
          itemElement.classList.remove(this.className('focused'));
        });
      }
      itemElement.classList.toggle(this.className('focused'), focused);
      this.setTimeout('_dimTimeout', delay, () => {
        this.element.classList.toggle(this.className('dimmed'), focused);
      });
    }
    _onItemClick(event) {
      const actionElementTags = ['a', 'audio', 'button', 'input', 'video'];
      if (actionElementTags.indexOf(event.target.tagName.toLowerCase()) !== -1) { return; }
      this.toggleItemExpansion(event.currentTarget);
    }
    _onItemExpand(event) {
      const { target } = event;
      if (!this._isItemElement(target)) { return; }
      const { expanded } = event.detail;
      this.toggleItemFocus(target, expanded, this.expandDuration);
    }
    _onItemMouseEnter(event) {
      this.toggleExpandedItemFocus(event.currentTarget, true);
    }
    _onItemMouseLeave(event) {
      this.toggleExpandedItemFocus(event.currentTarget, false);
    }
    _onItemsMutation(mutations) {
      let addedItemElements = mutations
        .filter(m => !!m.addedNodes.length)
        .reduce((allElements, m) => {
          let elements = Array.from(m.addedNodes).filter(this._isItemElement);
          return allElements.concat(elements);
        }, []);
      addedItemElements.forEach(this._toggleItemEventListeners.bind(this, true));
      this._itemsObserver.disconnect();
      this._reLayoutItems(() => {
        addedItemElements[0].scrollIntoView();
      });
      this._itemsObserver.connect();
    }
    _onMouseLeave(_) {
      if (!this.expandedItemElement) { return; }
      this.toggleItemFocus(this.expandedItemElement, false);
    }
    _onWindowResize(_) {
      this._reLayoutItems();
    }
    _isItemElement(node) {
      return (node instanceof HTMLElement &&
        node.classList.contains(this.className('item')));
    }
    _selectItemElements() {
      this.itemElements = Array.from(this.element.querySelectorAll(
        `.${this.className('item')}:not(.${this.className('sample')})`
      ));
    }
    _toggleItemEventListeners(on, itemElement) {
      this.toggleEventListeners(on, {
        'click': this._onItemClick,
        'mouseenter': this._onItemMouseEnter,
        'mouseleave': this._onItemMouseLeave,
      }, itemElement);
    }
    _adjustItemToBottomEdge(itemElement) {
      let { style } = itemElement;
      style.top = 'auto';
      style.bottom = '0px';
    }
    _adjustItemToRightEdge(itemElement) {
      let { style } = itemElement;
      style.left = 'auto';
      style.right = '0px';
    }
    _getMetricSamples() {
      let containerElement = this.selectByClass('samples');
      if (containerElement) {
        containerElement.parentNode.removeChild(containerElement);
      }
      let itemElement = this.sampleItemElement.cloneNode(true);
      itemElement.classList.add(this.className('sample'));
      let expandedItemElement = this.sampleItemElement.cloneNode(true);
      expandedItemElement.classList.add(
        this.className('expanded'), this.className('sample')
      );
      containerElement = document.createElement('div');
      containerElement.classList.add(this.className('samples'));
      let { style } = containerElement;
      style.left = style.right = style.top = '0px';
      style.position = 'absolute';
      style.visibility = 'hidden';
      style.zIndex = 0;
      containerElement.appendChild(itemElement);
      containerElement.appendChild(expandedItemElement);
      this.element.appendChild(containerElement);
      return { itemElement, expandedItemElement };
    }
    _isBottomEdgeItem(i) {
      const { rowSize } = this.metrics;
      let lastRowSize = (this.itemElements.length % rowSize) || rowSize;
      let untilLastRow = this.itemElements.length - lastRowSize;
      return (i + 1) > untilLastRow;
    }
    _isRightEdgeItem(i) {
      return ((i + 1) % this.metrics.rowSize) === 0;
    }
    _layoutItems() {
      Array.from(this.itemElements).reverse().forEach((itemElement) => {
        if (!itemElement.hasAttribute(this.attrName('original-position'))) {
          itemElement.setAttribute(this.attrName('original-position'),
            getComputedStyle(itemElement).position);
        }
        let { offsetLeft, offsetTop, style } = itemElement;
        style.position = 'absolute';
        style.left = `${offsetLeft}px`;
        style.top = `${offsetTop}px`;
      });
      let { style } = this.element;
      style.width = `${this.metrics.wrapWidth}px`;
      style.height = `${this.metrics.wrapHeight}px`;
    }
    _reLayoutItems(completion) {
      if (this.expandedItemElement) {
        this.toggleItemExpansion(this.expandedItemElement, false, () => {
          this._reLayoutItems(completion);
        });
        return;
      }
      this._selectItemElements();
      this._updateMetrics();
      this.itemElements.forEach((itemElement) => {
        let { style } = itemElement;
        style.bottom = style.left = style.right = style.top = 'auto';
        style.position = itemElement.getAttribute(this.attrName('original-position'));
        itemElement.classList.remove(this.className('raw'));
      });
      this._layoutItems();
      if (completion) {
        completion();
      }
    }
    _toggleNeighborItemsRecessed(index, recessed) {
      const { expandedScale, rowSize } = this.metrics;
      let dx = this._isRightEdgeItem(index) ? -1 : 1;
      let dy = this._isBottomEdgeItem(index) ? -1 : 1;
      let level = 1;
      let neighbors = [];
      while (level < expandedScale) {
        neighbors.push(
          this.itemElements[index + level * dx],
          this.itemElements[index + level * dy * rowSize],
          this.itemElements[index + level * (dy * rowSize + dx)]
        );
        level += 1;
      }
      neighbors.filter(n => !!n).forEach((itemElement) => {
        itemElement.classList.toggle(this.className('recessed'));
      });
    }
    _updateMetrics({ hard } = { hard: false }) {
      if (hard) {
        const { itemElement, expandedItemElement } = this._getMetricSamples();
        this.metrics = {
          itemWidth: itemElement.offsetWidth,
          itemHeight: itemElement.offsetHeight,
          expandedWidth: expandedItemElement.offsetWidth,
          expandedHeight: expandedItemElement.offsetHeight,
          expandedScale: parseInt(this.cssVariable('item-expanded-scale')),
        };
      }
      let gutter = Math.round(parseFloat(
        getComputedStyle(this.sampleItemElement).marginRight
      ));
      let fullWidth = this.metrics.itemWidth + gutter;
      let fullHeight = this.metrics.itemHeight + gutter;

      let { style } = this.element;
      style.height = style.width = 'auto';

      let rowSize = parseInt(((this.element.offsetWidth + gutter) / fullWidth));
      let colSize = Math.ceil(this.itemElements.length / rowSize);
      Object.assign(this.metrics, { gutter, rowSize, colSize }, {
        wrapWidth: fullWidth * rowSize,
        wrapHeight: fullHeight * colSize,
      });
    }
  }
  MediaGrid.debug = false;
  HLF.buildExtension(MediaGrid, {
    autoBind: true,
    autoListen: true,
    compactOptions: true,
    mixinNames: ['css', 'selection'],
  });
  Object.assign(HLF, { MediaGrid });
  return MediaGrid;
});
(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core', 'hlf/hover-intent'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'), require('hlf/hover-intent'));
  } else {
    attach(HLF, HLF.HoverIntent);
  }
})(this, function(HLF, HoverIntent) {
  'use strict';
  class Tip {
    static get defaults() {
      return {
        cursorHeight: 12,
        defaultDirection: ['bottom', 'right'],
        hasListeners: false,
        hasStem: true,
        snapTo: null,
        template() {
          let stemHtml = this.hasStem ? `<div class="${this.className('stem')}"></div>` : '';
          return (
`<div class="${this.className('inner')}">
  ${stemHtml}
  <div class="${this.className('content')}"></div>
</div>`
          );
        },
        toggleDelay: 700,
        triggerContent: null,
        viewportElement: document.body,
      };
    }
    static toPrefix(context) {
      switch (context) {
        case 'event': return 'hlftip';
        case 'data': return 'hlf-tip';
        case 'class': return 'tips';
        case 'var': return 'tip';
        default: return 'hlf-tip';
      }
    }
    constructor(elements, options, contextElement) {
      this.elementHoverIntent = null;
      this.hoverIntent = null;
      this._currentTriggerElement = null;
      this._sleepingPosition = null;
      this._state = null;
      this._stemSize = null;
      this._toggleCountdown = null;
    }
    init() {
      this.element = document.createElement('div');
      this._updateState('asleep');
      this._renderElement();
      this._toggleContextMutationObserver(true);
      this._toggleElementEventListeners(true);
      this._toggleTriggerElementEventListeners(true);
      this._updateTriggerElements();
    }
    deinit() {
      this.element.parentNode.removeChild(this.element);
      this._toggleContextMutationObserver(false);
      this._toggleElementEventListeners(false);
      this._toggleTriggerElementEventListeners(false);
    }
    get isAsleep() { return this._state === 'asleep'; }
    get isSleeping() { return this._state === 'sleeping'; }
    get isAwake() { return this._state === 'awake'; }
    get isWaking() { return this._state === 'waking'; }
    get snapToTrigger() { return this.snapTo === 'trigger'; }
    get snapToXAxis() { return this.snapTo === 'x'; }
    get snapToYAxis() { return this.snapTo === 'y'; }
    sleep({ triggerElement, event }) {
      if (this.isAsleep || this.isSleeping) { return; }

      this._updateState('sleeping', { event });
      this.setTimeout('_toggleCountdown', this.toggleDelay, () => {
        this._toggleElement(false, () => {
          this._updateState('asleep', { event });
        });
      });
    }
    wake({ triggerElement, event }) {
      this._updateCurrentTriggerElement(triggerElement);
      if (this.isAwake || this.isWaking) { return; }

      let delayed = !this.isSleeping;
      if (!delayed) { this.debugLog('staying awake'); }
      this._updateState('waking', { event });
      this.setTimeout('_toggleCountdown', (!delayed ? 0 : this.toggleDelay), () => {
        this._toggleElement(true, () => {
          this._updateState('awake', { event });
        });
        if (event.target !== this._contentElement) {
          this._updateElementPosition(triggerElement, event);
        }
      });
    }
    _getElementSize(triggerElement, { contentOnly } = {}) {
      let size = {
        height: triggerElement.getAttribute(this.attrName('height')),
        width: triggerElement.getAttribute(this.attrName('width')),
      };
      if (!size.height || !size.width) {
        this._updateElementContent(triggerElement);
        this._withStealthRender(() => {
          triggerElement.setAttribute(this.attrName('height'),
            (size.height = this.element.offsetHeight));
          triggerElement.setAttribute(this.attrName('width'),
            (size.width = this.element.offsetWidth));
        });
      }
      if (contentOnly) {
        const { paddingTop, paddingLeft, paddingBottom, paddingRight } =
          getComputedStyle(this._contentElement);
        size.height -= parseFloat(paddingTop) + parseFloat(paddingBottom);
        size.width -= parseFloat(paddingLeft) + parseFloat(paddingRight);
      }
      return size;
    }
    _getStemSize() {
      let size = this._stemSize;
      if (size != null) { return size; }

      let stemElement = this.selectByClass('stem', this.element);
      if (!stemElement) {
        size = 0;
      } else {
        this._withStealthRender(() => {
          let margin = getComputedStyle(stemElement).margin.replace(/0px/g, '');
          size = Math.abs(parseInt(margin));
        });
      }
      this._stemSize = size;
      return size;
    }
    _getTriggerOffset(triggerElement) {
      const { position } = getComputedStyle(triggerElement);
      if (position === 'fixed' || position === 'absolute') {
        const triggerRect = triggerElement.getBoundingClientRect();
        const viewportRect = this.viewportElement.getBoundingClientRect();
        return {
          left: triggerRect.left - viewportRect.left,
          top: triggerRect.top - viewportRect.top,
        };
      } else {
        return {
          left: triggerElement.offsetLeft, top: triggerElement.offsetTop
        };
      }
    }
    _isTriggerDirection(directionComponent, triggerElement) {
      if (this.element.classList.contains(this.className(directionComponent))) {
        return true;
      }
      if (
        (!triggerElement || !triggerElement.hasAttribute(this.attrName('direction'))) &&
        this.defaultDirection.indexOf(directionComponent) !== -1
      ) {
        return true;
      }
      return false;
    }
    _onContextMutation(mutations) {
      let newTriggerElements = [];
      const allTriggerElements = Array.from(this.querySelector(this.contextElement));
      mutations.forEach((mutation) => {
        let triggerElements = Array.from(mutation.addedNodes)
          .filter(n => n instanceof HTMLElement)
          .map((n) => {
            let result = this.querySelector(n);
            return result.length ? result[0] : n;
          })
          .filter(n => allTriggerElements.indexOf(n) !== -1);
        newTriggerElements = newTriggerElements.concat(triggerElements);
      });
      this._updateTriggerElements(newTriggerElements);
      this.elements = this.elements.concat(newTriggerElements);
      this.hoverIntent.elements = this.elements;
    }
    _onContentElementMouseEnter(event) {
      this.debugLog('enter tip');
      let triggerElement = this._currentTriggerElement;
      if (!triggerElement) { return; }
      this.wake({ triggerElement, event });
    }
    _onContentElementMouseLeave(event) {
      this.debugLog('leave tip');
      let triggerElement = this._currentTriggerElement;
      if (!triggerElement) { return; }
      this.sleep({ triggerElement, event });
    }
    _onTriggerElementMouseEnter(event) {
      this.wake({ triggerElement: event.target, event });
    }
    _onTriggerElementMouseLeave(event) {
      this.sleep({ triggerElement: event.target, event });
    }
    _onTriggerElementMouseMove(event) {
      const { target } = event;
      if (target.classList.contains(this.className('trigger'))) {
        this._updateCurrentTriggerElement(target);
      }
      if (
        this.isAsleep || !this._currentTriggerElement || (
          target !== this._currentTriggerElement &&
          target !== this._currentTriggerElement.parentElement &&
          !this._currentTriggerElement.contains(target)
        )
      ) {
        return;
      }
      this._updateElementPosition(this._currentTriggerElement, event);
    }
    _renderElement() {
      if (this.element.innerHTML.length) { return; }
      this.element.innerHTML = this.template();
      this.element.classList.add(
        this.className('tip'), this.className('follow'), this.className('hidden'),
        ...(this.defaultDirection.map(this.className))
      );

      this._contentElement = this.selectByClass('content', this.element);

      this.viewportElement.insertBefore(this.element, this.viewportElement.firstChild);

      if (this.snapTo) {
        this.element.classList.add(this.className((() => {
          if (this.snapToTrigger) { return 'snap-trigger'; }
          else if (this.snapToXAxis) { return 'snap-x-side'; }
          else if (this.snapToYAxis) { return 'snap-y-side'; }
        })()));
      }
    }
    _toggleContextMutationObserver(on) {
      if (!this.querySelector) { return; }
      if (!this._contextObserver) {
        this._contextObserver = new MutationObserver(this._onContextMutation);
      }
      if (on) {
        const options = { childList: true, subtree: true };
        this._contextObserver.observe(this.contextElement, options);
      } else {
        this._contextObserver.disconnect();
      }
    }
    _toggleElement(visible, completion) {
      if (this._toggleAnimation) { return; }
      const duration = this.cssVariableDuration('toggle-duration', this.element);
      let { classList, style } = this.element;
      classList.toggle(this.className('visible'), visible);
      if (visible) {
        classList.remove(this.className('hidden'));
      }
      this.setTimeout('_toggleAnimation', duration, () => {
        if (!visible) {
          classList.add(this.className('hidden'));
          style.transform = 'none';
        }
        completion();
      });
    }
    _toggleElementEventListeners(on) {
      if (this.elementHoverIntent || !on) {
        this.elementHoverIntent.remove();
        this.elementHoverIntent = null;
      }
      if (on) {
        this.elementHoverIntent = HoverIntent.extend(this._contentElement);
      }
      const { eventName } = HoverIntent;
      let listeners = {};
      listeners[eventName('enter')] = this._onContentElementMouseEnter;
      listeners[eventName('leave')] = this._onContentElementMouseLeave;
      this.toggleEventListeners(on, listeners, this._contentElement);
    }
    _toggleTriggerElementEventListeners(on) {
      if (this.hoverIntent || !on) {
        this.hoverIntent.remove();
        this.hoverIntent = null;
      }
      if (on) {
        const { contextElement } = this;
        this.hoverIntent = HoverIntent.extend(this.elements, { contextElement });
      }
      const { eventName } = HoverIntent;
      let listeners = {};
      listeners[eventName('enter')] = this._onTriggerElementMouseEnter;
      listeners[eventName('leave')] = this._onTriggerElementMouseLeave;
      listeners[eventName('track')] = this._onTriggerElementMouseMove;
      this.toggleEventListeners(on, listeners, this.contextElement);
    }
    _updateCurrentTriggerElement(triggerElement) {
      if (triggerElement == this._currentTriggerElement) { return; }

      this._updateElementContent(triggerElement);
      let contentSize = this._getElementSize(triggerElement, { contentOnly: true });
      this._contentElement.style.height = `${contentSize.height}px`;
      this._contentElement.style.width = `${contentSize.width + 1}px`; // Give some buffer.

      let { classList } = this.element;
      let compoundDirection = triggerElement.hasAttribute(this.attrName('direction')) ?
        triggerElement.getAttribute(this.attrName('direction')).split(' ') :
        this.defaultDirection;
      let directionClassNames = compoundDirection.map(this.className);
      if (!directionClassNames.reduce((memo, className) => {
        return memo && classList.contains(className);
      }, true)) {
        this.debugLog('update direction class', compoundDirection);
        classList.remove(...(['top', 'bottom', 'right', 'left'].map(this.className)));
        classList.add(...directionClassNames);
      }

      this._currentTriggerElement = triggerElement;
    }
    _updateElementContent(triggerElement) {
      const content = triggerElement.getAttribute(this.attrName('content'));
      this._contentElement.textContent = content;
    }
    _updateElementPosition(triggerElement, event) {
      let cursorHeight = this.snapTo ? 0 : this.cursorHeight;
      let offset = { left: event.detail.pageX, top: event.detail.pageY };

      if (this.snapTo) { // Note vertical directions already account for stem-size.
        let triggerOffset = this._getTriggerOffset(triggerElement);
        if (this.snapToXAxis || this.snapToTrigger) {
          offset.top = triggerOffset.top;
          if (this._isTriggerDirection('bottom', triggerElement)) {
            offset.top += triggerElement.offsetHeight;
          }
          if (!this.snapToTrigger) {
            offset.left -= this.element.offsetWidth / 2;
          }
        }
        if (this.snapToYAxis || this.snapToTrigger) {
          offset.left = triggerOffset.left;
          if (!this.snapToTrigger) {
            if (this._isTriggerDirection('right', triggerElement)) {
              offset.left += triggerElement.offsetWidth + this._getStemSize();
            } else if (this._isTriggerDirection('left', triggerElement)) {
              offset.left -= this._getStemSize();
            }
            offset.top -= this.element.offsetHeight / 2 + this._getStemSize();
          }
        }
      }

      if (this._isTriggerDirection('top', triggerElement)) {
        offset.top -= this.element.offsetHeight + this._getStemSize();
      } else if (this._isTriggerDirection('bottom', triggerElement)) {
        offset.top += cursorHeight * 2 + this._getStemSize();
      }
      if (this._isTriggerDirection('left', triggerElement)) {
        offset.left -= this.element.offsetWidth;
        if (this.element.offsetWidth > triggerElement.offsetWidth) {
          offset.left += triggerElement.offsetWidth;
        }
      }
      this.element.style.transform = `translate(${offset.left}px, ${offset.top}px)`;
    }
    _updateState(state, { event } = {}) {
      if (state === this._state) { return; }
      if (this._state) {
        if (state === 'asleep' && !this.isAsleep) { return; }
        if (state === 'awake' && !this.isWaking) { return; }
      }
      this._state = state;
      this.debugLog(state);

      if (this.hasListeners && this._currentTriggerElement) {
        this._currentTriggerElement.dispatchEvent(
          this.createCustomEvent(this._state)
        );
      }

      if (this.isAsleep || this.isAwake) {
        if (this._currentTriggerElement) {
          this._currentTriggerElement.setAttribute(
            this.attrName('has-tip-focus'), this.isAwake
          );
        }
        if (this.hoverIntent) {
          this.hoverIntent.configure({ interval: this.isAwake ? 100 : 'default' });
        }
      } else if (this.isSleeping) {
        this._sleepingPosition = { x: event.detail.pageX, y: event.detail.pageY };
      } else if (this.isWaking) {
        this._sleepingPosition = null;
      }
    }
    _updateTriggerAnchoring(triggerElement) {
      let offset = this._getTriggerOffset(triggerElement);
      let height = triggerElement.offsetHeight;
      let width = triggerElement.offsetWidth;
      let tip = this._getElementSize(triggerElement);
      this.debugLog({ offset, height, width, tip });
      const viewportRect = this.viewportElement.getBoundingClientRect();
      let newDirection = this.defaultDirection.map((d) => {
        let edge, fits;
        if (d === 'bottom') {
          fits = (edge = offset.top + height + tip.height) && edge <= viewportRect.height;
        } else if (d === 'right') {
          fits = (edge = offset.left + tip.width) && edge <= viewportRect.width;
        } else if (d === 'top') {
          fits = (edge = offset.top - tip.height) && edge >= 0;
        } else if (d === 'left') {
          fits = (edge = offset.left - tips.width) && edge >= 0;
        } else {
          fits = true;
        }
        this.debugLog('check-direction-component', { d, edge });
        if (!fits) {
          if (d === 'bottom') { return 'top'; }
          if (d === 'right') { return 'left'; }
          if (d === 'top') { return 'bottom'; }
          if (d === 'left') { return 'right'; }
        }
        return d;
      });
      triggerElement.setAttribute(this.attrName('direction'), newDirection.join(' '));
    }
    _updateTriggerContent(triggerElement) {
      const { triggerContent } = this;
      let content;
      if (typeof triggerContent === 'function') {
        content = triggerContent(triggerElement);
      } else {
        let contentAttribute;
        let shouldRemoveAttribute = true;
        if (triggerElement.hasAttribute(triggerContent)) {
          contentAttribute = triggerContent;
        } else if (triggerElement.hasAttribute('title')) {
          contentAttribute = 'title';
        } else if (triggerElement.hasAttribute('alt')) {
          contentAttribute = 'alt';
          shouldRemoveAttribute = false;
        } else {
          return console.error('Unsupported trigger.');
        }
        content = triggerElement.getAttribute(contentAttribute);
        if (shouldRemoveAttribute) {
          triggerElement.removeAttribute(contentAttribute);
        }
      }
      triggerElement.setAttribute(this.attrName('content'), content);
    }
    _updateTriggerElements(triggerElements) {
      if (!triggerElements) {
        triggerElements = this.elements;
      }
      triggerElements.forEach((triggerElement) => {
        triggerElement.classList.add(this.className('trigger'));
        this._updateTriggerContent(triggerElement);
        this._updateTriggerAnchoring(triggerElement);
      });
    }
    _withStealthRender(fn) {
      if (getComputedStyle(this.element).display !== 'none') {
        return fn();
      }
      this.swapClasses('hidden', 'visible', this.element);
      this.element.style.visibility = 'hidden';
      let result = fn();
      this.swapClasses('visible', 'hidden', this.element);
      this.element.style.visibility = 'visible';
      return result;
    }
  }
  Tip.debug = false;
  HLF.buildExtension(Tip, {
    autoBind: true,
    compactOptions: true,
    mixinNames: ['css', 'event', 'selection'],
  });
  Object.assign(HLF, { Tip });
  return Tip;
});
