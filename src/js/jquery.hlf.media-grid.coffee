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
      focusDelay: 1000
      resizeDelay: 100
      solo: on
      classNames: do ->
        classNames = {}
        keys = ['ready', 'item', 'expanded', 'dimmed', 'focused', 'sample']
        (classNames[key] = "#{pre}#{key}") for key in keys
        classNames

  class MediaGrid
    constructor: (@$el, options) ->

    init: ->
      @$items ?= @selectByClass 'item'
      @$sampleItem = @$items.first()
      # TODO: Delegation.
      # Toggling.
      @$items.on 'click', (e) =>
        @toggleItemExpansion $(e.currentTarget)
        return

      # Dimming.
      @focusDelay *= parseFloat @$sampleItem.css('transition-duration')
      if @solo is on
        @$expandedItem = null
        @on
          mouseenter: (e) =>
            @toggleExpandedItemFocus $(e.currentTarget), on
            return
          mouseleave: (e) =>
            @toggleExpandedItemFocus $(e.currentTarget), off
            return
          expand: (e, expanded) =>
            @_clearDimTimeout() if expanded
            @toggleItemFocus $(e.currentTarget), expanded, @focusDelay
            return
        , ".#{@classNames.item}"
        @on 'mouseleave', =>
          @toggleItemFocus @$expandedItem, off, 0
          return

      # Layout.
      @metrics = {}
      @$metricsSamples = {}

      @on 'ready', =>
        @_updateMetrics()
        @_layoutItems()
        @$el.addClass @classNames.ready
        return
      @trigger 'ready' if @autoReady is on

      $(window).resize _.debounce( =>
        @_updateMetrics off
        @_reLayoutItems()
        return
      , @resizeDelay)
      return

    toggleItemExpansion: ($item, expanded, silently=off) ->
      expanded ?= not $item.hasClass @classNames.expanded
      if expanded
        i = $item.index()
        if @_isRightEdgeItem(i) then @_adjustItemToRightEdge $item
        if @_isBottomEdgeItem(i) then @_adjustItemToBottomEdge $item
        if @solo is on then @$items.removeClass @classNames.expanded

      $item.toggleClass @classNames.expanded, expanded
      @$expandedItem = if expanded then $item else null

      $item.trigger @evt('expand'), [expanded] unless silently is on
      return

    toggleExpandedItemFocus: ($item, focused) ->
      return unless $item?.hasClass @classNames.expanded
      delay = if focused then 0 else 1000
      @toggleItemFocus $item, focused, delay
      return

    toggleItemFocus: ($item, focused, delay) ->
      return unless $item?
      $item.toggleClass @classNames.focused, focused
      @_dimTimeout = setTimeout =>
        return unless focused is $item.hasClass(@classNames.focused)
        @$el.toggleClass @classNames.dimmed, focused
        return
      , delay
      return

    _adjustItemToBottomEdge: ($item) ->
      $item.css top: 'auto', bottom: 0
      return

    _adjustItemToRightEdge: ($item) ->
      $item.css left: 'auto', right: 0
      return

    _clearDimTimeout: ->
      return unless @_dimTimeout?
      clearTimeout @_dimTimeout
      @_dimTimeout = null
      return

    _isBottomEdgeItem: (i) -> (i + 1) > (@$items.length - @metrics.rowSize)

    _isRightEdgeItem: (i) -> (i + 1) % @metrics.rowSize is 0

    _layoutItems: ->
      $(@$items.toArray().reverse()).each (i, item) =>
        $item = $ item
        offset = $item.position()

        unless $item.data(@attr('original-position'))?
          $item.data @attr('original-position'), $item.css('position')

        $item.css $.extend(offset, position: 'absolute')

      @$el.css width: @metrics.wrapWidth, height: @metrics.wrapHeight
      return

    _reLayoutItems: ->
      @$items.each (i, item) =>
        @toggleItemExpansion $(item), off
        return

      _.delay =>
        @$items.each (i, item) =>
          $item = $ item
          $item.css 
            top: 'auto', left: 'auto', bottom: 'auto', right: 'auto'
            position: $item.data @attr('original-position')

        @_layoutItems()
        return
      , @focusDelay
      return

    _updateMetrics: (hard=on) ->
      if hard is on
        @$metricsSamples.$item = @$sampleItem.clone()
        @$metricsSamples.$expanded = @$sampleItem.clone().addClass @classNames.expanded
        @$metricsSamples.$wrap?.remove()
        @$metricsSamples.$wrap = @$el.clone().empty().addClass @classNames.sample
          .css left: 0, position: 'absolute', right: 0, top: 0
          .css visibility: 'hidden', zIndex: 0
          .append @$metricsSamples.$item
          .append @$metricsSamples.$expanded
          .appendTo @$el

      {$item, $expanded, $wrap} = @$metricsSamples
      gutter = Math.round parseFloat(@$sampleItem.css('margin-right'))
      fullWidth = $item.outerWidth() + gutter
      fullHeight = $item.outerHeight() + gutter

      if hard is on then @metrics =
        gutter: gutter
        itemWidth: $item.outerWidth()
        itemHeight: $item.outerHeight()
        expandedWidth: $expanded.outerWidth()
        expandedHeight: $expanded.outerHeight()

      rowSize = parseInt ($wrap.outerWidth() / fullWidth), 10
      colSize = Math.ceil @$items.length / rowSize
      $.extend @metrics,
        rowSize: rowSize
        colSize: colSize
        wrapWidth: fullWidth * rowSize
        wrapHeight: fullHeight * colSize
      return

  hlf.createPlugin
    name: 'mediaGrid'
    namespace: hlf.mediaGrid
    apiClass: MediaGrid
    baseMixins: ['data', 'event', 'selection']
    compactOptions: yes

  yes

)
