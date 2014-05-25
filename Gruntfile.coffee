matchdep = require 'matchdep'

module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    bower:
      install:
        options:
          cleanBowerDir: yes
          cleanTargetDir: no
          copy: yes
          install: yes
          layout: (type, component) -> type # Just the file.
          targetDir: './lib'
          verbose: yes
    clean:
      dist: [
        'dist/*'
        '!dist/.gitignore'
      ]
      docs: [
        'docs/*'
        '!docs/.gitignore'
      ]
      lib: [
        'lib/*'
        '!lib/.gitignore'
      ]
    coffee:
      src:
        expand: yes
        src: 'src/**/*.coffee'
        dest: 'dist/'
        ext: '.js'
        extDot: 'last'
        flatten: yes
    groc:
      all:
        src: [
          'src/**/*'
          'tests/**/*'
          'README.md'
        ]
      options:
        out: 'docs/'
    sass:
      src:
        expand: yes
        src: 'src/**/*.scss'
        dest: 'dist/'
        ext: '.css'
        extDot: 'last'
        flatten: yes
    watch:
      css:
        files: 'src/**/*.scss'
        tasks: ['sass']
      js:
        files: 'src/**/*.coffee'
        tasks: ['coffee']

  grunt.loadNpmTasks plugin for plugin in matchdep.filterDev 'grunt-*'

  grunt.registerTask 'default', [
    'clean:lib'
    'bower'
    'dist'
    'watch'
  ]

  grunt.registerTask 'dist', [
    'clean:dist'
    'coffee'
    'sass'
  ]

  grunt.registerTask 'docs', ['clean:docs', 'groc']
