var elGenie = (function() {

  /**
    * Utility methods
    */
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
    },
    randomFlip: function(val) {
      val = Math.abs(val);
      var n = Math.random(val * 2) - val;
      return n;
    }
  }

  var canvas;

  var width = 960;
  var height = window.innerHeight;

  var defaultCanvasId = "elGenieCanvas";

  // initialize the app and the canvas
  function init(canvasId) {
    /**
      * Initialize the canvas and renderview
      */
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

    // position the app
    renderer.view.style.position = "absolute";
    renderer.view.style.top = "0px";
    renderer.view.style.left = "0px";

    /**
      * Setup the genie lamp
      */
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
    sprGenie.defaultWobbleFactor = .007;
    sprGenie.wobbleFactor = .005;

    // create rubbing function for genie
    sprGenie.rub = function() {
      //console.log("Rub rub!");

      this.rubStart = ticks;
      this.rubCycle = ticks;
      this.isRubbing = true;
      this.wobbleFactor += sprGenie.defaultWobbleFactor;

      //if (this.wobbleFactor > .1)
      //  this.wobbleFactor += sprGenie.defaultWobbleFactor;
    }

    sprGenie.tick = function() {
      if (this.isRubbing) {
        if (ticks > this.rubStart + 300) {
          this.isRubbing = false;
          this.wobbleFactor = sprGenie.defaultWobbleFactor;
          this.rotation = 0;
          return;
        }
        if (ticks > this.rubCycle + 30) {
          this.rubCycle = ticks;
          this.wobbleFactor -= sprGenie.defaultWobbleFactor * 2;
          if (this.wobbleFactor < sprGenie.defaultWobbleFactor)
            this.wobbleFactor = 0;
        }

        this.rotation = Math.sin(ticks / 2) * this.wobbleFactor;
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

    // variables to limit particle spawn rate
    var particleLimit = 3;
    var particleCounter = 0;

    sprGenie.mousemove = sprGenie.touchmove = function(data) {
      data.originalEvent.preventDefault();

      var currentPosition = data.getLocalPosition(this.parent);


      particleCounter++;
      if (particleCounter > particleLimit) {
        particleCounter = 0;

        // spawn particles
        for (var i = 0; i < 2; i++) {
          var p = new Particle(currentPosition.x + i * 5, currentPosition.y);
          sparkles.push(p);
          sparkleContainer.addChild(p);
        }
      }

      if (this.startPosition) {

        // calculate distance
        var d = utils.distance(currentPosition, this.startPosition);

        // third of genie width
        if (d > (sprGenie.width / 3)) {
          // simulate a rub!
          this.rub();
          this.startPosition = null;
        }
      } else {
        if ( utils.pointIntersects(currentPosition, this)) {
          this.startPosition = currentPosition;
        }
      }
    }

    // add to stage
    stage.addChild(sprGenie);


    /**
      * Configure the mouse trailng sparkles.
      */
    var sparkleContainer = new PIXI.SpriteBatch();
    stage.addChild(sparkleContainer);

    // load the sprite sheet
    var sparkleSheet = PIXI.Texture.fromImage("sparkle.png");

    // slice the sheet into subimages for the animation
    var texSparkles = [];
    var w = 32, h = 32; 
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 4; j++) {
        texSparkles.push( new PIXI.Texture( sparkleSheet,
                          new PIXI.Rectangle( i * w, j * h, w, h ) ) );
      }
    }



    var sparkles = [];

    // sparkle
    function Particle(x, y) {
      var p = new PIXI.Sprite( texSparkles[0] );
      p.interactive = p.buttonMode = false;
      p.position.x = x;
      p.position.y = y;
      p.ticks = 0;
      p.limit = 2 + Math.random() * 3 - 1 | 0;
      p.subImg = 0;
      p.removed = false;
      p.g = .02 * Math.random(); // gravity
      p.v = {
        x: utils.randomFlip(.5),
        y: 0
      } // velocity

      p.tick = function() {
        this.ticks++;
        if (this.ticks > this.limit) {
          this.ticks = 0;
          this.texture = (texSparkles[this.subImg++ % texSparkles.length]);
        }
        // update the particle
        this.rotation += 0.001;

        if (this.subImg >= texSparkles.length) {
          this.kill();
        }

        this.v.y += this.g;
        this.x += this.v.x;
        this.y += this.v.y;
      }

      // destroy the particle and free memory
      p.kill = function() {
        this.removed = true;
      }

      return p;
    }


    /**
      * Start app
      */
    var ticks = 0;

    setInterval(function() {
      ticks++;
    }, 20);

    requestAnimFrame( animate );
    function animate() {
      requestAnimFrame( animate );

      //ticks++;

      sprGenie.tick();

      // update particles
      var buf = [];
      for (var i = 0; i < sparkles.length; i++) {
        var p = sparkles[i];

        if (!p.removed) {
          p.tick();
          buf.push(p);
        } else {
          sparkleContainer.removeChild(p);
        }
      }
      sparkles = buf;
      
      // render stage
      renderer.render(stage);
    }

  }

  /**
    * Public methods.
    */
  return {
    init: function(canvasId) {
      init(canvasId);
    }
  }
})();

