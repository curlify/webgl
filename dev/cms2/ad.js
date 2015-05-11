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

      var menuscroll = instance.add( cms.sorted_scrollable.new(cms,"main menu",viewWidth,viewHeight) )

      menuscroll.addItem = function(json) {

        //var container = cms.addItem()
        console.log(json)
        var container = menuscroll.add( focusable.new(json.name,this.itemwidth,cms.metadataheight) )
        container.json = json
        container.id = json.id

        var bg = container.add( rectangle.new(container.width(),container.height(),{red:1,green:1,blue:1}) )
        bg.alpha = 0.25

        var metadata = container.add( object.new("metadata",container.width(),cms.metadataheight) )

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
                createCORSRequest('DELETE', 'http://curlify.io/api/ads/'+json.id).then( function(response){
                  cms.content.change( cms.adview.new(cms) )
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

        if (container.json.splash_asset_id != null) {
          var itemimage = container.add( image.new("http://curlify.io/api/assets/"+container.json.splash_asset_id+"/content") )
          itemimage.onload = function() {
            var scale = (menuscroll.itemwidth-cms.itembackgroundpad) / this.width()

            var targetheight = this.size.height * scale
            this.scale.x = scale
            this.scale.y = 0//scale
            this.anim.animate( this.scale, {y:scale,time:500,ease:animator.outQuad})

            container.size.height = targetheight/*this.height()*/ + cms.metadataheight + cms.itembackgroundpad/2
            //bg.size.height = container.height()
            bg.anim.animate( bg.size, {height:container.height(),time:500,ease:animator.outQuad})

            //this.position.y = -container.height()/2+this.height()/2+cms.itembackgroundpad/2
            this.anim.animate( this.position, {y:-container.height()/2+targetheight/2+cms.itembackgroundpad/2,time:500,ease:animator.outQuad})

            //metadata.position.y = container.height()/2-cms.metadataheight/2
            metadata.anim.animate( metadata.position, {y:container.height()/2-cms.metadataheight/2,time:500,ease:animator.outQuad})

            this.alpha = 0
            this.anim.animate( this, {alpha:1,time:2500,ease:animator.inOutQuad})

            if ( instance.parent != null ) instance.layoutChangedTree()
          }
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
          cms.choseAd( container.json )
        }

        return container

      }

      menuscroll.addLastCard = function() {
        var acc = menuscroll.add( focusable.new("add ad",this.itemwidth,this.itemwidth) )
        acc.id = 9999999999

        var bg = acc.add( rectangle.new(acc.width(),acc.height(),{red:1,green:1,blue:1}) )
        bg.drawbackside = true
        bg.alpha = 0.25

        acc.focus = function() {
          //acc.anim.animate( acc, {alpha:2,time:250,ease:animator.inOutQuad})
          acc.anim.animate( acc.scale, {x:1.2,y:1.2,time:250,ease:animator.inOutQuad})
          //acc.bringToFront()
        }
        acc.defocus = function() {
          acc.anim.animate( acc.scale, {x:1,y:1,time:250,ease:animator.inOutQuad})
        }

        var newaccount = acc.add( image.new( cms.buttons2.children[2] ) )
        newaccount.scale.x = cms.buttonscale
        newaccount.scale.y = cms.buttonscale

        var inputside = acc.add( object.new() )
        inputside.rotate.y = Math.PI
        inputside.active = false

        var close = inputside.add( button.new( cms.buttons2.children[3] ))
        close.scale.x = 0.3
        close.scale.y = 0.3
        close.position.x = acc.width()/2-close.width()/2
        close.position.y = -acc.height()/2+close.height()/2
        close.click = function() {
          inputside.active = false
          acc.anim.animate( acc.rotate, {y:0,time:500,ease:animator.inOutQuad,onComplete:
            function() {
              newaccount.input.destroy()
              newaccount.input = null
              newaccount.inputcanvas = null
              newaccount.inputtexture.removeSelf()
              newaccount.inputtexture = null
            }
          })
        }

        var gogo = inputside.add( image.new( cms.buttons2.children[1] ) )
        gogo.scale.x = 0.3
        gogo.scale.y = 0.3
        gogo.position.y = 50

        acc.click = function() {

          if (close.focused) return

          if (newaccount.input == null) {

            inputside.active = true
            acc.anim.animate( acc.rotate, {y:Math.PI,time:500,ease:animator.inOutQuad})

            var inputcanvas = document.createElement("canvas");
            inputcanvas.width = 150//acc.width()
            inputcanvas.height = 28//acc.height()

            newaccount.inputcanvas = inputcanvas

            var input = new CanvasInput({
              canvas: inputcanvas,
              placeHolder: 'ad name',
              onsubmit: function(){
                acc.click()
              },
            });
            input.focus()

            newaccount.input = input

            var inputtexture = inputside.add( image.new(inputcanvas) )
            inputtexture.step = function() {
              gl.bindTexture(gl.TEXTURE_2D, this.texture);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inputcanvas);
            }

            newaccount.inputtexture = inputtexture
          } else {

            acc.anim.animate( acc.rotate, {y:0,time:500,ease:animator.inOutQuad,onComplete:
              function() {

                var params = "account_id="+cms.account.id+"&ads_type_id=1&name="+newaccount.input.value()
                createCORSRequest('POST', 'http://curlify.io/api/ads', params).then( function(response){
                  console.log(response)
                  cms.content.change( cms.adview.new(cms) )
                }, function(error){
                  console.log("error",error)
                })

                newaccount.input.destroy()
                newaccount.input = null
                newaccount.inputcanvas = null
                newaccount.inputtexture.removeSelf()
                newaccount.inputtexture = null
                
              }
            })

          }

        }

        return acc
      }

      createCORSRequest('GET', 'http://curlify.io/api/ads/account_id/'+cms.account.id).then( function(response){
        var cmsJson = JSON.parse(response);

        var index = 0
        var nextItem = function() {

          if (cmsJson.error != null || index >= cmsJson.length) {
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
          menuscroll.addItem( cmsJson[i] )
        }

        menuscroll.addLastCard()
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