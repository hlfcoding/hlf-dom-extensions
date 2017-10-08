const matchdep = require('matchdep');

const dist = {
  clean: [
    'dist/*',
    '!dist/.gitignore',
  ],
  // # Copy original css for importing.
  copy: {
    expand: true,
    src: 'src/**/*.{js,css}',
    dest: 'dist/',
    extDot: 'last',
    flatten: true,
  },
  registerTasks(grunt) {
    grunt.registerTask('dist', ['clean:dist', 'copy:dist']);
    // This task's optimized for speed, at cost of artifacts.
    grunt.registerTask('lazy-dist', ['newer:copy:dist']);
  },
};

const docs = (function() {
  const src = [
    'src/**/*.{js,css}',
    'tests/**/*.{js,css}',
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
      add: true,
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
          '!tests/**/*.{css,js}',
          'README.md',
        ],
        dest: 'gh-pages/',
      },
      {
        src: 'node_modules/merlot/template.jst.html',
        dest: 'gh-pages/',
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
        githubPath: 'hlfcoding/hlf-jquery',
        headline: 'HLF jQuery',
        pageTitle: 'HLF jQuery by hlfcoding',
        subHeadline: 'Custom jQuery Plugins',
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
  clean: ['release/*'],
  copy: {
    expand: true,
    src: ['dist/*'],
    dest: 'release/',
    extDot: 'last',
    flatten: true,
  },
  uglify: {
    files: {
      'release/jquery.hlf.min.js': [
        'dist/jquery.extension.hlf.core.js',
        'dist/jquery.extension.hlf.event.js',
        'dist/jquery.hlf.tip.js',
      ],
    },
  },
  registerTasks(grunt) {
    grunt.registerTask('release', [
      'dist',
      // Uncompressed version.
      'clean:release',
      'copy:release',
      // Compressed version.
      'uglify:release',
    ]);
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
      release: release.clean,
    },
    copy: {
      dist: dist.copy,
      'gh-pages': pages.copy,
      lib: lib.copy,
      release: release.copy,
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
    uglify: {
      release: release.uglify,
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
  release.registerTasks(grunt);
};
