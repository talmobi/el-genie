var elGenie = (function() {

  var canvas;

  // initialize the app and the canvas
  function init(canvasId) {
    if (!canvasId) {
      canvas = document.createElement('canvas');
    } else {
      canvas = document.getElementById(canvasId);
    }

    if (!canvas || typeof canvas !== "object") {
      console.log("elGenie app wasn't able to initialize a canvas. Try giving it a canvas Id.");
      return;
    }

  }

  return {
    init: init();
  }
});

