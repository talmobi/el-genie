var elGenie = (function() {

  var utils = {
    distance: function(point1, point2) {
      var x = point2.x - point1.x;
      var y = point2.y - point1.y;
      return Math.sqrt( x*x + y*y );
    },
    pointIntersects: function(p, r) {
      var x = r.x - r.width * r.anchor.x || 0;
      var y = r.y - r.height * r.anchor.y || 0;
      var w = r.width;
      var h = r.height;

      return !(p.x > (x + w) || p.x < x || p.y > (y + h) || p.y < y);
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

    // defines a polygon shape around the lamp (for more accurate collision detection)
    var vertices = [0,300, 135,235, 488,290,
                    620,60, 880,0, 1020,190,
                    1020,280, 777,515, 870,630,
                    270,625, 403,540];

    // tint the sprite in a color (hex RRGGBB)
    sprGenie.tint = 0xDDCC22;

    // make sprite clickable
    sprGenie.interactive = true;
    sprGenie.buttonMode = true;

    // define the magnitude of the wobble effect
    sprGenie.defaultWobbleFactor = .005;
    sprGenie.wobbleFactor = .005;

    // create rubbing function for genie
    sprGenie.rub = function() {
      console.log("Rub rub!");

      this.rubStart = ticks;
      this.rubCycle = ticks;
      this.isRubbing = true;
      this.wobbleFactor += sprGenie.defaultWobbleFactor;

      if (this.wobbleFactor > .1)
        this.wobbleFactor += sprGenie.defaultWobbleFactor;
    }

    sprGenie.tick = function() {
      if (this.isRubbing) {
        if (ticks > this.rubStart + 400) {
          this.isRubbing = false;
          this.wobbleFactor = sprGenie.defaultWobbleFactor;
          this.rotation = 0;
          return;
        }
        if (ticks > this.rubCycle + 30) {
          this.rubCycle = ticks;
          this.wobbleFactor /= 2;
          if (this.wobbleFactor < sprGenie.defaultWobbleFactor)
            this.wobbleFactor = 0;
        }

        this.rotation = Math.sin(ticks) * this.wobbleFactor;
      }
    }

    // center at the genie lamps foot
    sprGenie.anchor.x = .5; // 0.6
    sprGenie.anchor.y = .5; // 0.8

    // set sprGenie at center of screen
    sprGenie.position.x = width / 2 | 0;
    sprGenie.position.y = height / 2 | 0;

    // shrink the lamp a bit
    sprGenie.scale.x = sprGenie.scale.y = .5;

    // setup genie touch events
    var _s = sprGenie;
    _s.mouseup = _s.mouseupoutside = _s.touchend = _s.touchendoutside = function(data) {
      this.startPosition = null;
    }

    sprGenie.mousedown = sprGenie.touchdown = function(data) {
      var p = data.getLocalPosition(this.parent);
      this.rub();
    }

    /*
    // draw hitbox for testing
    var g = new PIXI.Graphics();
    g.beginFill(0x00FF00);
    g.drawRect(sprGenie.x - sprGenie.width * sprGenie.anchor.x,
               sprGenie.y - sprGenie.height * sprGenie.anchor.y, sprGenie.width, sprGenie.height);
    g.endFill();
    stage.addChild(g);
    */

    sprGenie.mousemove = sprGenie.touchmove = function(data) {
      var currentPosition = data.getLocalPosition(this.parent);

      if (this.startPosition) {

        // calculate distance
        var d = utils.distance(currentPosition, this.startPosition);

        // third of genie width
        if (d > (sprGenie.width / 4)) {
          // simulate a rub!
          this.rub();
          this.startPosition = null;
        }
      } else {
        if ( utils.pointIntersects(currentPosition, this)) {
          console.log("x: " + this.x + ", w: " + this.width + ", y: " + this.y + ", h: " + this.height);
          console.log(this.anchor);
          this.startPosition = currentPosition;
        }
      }
    }

    // add to stage
    stage.addChild(sprGenie);

    var ticks = 0;

    setInterval(function() {
      ticks++;
    }, 25);

    requestAnimFrame( animate );
    function animate() {
      //ticks++;

      sprGenie.tick();
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

