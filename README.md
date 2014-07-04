# HLF jQuery Library [![Build Status](https://travis-ci.org/hlfcoding/hlf-jquery.svg?branch=master)](https://travis-ci.org/hlfcoding/hlf-jquery)

jQuery extensions and plugins for quality UI. All modules have scoped debug
flags, jQuery namespaces, and no-conflict support with jQuery. All modules have
AMD-compatible versions, so you can pick and choose what to use. The only other
hard dependencies is UnderscoreJS. RequireJS is suggested. Other dependencies
(see Bower file) are for tests and demos.

The [annotated source code][] is also available.

## Extensions

All extensions should have test pages.

### Core

Main features:

- Generate jQuery plugin methods from plugin definitions.
- Helpers to create mixins that can be used for plugin API.
- Provide no-conflict support.

### Event

Main features:

- Hover-intent provides rate-limited versions of mouseenter and mouseleave 
  events through a customizable delay.

## Plugins

All plugins should have test pages and sample styles. Some plugins may have
required styles. When possible, styles are made customizeable as SCSS mixins.

### HLF Tip

A [visual test for Tip][] is available.

Main features:

- Uses custom hover intent events that allow for custom delays.
- Re-use the same tip for a group of triggers.
- Has a snapping extension that allows snapping to the trigger or tracking in
  either direction.

Additional features:

- Sample styling that draws tip stems with CSS borders.
- Detailed API.

Example:

```javascript
$('.article-1').find('a[title]').tip(); // Tips will follow cursor.
$('.article-2').find('a[title]').snapTip(); // Tips will remain affixed.
```

See visual tests for more examples.

### HLF Editable

A [(WIP) visual test for Editable][] is available.

Main features:

- Uses mixins for encapsulate editing behaviors, so plugin instances can be
  composed based on data-attribute configuration. 
- Attempts to wrap abstract away vendor APIs (for example, CodeMirror vs ACE).

## Development

Start off with `npm install`.

### Grunt Tasks

- Use `grunt` to start developing.
- Use `grunt dist` to build.
- Use `grunt docs` to generate Groc documentation.
- Use `grunt test` to test.

### Sample ST2 Project File

```json
{
  "folders":
  [
    {
      "path": "<projects>",
      "file_exclude_patterns":
      [
        "dist/*",
        "docs/*",
        "jquery/tests/*.css",
        "jquery/tests/*.js"
      ]
    }
  ]
}
```

## License

The MIT License (MIT)

    Copyright (c) 2014 Peng Wang

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

[annotated source code]: http://hlfcoding.github.io/hlf-jquery/docs/index.html
[visual test for Tip]: http://hlfcoding.github.io/hlf-jquery/tests/tip.visual.html
[(WIP) visual test for Editable]: http://hlfcoding.github.io/hlf-jquery/tests/editable.visual.html
