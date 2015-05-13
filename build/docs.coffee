grunt = require 'grunt'

# For working docs generation, disable automatic trailing whitespace trimming.

module.exports =

  clean: [
    'docs/*'
    '!docs/.gitignore'
  ]

  groc:
    all:
      src: [
        'src/**/*.{coffee,scss}'
        'tests/**/*.{coffee,scss}'
        'README.md'
      ]
    options:
      out: 'docs/'

  task: -> grunt.registerTask 'docs', ['clean:docs', 'groc']
