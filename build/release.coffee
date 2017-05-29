# Releases to Bower.

grunt = require 'grunt'

module.exports =

  bump:
    options:
      files: [
        'bower.json'
        'package.json'
      ]
      commitFiles: ['.']
      pushTo: 'origin'

  clean: ['release/*']

  copy:
    expand: yes
    src: [
      'dist/*'
    ]
    dest: 'release/'
    extDot: 'last'
    flatten: yes

  uglify:
    files:
      'release/jquery.hlf.min.js': [
        'dist/jquery.extension.hlf.core.js'
        'dist/jquery.extension.hlf.event.js'
        'dist/jquery.hlf.tip.js'
      ]

  task: ->
    grunt.registerTask 'release', [
      'dist'
      # Uncompressed version.
      'clean:release'
      'copy:release'
      # Compressed version.
      'uglify:release'
    ]
