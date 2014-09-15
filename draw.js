var processing;
var grid;
var generator = new smyckr.SmyckeGridGenerator();

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
    white: [255, 255, 255],
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
      processing.background(200);
      drawHexGrid(grid, tileRadius);
      drawClock(30);
    }
  };

  function setupWindowResizeHandler(processing) {
    var update = function() {
      var width = window.innerWidth - 30;
      var height = window.innerHeight - 30;
      processing.size(width, height);
    }
    update();
    $(window).resize(update);
  }

  function drawHexGrid(grid, tileRadius) {
    var centerX = processing.width / 2, centerY = processing.height / 2;
    var offset = [centerX, centerY]; 
    for(var i = 0; i < grid.tiles.length; i++ ){
      var tile = grid.tiles[i];
      var xy = xyzToXy(tile.xyz, tileRadius, offset);
      drawHexTile(xy, tileRadius, tile.value);
    }
  };

  function drawHexTile(xy, radius, c) {
    var i, angle, x, y;
    var clr = colors[c];
    processing.fill(processing.color(clr[0], clr[1], clr[2]));
    processing.strokeWeight(0.7);
    processing.stroke(40);
    processing.beginShape();
    for(i = 0; i < 6; i++) {
      angle = 2 * Math.PI / 6 * (i + 0.5);
      x = xy[0] + radius * Math.cos(angle);
      y = xy[1] + radius * Math.sin(angle);
      processing.vertex(x, y);
    }
    processing.endShape(processing.CLOSE);
  };

  function drawClock(tileRadius) {

   var now = new Date();

   // Moving hours arm by small increments
   var hoursPosition = (now.getHours() % 12 + now.getMinutes() / 60) / 12;
   drawArm(hoursPosition, 1.7 * tileRadius, 7);

   // Moving minutes arm by small increments
   var minutesPosition = (now.getMinutes() + now.getSeconds() / 60) / 60;
   drawArm(minutesPosition, 2.4 * tileRadius, 4);
  }

  function drawArm(position, len, weight) {
    // determine center and max clock arm length
    var centerX = processing.width / 2, centerY = processing.height / 2;
    processing.stroke(0);
    processing.strokeWeight(weight);
    processing.strokeCap(processing.SQUARE);
    processing.line(centerX, centerY,
      centerX + Math.sin(position * 2 * Math.PI) * len,
      centerY - Math.cos(position * 2 * Math.PI) * len);
  }

  function xyzToXy(xyz, hexTileRadius, xyOffset) {
    hexTileRadius = hexTileRadius || 1;
    xyOffset = xyOffset || [0,0];
    var x = hexTileRadius * Math.sqrt(3) * (xyz[0] + xyz[2] / 2);
    var y = hexTileRadius * xyz[2] * 3/2;
    return [x + xyOffset[0], y + xyOffset[1]];
  }
};
