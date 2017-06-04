(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(hlf);
  }
})(this, function(hlf) {
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
  class MediaGrid {
    constructor(element, options) {
      this.eventListeners = {
        mouseleave: (event) => {
          if (!this.expandedItemElement) { return; }
          this.toggleItemFocus(this.expandedItemElement, false, 0);
        },
      };
      this.eventListeners[this.eventName('expand')] = (event) => {
        const { target } = event;
        if (!target.classList.contains(this.className('item'))) { return; }
        const { expanded } = event.detail;
        this.toggleItemFocus(target, expanded, this.expandDuration);
      };
    }
    init() {
      if (!this.itemElements) {
        this.itemElements = this.selectAllByClass('item');
      }
      this.sampleItemElement = this.itemElements[0];
      this.expandDuration = 1000 * parseFloat(
        getComputedStyle(this.sampleItemElement).transitionDuration
      );
      Array.from(this.itemElements).forEach((itemElement) => {
        itemElement.addEventListener('click', (_) => {
          this.toggleItemExpansion(itemElement);
        });
        itemElement.addEventListener('mouseenter', (_) => {
          this.toggleExpandedItemFocus(itemElement, true);
        });
        itemElement.addEventListener('mouseleave', (_) => {
          this.toggleExpandedItemFocus(itemElement, false);
        });
      });
      this.expandedItemElement = null;
      this.metrics = {};
      let ran;
      window.addEventListener('resize', (_) => {
        const now = Date.now();
        if (ran && now < ran + this.resizeDelay) { return; }
        ran = now;
        this._updateMetrics(false);
        if (this.expandedItemElement) {
          this.toggleItemExpansion(this.expandedItemElement, false);
          this._reLayoutItems(this.expandDuration);
        } else {
          this._reLayoutItems();
        }
      });
      if (this.autoLoad) {
        this.load();
      }
    }
    load() {
      this._updateMetrics();
      this._layoutItems();
      this.element.classList.add(this.className('ready'));
    }
    toggleItemExpansion(itemElement, expanded) {
      if (typeof expanded === 'undefined') {
        expanded = !itemElement.classList.contains(this.className('expanded'));
      }
      if (expanded) {
        if (this.expandedItemElement) {
          this.toggleItemExpansion(this.expandedItemElement, false);
        }
        let index = Array.from(this.itemElements).indexOf(itemElement);
        if (this._isRightEdgeItem(index)) {
          this._adjustItemToRightEdge(itemElement);
        }
        if (this._isBottomEdgeItem(index)) {
          this._adjustItemToBottomEdge(itemElement);
        }
      }
      itemElement.classList.add(this.className('transitioning'));
      clearTimeout(itemElement.getAttribute(this.attrName('expand-timeout')));
      itemElement.setAttribute(this.attrName('expand-timeout'),
        setTimeout(() => {
          itemElement.classList.remove(this.className('transitioning'));
        }, this.expandDuration)
      );

      itemElement.classList.toggle(this.className('expanded'), expanded);
      this.expandedItemElement = expanded ? itemElement : null;

      itemElement.dispatchEvent(this.createCustomEvent('expand', { expanded }));
    }
    toggleExpandedItemFocus(itemElement, focused) {
      if (!itemElement.classList.contains(this.className('expanded'))) { return; }
      let delay = focused ? 0 : this.undimDelay;
      this.toggleItemFocus(itemElement, focused, delay);
    }
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
    _adjustItemToBottomEdge(itemElement) {
      itemElement.style.top = 'auto';
      itemElement.style.bottom = '0px';
    }
    _adjustItemToRightEdge(itemElement) {
      itemElement.style.left = 'auto';
      itemElement.style.right = '0px';
    }
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
    _isBottomEdgeItem(i) {
      return (i + 1) > (this.itemElements.length - this.metrics.rowSize);
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
    _reLayoutItems(delay = 0) {
      clearTimeout(this._layoutTimeout);
      this._layoutTimeout = setTimeout(() => {
        Array.from(this.itemElements).forEach((itemElement) => {
          let { style } = itemElement;
          style.bottom = style.left = style.right = style.top = 'auto';
          style.position = itemElement.getAttribute(this.attrName('original-position'));
        });
        this._layoutItems();
      }, delay);
    }
    _updateMetrics(hard = true) {
      if (hard) {
        const { itemElement, expandedItemElement } = this._getMetricSamples();
        this.metrics = {
          itemWidth: itemElement.offsetWidth,
          itemHeight: itemElement.offsetHeight,
          expandedWidth: expandedItemElement.offsetWidth,
          expandedHeight: expandedItemElement.offsetHeight,
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
  return hlf.createExtension({
    name: 'mediaGrid',
    namespace: hlf.mediaGrid,
    apiClass: MediaGrid,
    autoListen: true,
    baseMethodGroups: ['event', 'selection'],
    compactOptions: true,
  });
});
