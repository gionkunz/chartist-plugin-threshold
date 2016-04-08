# Threshold plugin for Chartist

This Chartist plugin can be used to divide your Line or Bar chart with a threshold. Everything above and below the
threshold will be tagged with a special class, in order for your to apply different styling where appropriate.

![Threshold Example Screenshot](https://raw.github.com/gionkunz/chartist-plugin-threshold/master/ct-threshold-demo.gif "Threshold Example Screenshot")

## Usage example

You can use the Plugin for bar and line charts. Chartist will split the relevant elements so that they get divided in
an above and below part. All elements will receive classes that allow you to style the parts above the threshold different
than the parts below.

```javascript
new Chartist.Line('.ct-chart', {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    [5, -4, 3, 7, 20, 10, 3, 4, 8, -10, 6, -8]
  ]
}, {
  showArea: true,
  axisY: {
    onlyInteger: true
  },
  plugins: [
    Chartist.plugins.ctThreshold({
      threshold: 4
    })
  ]
});
```

You can also set the threshold option to an array of values in order to specify a variable threshold. An additional
"lineSmooth" setting is available to control the smoothing of the threshold line with all Chartist.Interpolation functions
as available options.

```javascript
new Chartist.Line('.ct-chart', {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    [5, -4, 3, 7, 20, 10, 3, 4, 8, -10, 6, -8]
  ]
}, {
  showArea: true,
  axisY: {
    onlyInteger: true
  },
  plugins: [
    Chartist.plugins.ctThreshold({
      threshold: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      lineSmooth: Chartist.Interpolation.none()
    })
  ]
});
```

If you are using named series, you can even specify the name of an existing series to use as the threshold for other series
in the chart.

```javascript
new Chartist.Line('.ct-chart', {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [{
    name: 'goal',
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }, {
    name: 'sales',
    data: [5, -4, 3, 7, 20, 10, 3, 4, 8, -10, 6, -8]
  }]
}, {
  series: {
    'goal': {
      showPoint: false,
      showLine: true
    },
    'sales': {
      showPoint: true,
      showArea: true
    }
  },
  axisY: {
    onlyInteger: true
  },
  plugins: [
    Chartist.plugins.ctThreshold({
      threshold: 'goal',
      lineSmooth: Chartist.Interpolation.simple()
    })
  ]
});
```

If your data series uses multi-dimensional {x,y} coordinates (typically with AutoScaleAxis), be sure that your variable
threshold series contains a point for each value of x found in the data series, otherwise the plugin may produce
unexpected results.

## Styling

Use the following CSS to style the chart parts

```css
.ct-line.ct-threshold-above, .ct-point.ct-threshold-above, .ct-bar.ct-threshold-above {
  stroke: #f05b4f;
}

.ct-line.ct-threshold-below, .ct-point.ct-threshold-below, .ct-bar.ct-threshold-below {
  stroke: #59922b;
}

.ct-area.ct-threshold-above {
  fill: #f05b4f;
}

.ct-area.ct-threshold-below {
  fill: #59922b;
}
```

You can, of course, also split multiple series with the threshold plugin. Just make sure you modify the CSS selectors
with the necessary parent series class.

```css
.ct-series-a .ct-bar.ct-threshold-above {
  stroke: #f05b4f;
}

.ct-series-a .ct-bar.ct-threshold-below {
  stroke: #59922b;
}
```

## Default options

These are the default options of the threshold plugin. All options can be customized within the plugin factory function.

```
var defaultOptions = {
  threshold: 0,
  classNames: {
    aboveThreshold: 'ct-threshold-above',
    belowThreshold: 'ct-threshold-below'
  },
  maskNames: {
    aboveThreshold: 'ct-threshold-mask-above',
    belowThreshold: 'ct-threshold-mask-below'
  }
};
```
