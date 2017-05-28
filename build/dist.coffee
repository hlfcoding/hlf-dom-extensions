grunt = require 'grunt'

module.exports =

  clean: [
    'dist/*'
    '!dist/.gitignore'
  ]

  # Copy original css for importing.
  copy:
    expand: yes
    src: 'src/**/*.css'
    dest: 'dist/'
    extDot: 'last'
    flatten: yes

  task: ->
    grunt.registerTask 'dist', [
      'clean:dist'
      'copy:dist'
      'coffee'
    ]
    # This task's optimized for speed, at cost of artifacts.
    grunt.registerTask 'lazy-dist', [
      'newer:copy:dist'
      'newer:coffee'
    ]
