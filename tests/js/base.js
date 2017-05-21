//
// Test Helpers
// ============
// This is a developer-level module for writing tests. Extension users need
// not read further.
//
define(function() {
  'use strict';

  let namespace = {};

  if (!window.QUnit) { return namespace; }
  //
  // Reporting
  // ---------
  //
  QUnit.testStart(function(details) {
    console.log(''); // For grunt-contrib-qunit.
  });

  QUnit.log(function(details) {
    if (details.result) {
      console.log('\x1b[32m', `✔ ${details.message}`);
      return;
    }
    console.log('\x1b[31m', `✘ ${details.message}` +
      ` -- Expected: ${details.expected}, actual: ${details.actual}.`);
  });

  return namespace;
});
