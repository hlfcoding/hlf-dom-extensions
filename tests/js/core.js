
/*
HLF Core Unit Tests
===================
Offloads testing larger corer components to other test modules.
 */

(function() {
  require.config({
    baseUrl: '../lib',
    paths: {
      hlf: '../dist',
      test: '../tests/js'
    }
  });

  require(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core', 'test/base', 'test/core.mixin', 'test/core.plugin'], function($, _, hlf) {
    'use strict';
    var module, test;
    module = QUnit.module, test = QUnit.test;
    module('other');
    test('exports', function(assert) {
      assert.ok(hlf, 'Namespace should exist.');
    });
    test('noConflict', function(assert) {
      assert.ok($.createPlugin, 'Method shortcut for createPlugin exists by default, w/o noConflict.');
      hlf.noConflict();
      assert.strictEqual($.createPlugin, void 0, 'After call, method shortcut for createPlugin is back to old value.');
      assert.ok(hlf.createPlugin, 'After call, original method for createPlugin still exists.');
    });
    QUnit.start();
    return true;
  });

}).call(this);

//# sourceMappingURL=core.js.map
