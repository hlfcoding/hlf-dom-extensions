matchdep = require 'matchdep'

module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    clean:
      merlot: [
        'images/*',
        'stylesheets/*'
      ]

    copy:
      merlot:
        nonull: yes
        files: [
          { expand: yes, cwd: 'node_modules/merlot/images/', src: ['*.png'], dest: "images/" }
          { expand: yes, cwd: 'node_modules/merlot/stylesheets/', src: ['*.css*'], dest: "stylesheets/" }
        ]

  grunt.loadNpmTasks plugin for plugin in matchdep.filterDev 'grunt-*'

  grunt.registerTask 'default', ['clean', 'copy']
