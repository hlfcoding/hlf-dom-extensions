(function() {
  define(['jquery', 'underscore'], function($, _) {
    return QUnit.extend(QUnit.assert, {
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
  });

}).call(this);
