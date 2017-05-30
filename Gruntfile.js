const matchdep = require('matchdep');

let aspects = {}; // Like an aspect of work. Somewhat maps to directories and tasks.
['gh-pages', 'lib', 'release', 'src', 'tests']
  .forEach(name => aspects[name] = require(`./build/${name}`));

const dist = {
  clean: [
    'dist/*',
    '!dist/.gitignore',
  ],
  // # Copy original css for importing.
  copy: {
    expand: true,
    src: 'src/**/*.css',
    dest: 'dist/',
    extDot: 'last',
    flatten: true,
  },
  registerTasks(grunt) {
    grunt.registerTask('dist', ['clean:dist', 'copy:dist', 'coffee:src']);
    // This task's optimized for speed, at cost of artifacts.
    grunt.registerTask('lazy-dist', ['newer:copy:dist', 'newer:coffee:src']);
  },
};

const docs = (function() {
  const src = [
    'src/**/*.{coffee,css}',
    'tests/**/*.{coffee,css}',
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

module.exports = (grunt) => {
  config = {
    pkg: grunt.file.readJSON('package.json'),
    bump: aspects.release.bump,
    clean: {
      dist: dist.clean,
      docs: docs.clean,
      'gh-pages': aspects['gh-pages'].clean,
      lib: aspects.lib.clean,
      release: aspects.release.clean,
    },
    coffee: {
      src: aspects.src.coffee,
      tests: aspects.tests.coffee,
    },
    copy: {
      dist: dist.copy,
      'gh-pages': aspects['gh-pages'].copy,
      lib: aspects.lib.copy,
      release: aspects.release.copy,
    },
    'gh-pages': {
      'gh-pages': aspects['gh-pages']['gh-pages'],
    },
    groc: {
      docs: docs.groc,
    },
    markdown: {
      'gh-pages': aspects['gh-pages'].markdown,
    },
    qunit: {
      tests: aspects.tests.qunit,
    },
    uglify: {
      release: aspects.release.uglify,
    },
    watch: {
      // Caveat: These watch tasks do not clean.
      js: aspects.src.watch.js,
    },
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
  for (const name in aspects) {
    if (aspects.hasOwnProperty(name)) {
      if (name === 'src') { continue; }
      aspects[name].task();
    }
  }
};
