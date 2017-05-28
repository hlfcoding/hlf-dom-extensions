module.exports =

  autoprefixer:
    expand: yes
    src: 'dist/**/*.css'
    ext: '.css'
    extDot: 'last'

  coffee:
    expand: yes
    src: 'src/**/*.coffee'
    dest: 'dist/'
    ext: '.js'
    extDot: 'last'
    flatten: yes

  watch:
    js:
      files: '{src,tests}/**/*.coffee'
      tasks: ['newer:coffee', 'newer:qunit']
