
var test22 = {}

test22.new = function(){
  //console.log("new instance of test2")
  var instance = object.new()

  var splash = instance.add( image.new("splash.png") )

  splash.postDraw = function() {
    console.log(this.viewMatrix)
  }

  console.log(splash)

  return instance
}
