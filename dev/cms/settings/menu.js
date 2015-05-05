(function(){

  return {
    new : function(cms) {

      var instance = object.new()

      var bg = instance.add( rectangle.new() )

      var settings = instance.add( carousel.new() )
      settings.wrap = false

      var assets = require("settings/assets.js").then( function(assets) {
        settings.add( assets.new(cms) )
      })

      var closebutton = instance.add( button.new( cms.buttons2.children[3] ) )
      closebutton.click = function(x,y) {
        scene.closeScene( {alpha:0,time:500,ease:animator.inOutQuad} )
      }

      instance.layoutChanged = function() {
        instance.size.width = viewWidth
        instance.size.height = viewHeight*0.8

        bg.size.width = instance.size.width 
        bg.size.height = instance.size.height

        closebutton.position.x = viewWidth/2-75
        closebutton.position.y = -viewHeight/2+75
      }

      instance.layoutChanged()

      return instance
    }
  }

})()