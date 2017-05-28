grunt = require 'grunt'

# For working docs generation, disable automatic trailing whitespace trimming.

src = [
  'src/**/*.{coffee,css}'
  'tests/**/*.{coffee,css}'
  'docs/README.md'
]

module.exports =

  clean: [
    'docs/*/**'
    '!docs/.gitignore'
    '!docs/README.md'
  ]

  groc:
    src: src
    options:
      index: 'docs/README.md'
      out: 'docs/'

  watch:
    files: src
    # Sadly groc needs to run with all the sources to build its ToC.
    tasks: ['docs']

  task: -> grunt.registerTask 'docs', ['clean:docs', 'groc:docs']
