grunt = require 'grunt'

module.exports =

  qunit:
    expand: yes
    src: 'tests/*.unit.html'

  coffee:
    expand: yes
    src: 'tests/**/*.coffee'
    ext: '.js'
    extDot: 'last'

  task: ->
    grunt.registerTask 'test', [
      'coffee:tests'
      'qunit'
    ]
