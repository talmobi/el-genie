var elGenie = (function() {

  var utils = {
    distance: function(point1, point2) {
      var x = point2.x - point1.x;
      var y = point2.y - point1.y;
      return Math.sqrt( x*x + y*y );
    },
    pointIntersects: function(p, r) {
      return !(p.x > (r.x + r.width) || p.x < r.x || p.y > (r.y + r.height) || p.y < r.y);
    }
  }

  var canvas;

  var width = 960;
  var height = window.innerHeight;

  var defaultCanvasId = "elGenieCanvas";

  // initialize the app and the canvas
  function init(canvasId) {
    if (!canvasId && !document.getElementById(defaultCanvasId)) {
      canvas = document.createElement('canvas');
      canvas.id = defaultCanvasId;
      document.body.appendChild(canvas);
    } else {
      canvas = document.getElementById(canvasId);
    }

    if (!canvas || typeof canvas !== "object") {
      console.log("elGenie app wasn't able to initialize a canvas. Try giving it a canvas Id.");
      return;
    }


    // initialize PIXI.js
    var stage =  new PIXI.Stage(0xEEE),
        //renderer = new PIXI.CanvasRenderer(width, height, canvas, true);
        //renderer = new PIXI.WebGLRenderer(width, height, canvas, true);
        renderer = PIXI.autoDetectRenderer(width, height, canvas, true);

    renderer.view.style.position = "absolute";
    renderer.view.style.top = "0px";
    renderer.view.style.left = "0px";


    // load textures
    var texture = PIXI.Texture.fromImage("genie_lamp.png");
    // create sprite from it
    var sprGenie = new PIXI.Sprite(texture);

    var vertices = [0,300, 135,235, 488,290,
                    620,60, 880,0, 1020,190,
                    1020,280, 777,515, 870,630,
                    270,625, 403,540];

    sprGenie.hitArea = new PIXI.Polygon( vertices );

    sprGenie.tint = 0xDDCC22;

    // setup the genie sprite
    sprGenie.interactive = true;
    sprGenie.buttonMode = true;

    // create rubbing function for genie
    sprGenie.rub = function() {
      console.log("Rub rub!");
    }

    // center at the genie lamps foot
    sprGenie.anchor.x = 0.5; // 0.6
    sprGenie.anchor.y = 0.5; // 0.8

    // set sprGenie at center of screen
    sprGenie.position.x = width / 2 | 0;
    sprGenie.position.y = height / 2 | 0;

    // shrink the lamp a bit
    sprGenie.scale.x = sprGenie.scale.y = .5;

    // setip genie touch events
    var _s = sprGenie;
    _s.mouseup = _s.mouseupoutside = _s.touchend = _s.touchendoutside = function(data) {
      this.startPosition = null;
    }

    sprGenie.mousemove = sprGenie.touchmove = function(data) {
      var currentPosition = data.getLocalPosition(this.parent);

      if (this.startPosition) {
        var currentPosition = data.getLocalPosition(this.parent);

        // calculate distance
        var d = utils.distance(currentPosition, this.startPosition);

        // third of genie width
        if (d > sprGenie.width / 10) {
          // simulate a rub!
          this.rub();
          if (utils.pointIntersects(currentPosition, this.hitArea)) {
            this.startPosition = currentPosition;
          }
        }
      } else {
        if (utils.pointIntersects(currentPosition, this.hitArea)) {
          this.startPosition = currentPosition;
        }
      }
    }

    // add to stage
    stage.addChild(sprGenie);


    requestAnimFrame( animate );
    function animate() {
      requestAnimFrame( animate );

      // render stage
      renderer.render(stage);
    }

  }

  return {
    init: function(canvasId) {
      init(canvasId);
    }
  }
})();

