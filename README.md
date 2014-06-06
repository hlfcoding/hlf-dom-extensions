# HLF jQuery Library [![Build Status](https://travis-ci.org/hlfcoding/hlf-jquery.svg?branch=master)](https://travis-ci.org/hlfcoding/hlf-jquery)

jQuery extensions and plugins for quality UI. All modules have scoped debug flags, jQuery namespaces, and no-conflict support with jQuery.

Bower support forthcoming. For now, use `npm install && grunt dist` to build.

[Annotated source code is available.](docs/index.html)

## Extensions

All extensions have AMD-compatible versions.

### Core

Main features:

- Generate jQuery plugin methods from plugin definitions.
- Provide no-conflict support.

### Event

Main features:

- Hover-intent provides rate-limited versions of mouseenter and mouseleave events through a customizable delay.

## Plugins

All plugins have test pages and sample styles.

### HLF Tip

[Test is available.](tests/tip.visual.html)

Main features:

- Uses custom hover intent events that allow for custom delays.
- Re-use the same tip for a group of triggers.
- Has a snapping extension that allows snapping to the trigger or tracking in either direction.

Additional features:

- Sample styling that draws tip stems with CSS borders.
- Detailed API.

View the examples.

## Development

Start off with `npm install`.

### Grunt Tasks

Use `grunt` to start developing.

Use `grunt docs` to generate Groc documentation.

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
