# HLF jQuery Library

[![Build Status](https://img.shields.io/travis/hlfcoding/hlf-jquery.svg)](https://travis-ci.org/hlfcoding/hlf-jquery)
[![Package](https://img.shields.io/npm/v/hlf-jquery.svg?style=flat)](https://www.npmjs.com/package/hlf-jquery)
[![Code Climate](https://codeclimate.com/github/hlfcoding/hlf-jquery/badges/gpa.svg)](https://codeclimate.com/github/hlfcoding/hlf-jquery)
![GitHub License](https://img.shields.io/github/license/hlfcoding/hlf-jquery.svg)

<pre>
 __         __       ___
/\ \       /\ \     / __\
\ \ \___   \ \ \   /\ \_/_
 \ \  __`\  \ \ \  \ \  __\
  \ \ \ \ \  \ \ \  \ \ \_/
   \ \_\ \_\  \ \_\  \ \_\
    \/_/ /_/   \/_/   \/_/
</pre>

jQuery extensions and plugins for quality UI and implemented following best
practices. The [annotated source code][] is also available and include
documented examples.

All modules have scoped debug flags, jQuery namespaces, and no-conflict support
with jQuery. They are exported using [UMD]() and work with AMD, Browserify, or
plain.

## Plugins

All plugins should have test pages with documented source. Please use them as
usage examples. Plugins should also have sample styles, and some have required
styles. When possible, styles are made customizeable as SCSS mixins.

### [HLF Tip][]

Main features summary:

- Based on hover 'intent' and prevents redundant toggling or DOM thrashing.
- Re-use the same tip for a group of triggers to keep DOM light.
- Aware of available space surrounding the triggering element.
- Configurable animator, so opting out of non-GPU jQuery animations is easy.
- Has an extended, 'snapping' version that only follows the mouse on one axis.
  The tip snaps to the trigger's edge on the other axis.

Short examples:

```js
$('.avatars').find('img[alt]').tip(); // Tips will follow cursor.
$('nav.bar').find('a[title]').snapTip({
  snap: { toXAxis: true } // Tips will only follow along x axis.
});
$('article').find('a[title]').snapTip(); // Tip will not follow.
```

See [Tip's visual tests][] for more examples.

## Extensions

All extensions should be covered by QUnit tests.

### [HLF Core][]

Main features:

- Generate jQuery plugin methods from plugin definitions.
- Helpers to create mixins that can be used for plugin API.
- Provide no-conflict support.

See [Core's unit tests][] for examples.

### [HLF Event][]

Main features:

- Hover-intent provides rate-limited versions of mouseenter and mouseleave 
  events through a customizable delay.

## Requirements

Only other required dependency is UnderscoreJS. Modernizr is a suggested
dependency for true feature detection. Other Bower dependencies are for tests
and demos.

Styling is released as mainly Sass modules for you to import into your own SCSS.
Unfortunately, there are no plans for LESS support. Also for now, vendor-
prefixing is left to the build layer, so you're encouraged to select an auto-
prefixing solution.

## Plugins Coming Soon

### HLF Editable

Main features:

- Uses mixins for encapsulate editing behaviors, so plugin instances can be
  composed based on data-attribute configuration. 
- Attempts to wrap abstract away vendor APIs (for example, CodeMirror vs ACE).

## Install

```bash
your-project> bower install hlf-jquery
```

## Development [![devDependency Status](https://img.shields.io/david/dev/hlfcoding/hlf-jquery.svg)](https://david-dm.org/hlfcoding/hlf-jquery#info=devDependencies)

```bash
# to install
$ gem install -N sass # for grunt-contrib-sass
$ npm install

# to run some tests first
$ grunt test

# to read some docs
$ grunt docs

# to start developing
$ grunt
```

Note that Grunt task options and multi-tasks are in build/.

## License

The MIT License (MIT)

Copyright (c) 2014-present Peng Wang


[UMD]: https://github.com/umdjs/umd
[annotated source code]: http://hlfcoding.github.io/hlf-jquery/docs/index.html
[HLF Tip]: http://hlfcoding.github.io/hlf-jquery/docs/src/js/jquery.hlf.tip.html
[Tip's visual tests]: http://hlfcoding.github.io/hlf-jquery/tests/tip.visual.html
[HLF Core]: http://hlfcoding.github.io/hlf-jquery/docs/src/js/jquery.extension.hlf.core.html
[Core's unit tests]: http://localhost/hlf-jquery/tests/core.unit.html
[HLF Event]: http://hlfcoding.github.io/hlf-jquery/docs/src/js/jquery.extension.hlf.event.html
[HLF Editable]: http://hlfcoding.github.io/hlf-jquery/docs/src/js/jquery.hlf.editable.html
[Editable's visual tests]: http://hlfcoding.github.io/hlf-jquery/tests/editable.visual.html
