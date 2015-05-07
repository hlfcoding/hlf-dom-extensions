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

  sass:
    expand: yes
    src: 'src/**/*.scss'
    dest: 'dist/'
    ext: '.css'
    extDot: 'last'
    flatten: yes
