###
HLF Editable jQuery Plugin
==========================
###

# __See__: [tests](../../tests/js/editable.html).

# ❧

# Export. Support AMD, CommonJS (Browserify), and browser globals.
((root, factory) ->
  if typeof define is 'function' and define.amd?
    # - AMD. Register as an anonymous module.
    define [
      'jquery'
      'underscore'
      'hlf/jquery.extension.hlf.core'
    ], factory
  else if typeof exports is 'object'
    # - Node. Does not work with strict CommonJS, but only CommonJS-like
    #   environments that support module.exports, like Node.
    module.exports = factory(
      require 'jquery',
      require 'underscore',
      require 'hlf/jquery.extension.hlf.core'
    )
  else
    # - Browser globals (root is window). No globals needed.
    factory jQuery, _, jQuery.hlf
)(@, ($, _, hlf) ->

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
        if state is on
          display ?= 'block'
          $el.css { display }
        else if state is off
          if not display?
            display = $el.css 'display'
            if display isnt 'none' then $el.data @attr('display'), display
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
      @options.classNames.container += " #{@cls('inline')}"
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
      switch @editorName
        when 'CodeMirror' then @editor.getValue()
        else ''

    renderText: (text) ->
      switch @editorName
        when 'CodeMirror' then @editor.setValue text
        else

    # Onces
    
    decorateOptions: ->
      @opts.selectors.markup = '.editor-markup'
    decorate: ->
      delete @toggleEditing # Unneeded action.
      @on 'will-init', =>
      @on 'did-init', => @initEditor()

    # Own
    
    initEditor: ->
      @editorName = @data 'editor'
      switch @editorName
        when 'CodeMirror'
          opts = @data 'editor-options'
          opts.value = @$markup.text()
          location = (el) =>
            @$editor = el
            @$markup.replaceWith @$editor
          @editor = CodeMirror location, opts
        else didInit = no
      @bindEditor()
      didInit isnt no

    bindEditor: ->
      switch @editorName
        when 'CodeMirror'
          @editor.on 'blur', @handleValueChange
        else

  $.createMixin mixins, 'color-picker',

    # Onces
    
    decorateOptions: ->
      @opts.selectors.well = '.color-well'
    decorate: ->
      @on 'will-commit', (e) => @renderColor e.userInfo.text
      @on 'did-init', => @initColorPicker()

    # Own
    
    initColorPicker: ->
      _.bindAll @, 'handleColorPickerChange'
      @pickerName = @data 'color-picker'
      switch @pickerName
        when 'Spectrum'
          opts = @data 'color-picker-options'
          opts.color = "##{@$input.val()}"
          opts.change = @handleColorPickerChange
          @$well.spectrum opts
        else didInit = no
      @bindColorPicker()
      didInit isnt no

    bindColorPicker: ->

    handleColorPickerChange: (color) ->
      switch @pickerName
        when 'Spectrum' then color = color.toHexString().substring(1)
      @$input
        .val color
        .trigger 'change'

    # Actions
    
    renderColor: (color) ->
      switch @pickerName
        when 'Spectrum' then @$well.spectrum 'set', color

  $.createMixin mixins, 'file-uploader',

    # Onces
    
    decorateOptions: ->
      @opts.selectors.text = '.preview > figcaption'
      @opts.selectors.thumb = '.preview > .thumb'
    decorate: ->
      delete @toggleEditing # Unneeded action.
      @on 'will-commit', (e) =>
      @on 'did-init', => @initFileUploader()

    # Own
    
    initFileUploader: ->
      @uploaderName = @data 'file-uploader'
      switch @uploaderName
        when 'jQueryFileUpload'
          opts = @data 'file-uploader-options'
          @$input.fileupload opts
        else didInit = no
      @bindFileUploader()
      didInit isnt no

    bindFileUploader: ->

  # ❧

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
    autoSelect: yes
    compactOptions: yes
)
