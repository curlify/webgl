

(function() {

  return {
    new : function(parent,json) {

      console.log("ad",json)
      var instance = fbo_object.new ("ad",screenWidth,screenHeight,true)

      var adplace = instance.add( object.new("adobject") )
      var splash = instance.add( image.new(json.splash) )
      splash.size.width = screenWidth
      splash.size.height = screenHeight
      splash.onload = function() {
        if (instance.onload != null) instance.onload()
      }

      //var foo = instance.add( rectangle.new(screenWidth,screenHeight,{red:Math.random(),green:Math.random(),blue:Math.random()}) )
      //foo.alpha = 0.5

      instance.activate = function() {

        console.log("activate")
        instance.active = true

        instance.anim.animate( instance, {alpha:1,time:500,onComplete:
          function() {

            require(json.zip)
              .then(function(scriptobject)
              {
                instance.updateInterval = 0
                var scriptinstance = adplace.add( scriptobject.new({parent:parent,json:json}) )

                splash.anim.animate( splash, {alpha:0,time:250,onComplete:
                  function(){
                    splash.visible = false
                  }
                })
              },function(error){
                console.log("failed zip load!!!",error)
              })
          }
        })
      }

      instance.deactivate = function() {
        instance.active = false
        instance.updateInterval = 500

        splash.visible = true
        instance.anim.stop()
        instance.anim.animate( splash, {alpha:1,time:250,onComplete:
          function() {
            adplace.children = []
          }
        })
      }

      instance.scenefocus = function() {
        console.log("ad scenefocus")
      }

      return instance
    }
  }

})()

