
(function() {

  return {

    new : function() {

      var instance = object.new ("application")

      Promise.all([
        require("cmsloader.js"),
        require("vertuad.js")
        ])
        .then(function(requires) {

          console.log("vertu_reveal requires all done")

          var cmsloader = requires[0]
          var ad = requires[1]

          var feeds = [{url:"https://api.curlify.com/api/dev/app/9f648c3f885a88757baf7e4bd4867f00/ads?id="+String(Math.random()), filename:"demos.json"}]
          instance.cmsloader = cmsloader.new(feeds)
          
          instance.cmsloader.onload = function(json) {
            console.log("cmsloader.onload")
            instance.json = json

            var reveal = { name:"reveal", show:[], hide:[], reverse_draw:true }
            reveal.show.push( {target:'position.x',startposition:0,endposition:0,func:animator.linear} )
            reveal.hide.push( {target:'position.x',startposition:0,endposition:-screenWidth*1.0,func:animator.inOutQuad} )

            var curlstack = instance.add( carousel.new() )
            curlstack.transition = reveal

            curlstack.carouselmoved = function(selitem) {
              var current = curlstack.getItem( selitem )
              if ( current != curlstack.currentad ) {
                if (curlstack.currentad != null) curlstack.currentad.child.deactivate()
                curlstack.currentad = current
                curlstack.currentad.child.activate()
              }
            }

            for (var i = 0; i <= json.length - 1; i++) {
              new function() {
                var demo = curlstack.add( ad.new(instance,json[i]) )
              }
            }

            curlstack.carouselmoved(1)
          }
          
          instance.cmsloader.updatefeed()
          
          instance.step = function() {
            fps.updateFps()
          }

        }, function(error) {
          console.log("requires failed",error)
        })

      return instance
      
    },

  }

})()
