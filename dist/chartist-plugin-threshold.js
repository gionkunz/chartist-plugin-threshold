(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Chartist.plugins.ctThreshold'] = factory();
  }
}(this, function () {

  /**
   * Chartist.js plugin to display a data label on top of the points in a line chart.
   *
   */
  /* global Chartist */
  (function(window, document, Chartist) {
    'use strict';

    var defaultOptions = {
      threshold: 0,
      classNames: {
        aboveThreshold: 'ct-threshold-above',
        belowThreshold: 'ct-threshold-below'
      }
    };

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.ctThreshold = function(options) {

      options = Chartist.extend({}, defaultOptions, options);

      return function ctThreshold(chart) {
        if(chart instanceof Chartist.Line) {
          chart.on('draw', function(data) {
            if(data.type === 'point') {
              data.element.addClass(
                data.value >= options.threshold ? options.classNames.aboveThreshold : options.classNames.belowThreshold
              );
            }
          });
        }
      };
    };

  }(window, document, Chartist));

  return Chartist.plugins.ctThreshold;

}));
