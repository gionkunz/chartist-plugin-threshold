/**
 * jasmine
 * =======
 *
 * Test settings
 *
 * Link: https://github.com/gruntjs/grunt-contrib-jasmine
 */

'use strict';

module.exports = function () {
  return {
    dist: {
      src: [
        // ugly just to make this work
        'node_modules/chartist/dist/chartist.js',
        '<%= pkg.config.dist %>/chartist-plugin-threshold.js'
      ],
      options: {
        specs: '<%= pkg.config.test %>/spec/spec-*.js',
        // helpers: '<%= pkg.config.test %>/spec/helper-*.js',
        phantomjs: {
          'ignore-ssl-errors': true
        }
      }
    }
  };
};
