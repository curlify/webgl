(function(){

  return {
    new : function() {

      var instance = object.new()

      instance.fontname = "Roboto"
      instance.buttonscale = 0.5

      instance.itembackgroundpad = 8
      instance.metadatapad = 15
      instance.metadataheight = 50

      instance.contextmenuwidth = 200
      instance.contextmenuheight = 50
      instance.contextmenupad = 15
      instance.contextmenuitempad = 3

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

      instance.buttons1 = sprite.new("cms_buttons_1.png",8,11)
      instance.buttons2 = sprite.new("cms_buttons_2.png",8,11)
      instance.buttons1.onload = loading.advance
      instance.buttons2.onload = loading.advance

      Promise.all( [
        require("sorted_scrollable.js"),
        require("account.js"),
        require("ad.js"),
        require("files.js"),
        require("preview.js"),
        instance.buttons1.promise,
        instance.buttons2.promise,
        ]).then(
        function(requires) {

          instance.sorted_scrollable = requires[0]

          instance.accountview = requires[1]
          instance.adview = requires[2]
          instance.filesview = requires[3]
          instance.previewview = requires[4]

          var createContextItem = function(item) {
            var container = focusable.new(item.title,instance.contextmenuwidth,instance.contextmenuheight)
            container.item = item
            container.alpha = 3

            var bg = container.add( rectangle.new(container.width(),container.height(),{red:1,green:1,blue:1}) )
            bg.alpha = 0.25

            var metadata = container.add( focusable.new("metadata",container.width(),container.height()) )

            var adname = metadata.add( text.new(container.item.title,16,instance.fontname,{red:1,green:1,blue:1},metadata.width()*2,metadata.height(),"left") )
            adname.position.x = -metadata.width()/2+instance.contextmenupad
            adname.alpha = 0.35

            container.focus = function() {
              scene.stealPointers(this)
              container.anim.animate( container, {alpha:1,time:250,ease:animator.inOutQuad})
            }
            container.defocus = function() {
              container.anim.animate( container, {alpha:3,time:250,ease:animator.inOutQuad})
            }

            container.click = item.action

            return container
          }

          instance.createContextMenu = function(target,items) {

            var cx = instance.sorted_scrollable.new(instance,"context menu",instance.contextmenuwidth,(instance.contextmenuheight+instance.contextmenuitempad)*items.length)
            cx.layoutFunction = function(item,x,y,index,scroll) {
              if (item.targetposition == null) {
                console.log(item)
                item.position.x = x
                item.position.y = -scroll.contentsize.height/2
                item.anim.animate( item.position, {x:x,y:y,start:index*150,time:500,ease:animator.outQuad} )
                item.rotate.x = Math.PI
                item.anim.animate( item.rotate, {x:0,start:index*150,time:2500,ease:animator.outElastic} )
                item.alpha = 0
                item.anim.animate( item, {alpha:3,start:index*150,time:500,ease:animator.linear} )
              } else if ( x != item.targetposition.x || y != item.targetposition.y ) {
                item.anim.animate( item.position, {x:x,y:y,time:500,ease:animator.outQuad} )
                console.log("BUT WHYY")
              }
              item.targetposition = {x:x,y:y}
            }

            cx.itempad = instance.contextmenuitempad
            //cx.itemwidth = instance.contextmenuitemwidth
            cx.movethreshold = 10

            cx.relativePress = function(x,y) {
              if (this.hit(x,y)) {
                if (this.focus != null) this.focus(x,y)
                this.focused = true
                return true
              }
              this.removeSelf()
              return true
            }

            for (var i=0;i<items.length;i++) {
              var f = cx.add( createContextItem(items[i]) )
              f.id = i
            }

            target.add( cx )
            cx.layoutChangedTree()

            return cx
          }

          var main = instance.add( object.new() )
          main.alpha = 0

          var menu = main.add( object.new() )
          menu.size.width = 250

          var content = main.add( object.new() )
          content.change = function(newcontent) {
            content.anim.animate( content, {alpha:0,time:250,ease:animator.inOutQuad,onComplete:
              function() {
                if ( content.script != null ) content.script.removeSelf()
                content.script = null
                content.children = []
                content.script = content.add(newcontent)
                newcontent.layoutChangedTree()
                content.alpha = 1
                newcontent.alpha = 0
                newcontent.anim.animate( newcontent, {alpha:1,time:250,ease:animator.inOutQuad})
              }
            })
          }
          instance.content = content

          var menuscroll = menu.add( instance.sorted_scrollable.new(instance,"main menu",menu.width(),viewHeight) )
          menuscroll.itemwidth = menu.size.width
          menuscroll.itempad = 2

          menuscroll.addItem = function(titlestr,valuestr,target) {
            var container = menuscroll.add( focusable.new() )
            container.id = menuscroll.instance.children.length

            container.size.width = this.itemwidth-this.itempad
            container.size.height = 80

            var bg = container.add( rectangle.new(this.width()*2,0,{red:1,green:1,blue:1}) )
            bg.position.x = -bg.width()/4
            bg.alpha = 0
            bg.show = function() {
              bg.anim.stop()
              bg.anim.animate( bg, {alpha:0.25,time:250,ease:animator.outQuad})
            }
            bg.hide = function() {
              bg.anim.stop()
              bg.anim.animate( bg, {alpha:0,time:250,ease:animator.outQuad})
            }
            container.bg = bg

            var textpad = 20
            var textcontainer = container.add( object.new() )
            textcontainer.size.width = container.width()-textpad*2
            textcontainer.size.height = container.height()-textpad*2

            var title = textcontainer.add( text.new(titlestr,12,instance.fontname,{red:1,green:1,blue:1},null,null,"left") )
            title.alpha = 0.4
            title.position.x = -textcontainer.width()/2
            title.position.y = -18

            var addValue = function(val) {
              var value = textcontainer.add( text.new(val,28,instance.fontname,{red:1,green:1,blue:1},null,null,"left") )
              value.alpha = 0
              value.position.x = -textcontainer.width()/2
              value.position.y = titlestr.length > 0 ? 5 : 0
              value.anim.animate( value, {alpha:1,time:250,ease:animator.inOutQuad})

              value.change = function(newval) {
                value.anim.animate( value, {alpha:0,time:250,ease:animator.inOutQuad,onComplete:
                  function() {
                    addValue(newval)
                  }
                })
              }
              container.value = value
            }
            addValue(valuestr)

            bg.size.height = container.size.height-this.itempad


            container.focus = function() {
              container.anim.animate( container, {alpha:2,time:250,ease:animator.inOutQuad})
              //bg.anim.animate( bg.position, {x:0,time:250,ease:animator.inOutQuad})
            }
            container.defocus = function() {
              container.anim.animate( container, {alpha:1,time:250,ease:animator.inOutQuad})
              //bg.anim.animate( bg.position, {x:-bg.width()/4,time:250,ease:animator.inOutQuad})
            }
            container.click = function() {
              //this.bringToFront()

              menuscroll.current.bg.show()
              bg.hide()

              menuscroll.current = container
              content.change( target.new(instance) )

            }

            return container

          }

          var logo = menuscroll.add( object.new("logo") )
          logo.id = 0
          var bg = logo.add( rectangle.new(0,0,{red:1,green:1,blue:1}) )
          //bg.alpha = 0.0//25
          bg.visible = false
          var img = logo.add( image.new("curlify_logo.png") )
          img.onload = function() {
            var sc = menuscroll.itemwidth / img.width()
            this.scale.x = sc
            this.scale.y = sc

            logo.size.width = img.width()
            logo.size.height = img.height()

            bg.size.width = logo.width()
            bg.size.height = logo.height()

            instance.layoutChangedTree()
          }
          //menuscroll.user = menuscroll.addItem( "USER", "VESA", "user.js" )
          menuscroll.account = menuscroll.addItem( "ACCOUNT", "", instance.accountview )
          menuscroll.current = menuscroll.account

          instance.layoutChanged = function() {
            console.log("layoutChanged cms")

            instance.size.width = viewWidth
            instance.size.height = viewHeight

            content.size.width = viewWidth-menu.width()
            content.size.height = viewHeight-110

            menu.position.x = -viewWidth/2+menu.width()/2

            content.position.x = menu.width()/2
            content.position.y = viewHeight/2-content.height()/2

            //menuscroll.size.width = instance.width()
            //menuscroll.contentsize.width = menuscroll.size.width
            menuscroll.size.height = instance.height()
          }
          instance.layoutChangedTree()

          loading.anim.animate( loading, {alpha:0,time:500,ease:animator.inOutQuad,onComplete:
            function() {
              main.anim.animate( main, {alpha:1,time:500,ease:animator.inOutQuad})
            }}
          )
          
          instance.choseAccount = function(account) {
            instance.account = account
            instance.ad = null

            menuscroll.account.value.change( account.name )

            if ( menuscroll.ad == null ) {
              menuscroll.ad = menuscroll.addItem( "AD", "", instance.adview )
              instance.layoutChangedTree()
            }
            menuscroll.ad.value.change( "" )
            menuscroll.ad.click()

            if( menuscroll.preview != null) {
              menuscroll.preview.removeSelf()
              menuscroll.files.removeSelf()
              menuscroll.preview = null
              menuscroll.files = null
            }

            instance.layoutChangedTree()
              
          }

          instance.choseAd = function(ad) {
            instance.ad = ad
            menuscroll.ad.value.change( ad.name )

            if (menuscroll.preview == null) {
              menuscroll.preview = menuscroll.addItem( "", "Preview", instance.previewview )
              menuscroll.files = menuscroll.addItem( "", "Files", instance.filesview )
              menuscroll.files.bg.show()
              instance.layoutChangedTree()
            }
            menuscroll.preview.click()

          }

          menuscroll.account.click()
          content.change( instance.accountview.new(instance) )

        },
        function(e) {
          console.log(e)
        }

      )

      instance.step = function(timedelta) {
        fps.updateFps()
      }

      return instance
    }
  }

})()