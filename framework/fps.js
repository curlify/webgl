
(function() {

  var fps = (function() {

    console.log("initialize fps module")

    var sys = curlify.getModule("sys")

    var fpsCounter = 0
    var fpsTimestamp = 0

    return {
      updateFps : function() {
        if (fpsCounter == 100) {
          fpsCounter = 0
          var timestamp = sys.timestamp()
          var current_fps = 100000 / (timestamp - fpsTimestamp)
          console.log("FPS : " + current_fps)
          fpsTimestamp = timestamp
        }
        fpsCounter = fpsCounter + 1
      }
    }
  })()

  curlify.module("fps",fps)
})()
