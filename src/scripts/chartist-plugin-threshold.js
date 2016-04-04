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

  function createMasks(chart, thresholdSeries, options) {
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

    if (thresholdSeries.data.length) {
      // generate SVG path for the threshold series and append to each mask
      var interpolator = options.lineSmooth;
      var thresholdSvgPath = createThresholdSvgPath(chart, thresholdSeries.data, interpolator);
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

  // generates an SVG Path for the given threshold data and returns an instance of Chartist.Svg.Path
  function createThresholdSvgPath(chart, thresholdData, interpolator) {
    var pathCoordinates = [];
    var pathData = [];

    thresholdData.forEach(function(value, valueIndex) {
      var p = {
        x: chart.chartRect.x1 + chart.axisX.projectValue(value, valueIndex, thresholdData),
        y: chart.chartRect.y1 - chart.axisY.projectValue(value, valueIndex, thresholdData)
      };

      pathCoordinates.push(p.x, p.y);
      pathData.push({
        value: value,
        valueIndex: valueIndex,
        meta: ''
      });
    });

    return interpolator(pathCoordinates, pathData);
  }

  // converts threshold parameter to a data series, normalizes data, and returns threshold series
  function normalizeThresholdData(threshold, chart) {
    var thresholdSeries;

    if (Chartist.isNum(threshold)) {
      // if threshold is a static number, generate a series of static data points
      var data = [];

      if (chart.data.series.length) {
        var count = chart.data.series.reduce(function(prev, curr) {
          return Math.max(prev, (curr.data || curr).length);
        }, 0);

        data = Chartist.times(count).map(function() {
          return threshold;
        });
      }

      thresholdSeries = {
        data: data,
        name: '_threshold'
      };
    } else {
      // if threshold is a string, map threshold to series data of matching series
      if (typeof threshold === 'string') {
        thresholdSeries = chart.data.series.reduce(function(prev, curr) {
          return curr.name === threshold ? curr : prev;
        }, threshold);
      } else if (threshold.constructor === Array) {
        thresholdSeries = {
          data: threshold,
          name: '_threshold'
        };
      }

      // if threshold is not an array or valid series name, throw an exception
      if (!(thresholdSeries instanceof Object) || !thresholdSeries.data) {
        throw new Error('Invalid \'threshold\' value provided to chartist-plugin-threshold: ' + threshold);
      }
    }

    var normalizedData = Chartist.normalizeData({
      series: [thresholdSeries]
    });

    thresholdSeries.data = Chartist.getDataArray(normalizedData, chart.options.reverseData, true).shift();
    return thresholdSeries;
  }

  Chartist.plugins = Chartist.plugins || {};
  Chartist.plugins.ctThreshold = function (options) {

    options = Chartist.extend({}, defaultOptions, options);

    return function ctThreshold(chart) {
      if (chart instanceof Chartist.Line || chart instanceof Chartist.Bar) {
        var thresholdSeries = normalizeThresholdData(options.threshold, chart);

        chart.on('draw', function (data) {
          // if the element represents the control series, don't apply threshold classes or masks to it
          if (data.series && data.series.name && data.series.name === thresholdSeries.name) {
            return;
          }

          if (data.type === 'point') {
            // For points we can just use the data value and compare against the threshold in order to determine
            // the appropriate class

            // use point at given index in the threshold data as the threshold for the current point
            var thresholdPoint = thresholdSeries.data[data.index] || {y: 0};
            var thresholdValue = +thresholdPoint.y || 0;

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
          if (thresholdSeries.data.length) {
            createMasks(data, thresholdSeries, options);
          }
        });
      }
    };
  };
}(window, document, Chartist));
