
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

var app = function() {

    var instance = new object ("application")

    var w=screenWidth*0.5
    var h=screenHeight*0.5
    var content = instance.add( new carousel("content") )
    content.wrap = true
    content.itemsize = screenWidth/2
    content.inertia = 5
    //content.swipespeed = screenWidth/8
    content.movethreshold = 0

    instance.cmsloader = cmsloader.new()
    instance.cmsloader.onload = function(json) {
      console.log("cmsloader.onload")

      //content.add(image.new("ff"))
      for (var i = json.length - 1; i >= 0; i--) {
        console.log(json[i].splash)

        var carouselobject = content.add( object.new("carousel object") )

        var splash = carouselobject.add( image.new(json[i].splash) )
        splash.onload = function() {
          this.size.width = w
          this.size.height = h
        }

        var mirror = carouselobject.add( mirrorimage.new(json[i].splash) )
        mirror.onload = function() {
          this.size.width = w
          this.size.height = h
          this.position.y = splash.height()/2+30
        }
        mirror.alpha = 0.75
        

      };
    }
    instance.cmsloader.updatefeed()

    instance.step = function() {
        fps.updateFps()
    }

    return instance
}
