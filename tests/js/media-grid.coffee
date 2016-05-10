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

  if window.QUnit?
    {module, test} = QUnit

    module 'hlf.mediaGrid',
      beforeEach: ->
        @mg = $ """
          <div>
            <div class="js-mg-item"></div>
            <div class="js-mg-item"></div>
            <div class="js-mg-item"></div>
          </div>
          """
          .mediaGrid().mediaGrid()
  
    test '#_updateMetrics', (assert) ->
      {$el, $items} = @mg
      $el.add($items).css boxSizing: 'border-box'
      $el.css width: 620, padding: 10
      $items.css marginRight: 10, padding: 9, borderWidth: 1, width: 200, height: 200
      @mg._updateMetrics(on)
      assert.strictEqual @mg.metrics.gutter, 10,
        'It calculates gutter based on item margin sizes.'
      assert.strictEqual @mg.metrics.itemWidth, 200,
        "It uses the item's 'outerWidth' as item width."
      assert.strictEqual @mg.metrics.rowSize, 2,
        'It calculates row size based on item and wrap sizes.'
      assert.strictEqual @mg.metrics.colSize, 2,
        'It calculates column size based on row size.'

      $el.css width: 630
      @mg._updateMetrics(on)
      assert.strictEqual @mg.metrics.rowSize, 3,
        'It calculates row size based on item and wrap sizes.'
      assert.strictEqual @mg.selectByClass('sample').length, 1,
        'It cleans up after multiple hard updates.'
      return

    QUnit.start()
    return

  tests = []

  tests.push $.visualTest

    label: 'by default'
    template:
      """
      <div class="test-body">
      <% _.range(12).forEach(function() { %>
        <article class="js-mg-item">
          <section class="preview">
            <img src="http://placehold.it/200x134/888/aaa" alt="preview thumbnail" class="thumb" />
            <hgroup>
              <h1 class="title"><%= loremIpsum.title %></h1>
              <h2 class="date">July 14, 2012</h2>
            </hgroup>
            <ul class="tags">
              <li>foo</li>
              <li>bar</li>
              <li>baz</li>
            </ul>
          </section>
          <section class="detail">
            <img src="http://placehold.it/418x270/888/aaa" alt="main banner" class="banner" />
            <hgroup>
              <h1 class="title"><%= loremIpsum.title %></h1>
              <h2 class="date">July 14, 2012</h2>
            </hgroup>
            <p class="body"><%= loremIpsum.short %></p>
            <ul class="tags">
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
