var processing;
var grid;
var generator = new smyckr.SmyckeGridGenerator();

function makeNewPattern() {
  var strategy = _.sample([
    generator.nextSpot.bind(generator),
    generator.nextSpotNoTouching.bind(generator),
    generator.nextSpotSticky.bind(generator),
    generator.nextSpotBlackFlowers.bind(generator)
  ]);
  grid = generator.generateGrid(strategy);
  displayGridString(generator.gridToString(grid));
  drawSmyckeClock(grid)(processing);
};

function run() {
  var canvas = document.getElementById("canvas1");
  if (!getGridString()) {
    grid = generator.generateGrid();
    displayGridString(generator.gridToString(grid));
  }
  else {
    grid = generator.stringToGrid(getGridString());
  }
  processing = new Processing(canvas, drawSmyckeClock(grid));
};

function getGridString() {
  var href = document.location.href;
  var foundFragment = href.match(/#[a-zA-Z0-9]+$/);
  if (foundFragment) {
    return foundFragment[0].substr(1);
  }
  else {
    return false;
  }
};

function displayGridString(gridString) {
  var href = document.location.href;
  var foundFragment = href.match(/#.*$/);
  if (foundFragment) {
    document.location.href = href.replace(/#.*$/, '#' + gridString);
  }
  else {
    document.location.href = href + '#' + gridString;
  }
};

function drawSmyckeClock(grid) {
  var colors = {
    white: [245, 245, 240],
    black: [20, 20, 20],
    gray: [127,127,127],
    yellow: [240, 240, 0],
    red: [240, 0, 0],
    green: [0, 240, 0]
  };

  return function(processing) {
    var tileRadius = 30;
    processing.setup = function() {
      setupWindowResizeHandler(processing);
      processing.frameRate(6);
    }
    processing.draw = function() {
      processing.background(255);
      var clockCenter = drawHexGrid(grid, tileRadius);
      drawClock(30, clockCenter);
    }
  };

  function setupWindowResizeHandler(processing) {
    var update = function() {
      var width = window.innerWidth - 30;
      var height = window.innerHeight - 100;
      processing.size(width, height);
    }
    update();
    $(window).resize(update);
  }

  function drawHexGrid(grid, tileRadius) {
    var centerX = processing.width / 2, centerY = processing.height / 2;
    var minX = 0, maxX = 0, minY = 0, maxY = 0;
    var tilesVertices = _.map(grid.tiles, function(tile) {
      var xy = xyzToXy(tile.xyz, tileRadius);
      var vertices = tileVertices(xy, tileRadius);
      _.forEach(vertices, function(v) {
        minX = Math.min(minX, v[0]);
        maxX = Math.max(maxX, v[0]);
        minY = Math.min(minY, v[1]);
        maxY = Math.max(maxY, v[1]);
      });
      return vertices;
    });
    var offset = [centerX - (maxX - Math.abs(minX)) / 2, centerY - (maxY - Math.abs(minY)) / 2];
    tilesVertices = _.map(tilesVertices, function(vs) {
      return _.map(vs, function(v) {
        return [v[0] + offset[0], v[1] + offset[1]];
      });
    });
    _.forEach(tilesVertices, drawTileShadow);
    _.forEach(tilesVertices, function(vertices, i) {
      drawTile(vertices, grid.tiles[i].value);
    });
    return offset;
  };

  function tileVertices(xy, radius) {
    return _.map(_.range(6), function(dir) {
      var angle = 2 * Math.PI / 6 * (dir + 0.5);
      var x = xy[0] + radius * Math.cos(angle);
      var y = xy[1] + radius * Math.sin(angle);
      return [x, y];
    });
  };

  function drawTileShadow(vertices) {
    processing.strokeWeight(4);
    processing.stroke(200);
    processing.noFill();
    processing.beginShape();
    _.forEach(vertices, function(v) {
      processing.vertex(v[0] - 2, v[1] + 2);
    });
    processing.endShape(processing.CLOSE);
  };

  function drawTile(vertices, colorName) {
    var clr = colors[colorName];
    processing.fill(processing.color(clr[0], clr[1], clr[2]));
    processing.strokeWeight(0.7);
    processing.stroke(40);
    processing.beginShape();
    _.forEach(vertices, function(v) {
      processing.vertex(v[0], v[1]);
    });
    processing.endShape(processing.CLOSE);
  };

  function drawClock(tileRadius, centerXy) {
   var now = new Date();

   // Moving hours arm by small increments
   var hoursPosition = (now.getHours() % 12 + now.getMinutes() / 60) / 12;
   drawArm(hoursPosition, 1.7 * tileRadius, 7, centerXy);

   // Moving minutes arm by small increments
   var minutesPosition = (now.getMinutes() + now.getSeconds() / 60) / 60;
   drawArm(minutesPosition, 2.4 * tileRadius, 4, centerXy);
  }

  function drawArm(position, len, weight, centerXy) {
    // determine center and max clock arm length
    processing.stroke(0);
    processing.strokeWeight(weight);
    processing.strokeCap(processing.SQUARE);
    processing.line(centerXy[0], centerXy[1],
      centerXy[0] + Math.sin(position * 2 * Math.PI) * len,
      centerXy[1] - Math.cos(position * 2 * Math.PI) * len);
  }

  function xyzToXy(xyz, hexTileRadius) {
    hexTileRadius = hexTileRadius || 1;
    var x = hexTileRadius * Math.sqrt(3) * (xyz[0] + xyz[2] / 2);
    var y = hexTileRadius * xyz[2] * 3/2;
    return [x, y];
  }
};
