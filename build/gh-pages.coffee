grunt = require 'grunt'

module.exports =

  'gh-pages': 
    options:
      base: 'gh-pages'
      add: yes
    src: ['**']

  clean: [
    'gh-pages/*'
    '!gh-pages/.gitignore'
    '!gh-pages/template.html'
  ]

  copy:
    expand: yes
    src: [
      'dist/**/*'
      'docs/**/*'
      'lib/**/*'
      'tests/**/*'
      '!tests/**/*.{scss,coffee}'
      'README.md'
    ]
    dest: 'gh-pages/'

  markdown:
    options:
      template: 'gh-pages/template.html'
    src: 'gh-pages/README.md'
    dest: 'gh-pages/index.html'

  task: ->
    grunt.registerTask 'pages', [
      'dist'
      'docs'
      'clean:gh-pages'
      'copy:gh-pages'
      'markdown:gh-pages'
      'gh-pages'
    ]
