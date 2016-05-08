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
      @pushResult { result, actual: result, expected: yes, message }

    hasOwnProperties: (object, names, message) ->
      result = _.chain object
        .keys().intersection names
        .size().isEqual names.length
        .value()
      @pushResult { result, actual: result, expected: yes, message }

  # Reporting
  # ---------

  QUnit.testStart (details) =>
    console.log '' # For grunt-contrib-qunit.
    return

  QUnit.log (details) =>
    if details.result is yes
      console.log '\x1b[32m', "✔ #{details.message}"
      return
    console.log '\x1b[31m', "✘ #{details.message}" +
      " -- Expected: #{details.expected}, actual: #{details.actual}."
    return

  yes
