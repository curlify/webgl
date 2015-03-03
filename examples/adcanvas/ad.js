
(function() {

  return {
    new : function(parent,json) {

      console.log("ad",json)
      var instance = object.new ("ad")

      var adplace = instance.add( object.new("adobject") )
      var splash = instance.add( image.new(json.splash) )
      splash.onload = function() {
        console.log("splash loaded!")

        require(json.zip)
          .then(function(scriptobject)
          {
            instance.updateInterval = 0
            var scriptinstance = adplace.add( scriptobject.new({parent:parent,json:json}) )
            if (instance.onload != null) instance.onload()

            splash.anim.animate( splash, {alpha:0,time:250,onComplete:
              function(){
                splash.visible = false
              }
            })
          },function(error){
            console.log("failed zip load!!!",error)
            parent.scenefocus()
          })

/*
        JSZipUtils.getBinaryContent(json.zip, function(err, data) {

          if(err) {
            throw err; // or handle err
          }

          zip = new JSZip(data);
          console.log("zip loaded : ",zip.files)
          var adscriptfile = zip.file("main.js")
          console.log(adscriptfile)
          //console.log(adscript.asText())
          //adobject.add( gyrodemo.new() )
          //splash.anim.animate( splash,{alpha:0,time:250})

          if (adscriptfile == null) {
            //adplace.add( cmsscript.new() )
            //splash.anim.animate( splash, {alpha:0,time:250})
            //if (instance.onload != null) instance.onload()
            parent.scenefocus()
            zip = null
            return
          }
          
          var adobject = ziprequire(adscriptfile)
          zip = null
          console.log( adobject )
          adplace.add( adobject )
          splash.anim.animate( splash, {alpha:0,time:250})
          if (instance.onload != null) instance.onload()

        });
      */

      }

      var back = instance.add( button.new("back_from_ad.png") )
      back.onload = function() {
        back.position.x=-viewWidth/2+back.width()/2
        back.position.y=-viewHeight/2+back.height()/2
      }
      back.click = function(x,y) {
        console.log("back.click")
        scene.closeScene({alpha:0,time:250,onComplete:
          function() {
            console.log("other oncomplete")
            parent.scenefocus()
          }
        })
      }

      instance.scenefocus = function() {
        console.log("ad scenefocus")
      }

      return instance
    }
  }
}())
