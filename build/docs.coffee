grunt = require 'grunt'

# For working docs generation, disable automatic trailing whitespace trimming.

src = [
  'src/**/*.{coffee,scss}'
  'tests/**/*.{coffee,scss}'
  'README.md'
]

module.exports =

  clean: [
    'docs/*'
    '!docs/.gitignore'
  ]

  groc:
    src: src
    options: { out: 'docs/' }

  watch:
    files: src
    # Sadly groc needs to run with all the sources to build its ToC.
    tasks: ['docs']

  task: -> grunt.registerTask 'docs', ['clean:docs', 'groc:docs']
