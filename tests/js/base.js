//
// Test Helpers
// ============
// This is a developer-level module for writing tests. Extension users need
// not read further.
//
define(function() {
  'use strict';
  //
  // Reporting
  // ---------
  //
  if (window.QUnit) {
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
    return;
  }
  //
  // __createVisualTest__ returns a configured test function generator. Tests
  // should be invoked tests on document ready. Configuration:
  //
  // - `label` - header text describing the test topic.
  // - `anchorName` - for the section on its docs page, used to generate `docsUrl`.
  // - `asFragments` - will render the test differently, directly inside `<body>`.
  // - `className` - a hook for any custom css.
  // - `footerHtml` - optional html for controls for additional testing.
  //
  // It will:
  // 1. Ensure config.
  // 2. Build test template vars.
  // 3. Render test to get test context (or fragments).
  // 4. Run tests.
  //
  // It also includes helpers for additional setup. `setupAppendButton` inits a
  // button for appending an item to a list, and should be included as part of
  // `footerHtml`.
  //
  function createVisualTest(config) {
    return function() {
      const {
        asFragments, anchorName, beforeTest, className, label, template, test
      } = config;
      let { footerHtml, vars } = config;
      if (!asFragments) {
        footerHtml = footerHtml || '';
      }
      vars = vars || {};
      let docsUrl = document.querySelector('body > header [data-rel=docs]').href;
      docsUrl += `#${anchorName}`;
      let html = template(vars);
      let containerElement = asFragments ? document.body : document.getElementById('main');
      let opts;
      if (asFragments) {
        opts = { template: (vars => vars.html) };
      }
      let testElement = renderVisualTest(containerElement,
        { className, docsUrl, footerHtml, html, label }, opts
      );
      if (asFragments) {
        if (className) {
          containerElement.classList.add(className);
        }
        testElement.classList.add('visual-test-fragment');
      }
      if (beforeTest) {
        beforeTest(testElement);
      }
      test(testElement);
    };
  }
  Object.assign(createVisualTest, {
    setupAppendButton(testElement, listSelector, updateItem) {
      let listElement = testElement.querySelector(listSelector);
      let itemElement = listElement.lastChild.cloneNode(true);
      testElement.querySelector('[name=list-append]').addEventListener('click', () => {
        let newElement = itemElement.cloneNode();
        listElement.appendChild(newElement);
        if (updateItem) {
          updateItem(newElement);
        }
      });
    }
  });
  //
  // __renderVisualTest__ is a simple method for an element to render and
  // append a test. Only provide a custom template if absolutely needed.
  //
  function renderVisualTest(containerElement, vars, opts) {
    var $test;
    if (opts == null) {
      opts = {};
    }
    let { template } = Object.assign({}, renderVisualTest.defaults, opts);
    let templateElement = document.createElement('template');
    templateElement.innerHTML = template(vars);
    let testElement = templateElement.content.firstChild;
    containerElement.appendChild(testElement);
    return testElement;
  }
  renderVisualTest.defaults = {
    template: (vars) => {
      const { className, docsUrl, footerHtml, html, label } = vars;
      return (
`<section class="${className} visual-test">
  <header>
    <span class="label">${label}</span>
    <a data-rel="docs" href="${docsUrl}">docs</a>
  </header>
  ${html}
  <footer>${footerHtml}</footer>
</section>`
      );
    }
  };
  const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed " +
    "do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim " +
    "ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip " +
    "ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate " +
    "velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat " +
    "cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id " +
    "est laborum.";
  const placeholderText = {
    long: loremIpsum,
    short: loremIpsum.slice(0, 200),
    title: loremIpsum.slice(0, 26)
  };

  return { createVisualTest, placeholderText, renderVisualTest };
});
