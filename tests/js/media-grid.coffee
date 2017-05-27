###
HLF Media Grid Visual Tests
===========================
###

# [Page](../../../tests/media-grid.visual.html) | [Source](../../src/js/jquery.hlf.media-grid.html)

require.config
  baseUrl: '../lib'
  paths:
    hlf: '../dist'
    test: '../tests/js'

require [
  'jquery'
  'underscore'
  'test/base'
  'test/base-visual'
  'hlf/jquery.hlf.media-grid'
], ($, _) ->
  'use strict'

  # If the context is QUnit, run any unit tests. In most cases, an API class
  # instance still requires some HTML fragments, and even temporarily attaching
  # them to the DOM.
  if window.QUnit?
    {module, test} = QUnit

    module 'hlf.mediaGrid',
      beforeEach: ->
        @mg = $ """
          <div>
            <div>
              <div class="js-mg-item"></div>
              <div class="js-mg-item"></div>
              <div class="js-mg-item"></div>
            </div>
          </div>
          """
          .appendTo('body') # Required for 'auto' width.
          .children('div').mediaGrid().mediaGrid()

      afterEach: ->
        @mg.$el.parent().remove()

    test '#_updateMetrics', (assert) ->
      {$el, $items} = @mg
      $el.add($items).css boxSizing: 'border-box'
      $el.css padding: 10

      $el.parent().css width: 610
      $items.css marginRight: 10, padding: 9, borderWidth: 1, width: 200, height: 200
      @mg._updateMetrics on
      assert.strictEqual @mg.metrics.gutter, 10,
        'It calculates gutter based on item margin sizes.'
      assert.strictEqual @mg.metrics.itemWidth, 200,
        "It uses the item's 'outerWidth' as item width."
      assert.strictEqual @mg.metrics.rowSize, 2,
        'It calculates row size based on item and wrap sizes.'
      assert.strictEqual @mg.metrics.colSize, 2,
        'It calculates column size based on row size.'

      $el.parent().css width: 620
      @mg._updateMetrics on
      assert.strictEqual @mg.metrics.rowSize, 3,
        'It calculates row size based on item and wrap sizes.'
      assert.strictEqual @mg.selectByClass('sample').length, 1,
        'It cleans up after multiple hard updates.'
      return

    QUnit.start()
    return yes

  # Setup visual tests. Tests are decorated closures queued and run on document-
  # ready. Note that the sample logic in tests is in JavaScript (perhaps easier to
  # understand than CoffeeScript) for your convenience.
  tests = []

  # Default
  # -------
  # Basic test with the default settings and all content extras. `MediaGrid`
  # instance is created and accessed via `$.fn.mediaGrid`. Item content markup
  # can be customized as fit.
  tests.push $.visualTest

    label: 'by default'
    template:
      """
      <div class="test-body mg-item-extras">
      <% _.range(12).forEach(function() { %>
        <article class="js-mg-item">
          <section class="mg-preview">
            <img src="http://placehold.it/200x134/888/aaa" alt="preview thumbnail" />
            <hgroup>
              <h1 class="mg-title"><%= loremIpsum.title %></h1>
              <h2 class="mg-date">July 14, 2012</h2>
            </hgroup>
            <ul class="mg-tags">
              <li>foo</li>
              <li>bar</li>
              <li>baz</li>
            </ul>
          </section>
          <section class="mg-detail">
            <img src="http://placehold.it/418x270/888/aaa" alt="main banner" />
            <hgroup>
              <h1 class="mg-title"><%= loremIpsum.title %></h1>
              <h2 class="mg-date">July 14, 2012</h2>
            </hgroup>
            <p><%= loremIpsum.short %></p>
            <ul class="mg-tags">
              <li>foo</li>
              <li>bar</li>
              <li>baz</li>
            </ul>
          </section>
        </article>
      <% }) %>
      </div>
      """
    test: ($context) ->
      `var mg = $context.find('.test-body').mediaGrid().mediaGrid();
      _.delay(function() { mg.trigger('ready'); }, 500);` # Better to use imagesLoaded.
      return

    anchorName: 'default'
    className: 'default-call'
    vars: _.pick $, 'loremIpsum'

  $ ->
    test() for test in tests
    return

  yes
