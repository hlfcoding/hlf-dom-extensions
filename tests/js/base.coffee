define [
  'jquery'
  'underscore'
], ($, _) ->

  # Unit Test Helpers
  # -----------------

  QUnit.extend QUnit.assert,

    hasFunctions: (object, names, message) ->
      result = _.chain object
        .functions().intersection names
        .size().isEqual names.length
        .value()
      QUnit.push result, (actual = result), (expected = yes), message

    hasOwnProperties: (object, names, message) ->
      result = _.chain object
        .keys().intersection names
        .size().isEqual names.length
        .value()
      QUnit.push result, (actual = result), (expected = yes), message

  yes
