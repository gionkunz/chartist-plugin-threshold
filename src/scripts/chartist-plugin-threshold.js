/**
 * Chartist.js plugin to display a data label on top of the points in a line chart.
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  var defaultOptions = {
    threshold: 0,
    classNames: {
      aboveThreshold: 'ct-threshold-above',
      belowThreshold: 'ct-threshold-below'
    },
    maskNames: {
      aboveThreshold: 'ct-threshold-mask-above',
      belowThreshold: 'ct-threshold-mask-below'
    },
    lineSmooth: Chartist.Interpolation.none({
      fillHoles: true
    })
  };

  function createMasks(chart, threshold, options) {
    // Select the defs element within the chart or create a new one
    var defs = chart.svg.querySelector('defs') || chart.svg.elem('defs');
    var width = chart.svg.width();
    var height = chart.svg.height();

    // Create mask for upper part above threshold
    var aboveMask = defs
      .elem('mask', {
        x: 0,
        y: 0,
        width: width,
        height: height,
        id: options.maskNames.aboveThreshold
      });

    // Create mask for lower part below threshold
    var belowMask = defs
      .elem('mask', {
        x: 0,
        y: 0,
        width: width,
        height: height,
        id: options.maskNames.belowThreshold
      });

    if (threshold.hasData()) {
      // generate SVG path for the threshold series and append to each mask
      var thresholdSvgPath = threshold.generateSvgPath(chart, options.lineSmooth);
      var firstElement = thresholdSvgPath.pathElements[0];
      var lastElement = thresholdSvgPath.pathElements[thresholdSvgPath.pathElements.length - 1];

      // first element is removed and replaced with a line from top-left of the chart to the first point
      var aboveMaskSvgPath = thresholdSvgPath.clone(true)
        .position(0)
        .remove(1)
        .move(firstElement.x, 0)
        .line(firstElement.x, firstElement.y)
        .position(thresholdSvgPath.pathElements.length + 1)
        .line(lastElement.x, 0);

      // first element is removed and replaced with a line from bottom-left of the chart to the first point
      var belowMaskSvgPath = thresholdSvgPath
        .position(0)
        .remove(1)
        .move(firstElement.x, height)
        .line(firstElement.x, firstElement.y)
        .position(thresholdSvgPath.pathElements.length + 1)
        .line(lastElement.x, height);

      aboveMask.elem('path', {
        d: aboveMaskSvgPath.stringify(),
        fill: 'white'
      });

      belowMask.elem('path', {
        d: belowMaskSvgPath.stringify(),
        fill: 'white'
      });
    }

    return defs;
  }

  Chartist.plugins = Chartist.plugins || {};
  Chartist.plugins.ctThreshold = function (options) {

    options = Chartist.extend({}, defaultOptions, options);

    return function ctThreshold(chart) {
      if (chart instanceof Chartist.Line || chart instanceof Chartist.Bar) {
        var threshold = new Threshold(chart, options.threshold);

        chart.on('draw', function (data) {
          // if the element represents the control series, don't apply threshold classes or masks to it
          if (data.series && data.series.name && data.series.name === threshold.value) {
            return;
          }

          if (data.type === 'point') {
            // For points we can just use the data value and compare against the threshold in order to determine
            // the appropriate class

            var thresholdValue = threshold.getThresholdValue(data);

            data.element.addClass(
              data.value.y >= thresholdValue ? options.classNames.aboveThreshold : options.classNames.belowThreshold
            );
          } else if (data.type === 'line' || data.type === 'bar' || data.type === 'area') {
            // Cloning the original line path, mask it with the upper mask rect above the threshold and add the
            // class for above threshold
            data.element
              .parent()
              .elem(data.element._node.cloneNode(true))
              .attr({
                mask: 'url(#' + options.maskNames.aboveThreshold + ')'
              })
              .addClass(options.classNames.aboveThreshold);

            // Use the original line path, mask it with the lower mask rect below the threshold and add the class
            // for blow threshold
            data.element
              .attr({
                mask: 'url(#' + options.maskNames.belowThreshold + ')'
              })
              .addClass(options.classNames.belowThreshold);
          }
        });

        // On the created event, create the two mask definitions used to mask the line graphs
        chart.on('created', function (data) {
          if (threshold.hasData()) {
            createMasks(data, threshold, options);
          }
        });
      }
    };
  };

  /**
   * Constructor for Threshold class.
   *
   * @param {Chartist.Base} chart Chart instance
   * @param {Number|String|Array|Object} value Threshold option passed in to Chartist.plugins.ctThreshold
   * @constructor
   */
  function Threshold(chart, value) {
    this.chart = chart;
    this.value = value;
    this.normalize(value);
  };

  /**
   * Returns the threshold value corresponding to the provided point in a data series.
   *
   * @memberof Threshold
   * @param {Object} A data point from a chart series
   * @return {Number} Threshold value at given point
   */
  Threshold.prototype.getThresholdValue = function(point) {
    var thresholdPoint;

    if (point.value.x !== undefined) {
      // for mult-dimensional points, find the point at x
      thresholdPoint = this.series.data.filter(function(tp) {
        return tp.x === point.value.x;
      }).pop();
    } else if (this.series.data[point.index]) {
      // for plain arrays, use value at the series index
      thresholdPoint = this.series.data[point.index];
    }

    return Chartist.getMultiValue(thresholdPoint, 'y');
  };

  /**
   * Checks if the threshold instance contains any data.
   *
   * @memberof Threshold
   * @return {Boolean} True if the threshold series contains any data, false otherwise
   */
  Threshold.prototype.hasData = function() {
    return this.series && this.series.data.length > 0;
  };

  /**
   * Generates and returns an SVG Path for the threshold data.
   *
   * @memberof Threshold
   * @param {Object} chartProperties An object containing properties of the chart for which the path is being drawn
   * @param {Function} interpolator Interpolation function to use when rendering the path
   * @return {Chartist.Svg.Path} SVG path representing the threshold data
   */
  Threshold.prototype.generateSvgPath = function(chartProperties, interpolator) {
    var pathCoordinates = [];
    var pathData = [];
    var data = this.series.data;

    data.forEach(function(value, valueIndex) {
      var p = {
        x: chartProperties.chartRect.x1 + chartProperties.axisX.projectValue(value, valueIndex, data),
        y: chartProperties.chartRect.y1 - chartProperties.axisY.projectValue(value, valueIndex, data)
      };

      pathCoordinates.push(p.x, p.y);
      pathData.push({
        value: value,
        valueIndex: valueIndex
      });
    });

    return interpolator(pathCoordinates, pathData);
  };

  /**
   * Converts threshold value to a data series and normalizes the data.
   *
   * @memberof Threshold
   * @param {Number|String|Array|Object} Value of the threshold option passed in to plugin
   * @return {Threshold} Threshold instance
   */
  Threshold.prototype.normalize = function(value) {
    this.series = null;

    // if threshold is a static number, generate a series of static data points
    if (Chartist.isNum(value)) {
      var data = [];

      if (this.chart.data.series.length) {
        var axisX = this.chart.options.axisX;

        // if using multi-dimensional points, we have to generate a point for each value of x
        if (axisX.type && axisX.type.prototype.constructor.name != 'StepAxis') {
          var points = {};

          this.chart.data.series.forEach(function(series) {
            (series.data || series).forEach(function(point) {
              points[point.x] = true;
            });
          });

          data = Object.keys(points).map(function(x) {
            return {x: +x, y: value};
          });
        } else {
          var count = this.chart.data.series.reduce(function(prev, curr) {
            return Math.max(prev, (curr.data || curr).length);
          }, 0);

          data = Chartist.times(count).map(function() {
            return value;
          });
        }
      }

      this.series = {
        data: data,
        name: '_threshold'
      };
    } else {
      // if threshold is a string, map threshold to series data of matching name
      if (typeof value === 'string') {
        this.series = this.chart.data.series.reduce(function(prev, curr) {
          return curr.name === value ? curr : prev;
        }, value);
      } else if (value.constructor === Array) {
        this.series = {
          data: value,
          name: '_threshold'
        };
      }

      // if threshold is not an array or valid series name, throw an exception
      if (!(this.series instanceof Object) || !this.series.data) {
        throw new Error('Invalid \'threshold\' value provided to chartist-plugin-threshold: ' + value);
      }
    }

    var normalizedData = Chartist.normalizeData({
      series: [this.series]
    });

    this.series.data = Chartist.getDataArray(normalizedData, this.chart.options.reverseData, true).shift();

    return this;
  };
}(window, document, Chartist));
