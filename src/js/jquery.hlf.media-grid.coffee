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
      dimDelay: 1000
      resizeDelay: 100
      solo: on
      classNames: do ->
        classNames = {}
        keys = ['ready', 'item', 'expanded', 'dimmed', 'focused', 'animating']
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
        @toggleItem $(e.currentTarget)
        return

      # Dimming.
      @dimDelay *= parseFloat @$sampleItem.css('transition-duration')
      if @solo is on
        @$expandedItem = null
        @on
          mouseenter: (e) =>
            $item = $ e.currentTarget
            return if @_handleEnteringExpandedItem $item
            @_handleEnteringDimmedItem $item
            return
          mouseleave: (e) =>
            $item = $ e.currentTarget
            @_handleLeavingExpandedItem $item
            return
          toggle: (e, dimmed) =>
            $item = $ e.currentTarget
            @_handleDimmingOnTogglingItem $item, dimmed
            @_handleFocusingOnTogglingItem $item
            return
        , ".#{@classNames.item}"

      # Layout.
      @metrics = {}
      @$metricsSamples = {}
      _.delay =>
        @_updateMetrics()
        @_layoutItems()
        @$el.addClass @classNames.ready
        return
      , @dimDelay
      $(window).resize _.debounce( =>
        @_updateMetrics(off)
        @_reLayoutItems() if @_needsLayout()
        return
      , @resizeDelay)
      return

    toggleItem: ($item, expanded, silently=off) ->
      expanded ?= not $item.hasClass @classNames.expanded
      if expanded
        i = $item.index()
        if @_isRightEdgeItem(i) then @_adjustItemToRightEdge $item
        if @_isBottomEdgeItem(i) then @_adjustItemToBottomEdge $item
        if @solo is on then @$items.removeClass @classNames.expanded

      $item.toggleClass @classNames.expanded, expanded

      $item.trigger @evt('toggle'), [expanded] unless silently is on
      return

    _adjustItemToBottomEdge: ($item) ->
      $item.css { left: 'auto', right: 0 }
      return

    _adjustItemToRightEdge: ($item) ->
      $item.css { top: 'auto', bottom: 0 }
      return

    _handleDimmingOnTogglingItem: ($item, dimmed) ->
      _.delay =>
        @$el.toggleClass @classNames.dimmed, dimmed
        return
      , @dimDelay
      return

    _handleFocusingOnTogglingItem: ($item) ->
      @$expandedItem = $item.addClass @classNames.focused
      return

    _handleEnteringDimmedItem: ($item) ->
      return no unless @$el.hasClass @classNames.dimmed
      _.delay =>
        return if @$expandedItem.hasClass @classNames.focused
        @$el.removeClass @classNames.dimmed
        return
      , @dimDelay
      return yes

    _handleEnteringExpandedItem: ($item) ->
      return no unless $item.hasClass @classNames.expanded
      $item.addClass @classNames.focused
      @$el.toggleClass @classNames.dimmed
      return yes

    _handleLeavingExpandedItem: ($item) ->
      return no unless $item.hasClass @classNames.expanded
      $item.removeClass @classNames.focused

    _isBottomEdgeItem: (i) -> (i + 1) > (@$items.length - @metrics.rowSize)

    _isRightEdgeItem: (i) -> (i + 1) % @metrics.rowSize is 0

    _layoutItems: ->
      $(@$items.toArray().reverse()).each (i, item) =>
        $item = $ item
        p = $item.position()
        type = $item.css('position')

        unless $item.data(@attr('initial-layout-type'))
          $item.data @attr('initial-layout-type'), type
        if type isnt 'absolute'
          $item.css $.extend(p, { position: 'absolute' })

        $item.data @attr('layout-position'), p

      @$el.css
        width: @metrics.wrapWidth
        height: @metrics.wrapHeight
      return

    _needsLayout: (prevMetrics) ->
      return yes if not @metrics? or not @metrics.previous?
      prevMetrics ?= @metrics.previous
      return @metrics.rowSize isnt prevMetrics.rowSize or
             @$items.length isnt prevMetrics.count

    _reLayoutItems: ->
      @$items.each (i, item) =>
        @toggleItem $(item), off
        return

      _.delay =>
        @$items.each (i, item) =>
          $item = $ item
          p = $item.data @attr('layout-position')
          $item.css 
            top: 'auto', left: 'auto', bottom: 'auto', right: 'auto'
            position: $item.data @attr('initial-layout-type')

        @layoutItems()
        return
      , @_delay
      return

    _updateMetrics: (hard=on) ->
      if hard is on
        @$metricsSamples.$item = @$sampleItem.clone()
        @$metricsSamples.$expanded = @$sampleItem.clone().addClass @classNames.expanded
        @$metricsSamples.$wrap ?= @$el.clone().empty().appendTo('body')
        @$metricsSamples.$item.add(@$metricsSamples.$expanded)
          .css('visibility', 'hidden').appendTo(@$metricsSamples.$wrap)

      {$item, $expanded, $wrap} = @$metricsSamples
      gutter = Math.round parseFloat(@$sampleItem.css('margin-right'))
      fullWidth = $item.outerWidth() + gutter
      fullHeight = $item.outerHeight() + gutter
      previous = _.clone @metrics if metrics?

      if hard is on then @metrics =
        gutter: gutter
        itemWidth: $item.outerWidth()
        itemHeight: $item.outerHeight()
        expandedWidth: $expanded.outerWidth()
        expandedHeight: $expanded.outerHeight()

      rowSize = parseInt ($wrap.innerWidth() / fullWidth), 10
      colSize = Math.ceil @$items.length / rowSize
      $.extend @metrics,
        rowSize: rowSize
        colSize: colSize
        wrapWidth: fullWidth * rowSize
        wrapHeight: fullHeight * colSize

      if previous? and (not @metrics.previous? or (previous? and @_needsLayout(previous)))
        delete @metrics.previous
        @metrics.previous = previous
        @metrics.previous.count = @$items.length
      return

  hlf.createPlugin
    name: 'mediaGrid'
    namespace: hlf.mediaGrid
    apiClass: MediaGrid
    baseMixins: ['data', 'event', 'selection']
    compactOptions: yes

  yes

)
