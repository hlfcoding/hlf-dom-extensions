# (function($){
# /**@exports $ as jQuery */
# /**
#  * Plugin to create custom ui-related bindings for a toolbar control. Uses the 
#  *      pattern of lazy-initializing the API and storing an instance of it as a 
#  *      data reference to the jQuery object.
#  * @constructor
#  * @param {?Object=} options Custom overrides to the defaults. 
#  * @return {jQuery} Returns an extended jQuery object with the toolbar API methods.
#  * @example 
#  * $toolbar = jQuery('#the-toolbar').toolbar(); // get the lazy-constructed API
#  * $toolbar.hideButton($('#some-button', $toolbar)); // hide the button
#  */
# $.fn.hlfToolbar = function(options){    
#   var api = this.data(hlfPkg + '.jquery.toolbar');
#   if (api) {
#     return api;
#   }
#   var opt = $.extend(true, {}, $.fn.hlfToolbar.defaults, options);
#   var sel = opt.selectors;
#   // temporary
#   api = {
#     $buttons: this.find(sel.btn).hlfButton(),
#     /** @methodOf jQuery.fn.toolbar */ 
#     hideButton: function($button){
#       $button.add($button.closest(sel.btnWrap).next(sel.btnSeparator))
#         .hide();
#     }
#   };
#   this.data(hlfPkg + '.jquery.toolbar', api);
#   $.extend(this, api);
#   return this;
# };
# /**
#  * TODO doc
#  */
# $.fn.hlfButton = function(options){
#   var opt = $.extend(true, {}, $.fn.hlfButton.defaults, options);
#   if (this.length > 1) {
#     this.each(function(){ $(this).hlfButton(); });
#     return;
#   }
#   // link button
#   this.filter('[data-href]').bind('click', $.proxy(function(evt){
#     evt.preventDefault();
#     window.open(this.attr('data-href'));
#   }, this));
#   // toggle button
#   // TODO - long hold
#   this.filter('.toggle').bind('click', $.proxy(function(evt){
#     evt.preventDefault();
#     if (!this.is('.on, .off')) {
#       this.addClass('on');
#     } else {
#       this.toggleClass('on off');
#     }
#     this.trigger((this.is('.on') ? 'on' : 'off'), [this.attr('id')]);
#   }, this));
#   return this;
# };
# /** 
#  * Properties:
#  *      <br/>selectors: btnWrap, btnSeparator
#  * @static
#  */
# $.fn.hlfToolbar.defaults = {};
# $.fn.hlfToolbar.defaults.selectors = {
#   btnWrap: '.btn-wrap',
#   btnSeparator: '.separator',
#   btn: '.btn'
# };
# $.fn.hlfButton.defaults = {};
# })(jQuery);
