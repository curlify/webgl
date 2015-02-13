
(function() {
  
  //console.log("initialize test2 object")

  var object = curlify.require("object")
  var image = curlify.require("image")
  var rectangle = curlify.require("rectangle")


  return {
    new : function(){
      //console.log("new instance of test2")
      var instance = object.new()

      var splash = instance.add( image.new("splash.png") )

      splash.postDraw = function() {
        console.log(this.viewMatrix)
      }

      console.log(splash,curlify.gl)

      return instance
    }
  }
})()
