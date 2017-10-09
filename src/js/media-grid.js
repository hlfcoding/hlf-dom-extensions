//
// HLF Media Grid Extension
// ========================
// [Styles](../css/media-grid.html) | [Tests](../../tests/js/media-grid.html)
//
// The `mediaGrid` extension, inspired by the Cargo Voyager design template, can
// expand an item inline without affecting the position of its siblings. The
// extension tries to add the minimal amount of DOM elements and styles. So the
// layout rules are mostly defined in the styles, and initial html for items is
// required (see the tests for an example). The extension also handles additional
// effects like focusing on the expanded item and dimming its siblings.
//
(function(root, attach) {
  //
  // - When AMD, register the attacher as an anonymous module.
  // - When Node or Browserify, set module exports to the attach result.
  // - When browser globals (root is window), Just run the attach function.
  //
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(HLF);
  }
})(this, function(HLF) {
  'use strict';
  //
  // MediaGrid
  // ---------
  //
  // - __debug__ toggles debug logging for all instances of an extension.
  // - __toString__ helps to namespace when registering any DOM names.
  // - __attrName__, __className__, __eventName__, __varName__ helpers are all attached to
  //   the class statically, along with the __extend__ method.
  //
  // The extension's __defaults__ are available as reference. Also note that
  // _the extension instance gets extended with the options_.
  //
  // - __autoReady__ is `false` by default, as recommended. Turning it on means
  //   the `ready` event gets triggered immediately, synchronously, and is only
  //   recommended if your grid doesn't have images and such that require a
  //   wait before being fully loaded and sized. Otherwise, you can manually
  //   __load__ and use __createPreviewImagesPromise__ to help determine when
  //   to do so.
  //
  // - __resizeDelay__ is the millis to wait for window resizing to stop before
  //   doing a re-layout. `100` is the default to balance responsiveness and
  //   performance.
  //
  // - __undimDelay__ is the millis to wait before removing the dim effect when
  //   focus is toggled off on an expanded item.
  //
  // - Note: the majority of presentation state logic is in the extension
  //   stylesheet. We update the presentation state by using __className__.
  //
  // To summarize the implementation, on a DOM that's already created, the
  // extension, given the `element`, will select the `itemElements` and
  // `sampleItemElement`, as well as parse the `expandDuration`. The extension
  // will wait for content to load before doing an initial layout via
  // `_updateMetrics` and `_layoutItems`. `eventListeners` are added
  // automatically with the `_onMouseLeave` and `_onItemExpand` handlers that
  // `toggleItemFocus`. `_toggleItemEventListeners` runs for each item to add
  // `_onItemClick`, and `_onItemMouseEnter` and `_onItemMouseLeave` that
  // respectively `toggleItemExpansion` and `toggleExpandedItemFocus`. The
  // `_onWindowResize` handler is automatically set up to `_reLayoutItems`. And
  // the `_itemsObserver` is manually set up with the `_onItemsMutation`
  // handler that `_toggleItemEventListeners` and also `_reLayoutItems`. Once
  // `ready`, the respective namespaced event is dispatched from and class is
  // added to the `element`.
  //
  class MediaGrid {
    static get debug() {
      return false;
    }
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
    //
    // `toggleItemExpansion` basically toggles the `-expanded` class on the
    // given `itemElement` to `expanded` and triggers the `expand` event. To
    // allow styling or scripting during the transition, it adds the
    // `-transitioning`, `-contracting`, and `-expanding` classes and removes
    // them afterwards per `expandDuration`.
    //
    // `toggleExpandedItemFocus` wraps `toggleItemFocus` to factor in
    // `undimDelay` when toggling off `focus`. Focusing dims without delay.
    //
    // `toggleItemFocus` basically toggles the `-focused` class on the given
    // `itemElement` to `focused` and the `-dimmed` class on the root element
    // after any given `delay`.
    //
    // `_getMetricSamples` returns cloned `itemElement` and
    // `expandedItemElement` mainly for calculating initial metrics. For them
    // to have the right sizes, they're attached to an invisible container
    // appended to the root element.
    //
    // `_layoutItems` occurs once `metrics` is updated. With the latest
    // `wrapWidth` and `wrapHeight` metrics, the root element is resized. Each
    // element in `itemElements` gets its position style set to `absolute` non-
    // destructively; this method assumes the original is `float`, and so
    // iterates in reverse.
    //
    // `_reLayoutItems` wraps `_layoutItems` to be its idempotent version by
    // first resetting each item's to its `original-position`.
    //
    // `_toggleNeighborItemsRecessed` toggles the `-recessed` class on items
    // per the occlusion-causing expansion of the item at `index`.
    //
    // `_updateMetrics` builds the `metrics` around item and wrap as well as
    // row and column sizes. It does so by measuring sample elements and their
    // margins, as well as sizing the wrap (root element) to fit its items. As
    // such, this method isn't idempotent and expects to be followed by a call
    // to `_layoutItems`.
    //
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
  HLF.buildExtension(MediaGrid, {
    autoBind: true,
    autoListen: true,
    compactOptions: true,
    mixinNames: ['css', 'selection'],
  });
  Object.assign(HLF, { MediaGrid });
  return MediaGrid;
});
