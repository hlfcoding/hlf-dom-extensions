# HLF DOM Extensions

[![Package](https://img.shields.io/npm/v/hlf-dom-extensions.svg?style=flat)](https://www.npmjs.com/package/hlf-dom-extensions)
[![Code Climate](https://api.codeclimate.com/v1/badges/2fa382c64d158c960256/maintainability)](https://codeclimate.com/github/hlfcoding/hlf-dom-extensions/maintainability)
[![Dependency Status](https://img.shields.io/david/hlfcoding/hlf-dom-extensions.svg)](https://david-dm.org/hlfcoding/hlf-dom-extensions#info=dependencies)
![GitHub License](https://img.shields.io/github/license/hlfcoding/hlf-dom-extensions.svg)

<pre>
 __         __       ___
/\ \       /\ \     / __\
\ \ \___   \ \ \   /\ \_/_
 \ \  __`\  \ \ \  \ \  __\
  \ \ \ \ \  \ \ \  \ \ \_/
   \ \_\ \_\  \ \_\  \ \_\
    \/_/ /_/   \/_/   \/_/
</pre>

DOM extensions for quality UI and implemented without hard dependencies. The
[annotated source code][] is also available and include documented examples. All
modules are exported using [UMD]() and work with AMD, Browserify, or plain.

All extensions should have test pages with documented source. Please use them as
usage examples. Some extensions also have sample and/or required styles
configurable via custom properties.

### [Tip][]

Main features summary:

- Based on hover 'intent' and prevents redundant toggling or DOM thrashing.
- Re-use the same tip for a group of triggers to keep DOM light.
- Aware of available space surrounding the triggering element.
- Has a `snapTo` option to allow only following the mouse on one axis. The tip
  snaps to the trigger's edge on the other axis.

Short examples:

```js
let contextElement, tip;
contextElement = document.querySelector('.avatars');
// Tip will follow cursor.
tip = Tip.extend(contextElement.querySelectorAll('img[alt]'), { contextElement });

contextElement = document.querySelector('nav.bar');
// Tip will only follow along x axis.
tip = Tip.extend(contextElement.querySelectorAll('a[title]'), { snapTo: 'x', contextElement });

contextElement = document.querySelector('article');
// Tip will not follow.
tip = Tip.extend(contextElement.querySelectorAll('a[title]'), { snapTo: 'trigger', contextElement });
```

See [Tip's visual tests][] for more examples.

### [Media Grid][]

The `MediaGrid` extension, inspired by the Cargo Voyager design template, can
expand an item inline without affecting the position of its siblings. The
extension tries to add the minimal amount of DOM elements and styles. So the
layout rules are mostly defined in the styles, and initial html for items is
required (see the tests for an example). The extension also handles additional
effects like focusing on the expanded item and dimming its siblings.

Short examples:

```html
<div class="tiles">
  <div class="js-mg-item">
    <div class="mg-preview">...</div>
    <div class="mg-detail">...</div>
  </div>
  ...
</div>
```

```js
let mediaGrid = HLF.MediaGrid.extend(document.querySelector('.tiles'));
mediaGrid.createPreviewImagesPromise().then(mediaGrid.load, mediaGrid.load);
```

See [Media Grid's unit tests][] and [Media Grid's visual tests][] for more
examples.

### [Hover Intent][]

The `HoverIntent` extension normalizes DOM events associated with mouse enter
and leave interaction. It prevents the 'thrashing' of attached behaviors (ex:
non-cancel-able animations) when matching mouse input arrives at frequencies
past the threshold.

See [Hover Intent's visual tests][] for more examples.

### [Core][]

```js
  HLF.buildExtension(MyExtensionClass, {
    autoBind: true,
    autoListen: true,
    compactOptions: true,
    mixinNames: ['css', 'selection'],
  });
```

See [Core's unit tests][] for examples.

## Requirements

Browser version supporting ES2015 and CSS custom properties.

## Plugins Coming Soon

### Field

## Install

```bash
$ npm install hlf-dom-extensions
```

## Development [![devDependency Status](https://img.shields.io/david/dev/hlfcoding/hlf-dom-extensions.svg)](https://david-dm.org/hlfcoding/hlf-dom-extensions#info=devDependencies)

```bash
# to install
$ npm install

# to read some docs
$ grunt docs

# to start developing
$ grunt
```

## License

The MIT License (MIT)

Copyright (c) 2014-present Peng Wang


[UMD]: https://github.com/umdjs/umd
[annotated source code]: http://hlfcoding.github.io/hlf-dom-extensions/docs/index.html
[Tip]: http://hlfcoding.github.io/hlf-dom-extensions/docs/src/js/tip.html
[Tip's visual tests]: http://hlfcoding.github.io/hlf-dom-extensions/tests/tip.visual.html
[Media Grid]: http://hlfcoding.github.io/hlf-dom-extensions/docs/src/js/media-grid.html
[Media Grid's unit tests]: http://hlfcoding.github.io/hlf-dom-extensions/tests/media-grid.unit.html
[Media Grid's visual tests]: http://hlfcoding.github.io/hlf-dom-extensions/tests/media-grid.visual.html
[Core]: http://hlfcoding.github.io/hlf-dom-extensions/docs/src/js/core.html
[Core's unit tests]: http://hlfcoding.github.io/hlf-dom-extensions/tests/core.unit.html
[Hover Intent]: http://hlfcoding.github.io/hlf-dom-extensions/docs/src/js/hover-intent.html
[Hover Intent's visual tests]: http://hlfcoding.github.io/hlf-dom-extensions/tests/hover-intent.visual.html
