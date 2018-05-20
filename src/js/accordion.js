//
// HLF Accordion Extension
// =======================
// [Tests](../../tests/js/accordion.html)
//
// The `Accordion` extension provides a simple but flexible accordion behavior.
// Folding a section only folds its items. `autoCollapse` is an option. And
// `cursorItemClass` and `featureCount` options allow certain items to remain
// visible upon folding. A `triggerSelector` option allows any trigger within
// the section to be used.
//
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
  //
  // Accordion
  // ---------
  //
  // - __autoCollapse__ can be turned off to prevent other sections from folding
  //   when a section unfolds. `true` by default.
  //
  // - __cursorItemClass__ when on a section's item, marks it as a cursor, and
  //   effectively preventing its section from folding. `'active'` by default.
  //
  // - __featureCount__ limits the number of starting items for a section to
  //   show even when folded. `1` by default.
  //
  // - __itemsSelector__ points to all elements in a section, to be toggled
  //   during folding and unfolding. `'li:not(:first-child)'` by default.
  //
  // - __sectionSelector__ points to all elements considered to be folding
  //   sections, which can be modified with the `js-ac-folded` class. `'ul'`
  //   by default.
  //
  // - __triggerSelector__ points to existing UI that when clicked toggles its
  //   section's folding'. `'.accordion-trigger'` by default.
  //
  // To summarize the implementation, given existing section elements in the
  // extended `element`, populate `_sections` with elements (`sectionElement`,
  // its `itemElements`, its `triggerElement`) and state (`hasCursor` and
  // `isFolded`, respectively per `cursorItemClass` and `false`). User input is
  // handled by `_onTriggerClick` and transformed into calls to
  // `_toggleSectionFolding`.
  //
  // `_toggleSectionFolding` at its core changes `display` on the `itemElements`
  // past the `featureCount` option for the section, while toggling the `js-ac-
  // folded` class. It also implements the `autoCollapse` option and recurses
  // to collapse the other sections if needed. It has a couple guards,
  // including not folding if the section `hasCursor`, or if section's
  // `isFolded` is already set.
  //
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
      [...this.element.querySelectorAll(this.sectionSelector)]
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
      let itemElements = [...sectionElement.querySelectorAll(this.itemsSelector)];
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
      this.autoCollapse = false;
      this._toggleSectionFolding(section, false);
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
