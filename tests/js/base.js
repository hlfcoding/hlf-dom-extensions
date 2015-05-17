
/*
Unit Test Helpers
=================
This is a developer-level extension for writing unit tests. Plugin users need
not read further.
 */

(function() {
  define(['jquery', 'underscore'], function($, _) {
    QUnit.extend(QUnit.assert, {
      hasFunctions: function(object, names, message) {
        var actual, expected, result;
        result = _.chain(object).functions().intersection(names).size().isEqual(names.length).value();
        return QUnit.push(result, (actual = result), (expected = true), message);
      },
      hasOwnProperties: function(object, names, message) {
        var actual, expected, result;
        result = _.chain(object).keys().intersection(names).size().isEqual(names.length).value();
        return QUnit.push(result, (actual = result), (expected = true), message);
      }
    });
    return true;
  });

}).call(this);

//# sourceMappingURL=base.js.map
