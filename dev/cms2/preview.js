(function(){

  return {
    new : function(cms) {

      var instance = object.new()

      var adcontainer = instance.add( fbo_object.new("ad container",480,852) )

      if ( cms.ad.splash_asset_id != null) {
        var itemimage = adcontainer.add( image.new("http://curlify.io/api/assets/"+cms.ad.splash_asset_id+"/content") )
      }

      require("http://curlify.io/api/ads/"+cms.ad.id+"/zip?postfix=.zip").then(
        function(script) {
          try {
            var ad = adcontainer.add( script.new() )
          } catch(err) {
            console.log(Error(err))
          }
          zipfile = null
          curlify.localVars.zipfile = null
        },
        function(e) {
          console.log(e)
          zipfile = null
          curlify.localVars.zipfile = null
        }
      )

      instance.layoutChanged = function() {
        instance.size.width = instance.parent.width()
        instance.size.height = instance.parent.height()

        var sc = instance.height()/adcontainer.size.height
        adcontainer.scale.x = sc
        adcontainer.scale.y = sc
      }

      return instance
    }
  }

})()