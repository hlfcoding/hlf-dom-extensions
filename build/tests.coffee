grunt = require 'grunt'

module.exports =

  qunit:
    expand: yes
    src: 'tests/*.unit.html'

  autoprefixer:
    expand: yes
    src: 'tests/**/*.css'
    ext: '.css'
    extDot: 'last'

  coffee:
    expand: yes
    src: 'tests/**/*.coffee'
    ext: '.js'
    extDot: 'last'

  task: ->
    grunt.registerTask 'test', [
      'coffee:tests'
      'autoprefixer:tests'
      'qunit'
    ]
