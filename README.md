# HLF jQuery Library [![Build Status](https://travis-ci.org/hlfcoding/hlf-jquery.svg?branch=master)](https://travis-ci.org/hlfcoding/hlf-jquery) ![Bower Version](https://img.shields.io/bower/v/hlf-jquery.svg)

jQuery extensions and plugins for quality UI and implemented following best
practices. The [annotated source code][] is also available and include
documented examples.

All modules have scoped debug flags, jQuery namespaces, and no-conflict support
with jQuery. They are exported using [UMD]() and work with AMD, Browserify, or
plain. Only other dependency is UnderscoreJS. Other Bower dependencies are for
tests and demos.

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
$('article').find('a[title]').snapTip() // Tip will not follow.
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

## Development

```bash
hlf-jquery> npm install

# to run some tests first
hlf-jquery> grunt dist test

# to read some docs
hlf-jquery> grunt docs

# to start developing
hlf-jquery> grunt 
```

Note that Grunt task options and multi-tasks are in build/.

### Sample ST2 Project File

```json
{
  "folders":
  [
    {
      "path": "hlf-jquery",
      "file_exclude_patterns":
      [
        "dist/*",
        "docs/*",
        "release/*",
        "tests/*.css",
        "tests/*.js"
      ]
    }
  ]
}
```

## License

The MIT License (MIT)

    Copyright (c) 2014-2015 Peng Wang

    Permission is hereby granted, free of charge, to any person obtaining a
    copy of this software and associated documentation files (the "Software"),
    to deal in the Software without restriction, including without limitation
    the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
    DEALINGS IN THE SOFTWARE.

[UMD]: https://github.com/umdjs/umd
[annotated source code]: http://hlfcoding.github.io/hlf-jquery/docs/index.html
[HLF Tip]: http://hlfcoding.github.io/hlf-jquery/docs/src/js/jquery.hlf.tip.html
[Tip's visual tests]: http://hlfcoding.github.io/hlf-jquery/tests/tip.visual.html
[HLF Core]: http://hlfcoding.github.io/hlf-jquery/docs/src/js/jquery.extension.hlf.core.html
[Core's unit tests]: http://localhost/hlf-jquery/tests/core.unit.html
[HLF Event]: http://hlfcoding.github.io/hlf-jquery/docs/src/js/jquery.extension.hlf.event.html
[HLF Editable]: http://hlfcoding.github.io/hlf-jquery/docs/src/js/jquery.hlf.editable.html
[Editable's visual tests]: http://hlfcoding.github.io/hlf-jquery/tests/editable.visual.html
