//
// HLF Media Grid Extensions
// =========================
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
  // § __UMD__
  // - When AMD, register the attacher as an anonymous module.
  // - When Node or Browserify, set module exports to the attach result.
  // - When browser globals (root is window), Just run the attach function.
  //
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(hlf);
  }
})(this, function(hlf) {
  //
  // Namespace
  // ---------
  //
  // It takes some more boilerplate to write the extension. Any of this additional
  // support API is put into a extension specific namespace under `hlf`, which in
  // this case is __hlf.mediaGrid__.
  //
  // - __debug__ toggles debug logging for all instances of an extension.
  // - __toString__ helps to namespace when registering any DOM names.
  //
  // The extension's __defaults__ are available as reference. Also note that _the
  // extension instance gets extended with the options_.
  //
  // - __autoReady__ is `false` by default, as recommended. Turning it on means
  //   the `ready` event gets triggered immediately, synchronously, and is only
  //   recommended if your grid doesn't have images and such that require a wait
  //   before being fully loaded and sized.
  //
  // - __resizeDelay__ is the millis to wait for window resizing to stop before
  //   doing a re-layout. `100` is the default to balance responsiveness and
  //   performance.
  //
  // - Note: for these extensions, the majority of presentation state logic is
  //   in the extension stylesheet. We update the presentation state by using
  //   namespaced __classNames__ generated in a closure.
  //
  hlf.mediaGrid = {
    debug: false,
    toString(context) {
      switch (context) {
        case 'event': return 'hlfmg';
        case 'data': return 'hlf-mg';
        case 'class': return 'mg';
        default: return 'hlf-mg';
      }
    },
    defaults: {
      autoReady: false,
      resizeDelay: 100,
      undimDelay: 1000,
    },
  };
  //
  // MediaGrid
  // ---------
  //
  class MediaGrid {
    constructor(element, options) {
      [ '_onItemClick', '_onItemExpand', '_onItemMouseEnter',
        '_onItemMouseLeave', '_onMouseLeave', '_onWindowResize',
      ].forEach((name) => {
        this[name] = this[name].bind(this);
      });
      this.eventListeners = { mouseleave: this._onMouseLeave };
      this.eventListeners[this.eventName('expand')] = this._onItemExpand;
    }
    //
    // __init__ completes the setup:
    // 1. Select `itemElements` and `sampleItemElement`.
    // 2. Get `expandDuration` from styles, create event bindings for expansion.
    //    This also relies on the `expandedItemElement` state.
    // 3. Create event bindings for dimming on expansion, hovering expanded item.
    // 4. Set up initial layout for running when `ready`.
    // 5. Set up re-layout for running on window resize.
    //
    init() {
      if (!this.itemElements) {
        this.itemElements = this.selectAllByClass('item');
      }
      Array.from(this.itemElements).forEach((itemElement) => {
        this.addEventListeners({
          'click': this._onItemClick,
          'mouseenter': this._onItemMouseEnter,
          'mouseleave': this._onItemMouseLeave,
        }, itemElement);
      });
      window.addEventListener('resize', this._onWindowResize);
      this.sampleItemElement = this.itemElements[0];
      this.expandDuration = 1000 * parseFloat(
        getComputedStyle(this.sampleItemElement).transitionDuration
      );
      this.expandedItemElement = null;
      this.metrics = {};
      if (this.autoLoad) {
        this.performLoad();
      }
    }
    deinit() {
      this.removeEventListeners(this.eventListeners);
      Array.from(this.itemElements).forEach((itemElement) => {
        this.removeEventListeners({
          'click': this._onItemClick,
          'mouseenter': this._onItemMouseEnter,
          'mouseleave': this._onItemMouseLeave,
        }, itemElement);
      });
      window.removeEventListener('resize', this._onWindowResize);
    }
    performLoad() {
      this._updateMetrics();
      this._layoutItems();
      this.element.classList.add(this.className('ready'));
      this.dispatchCustomEvent('ready');
    }
    //
    // § __Public__
    //
    // You are welcome to call these methods from your own code, though currently
    // there is no intended use case for that.
    //
    // __toggleItemExpansion__ basically toggles the `-expanded` class on the
    // given `itemElement` to `expanded` and triggers the `expand` event. To allow
    // styling or scripting during the transition, it adds the `-transitioning`
    // class and removes it afterwards per `expandDuration`.
    //
    toggleItemExpansion(itemElement, expanded, completion) {
      if (typeof expanded === 'undefined') {
        expanded = !itemElement.classList.contains(this.className('expanded'));
      }
      let index = Array.from(this.itemElements).indexOf(itemElement);
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
      itemElement.classList.add(this.className('transitioning'));
      clearTimeout(itemElement.getAttribute(this.attrName('expand-timeout')));
      itemElement.setAttribute(this.attrName('expand-timeout'),
        setTimeout(() => {
          itemElement.classList.remove(this.className('transitioning'));
          if (completion) {
            completion();
          }
        }, this.expandDuration)
      );

      itemElement.classList.toggle(this.className('expanded'), expanded);
      this.expandedItemElement = expanded ? itemElement : null;

      itemElement.dispatchEvent(this.createCustomEvent('expand', { expanded }));
    }
    //
    // __toggleExpandedItemFocus__ wraps `toggleItemFocus` to factor in
    // `undimDelay` when toggling off `focus`. Focusing dims without delay.
    //
    toggleExpandedItemFocus(itemElement, focused) {
      if (!itemElement.classList.contains(this.className('expanded'))) { return; }
      let delay = focused ? 0 : this.undimDelay;
      this.toggleItemFocus(itemElement, focused, delay);
    }
    //
    // __toggleItemFocus__ basically toggles the `-focused` class on the given
    // `itemElement` to `focused` and the `-dimmed` class on the root element
    // after any given `delay`.
    //
    toggleItemFocus(itemElement, focused, delay) {
      if (focused) {
        Array.from(this.itemElements).forEach((itemElement) => {
          itemElement.classList.remove(this.className('focused'));
        });
      }
      itemElement.classList.toggle(this.className('focused'), focused);
      clearTimeout(this._dimTimeout);
      this._dimTimeout = setTimeout(() => {
        this.element.classList.toggle(this.className('dimmed'), focused);
      }, delay);
    }
    //
    // § __Internal__
    //
    _onItemClick(event) {
      const actionElementTags = ['A', 'AUDIO', 'BUTTON', 'INPUT', 'VIDEO'];
      if (actionElementTags.indexOf(event.target.tagName) !== -1) { return; }
      this.toggleItemExpansion(event.currentTarget);
    }
    _onItemExpand(event) {
      const { target } = event;
      if (!target.classList.contains(this.className('item'))) { return; }
      const { expanded } = event.detail;
      this.toggleItemFocus(target, expanded, this.expandDuration);
    }
    _onItemMouseEnter(event) {
      this.toggleExpandedItemFocus(event.currentTarget, true);
    }
    _onItemMouseLeave(event) {
      this.toggleExpandedItemFocus(event.currentTarget, false);
    }
    _onMouseLeave(_) {
      if (!this.expandedItemElement) { return; }
      this.toggleItemFocus(this.expandedItemElement, false, 0);
    }
    _onWindowResize(_) {
      const now = Date.now();
      if (this._ran && now < this._ran + this.resizeDelay) { return; }
      this._ran = now;
      this._updateMetrics(false);
      this._reLayoutItems();
    }
    //
    // These are layout helpers for changing offset for an `itemElement`.
    //
    _adjustItemToBottomEdge(itemElement) {
      itemElement.style.top = 'auto';
      itemElement.style.bottom = '0px';
    }
    _adjustItemToRightEdge(itemElement) {
      itemElement.style.left = 'auto';
      itemElement.style.right = '0px';
    }
    //
    // ___getMetricSamples__ returns cloned `itemElement` and `expandedItemElement`
    // mainly for calculating initial metrics. For them to have the right sizes,
    // they're attached to an invisible container appended to the root element.
    //
    _getMetricSamples() {
      let containerElement = this.selectByClass('sample');
      if (containerElement) {
        containerElement.parentNode.removeChild(containerElement);
      }
      let itemElement = this.sampleItemElement.cloneNode(true);
      let expandedItemElement = this.sampleItemElement.cloneNode(true);
      expandedItemElement.classList.add(this.className('expanded'));
      containerElement = document.createElement('div');
      containerElement.classList.add(this.className('sample'));
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
    //
    // These are layout helpers for checking item position based on index and the
    // current `rowSize` metric.
    //
    _isBottomEdgeItem(i) {
      const { rowSize } = this.metrics;
      let lastRowSize = (this.itemElements.length % rowSize) || rowSize;
      let untilLastRow = this.itemElements.length - lastRowSize;
      return (i + 1) > untilLastRow;
    }
    _isRightEdgeItem(i) {
      return ((i + 1) % this.metrics.rowSize) === 0;
    }
    //
    // ___layoutItems__ occurs once `metrics` is updated. With the latest
    // `wrapWidth` and `wrapHeight` metrics, the root element is resized. Each
    // element in `itemElements` gets its position style set to `absolute` non-
    // destructively; this method assumes the original is `float`, and so
    // iterates in reverse.
    //
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
    //
    // ___reLayoutItems__ wraps `_layoutItems` to be its idempotent version by
    // first resetting each item's to its `original-position`. It can run after a
    // custom `delay`.
    //
    _reLayoutItems() {
      if (this.expandedItemElement) {
        this.toggleItemExpansion(
          this.expandedItemElement, false, this._reLayoutItems.bind(this)
        );
        return;
      }
      Array.from(this.itemElements).forEach((itemElement) => {
        let { style } = itemElement;
        style.bottom = style.left = style.right = style.top = 'auto';
        style.position = itemElement.getAttribute(this.attrName('original-position'));
        itemElement.classList.remove(this.className('raw'));
      });
      this._layoutItems();
    }
    //
    // TODO
    //
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
      neighbors.forEach((itemElement) => {
        itemElement.classList.toggle(this.className('recessed'));
      });
    }
    //
    // ___updateMetrics__ builds the `metrics` around item and wrap as well as
    // row and column sizes. It does so by measuring sample elements and their
    // margins, as well as sizing the wrap (root element) to fit its items. As
    // such, this method isn't idempotent and expects to be followed by a call
    // to `_layoutItems`.
    //
    _updateMetrics(hard = true) {
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
  //
  // § __Attaching__
  //
  return hlf.createExtension({
    name: 'mediaGrid',
    namespace: hlf.mediaGrid,
    apiClass: MediaGrid,
    autoListen: true,
    baseMethodGroups: ['css', 'event', 'selection'],
    compactOptions: true,
  });
});
