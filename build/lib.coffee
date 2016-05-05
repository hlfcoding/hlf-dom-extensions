grunt = require 'grunt'

module.exports =

  clean: ['lib/*', '!lib/.gitignore']

  copy:
    files: [
      { src: 'node_modules/jquery/dist/jquery.js', dest: 'lib/jquery.js' }
      { src: 'node_modules/underscore/underscore.js', dest: 'lib/underscore.js' }
      { src: 'node_modules/es6-promise/dist/es6-promise.js', dest: 'lib/promise.js' }
      { expand: yes, flatten: yes, src: 'node_modules/gsap/src/uncompressed/{jquery.gsap,TweenLite,plugins/CSSPlugin}.js', dest: 'lib/' }
      { src: 'node_modules/hlf-css/lib/modified/_normalize.scss', dest: 'lib/_normalize.scss' }
      { src: 'node_modules/hlf-css/lib/modified/html5-boilerplate/_helpers.scss', dest: 'lib/_helpers.scss' }
      { expand: yes, flatten: yes, src: 'node_modules/qunitjs/qunit/qunit.{css,js}', dest: 'lib/' }
      { src: 'node_modules/requirejs/require.js', dest: 'lib/require.js' }
      { src: 'node_modules/velocity-animate/velocity.js', dest: 'lib/velocity.js' }
    ]

  task: -> grunt.registerTask 'lib', ['clean:lib', 'copy:lib']

