require.config
  baseUrl: '../lib'
  paths:
    hlf: '../dist'
    test: '../tests/js'

require [
  'jquery'
  'underscore'
  'test/base-visual'
  'hlf/jquery.hlf.media-grid'
], ($, _) ->
  'use strict'

  shouldRunVisualTests = $('#qunit').length is 0
  return false unless shouldRunVisualTests
  tests = []

  tests.push $.visualTest

    label: 'by default'
    template:
      _.range(12).reduce (t) ->
        t + """
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
        """
      , ''
    test: ($context) ->
      $context.mediaGrid()
      return

    anchorName: 'default'
    className: 'default-call'
    vars: _.pick $, 'loremIpsum'

  $ ->
    test() for test in tests
    return
