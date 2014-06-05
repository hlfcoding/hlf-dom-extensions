###
HLF Editable jQuery Plugin
==========================
Released under the MIT License  
Written with jQuery 1.7.2  
###

# Export. Prefer AMD.
((plugin) ->
  if define? and define.amd?
    define [
      'jquery'
      'underscore'
      'hlf/jquery.extension.hlf.core'
    ], plugin
  else
    plugin jQuery, _, jQuery.hlf
)(($, _, hlf) ->

  hlf.editable =
    debug: on
    toString: _.memoize (context) ->
      switch context
        when 'event'  then '.hlf.editable'
        when 'data'   then 'hlf-editable'
        when 'class'  then 'js-editable'
        else 'hlf.editable'

    defaults:
      selectors:
        text:       '.js-text'
        input:      '.js-input input'
        inputWrap:  '.js-input'
      classNames:
        container:  ''

    types: _.memoize ->
      _.chain mixins
        .keys()
        .without 'base'
        .value()

  mixins = {}

  # Base Mixin
  # ----------
  $.createMixin mixins, 'base',

    # Own
    
    isEditing: null

    init: ->
      @trigger 'will-init'
      @$el.addClass @classNames.container
      @select()
      @bind()
      if @toggleEditing? then @toggleEditing off
      @trigger 'did-init'

    bind: ->
      if @toggleEditing?
        @on 'click', @selectors.text, (e) => @toggleEditing on
        @on 'blur', @selectors.input, (e) => @toggleEditing off
      @on 'change', @selectors.input, @handleValueChange

    handleCommand: (command, sender) ->
      @trigger 'before-command', { command }
      switch command.type
        when 'update' then @renderText command.userInfo.text
        else
      @trigger 'after-command', { command }

    handleValueChange: (sender) ->
      text = @inputValue()
      text = @textOnValueChange text
      userInfo = { text }
      @trigger 'will-commit', userInfo
      # @event commit.<ns>
      @trigger 'commit', userInfo

    # Actions
    
    toggleEditing: (state) ->
      @isEditing = state
      toggleOriginalDisplay = ($el, state) =>
        display = $el.data @attr('display')
        if state is on then $el.css { display }
        else if state is off
          if not display? then $el.data @attr('display'), $el.css('display')
          $el.hide()
      if state is on
        toggleOriginalDisplay @$text, off
        toggleOriginalDisplay @$inputWrap, on
        @$input.focus()
      else if state is off
        toggleOriginalDisplay @$text, on
        toggleOriginalDisplay @$inputWrap, off
      # @event toggle-edit.<ns>
      @trigger 'toggle-edit', { state }

    renderText: (text) -> @$text.text text

    inputValue: -> @$input.val()

    textOnValueChange: (text) ->

  $.createMixin mixins, 'inline',

    # Action Overrides
    
    textOnValueChange: (text) ->
      if not text.length then @$input.attr 'placeholder' else text

    # Onces
    
    decorateOptions: ->
      @classNames.container += " #{@cls('inline')}"
    decorate: ->
      @on 'did-init', => @initInline()
      @on 'will-commit', (e) => @renderText e.userInfo.text
      @on 'after-command', (e) =>
        command = e.userInfo.command
        switch command.type
          when 'update' then @updatePlaceholder()
          else

    # Own
    
    initInline: ->
      @updatePlaceholder()

    # Actions
    
    updatePlaceholder: ->
      @$input.attr 'placeholder', @$text.text()

  $.createMixin mixins, 'editor',

    # Action Overrides
    
    inputValue: ->

    renderText: (text) ->

    # Onces
    
    decorateOptions: ->
    decorate: ->

    # Own
    
    initEditor: ->

    bindEditor: ->

  $.createMixin mixins, 'color-picker',

    # Onces
    
    decorateOptions: ->
    decorate: ->

    # Own
    
    initColorPicker: ->

    bindColorPicker: ->

    handleColorPickerChange: (color) ->

    # Actions
    
    renderColor: (color) ->

  $.createMixin mixins, 'file-uploader',

    # Onces
    
    decorateOptions: ->
    decorate: ->

    # Own
    
    initFileUploader: ->

    bindFileUploader: ->

  # Export
  # ------
  
  hlf.createPlugin
    name: 'editable'
    namespace: hlf.editable
    apiMixins: mixins
    mixinFilter: (mixin, name) ->
      if _.isString(@options.types)
        @options.types = @options.types.split ' '
      name in @options.types and name in hlf.editable.types()
    baseMixins: [
      'data'
      'event'
      'selection'
    ]
)
