describe('ctThreshold', function () {
  'use strict';

  beforeEach(function () {

  });

  afterEach(function () {

  });

  it('should be defined in chartist', function () {
    expect(window.Chartist.plugins.ctThreshold).toBeDefined();
  });

  it('.ct-threshold-below and .ct-threshold-below elements must be present', function () {
    new window.Chartist.Line('#chart', {
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
        window.Chartist.plugins.ctThreshold({
          threshold: 4
        })
      ]
    });

    expect(document.querySelector('#chart svg .ct-threshold-below')).toBeDefined();
    expect(document.querySelector('#chart svg .ct-threshold-above')).toBeDefined();
  });
});
