module.exports =

  autoprefixer:
    options:
      map: yes
    expand: yes
    src: 'dist/**/*.css'
    ext: '.css'
    extDot: 'last'

  coffee:
    options:
      sourceMap: yes
    expand: yes
    src: 'src/**/*.coffee'
    dest: 'dist/'
    ext: '.js'
    extDot: 'last'
    flatten: yes

  sass:
    expand: yes
    src: 'src/**/*.scss'
    dest: 'dist/'
    ext: '.css'
    extDot: 'last'
    flatten: yes

  watch:
    css:
      files: '{src,tests}/**/*.scss'
      tasks: ['newer:copy:dist', 'newer:sass', 'newer:autoprefixer']
    js:
      files: '{src,tests}/**/*.coffee'
      tasks: ['newer:coffee']
