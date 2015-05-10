matchdep = require 'matchdep'

aspects = {} # Like an aspect of work. Somewhat maps to directories and tasks.

aspects[name] = require "./build/#{name}" for name in [
  'dist', 'docs', 'gh-pages', 'lib', 'release', 'src', 'tests'
]

module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    autoprefixer:
      options:
        browsers: ['last 2 versions', 'ie >= 8']
        cascade: yes
      src: aspects.src.autoprefixer
      tests: aspects.tests.autoprefixer

    bower: aspects.lib.bower

    bump: aspects.release.bump

    clean:
      dist: aspects.dist.clean
      docs: aspects.docs.clean
      'gh-pages': aspects['gh-pages'].clean
      lib: aspects.lib.clean
      release: aspects.release.clean

    coffee:
      src: aspects.src.coffee
      tests: aspects.tests.coffee

    copy:
      dist: aspects.dist.copy
      'gh-pages': aspects['gh-pages'].copy
      release: aspects.release.copy

    'gh-pages': aspects['gh-pages']['gh-pages']
      
    groc: aspects.docs.groc

    markdown:
      'gh-pages': aspects['gh-pages'].markdown

    qunit: aspects.tests.qunit

    sass:
      src: aspects.src.sass
      tests: aspects.tests.sass

    watch:
      # Caveat: These watch tasks do not clean.
      css:
        files: '{src,tests}/**/*.scss'
        tasks: ['copy:dist', 'sass', 'autoprefixer']
      js:
        files: '{src,tests}/**/*.coffee'
        tasks: ['coffee']

  grunt.loadNpmTasks plugin for plugin in matchdep.filterDev 'grunt-*'

  grunt.registerTask 'default', ['lib', 'dist', 'watch']

  aspect.task() for name, aspect of aspects when name isnt 'src'
