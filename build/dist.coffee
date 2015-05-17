grunt = require 'grunt'

module.exports =

  clean: [
    'dist/*'
    '!dist/.gitignore'
  ]

  # Copy original scss for importing.
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
    # This task's optimized for speed, at cost of artifacts.
    grunt.registerTask 'lazy-dist', [
      'newer:copy:dist'
      'newer:coffee'
      'newer:sass'
      'newer:autoprefixer'
    ]
