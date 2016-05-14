
/*
Unit Test Helpers
=================
This is a developer-level extension for writing unit tests. Plugin users need
not read further.
 */

(function() {
  define(['jquery', 'underscore'], function($, _) {
    'use strict';
    if (window.QUnit == null) {
      return false;
    }
    QUnit.extend(QUnit.assert, {
      hasFunctions: function(object, names, message) {
        var result;
        result = _.chain(object).functions().intersection(names).size().isEqual(names.length).value();
        return this.pushResult({
          result: result,
          actual: result,
          expected: true,
          message: message
        });
      },
      hasOwnProperties: function(object, names, message) {
        var result;
        result = _.chain(object).keys().intersection(names).size().isEqual(names.length).value();
        return this.pushResult({
          result: result,
          actual: result,
          expected: true,
          message: message
        });
      }
    });
    QUnit.testStart((function(_this) {
      return function(details) {
        console.log('');
      };
    })(this));
    QUnit.log((function(_this) {
      return function(details) {
        if (details.result === true) {
          console.log('\x1b[32m', "✔ " + details.message);
          return;
        }
        console.log('\x1b[31m', ("✘ " + details.message) + (" -- Expected: " + details.expected + ", actual: " + details.actual + "."));
      };
    })(this));
    return true;
  });

}).call(this);

//# sourceMappingURL=base.js.map
