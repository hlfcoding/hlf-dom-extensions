###
HLF Core jQuery Extension v1.0
Released under the MIT License
Written with jQuery 1.7.2
###
$ = jQuery

if not _? then throw "UnderscoreJS required."

_.templateSettings = interpolate: /\{\{(.+?)\}\}/g

$.hlf =
  createPlugin: (ns, apiClass) ->
    ns.apiClass = apiClass
    nsEvt = ns.toString 'event'
    nsDat = ns.toString 'data'
    return (opt, $ctx) ->
      $ctx ?= $ 'body'
      # - Try returning existing plugin api if no options are passed in.
      api = @first().data ns.toString()
      return api if api? and not opt?
      # - Re-apply plugin.
      opt = $.extend (deep=on), {}, ns.defaults, opt
      return @each ->
        $el = $(@).addClass ns.toString 'class'
        apiClass::_evt ?= (name) -> "#{name}#{nsEvt}"
        apiClass::_dat ?= (name) -> "#{nsDat}#{name}"
        apiClass::_log ?= if ns.debug then $.hlf.log else $.noop
        $el.data ns.toString(), new apiClass $el, opt, $ctx
      
    
  
  debug: on # Turn this off when going to production.
  toString: -> 'hlf'

$.hlf.log = if not $.hlf.debug then $.noop else
  (if console.log.bind then console.log.bind(console) else console.log)
