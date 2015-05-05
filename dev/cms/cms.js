(function(){

  return {
    new : function() {

      var instance = object.new()

      instance.fontname = "Roboto"

      var loading = instance.add( rectangle.new(0,5,{red:1,green:1,blue:1}) )
      loading.total = 2
      loading.current = 0
      loading.advance = function() {
        loading.current = loading.current + 1
        loading.size.width = (loading.current/loading.total)*viewWidth
        instance.layoutChanged()
      }

      instance.layoutChanged = function() {
        loading.position.x = -viewWidth/2+loading.width()/2
        loading.position.y = viewHeight/2-loading.height()/2
      }

      //var bg = instance.add( rectangle.new(viewWidth,viewHeight,{red:1,green:0,blue:0}) )
      //bg.alpha = 0.4
      instance.buttons1 = sprite.new("cms_buttons_1.png",8,11)
      instance.buttons1.onload = loading.advance
      instance.buttons2 = sprite.new("cms_buttons_2.png",8,11)
      instance.buttons2.onload = loading.advance

      Promise.all( [
        require("account/menu.js"),
        require("settings/menu.js"),
        instance.buttons1.promise,
        instance.buttons2.promise,
        ]).then(
        function(requires) {

          var accountmenu = requires[0]
          accountmenu.defaultpos = 0

          var settingsmenu = requires[1]

          instance.accountmenu = accountmenu
          instance.settingsmenu = settingsmenu

          var main = instance.add( focusable.new("main") )
          main.alpha = 0

          var adarea = main.add( fbo_object.new("ad area",480,852) )
          var menu = main.add( object.new() )
          menu.size.width = 200
          var bg = menu.add( rectangle.new(menu.width(),screenHeight,{red:0.5,green:0.5,blue:0.5}))
          bg.alpha = 0.5

          var menuscroll = menu.add( scrollable.new("main menu",menu.width(),viewHeight) )
          var itemheight = 150

          var ads = menuscroll.add( button.new( instance.buttons2.children[47] ) )
          ads.click = function(x,y) {
            var adpopup = accountmenu.new(instance)
            adpopup.alpha = 0
            scene.openScene( adpopup, {alpha:1,time:500,ease:animator.outQuad} )
          }
          var edit = menuscroll.add( button.new( instance.buttons2.children[84] ) )
          edit.alpha = 0.5
          edit.active = false
          edit.click = function(x,y) {
            var editpopup = settingsmenu.new(instance)
            editpopup.alpha = 0
            scene.openScene( editpopup, {alpha:1,time:500,ease:animator.outQuad} )
          }
          var search = menuscroll.add( button.new( instance.buttons2.children[0] ) )
          var users = menuscroll.add( button.new( instance.buttons2.children[80] ) )
          var settings = menuscroll.add( button.new( instance.buttons2.children[36] ) )

          menuscroll.contentsize.height = menuscroll.instance.children.length * itemheight

          instance.selectAd = function(ad) {
            console.log("selectAd",ad)
            instance.selectedAd = ad
            //require("http://api.curlify.com/units/ads/2208/assets/dev.zip").then(
            require("http://curlify.io/api/ads/"+ad.id+"/zip?postfix=.zip").then(
              function(script) {
                console.log("RESOLVED!")
                adarea.children = []
                try {
                  var ad = adarea.add( script.new() )
                } catch(err) {
                  console.log(Error(err))
                }
                zipfile = null
                curlify.localVars.zipfile = null
              },
              function() {
                console.log("REJECTED!")
                zipfile = null
                curlify.localVars.zipfile = null
              }
            )
            edit.active = true
            edit.anim.animate( edit, {alpha:1,time:500,ease:animator.inOutQuad})
          }


          instance.layoutChanged = function() {
            console.log("layoutChanged")

            adarea.position.x = menu.width()/2

            menu.position.x = -viewWidth/2+menu.width()/2
            menuscroll.size.height = viewHeight

            for (var i=0;i<menuscroll.instance.children.length;i++) {
              menuscroll.instance.children[i].position.y = i == 0 ? -menuscroll.height()/2 + itemheight/2 : menuscroll.instance.children[i-1].position.y + itemheight
            }
          }
          instance.layoutChanged()

          loading.anim.animate( loading, {alpha:0,time:500,ease:animator.inOutQuad,onComplete:
            function() {
              main.anim.animate( main, {alpha:1,time:500,ease:animator.inOutQuad})
            }} )
          

        }
      )

      instance.step = function(timedelta) {
        fps.updateFps()
      }

      return instance
    }
  }

})()