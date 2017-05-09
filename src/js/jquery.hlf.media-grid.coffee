###
HLF Media Grid jQuery Plugin
============================
###

# [Styles](../css/jquery.hlf.media-grid.html) | [Tests](../../tests/js/media-grid.html)

# The `mediaGrid` plugin, inspired by the Cargo Voyager design template, allows
# expanding an item inline without affecting the position of its siblings. The
# plugin tries to add the minimal amount of DOM elements and styles. So the
# layout rules are mostly defined in the styles, and initial html for items is
# required (see the tests for an example). The plugin also handles additional
# effects like focusing on the expanded item and dimming its siblings.

# § __UMD__
# - When AMD, register the attacher as an anonymous module.
# - When Node or Browserify, set module exports to the attach result.
# - When browser globals (root is window), Just run the attach function.
((root, attach) ->
  if typeof define is 'function' and define.amd?
    define [
      'jquery'
      'underscore'
      'hlf/jquery.extension.hlf.core'
    ], attach
  else if typeof module is 'object' && module.exports?
    module.exports = attach(
      require 'jquery',
      require 'underscore',
      require 'hlf/jquery.extension.hlf.core'
    )
  else
    attach jQuery, _, jQuery.hlf
  return
)(@, ($, _, hlf) ->

  # Namespace
  # ---------

  # It takes some more boilerplate to write the plugins. Any of this additional
  # support API is put into a plugin specific namespace under `$.hlf`, which in
  # this case is __$.hlf.mediaGrid__.
  #
  # - __debug__ toggles debug logging for all instances of a plugin.
  # - __toString__ helps to namespace when extending any jQuery API.
  #
  # The plugin's __defaults__ are available as reference. Also note that _the
  # plugin instance gets extended with the options_.
  #
  # - __autoReady__ is `false` by default, as recommended. Turning it on means
  #   the `ready` event gets triggered immediately, synchronously, and is only
  #   recommended if your grid doesn't have images and such that require a wait
  #   before being fully loaded and sized.
  #
  # - __resizeDelay__ is the millis to wait for window resizing to stop before
  #   doing a re-layout. `100` is the default to balance responsiveness and
  #   performance.
  #
  # - Note: for these tip plugins, the majority of presentation state logic is
  #   in the plugin stylesheet. We update the presentation state by using
  #   namespaced __classNames__ generated in a closure.
  #
  hlf.mediaGrid =
    debug: off
    toString: _.memoize (context) ->
      switch context
        when 'event'  then '.hlf.mg'
        when 'data'   then 'hlf-mg'
        when 'class'  then 'js-mg'
        else 'hlf.mg'

    defaults: do (pre = 'js-mg-') ->
      autoReady: off
      resizeDelay: 100
      undimDelay: 1000
      classNames: do ->
        classNames = {}
        keys = [
          'item', 'sample'
          'transitioning', 'expanded', 'dimmed', 'focused', 'ready'
        ]
        (classNames[key] = "#{pre}#{key}") for key in keys
        classNames

  # MediaGrid
  # ---------
  class MediaGrid
    # __constructor__ keeps `$el` as property. `options` is further normalized.
    constructor: (@$el, options) ->

    # __init__ completes the setup:
    # 1. Select `$items` and `$sampleItem`.
    # 2. Get `expandDuration` from styles, create event bindings for expansion.
    #    This also relies on the `$expandedItem` state.
    # 3. Create event bindings for dimming on expansion, hovering expanded item.
    # 4. Set up initial layout for running when `ready`.
    # 5. Set up re-layout for running on window resize.
    init: ->
      @$items ?= @selectByClass 'item'
      @$sampleItem = @$items.first()

      @expandDuration = 1000 * parseFloat @$sampleItem.css('transition-duration')
      @$items.on 'click', (e) =>
        @toggleItemExpansion $(e.currentTarget)
        return

      @$expandedItem = null
      @on
        mouseenter: (e) =>
          @toggleExpandedItemFocus $(e.currentTarget), on
          return
        mouseleave: (e) =>
          @toggleExpandedItemFocus $(e.currentTarget), off
          return
        expand: (e, expanded) =>
          @toggleItemFocus $(e.currentTarget), expanded, @expandDuration
          return
      , ".#{@classNames.item}"
      @on 'mouseleave', =>
        @toggleItemFocus @$expandedItem, off, 0 if @$expandedItem?
        return

      @metrics = {}
      @on 'ready', =>
        @_updateMetrics()
        @_layoutItems()
        @$el.addClass @classNames.ready
        return
      @trigger 'ready' if @autoReady is on

      $(window).resize _.debounce( =>
        @_updateMetrics off
        if @$expandedItem?
          @toggleItemExpansion @$expandedItem, off
          @_reLayoutItems @expandDuration
        else
          @_reLayoutItems()
        return
      , @resizeDelay)
      return

    # § __Public__
    #
    # You are welcome to call these methods from your own code, though currently
    # there is no intended use case for that.

    # __toggleItemExpansion__ basically toggles the `-expanded` class on the
    # given `$item` to `expanded` and triggers the `expand.` event. To allow
    # styling or scripting during the transition, it adds the `-transitioning`
    # class and removes it afterwards per `expandDuration`.
    toggleItemExpansion: ($item, expanded) ->
      expanded ?= not $item.hasClass @classNames.expanded
      if expanded
        @toggleItemExpansion @$expandedItem, off if @$expandedItem?
        i = $item.index()
        if @_isRightEdgeItem(i) then @_adjustItemToRightEdge $item
        if @_isBottomEdgeItem(i) then @_adjustItemToBottomEdge $item

      $item.addClass @classNames.transitioning
      clearTimeout $item.data(@attr('expand-timeout'))
      $item.data @attr('expand-timeout'), (setTimeout =>
        $item.removeClass(@classNames.transitioning); return
      , @expandDuration)

      $item.toggleClass @classNames.expanded, expanded
      @$expandedItem = if expanded then $item else null

      $item.trigger @evt('expand'), [expanded]
      return

    # __toggleExpandedItemFocus__ wraps `toggleItemFocus` to factor in
    # `undimDelay` when toggling off `focus`. Focusing dims without delay.
    toggleExpandedItemFocus: ($item, focused) ->
      return unless $item?.hasClass @classNames.expanded
      delay = if focused then 0 else @undimDelay
      @toggleItemFocus $item, focused, delay
      return

    # __toggleItemFocus__ basically toggles the `-focused` class on the given
    # `$item` to `focused` and the `-dimmed` class on the root element after any
    # given `delay`.
    toggleItemFocus: ($item, focused, delay) ->
      @$items.removeClass @classNames.focused if focused
      $item.toggleClass @classNames.focused, focused
      clearTimeout @_dimTimeout
      @_dimTimeout = setTimeout =>
        @$el.toggleClass @classNames.dimmed, focused
        return
      , delay
      return

    # § __Internal__

    # These are layout helpers for changing offset for an `$item`.

    _adjustItemToBottomEdge: ($item) ->
      $item.css top: 'auto', bottom: 0
      return

    _adjustItemToRightEdge: ($item) ->
      $item.css left: 'auto', right: 0
      return

    # ___getMetricSamples__ returns cloned `$item` and `$expanded` elements
    # mainly for calculating initial metrics. For them to have the right sizes,
    # they're attached to an invisible container appended to the root element.
    _getMetricSamples: ->
      @selectByClass('sample')?.remove()
      $item = @$sampleItem.clone()
      $expanded = @$sampleItem.clone().addClass @classNames.expanded
      $('<div>').addClass @classNames.sample
        .css left: 0, position: 'absolute', right: 0, top: 0
        .css visibility: 'hidden', zIndex: 0
        .append $item, $expanded
        .appendTo @$el
      { $item, $expanded }

    # These are layout helpers for checking item position based on index and the
    # current `rowSize` metric.

    _isBottomEdgeItem: (i) -> (i + 1) > (@$items.length - @metrics.rowSize)

    _isRightEdgeItem: (i) -> (i + 1) % @metrics.rowSize is 0

    # ___layoutItems__ occurs once `metrics` is updated. With the latest
    # `wrapWidth` and `wrapHeight` metrics, the root element is resized. Each
    # element in `$items` gets its position style set to `absolute` non-
    # destructively; this method assumes the original is `float`, and so
    # iterates in reverse.
    _layoutItems: ->
      @$items.get().reverse().forEach (item, i) =>
        $item = $ item
        offset = $item.position()

        unless $item.data(@attr('original-position'))?
          $item.data @attr('original-position'), $item.css('position')

        $item.css $.extend(offset, position: 'absolute')

      @$el.css width: @metrics.wrapWidth, height: @metrics.wrapHeight
      return

    # ___reLayoutItems__ wraps `_layoutItems` to be its idempotent version by
    # first resetting each item's to its `original-position`. It can run after a
    # custom `delay`.
    _reLayoutItems: (delay=0) ->
      clearTimeout @_layoutTimeout
      @_layoutTimeout = setTimeout =>
        key = @attr 'original-position'
        @$items.css
          top: 'auto', left: 'auto', bottom: 'auto', right: 'auto'
          position: -> $(@).data key

        @_layoutItems()
      , delay
      return

    # ___updateMetrics__ builds the `metrics` around item and wrap as well as
    # row and column sizes. It does so by measuring sample elements and their
    # margins, as well as sizing the wrap (root element) to fit its items. As
    # such, this method isn't idempotent and expects to be followed by a call
    # to `_layoutItems`.
    _updateMetrics: (hard=on) ->
      if hard is on
        {$item, $expanded} = @_getMetricSamples()
        @metrics =
          itemWidth: $item.outerWidth()
          itemHeight: $item.outerHeight()
          expandedWidth: $expanded.outerWidth()
          expandedHeight: $expanded.outerHeight()

      gutter = Math.round parseFloat(@$sampleItem.css('margin-right'))
      fullWidth = @metrics.itemWidth + gutter
      fullHeight = @metrics.itemHeight + gutter

      @$el.css width: 'auto', height: 'auto'

      rowSize = parseInt ((@$el.outerWidth() + gutter) / fullWidth), 10
      colSize = Math.ceil @$items.length / rowSize
      $.extend @metrics, { gutter, rowSize, colSize },
        wrapWidth: fullWidth * rowSize
        wrapHeight: fullHeight * colSize
      return

  # § __Attaching__

  hlf.createPlugin
    name: 'mediaGrid'
    namespace: hlf.mediaGrid
    apiClass: MediaGrid
    baseMixins: ['data', 'event', 'selection']
    compactOptions: yes

  yes

)
