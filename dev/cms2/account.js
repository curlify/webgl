(function(){

  return {
    new : function(cms) {

      var instance = object.new()

      var bg = instance.add( rectangle.new(0,0,{red:1,green:1,blue:1}) )
      bg.visible = false//bg.alpha = 0
      bg.layoutChanged = function() {
        bg.size.width = instance.width()
        bg.size.height = instance.height()
      }

      var menuscroll = instance.add( cms.sorted_scrollable.new(cms,"account list",viewWidth,viewHeight) )

      menuscroll.addItem = function(json) {

        console.log(json)
        var container = menuscroll.add( focusable.new(json.name,this.itemwidth,cms.metadataheight) )
        container.json = json
        container.id = json.id

        var bg = container.add( rectangle.new(container.width(),container.height(),{red:1,green:1,blue:1}) )
        bg.alpha = 0.25

        var metadata = container.add( focusable.new("metadata",container.width(),cms.metadataheight) )

        var adname = metadata.add( text.new(container.json.name,16,cms.fontname,{red:1,green:1,blue:1},metadata.width()*2,metadata.height(),"left") )
        adname.position.x = -metadata.width()/2+cms.metadatapad
        adname.alpha = 0.35

        var context = metadata.add( button.new(cms.buttons2.children[47]) )
        context.alpha = 0.25
        context.scale.x = 0.3
        context.scale.y = 0.3
        context.position.x = metadata.width()/2-cms.metadatapad-context.width()/2
        context.focus = function() {
          context.anim.animate( context, {alpha:1,time:250,ease:animator.inOutQuad})
        }
        context.defocus = function() {
          container.anim.animate( context, {alpha:0.25,time:250,ease:animator.inOutQuad})
        }
        context.click = function() {
          //scene.stealPointers(this)
          container.bringToFront()

          var items = [
            { title : "Duplicate",
              action : function() {
                console.log("FOO")
              }
            },
            { title : "Rename",
              action : function() {
                console.log("FOO")
              }
            },
            { title : "Delete",
              action : function() {
                createCORSRequest('DELETE', 'http://curlify.io/api/accounts/'+json.id).then( function(response){
                  cms.content.change( cms.accountview.new(cms) )
                  console.log(response)
                }, function(error){
                  console.log("error",error)
                })
              }
            },
          ]
          var menu = cms.createContextMenu( container, items )
          menu.position.y = menu.height()/2

        }

        
        container.focus = function() {
          container.anim.animate( container, {alpha:2,time:250,ease:animator.inOutQuad})
          //container.anim.animate( container.scale, {x:1.2,y:1.2,time:250,ease:animator.inOutQuad})
          //container.bringToFront()
        }
        container.defocus = function() {
          container.anim.animate( container, {alpha:1,time:250,ease:animator.inOutQuad})
          //container.anim.animate( container.scale, {x:1,y:1,time:250,ease:animator.inOutQuad})
        }

        container.click = function() {
          if (context.focused) return
          console.log("clicked",container.json)
          cms.choseAccount( container.json )
        }

        return container

      }

      menuscroll.addLastCard = function() {
        var acc = menuscroll.add( focusable.new("add account",this.itemwidth,this.itemwidth) )
        acc.id = 9999999999

        var bg = acc.add( rectangle.new(acc.width(),acc.height(),{red:1,green:1,blue:1}) )
        bg.alpha = 0.25

        acc.focus = function() {
          //acc.anim.animate( acc, {alpha:2,time:250,ease:animator.inOutQuad})
          acc.anim.animate( acc.scale, {x:1.2,y:1.2,time:250,ease:animator.inOutQuad})
          //acc.bringToFront()
        }
        acc.defocus = function() {
          acc.anim.animate( acc.scale, {x:1,y:1,time:250,ease:animator.inOutQuad})
        }

        var newaccount = acc.add( button.new( cms.buttons2.children[2] ) )
        newaccount.scale.x = cms.buttonscale
        newaccount.scale.y = cms.buttonscale
        newaccount.click = function() {

          if (menuscroll.div == null) {
            var div = document.createElement('div');
            div.innerHTML = "<center>Account name <br><input type='text' id='accountName'>";
            document.body.appendChild(div);
            div.setAttribute('style','box-shadow: 10px 10px 30px black; font-family: Roboto; width:20%; height:20%; font-size: 200%; position: relative; left: 40%; top: -20%; background-color: #888888')

            var name = document.getElementById('accountName')
            name.focus()
            name.onkeypress = function(e){
              console.log("KEY PRESS",e)
              if (!e) e = window.event;
              var keyCode = e.keyCode || e.which;
              if (keyCode == '13'){
                newaccount.click()
                return false;
              }
            }
            console.log("new div!")

            menuscroll.div = div
          } else {

            var name = document.getElementById('accountName')

            console.log(name)

            var params = "accounts_type_id=1&name="+name.value
            createCORSRequest('POST', 'http://curlify.io/api/accounts', params).then( function(response){
              console.log(response)

              cms.content.change( cms.accountview.new(cms) )
            }, function(error){
              console.log("error",error)
            })

            document.body.removeChild(menuscroll.div)
            menuscroll.div = null

          }
        }

        return acc
      }

      createCORSRequest('GET', 'http://curlify.io/api/accounts').then( function(response){
        var cmsJson = JSON.parse(response);

        var index = 0
        var nextItem = function() {

          if (index >= cmsJson.length) {
            var f = menuscroll.addLastCard()
            f.alpha = 0
            f.anim.animate( f, {alpha:1,time:250,ease:animator.inQuad})
            menuscroll.layoutChangedTree()
            return
          }

          var f = menuscroll.addItem( cmsJson[index] )
          f.alpha = 0
          f.anim.animate( f, {alpha:1,time:250,ease:animator.inQuad})
          menuscroll.layoutChangedTree()

          index = index + 1

          instance.anim.animate( instance, {time:100,onComplete:nextItem})
        }

        nextItem()
        /*
        for (var i=0;i<cmsJson.length;i++) {
          var f = menuscroll.addItem( cmsJson[i] )
          f.alpha = 0
          f.anim.animate( f, {alpha:1,time:250,start:i*150,ease:animator.inOutQuad})
        }
        */

      }, function(error){
        menuscroll.addLastCard()
      })

      instance.layoutChanged = function() {
        console.log("account layout changed",instance.parent.width(),instance.parent.height())
        instance.size.width = instance.parent.width()
        instance.size.height = instance.parent.height()

        menuscroll.size.width = instance.width()
        menuscroll.contentsize.width = menuscroll.width()
        menuscroll.size.height = instance.height()
      }

      return instance
    }
  }

})()