module.exports =

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
