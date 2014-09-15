(function(exports){
  function HexTile(xyz, value) {
    this.key = xyz.join(',');
    this.xyz = xyz;
    this.value = value;
  };

  function HexGrid() {
    this.tiles = [];
    this.tileKeys = {};

    this.addTile = function(xyz, value) {
      var tile = new HexTile(xyz, value);
      this.tiles.push(tile);
      this.tileKeys[xyzKey(xyz)] = tile;
    };

    this.emptyEdgeXyzs = function() {
      return emptyEdgeXyzs(_.map(this.tiles, 'xyz'));
    };

    this.tileByKey = function(key) {
      return this.tileKeys[key];
    };

    this.neighborTiles = function(xyz) {
      return _(neighborKeys(xyz)).map(this.tileByKey.bind(this)).compact().value();
    };

    this.toValueStream = function() {
      return gridToValueStream(this);
    };
  };

  function emptyEdgeXyzs(xyzs) {
    var allNeighborKeys = _(xyzs).map(neighborKeys).flatten().uniq().value();
    var xyzKeys = _.map(xyzs, xyzKey);
    return _(allNeighborKeys).difference(xyzKeys).map(xyzFromKey).value();
  };

  var neighborOffsets = [
    [1, 0, -1],
    [1, -1, 0],
    [0, -1, 1],
    [-1, 0, 1],
    [-1, 1, 0],
    [0, 1, -1]
  ];

  function neighborKeys(xyz) {
    return _.map(neighborOffsets, function(ofs) {
      return xyzKey([xyz[0] + ofs[0], xyz[1] + ofs[1], xyz[2] + ofs[2]]);
    });
  };

  function xyzKey(xyz) {
    return xyz.join(',');
  };

  function xyzFromKey(xyzKey) {
    return _.map(xyzKey.split(','), function(s) { return parseInt(s); });
  };

  function originXyz() {
    return [0, 0, 0];
  };

  function processConnectedTiles(getValue, encodeValue) {
    var candidates = [xyzKey(originXyz())];
    var encoded = {};
    while(candidates.length > 0) {
      var key = candidates.shift();
      if (!encoded[key]) {
        var value = getValue(key);
        encodeValue(key, value);
        encoded[key] = true;
        if (value) {
          candidates = candidates.concat(neighborKeys(xyzFromKey(key)));
        }
      }
    };
  };

  function gridToValueStream(grid) {
    var stream = [];
    var getValue = function(key) {
      var tile = grid.tileByKey(key);
      return tile ? tile.value : undefined;
    };
    var encodeValue = function(key, value) {
      stream.push(value);
    };
    processConnectedTiles(getValue, encodeValue);
    return stream;
  };

  function valueStreamToGrid(stream) {
    stream = _.clone(stream);
    var getValue = function(key) {
      return stream.shift();
    };
    var grid = new HexGrid();
    var encodeValue = function(key, value) {
      if (value) {
        grid.addTile(xyzFromKey(key), value);
      }
    }
    processConnectedTiles(getValue, encodeValue);
    return grid;
  };

  function SmyckeGridGenerator() {
  };

  SmyckeGridGenerator.prototype.initialGrid = function() {
    var grid = new HexGrid();
    grid.addTile([0, 0, 0], 'white');
    grid.addTile([1, 0, -1], 'white');
    grid.addTile([1, -1, 0], 'gray');
    grid.addTile([0, -1, 1], 'white');
    grid.addTile([-1, 0, 1], 'gray');
    grid.addTile([-1, 1, 0], 'white');
    grid.addTile([0, 1, -1], 'gray');
    return grid;
  };

  SmyckeGridGenerator.prototype.tiles = function() {
    return _({
      white: 5,
      black: 8,
      gray: 6,
      green: 3,
      yellow: 3,
      red: 3
    })
    .reduce(function(tiles, count, color) {
      return tiles.concat(_.times(count, _.constant(color)));
    }, []);
  };

  SmyckeGridGenerator.prototype.nextSpot = function(grid, candidates, nextColor) {
    return _.sample(candidates);
  };

  SmyckeGridGenerator.prototype.nextSpotNoTouching = function(grid, candidates, nextColor) {
    candidates = _(candidates).reject(function(xyz) {
      return _.some(grid.neighborTiles(xyz), function(tile) {
        return tile.value === nextColor;
      });
    }).value();
    return _.sample(candidates);
  };

  SmyckeGridGenerator.prototype.nextSpotSticky = function(grid, candidates, nextColor) {
    var sameColors = _(candidates).filter(function(xyz) {
      return _.some(grid.neighborTiles(xyz), function(tile) {
        return tile.value === nextColor;
      });
    }).value();
    return _.sample((sameColors.length > 0) ? sameColors : candidates);
  };

  SmyckeGridGenerator.prototype.nextSpotBlackFlowers = function(grid, candidates, nextColor) {
    var sticksTo = {
      'black': ['gray', 'white'],
      'white': ['white'],
      'gray': ['gray'],
      'red': ['black'],
      'green': ['black'],
      'yellow': ['black']
    };

    var someColors = _(candidates)
      .filter(function(xyz) {
        return _.all(grid.neighborTiles(xyz), function(tile) {
          return _.contains(sticksTo[nextColor], tile.value);
        });
      })
      .value();
    return _.sample((someColors.length > 0) ? someColors : candidates);
  };

  SmyckeGridGenerator.prototype.generateGrid = function(strategyFn) {
    strategyFn = strategyFn || this.nextSpot;
    var grid = _.reduce(_.shuffle(this.tiles()), function(grid, randomColor) {
      var xyz = strategyFn(grid, grid.emptyEdgeXyzs(), randomColor);
      grid.addTile(xyz, randomColor);
      return grid;
    }.bind(this), this.initialGrid());
    return grid;
  };

  SmyckeGridGenerator.prototype.gridToString = function(grid) {
    var valueStream = grid.toValueStream();
    var str = '';
    _.reduce(valueStream, function(acc, val) {
      if (val && acc.empties) {
        str = str + acc.empties;
        acc = {};
      }

      if (val) {
        str = str + encodeTable[val];
      }
      else if (!val && !acc.empties) {
        acc.empties = 1;
      }
      else if (!val && acc.empties < 9) {
        acc.empties++;
      }
      else if (!val && acc.empties == 9) {
        str = str + '9';
        acc = {};
      }
      return acc;
    }, {});
    return str;
  };

  var encodeTable = {
    'white': 'w',
    'gray': 'G',
    'black': 'b',
    'green': 'g',
    'red': 'r',
    'yellow': 'y'
  };

  var decodeTable = _(encodeTable)
    .invert()
    .assign((function() {
      return _.reduce(_.range(1, 10), function(obj, c) {
        obj[c.toString()] = _.times(c, _.constant(false)); return obj;
      }, {});
    })())
    .value();

  SmyckeGridGenerator.prototype.stringToGrid = function(str) {
    var stream = _(str.split('')).map(function(c) { return decodeTable[c]; }).flatten().value();
    return valueStreamToGrid(stream);
  };

  exports.SmyckeGridGenerator = SmyckeGridGenerator;
})(typeof exports === 'undefined'? this['smyckr']={}: exports);
