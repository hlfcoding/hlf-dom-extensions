###
HLF Tip Visual Tests
====================
###

# See [tests](../../../tests/tip.visual.html)

# Note that the sample logic in tests is in JavaScript (perhaps easier to
# understand than CoffeeScript) for your convenience.

require.config
  baseUrl: '../lib'
  paths:
    hlf: '../dist'
    test: '../tests/js'
  shim:
    TweenLite:
      exports: 'TweenLite'
    'jquery.gsap':
      deps: ['jquery', 'CSSPlugin', 'TweenLite']

# For performant animations, custom animators can be used. The below are
# examples of requiring GSAP and Velocity. Note Velocity does not provide a
# Promise shim and is annoyingly naive, so we must do it ourselves. See
# http://julian.com/research/velocity/#promises
animatorName = location.search.match(/\banimator=(\w+)\b/)?[1]
animatorName ?= 'jquery'
animatorDeps = switch animatorName
  when 'gsap' then ['jquery.gsap']
  when 'jquery' then []
  when 'velocity' then ['promise', 'velocity']

require [
  'jquery'
  'underscore'
].concat(animatorDeps, [
  'test/base-visual'
  'hlf/jquery.hlf.tip'
]), ($, _) ->

  shouldRunVisualTests = $('#qunit').length is 0
  return false unless shouldRunVisualTests
  tests = []

  # Some basic input binding for custom animator.
  $('.animator :radio').prop 'checked', no
    .filter("[value=#{animatorName}]").prop 'checked', yes
    .end().click -> location.search = "?animator=#{$(@).val()}"

  # To get back promises, Velocity's API actually requires additional work by
  # not directly correlating with jQuery's.
  if animatorName is 'velocity'
    `animator = {
      show: function($el, options) {
        $.Velocity('fadeIn', options).then(options.done, options.fail);
      },
      hide: function($el, options) {
        $.Velocity('fadeOut', options).then(options.done, options.fail);
      }
    };`

  # Default
  # -------
  # Basic test with the default settings. Basic tooltips are created and
  # accessed via `$.fn.tip`. Tip should entirely follow mouse. Tip size should
  # change when switching between links.
  tests.push $.visualTest

    label: "by default"
    template:
      """
      <p>
        <a class="trigger" title="link details" href="javascript:">tooltip trigger</a> &middot;
        <a class="trigger" title="<%= loremIpsum.short %>" href="javascript:">tooltip trigger</a> &middot;
        <a class="trigger" title="<%= loremIpsum.long %>" href="javascript:">tooltip trigger</a>
      </p>
      """
    test: ($context) ->
      # NOTE: Currently, the tip only parses content from the `title` and `alt`
      # attributes. This is limiting, but also conventional and easier to
      # maintain than a custom attribute.
      `$context.find('[title]').tip(null, $context);`
      # NOTE: `$context` also needs to be passed in. This is the core plugin
      # generator's convention where if the plugin instance is to be attached to
      # something besides the element(s) calling the method, it must be passed
      # in after the first argument (options or command).
      `api = $context.tip(null, $context);`

    anchorName: 'default'
    className: 'default-call'
    vars: _.pick $, 'loremIpsum'

  # Snapping Vertically
  # -------------------
  # Snapping tooltips are created and accessed via `$.fn.snapTip`. Options
  # related to snapping are in the `snap` option group. This one should snap to
  # an appropriate x position, along the trigger's most fitting edge (left or
  # right). In this case it should snap to the right and only be able to follow
  # the mouse along the y-axis.
  tests.push $.visualTest

    label: 'snapping with a list'
    template:
      """
      <ul class="list">
      <% _.range(1, count +1).forEach(function(i) { %>
        <li>
          <a class="trigger" title="This is list item <%= i %> in detail." href="javascript:">
            tooltip trigger
          </a>
        </li>
      <% }); %>
      </ul>
      """
    footerHtml:
      """
      <button name="list-append">load more</button>
      """
    test: ($context) ->
      `$context.find('[title]').snapTip({ snap: { toYAxis: true } }, $context);`

    anchorName: 'snapping-vertically'
    className: 'list-call'
    vars: { count: 3 }
    beforeTest: ($context) ->
      $.visualTest.setupAppendButton $context, '.list', ($newItem) ->
        # Minor logic to make titles dynamic.
        $trigger = $newItem.find '[title]'
        title = $trigger.attr('title').replace /\d/, $newItem.index() + 1
        $trigger.attr 'title', title

  # Snapping Horizontally
  # ---------------------
  # Change the flag from `toYAxis` to `toXAxis`, and this one should snap to
  # an appropriate y position, along the trigger's most fitting edge (top or bottom).
  tests.push $.visualTest

    label: 'snapping with a bar'
    template:
      """
      <nav class="bar">
      <% _.range(1, count +1).forEach(function(i) { %>
        <a class="trigger" href="#" title="This is bar item <%= i %> in detail.">
          tooltip trigger
        </a>
      <% }); %>
      </nav>
      """
    test: ($context) ->
      `$context.find('[title]').snapTip({ snap: { toXAxis: true } }, $context);`

    anchorName: 'snapping-horizontally'
    className: 'bar-call'
    vars: { count: 3 }

  # A Model Use Case
  # ----------------
  # The above examples could suffice with Bootstrap tooltip or others. Snapping
  # and shifting without redundantly toggling appearance really makes a
  # difference when hovering over a grid of small individual content pieces, ie.
  # avatar images.
  tests.push $.visualTest

    label: 'snapping with a grid'
    template:
      """
      <ul class="grid">
      <% _.range(1, count +1).forEach(function(i) { %>
        <li>
          <img src="resources/avatar.png" alt="This is avatar <%= i %> in detail.">
        </li>
      <% }); %>
      </ul>
      """
    test: ($context) ->
      `$context.find('[alt]').snapTip({
        snap: { toXAxis: true },
        animations: { hide: { delay: 400 } }
      }, $context);`

    anchorName: 'a-model-use-case'
    className: 'grid-call'
    vars: { count: 24 }

  # Corner Cases
  # ------------
  # Base tips also anchor themselves to the trigger based on available space.
  # Here we also use snap-tip without the axis flags from before to lock the tip
  # into place and prevent mouse following.
  tests.push $.visualTest

    template:
      """
      <a class="trigger top right" title="<%= loremIpsum.short %>" href="javascript:">
        top right corner
      </a>
      <a class="affixed trigger bottom left" title="<%= loremIpsum.short %>" href="javascript:">
        bottom left corner
      </a>
      <a class="affixed trigger bottom right" title="<%= loremIpsum.short %>" href="javascript:">
        bottom right corner
      </a>
      """
    test: ($fragments) -> `$fragments.snapTip();`

    anchorName: 'corner-cases'
    asFragments: yes
    className: 'edge-call'
    vars: _.pick $, 'loremIpsum'

  $ -> test() for test in tests
