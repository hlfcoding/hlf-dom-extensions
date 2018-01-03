# HLF DOM Extensions Documentation

## Navigation

Use the 'Table of Contents' on the right to navigate. Pages are organized as
they are in the project's file structure. You can use search to quickly
navigate, for example query 'Tip' to find all tip-related documentation.

You'll also find links in the source files for the corresponding test files, and
vice versa, since the tests also serve as usage examples for the source.

## Generation

The docs use [Groc](http://nevir.github.io/groc) and are generated via:

```bash
grunt docs
```

## Conventions

For extension JS, the [UMD](https://github.com/umdjs/umd) pattern is:

- When AMD, register the attacher as an anonymous module.
- When Node or Browserify, set module exports to the attach result.
- When browser globals (root is window), Just run the attach function.

```js
(function(root, attach) {
  if (typeof define === 'function' && define.amd) {
    define(['hlf/core'], attach);
  } else if (typeof exports === 'object') {
    module.exports = attach(require('hlf/core'));
  } else {
    attach(HLF);
  }
})(this, function(HLF) {
  return Extension;
});
```
