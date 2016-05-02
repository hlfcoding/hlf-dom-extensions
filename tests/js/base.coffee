###
Unit Test Helpers
=================
This is a developer-level extension for writing unit tests. Plugin users need
not read further.
###

define [
  'jquery'
  'underscore'
], ($, _) ->
  'use strict'

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
