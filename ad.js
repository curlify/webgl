
var ad = function(parent,json) {

    console.log("ad",json)
    var instance = new object ("ad")

    var adplace = instance.add( object.new("adobject") )
    var splash = instance.add( image.new(json.splash) )
    splash.onload = function() {
      console.log("splash loaded!")

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
          /*
          adplace.add( cmsscript.new() )
          splash.anim.animate( splash, {alpha:0,time:250})
          if (instance.onload != null) instance.onload()
          */
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

ad.new = function(parent,child) {
  return new ad(parent,child)
}
