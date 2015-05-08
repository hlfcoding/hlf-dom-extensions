define [
  'jquery'
  'underscore'
], ($, _) ->

  # Visual Test Helpers
  # -------------------

  $.visualTest = (config) ->
    ->
      vars = _.pick config, 'className', 'label'
      vars.html = _.template config.template, config.vars
      $context = $('#main').addVisualTest vars
      config.test $context

  $.fn.addVisualTest = (vars, opts) ->
    opts ?= {}
    _.defaults opts, $.fn.addVisualTest.defaults
    opts.template = _.template opts.template if _.isString(opts.template)
    $test = $ opts.template vars 
    @.append $test
    $test

  $.fn.addVisualTest.defaults = 
    template: _.template """
              <section class="<%- className %> visual-test">
                <header><%- label %></header>
                <%= html %>
              </section>
              """

  loremIpsum =
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
     incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
     nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
     Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
     fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
     culpa qui officia deserunt mollit anim id est laborum."

  $.loremIpsum = 
     long: loremIpsum
     short: loremIpsum[...200]

  yes
