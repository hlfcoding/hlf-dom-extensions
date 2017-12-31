const matchdep = require('matchdep');

const dist = {
  clean: [
    'dist/*',
    '!dist/.gitignore',
  ],
  comments: {
    src: ['dist/hlf-dom-extensions.{js,css}'],
  },
  concat: {
    files: {
      'dist/hlf-dom-extensions.css': ['dist/*.css'],
      'dist/hlf-dom-extensions.js': ['dist/core.js', 'dist/*.js', '!dist/guard.js'],
    },
  },
  copy: {
    expand: true,
    src: [
      'src/**/*.{js,css}',
      '!src/**/field.{js,css}',
    ],
    dest: 'dist/',
    extDot: 'last',
    flatten: true,
  },
  registerTasks(grunt) {
    grunt.registerTask('dist', ['clean:dist', 'copy:dist', 'concat:dist', 'comments:dist']);
    // This task's optimized for speed, at cost of artifacts.
    grunt.registerTask('lazy-dist', ['newer:copy:dist']);
  },
};

const docs = (function() {
  const src = [
    'src/**/*.{js,css}',
    'tests/**/*.{js,css}',
    '!**/field.{js,css}',
    'docs/README.md',
  ];
  return {
    clean: [
      'docs/*/**',
      '!docs/.gitignore',
      '!docs/README.md',
    ],
    groc: {
      src: src,
      options: {
        index: 'docs/README.md',
        out: 'docs/',
      },
    },
    watch: {
      files: src,
      // Sadly groc needs to run with all the sources to build its ToC.
      tasks: ['docs'],
    },
    registerTasks(grunt) {
      grunt.registerTask('docs', ['clean:docs', 'groc:docs']);
    },
  };
}());

const lib = {
  clean: ['lib/*', '!lib/.gitignore'],
  copy: {
    files: [
      { src: 'node_modules/hlf-css/lib/modified/_normalize.scss', dest: 'lib/normalize.css' },
      { expand: true, flatten: true, src: 'node_modules/qunitjs/qunit/qunit.{css,js}', dest: 'lib/' },
      { src: 'node_modules/requirejs/require.js', dest: 'lib/require.js' },
    ]
  },
  registerTasks(grunt) {
    grunt.registerTask('lib', ['clean:lib', 'copy:lib']);
  },
};

const pages = {
  'gh-pages': {
    options: {
      base: 'gh-pages',
    },
    src: [
      '**',
      '!template.jst.html',
    ],
  },
  clean: [
    'gh-pages/*',
    '!gh-pages/.gitignore',
    '!gh-pages/template.jst.html',
  ],
  copy: {
    nonull: true,
    files: [
      {
        expand: true,
        src: [
          'dist/**/*',
          'docs/**/*',
          'lib/**/*',
          'tests/**/*',
          'README.md',
        ],
        dest: 'gh-pages/',
      },
      {
        expand: true,
        cwd: 'node_modules/merlot',
        src: [
          'images/*',
          'stylesheets/*.{css,map}',
          'template.jst.html',
        ],
        dest: 'gh-pages/',
        filter: 'isFile',
      },
    ],
  },
  markdown: {
    options: {
      markdownOptions: {
        gfm: true,
        highlight: 'auto',
      },
      template: 'gh-pages/template.jst.html',
      templateContext: {
        githubAuthor: 'hlfcoding',
        githubPath: 'hlfcoding/hlf-dom-extensions',
        headline: 'HLF DOM Extensions',
        pageTitle: 'HLF DOM Extensions by hlfcoding',
        subHeadline: 'Custom UI',
      },
    },
    src: 'gh-pages/README.md',
    dest: 'gh-pages/index.html',
  },
  registerTasks(grunt) {
    grunt.registerTask('pages', [
      'dist',
      'docs',
      'clean:gh-pages',
      'copy:gh-pages',
      'markdown:gh-pages',
      'gh-pages:gh-pages',
    ]);
  },
};

const release = {
  bump: {
    options: {
      files: ['package.json'],
      commitFiles: ['.'],
      pushTo: 'origin',
    },
  },
};

module.exports = (grunt) => {
  config = {
    pkg: grunt.file.readJSON('package.json'),
    bump: release.bump,
    clean: {
      dist: dist.clean,
      docs: docs.clean,
      'gh-pages': pages.clean,
      lib: lib.clean,
    },
    comments: {
      dist: dist.comments,
    },
    concat: {
      dist: dist.concat,
    },
    copy: {
      dist: dist.copy,
      'gh-pages': pages.copy,
      lib: lib.copy,
    },
    'gh-pages': {
      'gh-pages': pages['gh-pages'],
    },
    groc: {
      docs: docs.groc,
    },
    markdown: {
      'gh-pages': pages.markdown,
    },
    watch: {},
  };
  if (!grunt.option('fast')) {
    config.watch.docs = docs.watch;
  }
  grunt.initConfig(config);

  matchdep.filterDev('grunt-*').forEach(plugin => grunt.loadNpmTasks(plugin));

  grunt.registerTask('default', ['lazy-dist', 'watch']);
  grunt.registerTask('install', ['lib', 'dist']);

  dist.registerTasks(grunt);
  docs.registerTasks(grunt);
  lib.registerTasks(grunt);
  pages.registerTasks(grunt);
};
