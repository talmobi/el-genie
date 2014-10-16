var elGenie = (function() {

  /**
    * Set starry image to glow.
    */
  var glowing = true;
  (function() {
    var img = $('#elStarsImageGlow');

    var duration = 1000;

    function loop() {
      if (glowing) {
        img.fadeIn(duration, function() {
          img.fadeOut(duration, loop);
        })
      }
    }
    if (img) {
      loop();
    }
  })();
  var _img = $('#elStarsImage');
  if (_img && false) {
    function loop(){
      if(playing){
        $('.images img:eq(1)').fadeIn(700, function(){
          $(this).fadeOut(700,loop);
        });
      }
    }

    loop(); // start loop
  }

  /**
    * App configuration
    */
  var DEBUG = false;

  var ismobile = (WURFL) ? WURFL.is_mobile : true;
  var sparkleMode = 2;
  var SCALE = 1;
  var WIDTH = 960 || window.innerWidth; // 960
  var HEIGHT = window.innerHeight;
  var FPS = (ismobile) ? 20 : 20;
  var MSPF = 1000 / FPS; // MS per Frame
  var TPS = (ismobile) ? 20 : 20;;
  var MSPT = 1000 / TPS; // MS per Frame
  var running = true;

  /**
    * Info.js (based on stats.js)
    */
  var info = null;
  if (DEBUG && false) {
    info = new Info();
    info.setMode(0); // 0: info box 1, 1: info box 2

    // Align top-left
    info.domElement.style.position = 'absolute';
    info.domElement.style.left = '0px';
    info.domElement.style.top = '0px';

    document.body.appendChild( info.domElement );
  }

  /**
    * Custom utility methods
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
      var origin = origin || {x: 0, y: 0};
      // calculate encircling rectangle of polygon.
      var or = utils.rectOfPolygon(vertices);

      // normalized vertices
      var nv = [];
      for (var i = 0; i < vertices.length; i+=2) {
        var u = vertices[i];
        var v = vertices[i+1];

        nv.push(u * scale || 1);
        nv.push(v * scale || 1);
      }

      var ur = utils.rectOfPolygon(nv);

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
    movePolygon: function(vertices, x, y) {
      if (vertices.length < 2)
        return;

      for (var i = 0; i < vertices.length; i+=2) {
        vertices[i] += x;
        vertices[i+1] += y;
      }
    },
    randomFlip: function(val) {
      val = Math.abs(val);
      return ((Math.random() * (val * 2)) - val);
    }
  }

  var canvas;

  var width = WIDTH || window.innerWidth;
  var height = HEIGHT || window.innerHeight;

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
    var texture = PIXI.Texture.fromImage("images/genie_lamp.png");
    // create sprite from it
    var sprGenie = new PIXI.Sprite(texture);

    // center at the genie lamps foot
    sprGenie.anchor.x = .5; // 0.6
    sprGenie.anchor.y = .5; // 0.8

    // set sprGenie at center of screen
    function positionGenieLamp() {
      sprGenie.position.x = (width * .465) | 0;
      //sprGenie.position.y = (height * .5) | 0;
      sprGenie.position.y = (205 + 370 * sprGenie.anchor.y);
    }
    positionGenieLamp();

    // shrink the lamp a bit
    sprGenie.scale.x = sprGenie.scale.y = SCALE;

    // defines a polygon shape around the lamp (for more accurate collision detection)
    /*var vertices = [0,300, 135,235, 488,290,
                    620,60, 880,0, 1020,190,
                    1020,280, 777,515, 870,630,
                    270,625, 403,540];
                    */
    // high res lamp rexture
    var vertices = [0, 100, 420, 0, 740, 50,
                    750, 250, 510, 350, 300, 350,
                    0, 160];

    var scaledVertices, polygonBox, scaledPolygon;

    function initPolygon() {
      scaledVertices = utils.resizePolygon(vertices, null, SCALE);
      polygonBox = utils.rectOfPolygon(scaledVertices);

      var xx = sprGenie.x - 774 * SCALE * sprGenie.anchor.x;
      var yy = sprGenie.y - 364 * SCALE * sprGenie.anchor.y;
      //var xx = sprGenie.x - sprGenie.width * .93;
      //var yy = sprGenie.y - sprGenie.height * .75;
      utils.movePolygon(scaledVertices, xx, yy);
      scaledPolygon = new PIXI.Polygon( scaledVertices );
    }
    initPolygon();

    if (DEBUG) {
      var _g = new PIXI.Graphics();
      _g.beginFill(0x00FF00, 0.5);
      utils.drawPolygon(_g, scaledVertices);
      stage.addChild(_g);
    }


    // set mobile frindly hit area
    mobileHitAreaFix();

    // tint the sprite in a color (hex RRGGBB)
    //sprGenie.tint = 0xDDCC22;

    // make sprite clickable
    sprGenie.interactive = true;
    sprGenie.buttonMode = true;

    // define the magnitude of the wobble effect
    sprGenie.defaultWobbleFactor = .007 * (ismobile ? 4 : 2);
    sprGenie.baseWobbleFactor = .005;
    sprGenie.wobbleFactor = .005;

    // create rubbing function for genie
    sprGenie.rub = function() {
      //console.log("Rub rub!");

      this.rubStart = ticks;
      this.rubCycle = ticks;
      this.isRubbing = true;
      this.wobbleFactor += sprGenie.defaultWobbleFactor;
    }

    // genie lamp udpate and wobble logic
    sprGenie.tick = function() {
      this.rotation = Math.sin(ticks / 2) * this.wobbleFactor;

      if (!running) {
        return;
      }

      if (this.isRubbing) {
        if (ticks > this.rubStart + MSPT * 1) {
          this.isRubbing = false;
          return;
        }

        var vertices = scaledVertices;
        //var xoff = 200;
        //var yoff = -80;
        var sg = sprGenie;
        if (this.wobbleFactor > 0.015) {
          if (Math.random() * 10 < 1)
          spawnLampParticle(sg.x - sg.width * 0.35, sg.y - sg.height * 0.11);
        }
        if (this.wobbleFactor > 0.1) {
          if (Math.random() * 10 < 2)
          spawnLampParticle(sg.x + sg.width * 0.35, sg.y + sg.height * .07);
        }
        if (this.wobbleFactor > 0.15) {
          if (Math.random() * 10 < 3) {
            spawnLampParticle(sg.x + sg.width * 0.05, sg.y - sg.height * .3);
            spawnLampParticle(sg.x + sg.width * 0.1, sg.y + sg.height * .15);
          }
        }

        // transition to video after wobble
        if (this.wobbleFactor > .3) {
          videoTransition();
        }

      } else { // not rubbing
        if (this.wobbleFactor < this.baseWobbleFactor) {
          this.wobbleFactor = this.baseWobbleFactor;
        } else {
          this.wobbleFactor *= 0.95;
        }
      }
    }

    // transition to video
    function videoTransition() {
      running = false;

      //$('#video_id').css({top: '-' + window.innerHeight, display: 'block' });
      
      /*$('#video_id').animate({
        top: "+" + 0
      }, {
        duration: 6000,
        complete: function() {
          $(canvas).remove();
        }
      });*/

      var t = 3000;
      var v = $('#video_id');
      v.fadeIn(t, function() {
        $(canvas).remove();

        //glowing = false;

        videojs("video_id").ready(function() {
          this.play();
        });
      })

      function _fadeOutGenie() {
        if (sprGenie) {
          if (sprGenie.alpha < .1)
            return;
          sprGenie.alpha *= .98;
          setTimeout(MSPF,_fadeOutGenie);
        }
      }
      _fadeOutGenie();

    }

    // setup genie touch events
    var _s = sprGenie;
    _s.mouseup = _s.mouseupoutside = _s.touchend = _s.touchendoutside = function(data) {
      this.startPosition = null;
    }

    sprGenie.mousedown = sprGenie.click = sprGenie.touchdown = function(data) {
      data.originalEvent.preventDefault();
      sprGenie.rub();
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
    var particleLimit = (ismobile) ? 6 : 12;
    var particleCounter = 0;

    // DEBUG
    if (DEBUG) {
      sprGenie.click = function(data) {
        data.originalEvent.preventDefault();
        sparkleMode++;
        sparkleMode %= 3;
      }
    }

    var mouseTrailToggle = true;

    // DEBUG
    // toggle mouse trailing effect
    if (DEBUG) {
      window.onkeyup = function(e) {
        var key = e.keyCode ? e.keyCode : e.which;

        if (key == 32) { // space 
          mouseTrailToggle = !mouseTrailToggle;
        }
      }
    }

    // touch test DEBUG
    sprGenie.mousedown = sprGenie.touchstart = function(data) {
      data.originalEvent.preventDefault();
    }

    //stage.mousemove = stage.touchmove = sprGenie.touchmove = function(data) {
    sprGenie.mousemove = sprGenie.touchmove = function(data) {
      data.originalEvent.preventDefault();

      var currentPosition = data.getLocalPosition(sprGenie.parent);

      particleCounter++;
      if (particleCounter > particleLimit) {
        particleCounter = 0;

        // spawn particles
        if (mouseTrailToggle) {
          for (var i = 0; i < (ismobile ? 1 : 2); i++) {
            var p = new Particle(currentPosition.x + i * 5 - 16, currentPosition.y - 16);
            p.v.x += i * .15;
            p.v.y += .2;
            p.scale.x = p.scale.y = (ismobile ? 2 : 1);
            sparkles.push(p);
            sparkleContainer.addChild(p);
          }
        }
      }

      if (sprGenie.startPosition) {

        // calculate distance
        var d = utils.distance(currentPosition, sprGenie.startPosition);

        // third of genie width
        if (d > (sprGenie.width / 4)) {
          // simulate a rub!
          sprGenie.rub();
          sprGenie.startPosition = null;
        }
      } else {
        if ( utils.pointIntersects(currentPosition, sprGenie)) {
          sprGenie.startPosition = currentPosition;
        }
      }
    }

    /**
      * Intro Animation
      */
    function zoominIntro() {
      var oldScaleX = sprGenie.scale.x;
      sprGenie.scale.x = sprGenie.scale.y = 0.02;
      
      // add to stage
      stage.addChild(sprGenie);

      // loop
      function introLoop() {
        introAnimation(introLoop);
      }
      introLoop();

      function introAnimation(callback) {
        if (sprGenie.scale.x < oldScaleX) {

          //var s = (sprGenie.scale.x + 0.005);
          var s = (sprGenie.scale.x) * 1.25;

          if (s > oldScaleX) {
            s = oldScaleX;
            sprGenie.rub();
            if (!ismobile) sprGenie.rub();
            
            setTimeout(function() {
              spawnLampParticle();
            }, 0);
          }

          sprGenie.scale.x = sprGenie.scale.y = s;

          setTimeout(callback, MSPF);
        } else {
          sprGenie.scale.x = sprGenie.scale.y = oldScaleX;
        }
      }
    }

    var animatingIntro = true;
    function dropIntro() {
      var oldY = sprGenie.y;
      sprGenie.y = -sprGenie.height;

      var grav = 2;
      var yspd = 5;
      var bounceCount = 0;
      var bounceMax = 5;

      // add to stage
      stage.addChild(sprGenie);

      // loop
      function introLoop() {
        introAnimation(introLoop);
      }
      introLoop();

      function introAnimation(callback) {
        yspd += grav;
        var s = sprGenie.y + yspd;

        if (s > oldY) { // bounce from ground
          s = oldY - (s - oldY);
          sprGenie.wobbleFactor = .2 * (yspd / 80);
          
          spawnParticle();
          spawnParticle();
          setTimeout(function() {
            spawnParticle();
            spawnLampParticle();
          }, 0);

          yspd = -yspd / 2;
          bounceCount++;
        }

        sprGenie.y = s;

        if (bounceCount < bounceMax) {
          setTimeout(callback, MSPF);
        } else {
          sprGenie.y = oldY;
          animatingIntro = false;
        }
      }

    }
    dropIntro();

    /**
      * Configure the mouse trailng sparkles.
      */
    var sparkleContainer = new PIXI.SpriteBatch();
    stage.addChild(sparkleContainer);

    // load the sprite sheet
    var sparkleSheet = PIXI.Texture.fromImage("images/sparkle.png");

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

    function spawnParticle(x, y) {

      if (!x || !y) {
        for (var i = 0; i < 100; i++) {
            x = sprGenie.x - sprGenie.width + Math.random() * sprGenie.width * 2;
            y = sprGenie.y - sprGenie.height + Math.random() * sprGenie.height * 2;
            if (scaledPolygon.contains(x, y)) {
              i = 100;
              break;
            }
          }
      }

      var p = new Particle(x, y);
      sparkles.push(p);
      sparkleContainer.addChild(p);
    }

    // spawn particle relative to the wobbling genie lamp
    function spawnLampParticle(x, y) {
      if (!x || !y) {
        x = sprGenie.position.x;
        y = sprGenie.position.y;
      }

      var d = utils.distance(sprGenie, {x: x, y: y}) // distance

      switch (sparkleMode) {
        case 0: d = (Math.random() * .9 + 0.1) * d; break;
        case 1: d = (Math.random() * .3 + 0.7) * d; break;
      }


      var dx = x - sprGenie.x;
      var dy = y - sprGenie.y;

      var or = Math.atan(dy / dx);

      var r = sprGenie.rotation + or; // rotation in radians.

      var nx = sprGenie.x - (d * Math.cos(r)) * ((dx > 0) ? -1 : 1);
      var ny = sprGenie.y - (d * Math.sin(r)) * ((dy > 0) ? 1 : 1);

      if (info) {
        info.setInfo2("x: " + x + ", y: " + y + "\nd: " + d + ", cos: " + Math.cos(r) * d + ", sin: " + Math.sin(r) * d);
      }


      switch (sparkleMode) {
        case 2:
          for (var i = 0; i < 100; i++) {
            nx = sprGenie.x - sprGenie.width + Math.random() * sprGenie.width * 2;
            ny = sprGenie.y - sprGenie.height + Math.random() * sprGenie.height * 2;
            if (scaledPolygon.contains(nx, ny)) {
              i = 100;
              break;
            }
          }
          break;
      }

      var p = new Particle(nx, ny);
      p.scale.x = p.scale.y = (2 + (ismobile ? 1 : 0)) + Math.random();
      p.anchor.x = p.anchor.y = .5;
      //p.limit = 1;
      //p.subImg = 30;
      p.move = function() {
        this.v.y += this.g;
        switch (sparkleMode) {
          case 0: this.x += (this.v.x * Math.sin(this.y) * 2) | 0;
          case 1: this.x += (this.v.x * Math.sin(this.y) * 1) | 0;
          default: this.x += this.v.x;
        }
        this.y += this.v.y;
      }
      p.v.y -= Math.abs(r) * .5;

      sparkles.push(p);
      sparkleContainer.addChild(p);
    }

    // sparkle
    function Particle(x, y) {
      var p = new PIXI.Sprite( texSparkles[0] );
      p.interactive = p.buttonMode = false;
      p.position.x = x;
      p.position.y = y;
      p.ticks = 0;
      p.limit = 0 + Math.random() * 4 - 1 | 0;
      p.subImg = 0;
      p.removed = false;
      p.g = .02 * Math.random(); // gravity
      p.v = {
        x: utils.randomFlip(.8),
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

        this.move();
      }

      p.move = function() {
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

    // render loop
    function renderLoop() {
      animate(renderLoop);
    }
    renderLoop();

    // update loop
    var ticks = 0;
    function updateLoop() {
      ticks++;
      update(updateLoop);
    }
    updateLoop();

    function update(callback) {

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

      // schedule next tick
      setTimeout(callback, MSPT);
    }
    

    //requestAnimFrame( animate );
    function animate(callback) {
      // DEBUG display genie lamps rotation radians
      //info.setInfo1("Sparkle Mode: " + sparkleMode + " / 2\n MouseTrail: "  + ((mouseTrailToggle) ? "ON (space)" : "OFF (space)") );
      if (DEBUG && info) {
        info.setInfo1( "w: " + renderer.view.width + ", h: " + renderer.view.height + "\n | " +
                      "iw: " + window.innerWidth + ", ih: " + window.innerHeight + "\n | " +
                      ((mouseTrailToggle) ? "ON (space)" : "OFF (space)") );
      }
      
      // render stage
      renderer.render(stage);

      //requestAnimFrame( animate );
      setTimeout(callback, MSPF);
    }

    // resize on window resize
    function resize() {
      var width = WIDTH;
      var height = window.innerHeight;

      // position the app
      renderer.view.style.position = "absolute";
      renderer.view.style.top = "0px";
      renderer.view.style.left = "0px";
      renderer.resize(width, height);

      // set sprGenie at center of screen
      if (!animatingIntro) {
        positionGenieLamp();
      }

      initPolygon();

      // set mobile frindly hit area
      mobileHitAreaFix();

      // draw hitbox for testing
      if (sprGenie.hitArea && DEBUG) {
        var g = new PIXI.Graphics();
        g.beginFill(0x00FF00);
        g.drawRect(sprGenie.hitArea.x + sprGenie.width * sprGenie.anchor.x,
                   sprGenie.hitArea.y + sprGenie.height * sprGenie.anchor.y, sprGenie.hitArea.width, sprGenie.hitArea.height);
        g.endFill();
        stage.addChild(g);
      }

      // remove all sparkles
      /*
      for (var i = 0; i < sparkles.length; i++) {
        var p = sparkles[i];
        p.removed = true;
      }
      */
    }

    function mobileHitAreaFix() {
      if (ismobile) {
        sprGenie.hitArea = new PIXI.Rectangle( -sprGenie.width * sprGenie.anchor.x,
          -sprGenie.height * sprGenie.anchor.y, 
          window.innerWidth, window.innerHeight);
      }
    }
    mobileHitAreaFix();

    window.addEventListener("resize", resize, false);
  }

  //console.log(WURFL);

  /**
    * Public methods.
    */
  return {
    init: function(canvasId) {
      init(canvasId);
    }
  }
})();

