var elGenie = (function() {

  var utils = {
    distance: function(point1, point2) {
      var x = point2.x - point1.x;
      var y = point2.y - point1.y;
      return Math.sqrt( x*x + y*y );
    },
    pointIntersects: function(p, r) {
      return !(p.x > (r.x + r.width) || p.x < r.x || p.y > (r.y + r.height) || p.y < r.y);
    },
    rectOfPolygon: function(vertices) {
      for (var i = 0; i < vertices.length; i+=2) {
        var r = {x1:0,y1:0,x2:0,y2:0};

        var x = vertices[i];
        var y = vertices[i+1];

        if (x < r.x1)
          r.x1 = x;
        if (x > r.x2)
          r.x2 = x;
        if (y < r.y1)
          r.y1 = y;
        if (y > r.y2)
          r.y2 = y;
      }

      return {x: r.x1, y: r.y1, w: r.x2 - r.x1, h: r.y2 - r.y1};
    },
    drawPolygon: function(graphics, vertices) {
      if (vertices.length < 2)
        return;
      var g = graphics;

      var counter = 0;
      g.moveTo(vertices[counter++], vertices[counter++]);

      while (counter < vertices.length - 1) {
        g.lineTo(vertices[counter++], vertices[counter++]);
      }

      g.endFill();
    },
    resizePolygon: function(vertices, origin, scale) {
      if (!origin) {
        var origin = {x: 0.5, y: 0.5};

        // calculate encircling rectangle of polygon.
        var or = utils.rectOfPolygon(vertices);
      }

      // normalized vertices
      var nv = [];
      for (var i = 0; i < vertices.length; i+=2) {
        var u = vertices[i];
        var v = vertices[i+1];

        nv.push(u * scale || 1);
        nv.push(v * scale || 1);
      }

      var ur = utils.rectOfPolygon(nv);

      console.log(or);
      console.log(ur);

      var o1 = { x: or.w * origin.x, y: or.h * origin.y };
      var o2 = { x: ur.w * origin.x, y: ur.h * origin.y };

      var delta = {x: o1.x - o2.x, y: o1.y - o2.y};

      // readjust the new polygon position with delta
      for (var i = 0; i < nv.length; i+=2) {
        nv[i] += delta.x;
        nv[i+1] += delta.y;
      }

      return nv;
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

    // draw the shape to the canvas for testing
    var g = new PIXI.Graphics();
    g.beginFill(0x00FF00);
    utils.drawPolygon(g, utils.resizePolygon(vertices, null, .5) );
    stage.addChild(g);


    sprGenie.hitArea = new PIXI.Polygon( utils.resizePolygon(vertices, null, .5) );
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

    sprGenie.click = function(data) {
      var p = data.getLocalPosition(this.parent);
      console.log("Cick! [" + p.x + ", " + p.y + "]");
    }

    sprGenie.mousemove = sprGenie.touchmove = function(data) {
      var currentPosition = data.getLocalPosition(this.parent);
      console.log(this.startPosition);

      if (this.startPosition) {

        // calculate distance
        var d = utils.distance(currentPosition, this.startPosition);

        // third of genie width
        if (d > (sprGenie.width / 2)) {
          // simulate a rub!
          this.rub();
          if (this.hitArea.contains(currentPosition)) {
            this.startPosition = currentPosition;
          }
        }
      } else {
        if (this.hitArea.contains(currentPosition)) {
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

