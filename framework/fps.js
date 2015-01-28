
var fps = {}
fps.fpsCounter = 0
fps.fpsTimestamp = 0

fps.updateFps = function() {
  if (fps.fpsCounter == 100) {
    fps.fpsCounter = 0
    var timestamp = sys.timestamp()
    var current_fps = 100000 / (timestamp - fps.fpsTimestamp)
    console.log("FPS : " + current_fps)
    fps.fpsTimestamp = timestamp
  }
  fps.fpsCounter = fps.fpsCounter + 1
}
