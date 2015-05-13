
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
    var shouldRunVisualTests;
    shouldRunVisualTests = $('#qunit').length === 0;
    if (shouldRunVisualTests) {
      $(function() {});
    } else {
      QUnit.module('other');
      QUnit.test('exports', function(assert) {
        return assert.ok(hlf, 'Namespace should exist.');
      });
      QUnit.test('noConflict', function(assert) {
        assert.ok($.createPlugin, 'Method shortcut for createPlugin should exist.');
        hlf.noConflict();
        assert.strictEqual($.createPlugin, void 0, 'Method shortcut for createPlugin should be back to original value.');
        return assert.ok(hlf.createPlugin, 'Original method for createPlugin should still exist.');
      });
      QUnit.start();
    }
    return true;
  });

}).call(this);
