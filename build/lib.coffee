grunt = require 'grunt'

module.exports =

  bower: # The rest is in Bower.json.
    install:
      options:
        cleanBowerDir: yes
        cleanTargetDir: no
        copy: yes
        install: yes
        layout: (type, component) -> type # Just the file.
        targetDir: './lib'
        verbose: yes

  clean: ['lib/*', '!lib/.gitignore']

  watch:
    files: 'bower.json'
    tasks: ['lib']

  task: -> grunt.registerTask 'lib', ['clean:lib', 'bower']

