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
    src: 'dist/*'
    dest: 'release/'
    extDot: 'last'
    flatten: yes

  task: -> grunt.registerTask 'release', ['dist', 'clean:release', 'copy:release']
