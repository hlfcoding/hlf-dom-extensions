grunt = require 'grunt'

module.exports =

  clean: [
    'dist/*'
    '!dist/.gitignore'
  ]

  copy:
    expand: yes
    src: 'src/**/*.scss'
    dest: 'dist/'
    extDot: 'last'
    flatten: yes

  task: ->
    grunt.registerTask 'dist', [
      'clean:dist'
      'copy:dist'
      'coffee'
      'sass'
      'autoprefixer'
    ]
