/*jslint browser: true, indent: 2 */
/*global google*/

(function() {
  'use strict';

  // http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
  var clone = function(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
      var copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
      var copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      var copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
      }
      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

  var isArray = function(variable) {
    return Object.prototype.toString.call(variable) === "[object Array]"
  };

  var standardSeries = function(series) {
    var i, j, data, r, key;

    // clean data
    if (!isArray(series) || typeof series[0] !== "object") {
      series = [{name: "Value", data: series}];
    }

    // right format
    for (i = 0; i < series.length; i += 1) {
      data = series[i].data;
      if (!isArray(data)) {
        r = [];
        for (j in data) {
          key = j;
          if (typeof key === "string") {
            key = (new Date(key)).getTime() / 1000.0;
          }
          r.push([key, data[j]]); // TODO typecast
        }
        r.sort(function(a,b){ return a[0] - b[0] });
        series[i].data = r;
      }
    }

    return series;
  }

  if ("Highcharts" in window) {

    var defaultOptions = {
      xAxis: {
        labels: {
          style: {
            fontSize: "12px"
          }
        }
      },
      yAxis: {
        title: {
          text: null
        },
        labels: {
          style: {
            fontSize: "12px"
          }
        }
      },
      title: {
        text: null
      },
      credits: {
        enabled: false
      },
      legend: {
        borderWidth: 0
      },
      tooltip: {
        style: {
          fontSize: "12px"
        }
      }
    };

    var jsOptions = function(opts) {
      var options = clone(defaultOptions);
      if ("min" in opts) {
        options.yAxis.min = opts.min;
      }
      if ("max" in opts) {
        options.yAxis.max = opts.max;
      }
      return options;
    }

    var Chartkick = {
      LineChart: function(elementId, series, opts) {
        var options = jsOptions(opts), data, i, j;
        options.xAxis.type = "datetime";
        options.chart = {type: "spline"};

        for (i = 0; i < series.length; i += 1) {
          data = series[i].data;
          for (j = 0; j < data.length; j += 1) {
            data[j][0] = data[j][0] * 1000;
          }
          series[i].marker = {symbol: "circle"};
        }
        options.series = series;

        if (series.length == 1) {
          options.legend = {enabled: false};
        }
        $(document.getElementById(elementId)).highcharts(options);
      },
      PieChart: function(elementId, series, opts) {
        var options = jsOptions(opts);
        options.series = [{
          type: "pie",
          name: "Value",
          data: series
        }];
        $(document.getElementById(elementId)).highcharts(options);
      },
      ColumnChart: function(elementId, series, opts) {
        var options = jsOptions(opts), data, i, j;
        options.chart = {type: "column"};

        var i, j, s, d, rows = [];
        for (i = 0; i < series.length; i += 1) {
          s = series[i];

          for (j = 0; j < s.data.length; j += 1) {
            d = s.data[j];
            if (!rows[d[0]]) {
              rows[d[0]] = new Array(series.length);
            }
            rows[d[0]][i] = d[1];
          }
        }

        var categories = [];
        for (i in rows) {
          categories.push(i);
        }
        options.xAxis.categories = categories;

        var newSeries = [];
        for (i = 0; i < series.length; i += 1) {
          d = [];
          for (j = 0; j < categories.length; j += 1) {
            d.push(rows[categories[j]][i]);
          }

          newSeries.push({
            name: series[i].name,
            data: d
          });
        }
        options.series = newSeries;

        if (series.length == 1) {
          options.legend.enabled = false;
        }
        $(document.getElementById(elementId)).highcharts(options);
      }
    };

  }
  else {
    google.load("visualization", "1.0", {"packages": ["corechart"]});

    // Set chart options
    var defaultOptions = {
      fontName: "'Lucida Grande', 'Lucida Sans Unicode', Verdana, Arial, Helvetica, sans-serif",
      pointSize: 6,
      legend: {
        textStyle: {
          fontSize: 12,
          color: "#444"
        },
        alignment: "center",
        position: "right"
      },
      curveType: "function",
      hAxis: {
        textStyle: {
          color: "#666",
          fontSize: 12
        },
        gridlines: {
          color: "transparent"
        },
        baselineColor: "#ccc"
      },
      vAxis: {
        textStyle: {
          color: "#666",
          fontSize: 12
        },
        baselineColor: "#ccc",
        viewWindow: {}
      },
      tooltip: {
        textStyle: {
          color: "#666",
          fontSize: 12
        }
      }
    }

    var createDataTable = function(series, columnType) {
      var data = new google.visualization.DataTable()
      data.addColumn(columnType, "");

      var i, j, s, d, rows = [];
      for (i = 0; i < series.length; i += 1) {
        s = series[i];
        data.addColumn("number", s.name);

        for (j = 0; j < s.data.length; j += 1) {
          d = s.data[j];
          if (!rows[d[0]]) {
            rows[d[0]] = new Array(series.length);
          }
          rows[d[0]][i] = d[1];
        }
      }

      var rows2 = [];
      for (i in rows) {
        rows2.push([columnType == "datetime" ? new Date(i * 1000) : i].concat(rows[i]));
      }
      data.addRows(rows2);

      return data;
    };

    var jsOptions = function(opts) {
      var options = clone(defaultOptions);
      if ("min" in opts) {
        options.vAxis.viewWindow.min = opts.min;
      }
      if ("max" in opts) {
        options.vAxis.viewWindow.max = opts.max;
      }
      return options;
    }

    var Chartkick = {
      LineChart: function(elementId, series, opts) {
        google.setOnLoadCallback(function() {
          var data = createDataTable(series, "datetime");

          var options = jsOptions(opts);
          if (series.length == 1) {
            options.legend.position = "none";
          }

          var chart = new google.visualization.LineChart(document.getElementById(elementId));
          chart.draw(data, options);
        });
      },
      PieChart: function(elementId, series, opts) {
        google.setOnLoadCallback(function() {
          var data = new google.visualization.DataTable();
          data.addColumn("string", "");
          data.addColumn("number", "Value");
          data.addRows(series);

          var options = jsOptions(opts);
          options.chartArea = {
            top: "10%",
            height: "80%"
          };

          var chart = new google.visualization.PieChart(document.getElementById(elementId));
          chart.draw(data, options);
        });
      },
      ColumnChart: function(elementId, series, opts) {
        google.setOnLoadCallback(function() {
          var data = createDataTable(series, "string");

          var options = jsOptions(opts);
          if (series.length == 1) {
            options.legend.position = "none";
          }

          var chart = new google.visualization.ColumnChart(document.getElementById(elementId));
          chart.draw(data, options);
        });
      }
    };
  }

  Chartkick.RemoteLineChart = function(elementId, dataSource, opts) {
    // TODO no jquery
    // TODO handle errors
    $.getJSON(dataSource, {}, function(data, textStatus, jqXHR) {
      // TODO parse JSON when jquery gone
      var series = standardSeries(data);
      new Chartkick.LineChart(elementId, series, opts);
    });
  }

  window.Chartkick = Chartkick;
})();
