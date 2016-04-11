
/*
HLF Editable jQuery Plugin
==========================
 */

(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  (function(root, attach) {
    if (typeof define === 'function' && (define.amd != null)) {
      return define(['jquery', 'underscore', 'hlf/jquery.extension.hlf.core'], attach);
    } else if (typeof exports === 'object') {
      return module.exports = attach(require('jquery', require('underscore', require('hlf/jquery.extension.hlf.core'))));
    } else {
      return attach(jQuery, _, jQuery.hlf);
    }
  })(this, function($, _, hlf) {
    var mixins;
    hlf.editable = {
      debug: true,
      toString: _.memoize(function(context) {
        switch (context) {
          case 'event':
            return '.hlf.editable';
          case 'data':
            return 'hlf-editable';
          case 'class':
            return 'js-editable';
          default:
            return 'hlf.editable';
        }
      }),
      defaults: {
        selectors: {
          text: '.js-text',
          input: '.js-input input',
          inputWrap: '.js-input'
        },
        classNames: {
          container: ''
        }
      },
      types: _.memoize(function() {
        return _.chain(mixins).keys().without('base').value();
      })
    };
    mixins = {};
    $.createMixin(mixins, 'base', {
      isEditing: null,
      init: function() {
        this.trigger('will-init');
        this.$el.addClass(this.classNames.container);
        this.bind();
        if (this.toggleEditing != null) {
          this.toggleEditing(false);
        }
        return this.trigger('did-init');
      },
      bind: function() {
        if (this.toggleEditing != null) {
          this.on('click', this.selectors.text, (function(_this) {
            return function(e) {
              return _this.toggleEditing(true);
            };
          })(this));
          this.on('blur', this.selectors.input, (function(_this) {
            return function(e) {
              return _this.toggleEditing(false);
            };
          })(this));
        }
        return this.on('change', this.selectors.input, this.handleValueChange);
      },
      handleCommand: function(command, sender) {
        this.trigger('before-command', {
          command: command
        });
        switch (command.type) {
          case 'update':
            this.renderText(command.userInfo.text);
            break;
        }
        return this.trigger('after-command', {
          command: command
        });
      },
      handleValueChange: function(sender) {
        var text, userInfo;
        text = this.inputValue();
        text = this.textOnValueChange(text);
        userInfo = {
          text: text
        };
        this.trigger('will-commit', userInfo);
        return this.trigger('commit', userInfo);
      },
      toggleEditing: function(state) {
        var toggleOriginalDisplay;
        this.isEditing = state;
        toggleOriginalDisplay = (function(_this) {
          return function($el, state) {
            var display;
            display = $el.data(_this.attr('display'));
            if (state === true) {
              if (display == null) {
                display = 'block';
              }
              return $el.css({
                display: display
              });
            } else if (state === false) {
              if (display == null) {
                display = $el.css('display');
                if (display !== 'none') {
                  $el.data(_this.attr('display'), display);
                }
              }
              return $el.hide();
            }
          };
        })(this);
        if (state === true) {
          toggleOriginalDisplay(this.$text, false);
          toggleOriginalDisplay(this.$inputWrap, true);
          this.$input.focus();
        } else if (state === false) {
          toggleOriginalDisplay(this.$text, true);
          toggleOriginalDisplay(this.$inputWrap, false);
        }
        return this.trigger('toggle-edit', {
          state: state
        });
      },
      renderText: function(text) {
        return this.$text.text(text);
      },
      inputValue: function() {
        return this.$input.val();
      },
      textOnValueChange: function(text) {}
    });
    $.createMixin(mixins, 'inline', {
      textOnValueChange: function(text) {
        if (!text.length) {
          return this.$input.attr('placeholder');
        } else {
          return text;
        }
      },
      decorateOptions: function() {
        return this.options.classNames.container += " " + (this.cls('inline'));
      },
      decorate: function() {
        this.on('did-init', (function(_this) {
          return function() {
            return _this.initInline();
          };
        })(this));
        this.on('will-commit', (function(_this) {
          return function(e) {
            return _this.renderText(e.userInfo.text);
          };
        })(this));
        return this.on('after-command', (function(_this) {
          return function(e) {
            var command;
            command = e.userInfo.command;
            switch (command.type) {
              case 'update':
                return _this.updatePlaceholder();
            }
          };
        })(this));
      },
      initInline: function() {
        return this.updatePlaceholder();
      },
      updatePlaceholder: function() {
        return this.$input.attr('placeholder', this.$text.text());
      }
    });
    $.createMixin(mixins, 'editor', {
      inputValue: function() {
        switch (this.editorName) {
          case 'CodeMirror':
            return this.editor.getValue();
          default:
            return '';
        }
      },
      renderText: function(text) {
        switch (this.editorName) {
          case 'CodeMirror':
            return this.editor.setValue(text);
        }
      },
      decorateOptions: function() {
        return this.opts.selectors.markup = '.editor-markup';
      },
      decorate: function() {
        delete this.toggleEditing;
        this.on('will-init', (function(_this) {
          return function() {};
        })(this));
        return this.on('did-init', (function(_this) {
          return function() {
            return _this.initEditor();
          };
        })(this));
      },
      initEditor: function() {
        var didInit, location, opts;
        this.editorName = this.data('editor');
        switch (this.editorName) {
          case 'CodeMirror':
            opts = this.data('editor-options');
            opts.value = this.$markup.text();
            location = (function(_this) {
              return function(el) {
                _this.$editor = el;
                return _this.$markup.replaceWith(_this.$editor);
              };
            })(this);
            this.editor = CodeMirror(location, opts);
            break;
          default:
            didInit = false;
        }
        this.bindEditor();
        return didInit !== false;
      },
      bindEditor: function() {
        switch (this.editorName) {
          case 'CodeMirror':
            return this.editor.on('blur', this.handleValueChange);
        }
      }
    });
    $.createMixin(mixins, 'color-picker', {
      decorateOptions: function() {
        return this.opts.selectors.well = '.color-well';
      },
      decorate: function() {
        this.on('will-commit', (function(_this) {
          return function(e) {
            return _this.renderColor(e.userInfo.text);
          };
        })(this));
        return this.on('did-init', (function(_this) {
          return function() {
            return _this.initColorPicker();
          };
        })(this));
      },
      initColorPicker: function() {
        var didInit, opts;
        _.bindAll(this, 'handleColorPickerChange');
        this.pickerName = this.data('color-picker');
        switch (this.pickerName) {
          case 'Spectrum':
            opts = this.data('color-picker-options');
            opts.color = "#" + (this.$input.val());
            opts.change = this.handleColorPickerChange;
            this.$well.spectrum(opts);
            break;
          default:
            didInit = false;
        }
        this.bindColorPicker();
        return didInit !== false;
      },
      bindColorPicker: function() {},
      handleColorPickerChange: function(color) {
        switch (this.pickerName) {
          case 'Spectrum':
            color = color.toHexString().substring(1);
        }
        return this.$input.val(color).trigger('change');
      },
      renderColor: function(color) {
        switch (this.pickerName) {
          case 'Spectrum':
            return this.$well.spectrum('set', color);
        }
      }
    });
    $.createMixin(mixins, 'file-uploader', {
      decorateOptions: function() {
        this.opts.selectors.text = '.preview > figcaption';
        return this.opts.selectors.thumb = '.preview > .thumb';
      },
      decorate: function() {
        delete this.toggleEditing;
        this.on('will-commit', (function(_this) {
          return function(e) {};
        })(this));
        return this.on('did-init', (function(_this) {
          return function() {
            return _this.initFileUploader();
          };
        })(this));
      },
      initFileUploader: function() {
        var didInit, opts;
        this.uploaderName = this.data('file-uploader');
        switch (this.uploaderName) {
          case 'jQueryFileUpload':
            opts = this.data('file-uploader-options');
            this.$input.fileupload(opts);
            break;
          default:
            didInit = false;
        }
        this.bindFileUploader();
        return didInit !== false;
      },
      bindFileUploader: function() {}
    });
    return hlf.createPlugin({
      name: 'editable',
      namespace: hlf.editable,
      apiMixins: mixins,
      mixinFilter: function(mixin, name) {
        if (_.isString(this.options.types)) {
          this.options.types = this.options.types.split(' ');
        }
        return indexOf.call(this.options.types, name) >= 0 && indexOf.call(hlf.editable.types(), name) >= 0;
      },
      baseMixins: ['data', 'event', 'selection'],
      autoSelect: true,
      compactOptions: true
    });
  });

}).call(this);

//# sourceMappingURL=jquery.hlf.editable.js.map
