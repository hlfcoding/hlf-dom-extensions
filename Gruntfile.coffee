matchdep = require 'matchdep'

module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    autoprefixer:
      options:
        browsers: ['last 2 versions', 'ie 9']
        cascade: yes
      src:
        expand: yes
        src: 'dist/**/*.css'
        ext: '.css'
        extDot: 'last'
      tests:
        expand: yes
        src: 'tests/**/*.css'
        ext: '.css'
        extDot: 'last'
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
      'gh-pages': [
        'gh-pages/*'
        '!gh-pages/.gitignore'
        '!gh-pages/template.html'
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
      tests:
        expand: yes
        src: 'tests/**/*.coffee'
        ext: '.js'
        extDot: 'last'
    copy:
      dist:
        expand: yes
        src: 'src/**/*.scss'
        dest: 'dist/'
        extDot: 'last'
        flatten: yes
      'gh-pages':
        src: [
          'dist/**/*'
          'docs/**/*'
          'examples/**/*'
          'lib/**/*'
          'tests/**/*.{css,html,js}'
          'README.md'
        ]
        dest: 'gh-pages/'
    'gh-pages':
      options:
        base: 'gh-pages'
        add: yes
      src: [ '**' ]
    groc:
      all:
        src: [
          'src/**/*.{coffee,scss}'
          'tests/**/*.{coffee,scss}'
          'README.md'
        ]
      options:
        out: 'docs/'
    markdown:
      'gh-pages':
        options:
          template: 'gh-pages/template.html'
        src: 'gh-pages/README.md'
        dest: 'gh-pages/index.html'
    qunit:
      all:
        expand: yes
        src: 'tests/*.unit.html'
    sass:
      src:
        expand: yes
        src: 'src/**/*.scss'
        dest: 'dist/'
        ext: '.css'
        extDot: 'last'
        flatten: yes
      tests:
        expand: yes
        src: 'tests/**/*.scss'
        ext: '.css'
        extDot: 'last'
    watch:
      # Caveat: These watch tasks do not clean.
      css:
        files: '{src,tests}/**/*.scss'
        tasks: ['sass', 'autoprefixer']
      js:
        files: '{src,tests}/**/*.coffee'
        tasks: ['coffee']

  grunt.loadNpmTasks plugin for plugin in matchdep.filterDev 'grunt-*'

  grunt.registerTask 'default', [
    'lib'
    'dist'
    'watch'
  ]

  grunt.registerTask 'dist', [
    'clean:dist'
    'copy:dist'
    'coffee'
    'sass'
    'autoprefixer'
  ]

  grunt.registerTask 'docs', [
    'clean:docs'
    'groc'
  ]

  grunt.registerTask 'lib', [
    'clean:lib'
    'bower'
  ]

  grunt.registerTask 'pages', [
    'dist'
    'docs'
    'clean:gh-pages'
    'copy:gh-pages'
    'markdown:gh-pages'
    'gh-pages'
  ]

  grunt.registerTask 'test', ['qunit']
