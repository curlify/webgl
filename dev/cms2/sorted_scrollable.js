(function(){

  return {
    new : function(cms,identifier,width,height) {

      var instance = scrollable.new(identifier,width,height)

      instance.itemwidth = 200 * cms.sizeMultiplier
      instance.itempad = 20 * cms.sizeMultiplier

      instance.sort = "id"

      
      // metadata
      // image
      // imageloaded
      // sortcolumn
      // contextitems
      // selectfunction
      // editfunction

      instance.addItem = function(parameters) {

        //console.log("addItem",parameters)
        var container = instance.add( object.new(parameters.metadata,this.itemwidth,this.itemwidth) )
        container.parameters = parameters
        container.id = parameters.sortid

        parameters.menuitem = container

        var bg = container.add( rectangle.new(container.width(),container.height(),{red:1,green:1,blue:1}) )
        bg.alpha = 0.25
        bg.drawbackside = true

        var viewside = container.add( focusable.new("viewside",container.width(),container.height()) )

        if (parameters.metadata != null) {
          var metadata = viewside.add( object.new("metadata",container.width(),cms.metadataheight) )
          //metadata.position.x = -container.width()/2+metadata.width()/2+cms.metadatapad
          metadata.position.y = container.height()/2-metadata.height()/2

          var metadatatext = metadata.add( text.new(parameters.metadata,16,cms.fontname,{red:1,green:1,blue:1},metadata.width()-cms.metadatapad*2-120*0.3,null,"left",null,2) )
          metadatatext.position.x = -container.width()/2+cms.metadatapad+metadatatext.width()/2//-metadata.width()/2+cms.metadatapad

          if (metadatatext.height() > metadata.height()) metadatatext.position.y = metadata.height()/2-metadatatext.height()/2-cms.metadatapad
          metadatatext.alpha = 0.35

          /*
          var test = metadata.add( rectangle.new(metadatatext.width(),metadatatext.height()))
          test.alpha = 0.5
          test.position.x = metadatatext.position.x
          test.position.y = metadatatext.position.y
          */
        }

        var inputside = container.add( object.new() )
        inputside.rotate.y = Math.PI
        inputside.active = false

        var close = inputside.add( button.new( cms.buttons2.children[3] ))
        close.scale.x = 0.3
        close.scale.y = 0.3
        close.position.x = container.width()/2-close.width()*1.5-cms.metadatapad
        close.position.y = container.height()/2-close.height()/2-cms.metadatapad/2
        close.click = function() {
          container.hideinput()
        }

        var gogo = inputside.add( button.new( cms.buttons2.children[1] ) )
        gogo.scale.x = 0.3
        gogo.scale.y = 0.3
        gogo.position.x = container.width()/2-gogo.width()/2-cms.metadatapad/2
        gogo.position.y = container.height()/2-gogo.height()/2-cms.metadatapad/2
        //gogo.position.y = 50
        //gogo.position.x = metadata.width()/2-cms.metadatapad-gogo.width()/2

        if (parameters.image != null) {
          var itemimage = viewside.add( image.new( parameters.image) )

          itemimage.onload = function() {
            if (parameters.imageloaded != null) parameters.imageloaded(itemimage)
            var scale = (instance.itemwidth-cms.itembackgroundpad) / this.width()

            var targetheight = this.size.height * scale
            this.scale.x = scale
            this.scale.y = 0//scale
            this.anim.animate( this.scale, {y:scale,time:500,ease:animator.outQuad})

            var oldheight = container.size.height
            container.size.height = Math.max( instance.itemwidth, targetheight + (metadata ? metadata.height() : 0) + cms.itembackgroundpad/2 )
            viewside.size.height = container.size.height
            //bg.size.height = container.height()
            bg.anim.animate( bg.size, {height:container.height(),time:500,ease:animator.outQuad})

            //this.position.y = -container.height()/2+this.height()/2+cms.itembackgroundpad/2
            parameters.imagealign = metadata ? parameters.imagealign : "center"
            parameters.imagealign = parameters.imagealign ? parameters.imagealign : "top"

            if (parameters.imagealign == "top") {
              this.anim.animate( this.position, {y:-container.height()/2+targetheight/2+cms.itembackgroundpad/2,time:500,ease:animator.outQuad})
            } else {
              this.anim.animate( this.position, {y:metadata ? -metadata.height()/2 : 0,time:500,ease:animator.outQuad})
            }

            //metadata.position.y = container.height()/2-cms.metadataheight/2
            if (metadata != null) metadata.anim.animate( metadata.position, {y:container.height()/2-metadata.height()/2,time:500,ease:animator.outQuad})

            var targetalpha = this.alpha
            this.alpha = 0
            this.anim.animate( this, {alpha:targetalpha,time:2500,ease:animator.inOutQuad})

            close.position.y = container.height()/2-close.height()/2-cms.metadatapad/2
            gogo.position.y = container.height()/2-gogo.height()/2-cms.metadatapad/2

            if ( instance.parent != null && oldheight != container.size.height) instance.layoutChangedTree()
          }
          if (itemimage.loaded) itemimage.onload()

        }        

        container.showinput = function(completefunc) {

          viewside.active = false

          var inputparameters = parameters.inputparameters || {}
          inputparameters.width = instance.itemwidth-instance.itempad*2
          inputparameters.onsubmit = function() {
            console.log("Submit via enter")
            gogo.click()
          }

          inputside.input = inputside.add( input.new(inputparameters.width+15,28,inputparameters) )
          inputside.input.input.focus()

          gogo.click = function() {
            console.log("Submit: ",inputside.input.input.value())
            if (inputside.input.input.value().length == 0) return

            var donefunc = function() {
              if (parameters.inputfunction == null) return
              parameters.inputfunction(inputside.input.input.value())
            }

            container.hideinput(donefunc)

          }

          container.anim.animate( container.rotate, {y:Math.PI,time:500,ease:animator.inOutQuad,onComplete:
            function() {
              inputside.active = true
              if (completefunc != null) completefunc()
            }
          })
        }

        container.hideinput = function(completefunc) {
          console.log("hideinput",completefunc)
          inputside.active = false
          container.anim.animate( container.rotate, {y:0,time:500,ease:animator.inOutQuad,onComplete:
            function() {
              if (completefunc != null) completefunc()
              inputside.input.removeSelf()
              inputside.input = null
              gogo.click = null
              viewside.active = true
            }
          })
        }

        if (parameters.contextitems != null) {
          var context = metadata.add( button.new(cms.buttons3.children[18]) )
          context.alpha = 0.25
          context.scale.x = 0.3
          context.scale.y = 0.3
          context.position.x = metadata.width()/2-cms.metadatapad/2-context.width()/2
          context.focus = function() {
            context.anim.animate( context, {alpha:1,time:250,ease:animator.inOutQuad})
          }
          context.defocus = function() {
            container.anim.animate( context, {alpha:0.25,time:250,ease:animator.inOutQuad})
          }
          context.click = function() {
            //scene.stealPointers(this)
            if (inputside.active) return

            container.bringToFront()

            var menu = container.add( cms.contextmenu.new(cms, container, parameters.contextitems) )

            var fitsright = menu.absolutex() < viewWidth/2-menu.width()*1.5
            var fitsleft = menu.absolutex() > -viewWidth/2+menu.width()*1.5
            var fitstop = menu.absolutey() > -viewHeight/2+menu.height()*1.5
            var fitsbottom = menu.absolutey() < viewHeight/2-menu.height()*1.5

            console.log("Fit data",fitsright,fitsleft,fitstop,fitsbottom)
            if (fitsright && fitstop) {
              menu.position.x = context.position.x + menu.width()/2 - context.width()/2
              menu.position.y = metadata.position.y - menu.height()/2 - context.height()/2
            } else if (fitsright && fitsbottom) {
              menu.position.x = context.position.x + menu.width()/2 + context.width()/2
              menu.position.y = metadata.position.y + menu.height()/2 - context.height()/2
              menu.reverseanimation = true
            } else if (fitsleft && fitsbottom) {
              menu.position.x = context.position.x - menu.width()/2 - context.width()/2
              menu.position.y = metadata.position.y + menu.height()/2 - context.height()/2
              menu.reverseanimation = true
            } else if (fitsleft && fitstop) {
              menu.position.x = context.position.x - menu.width()/2 - context.width()/2
              menu.position.y = metadata.position.y - menu.height()/2 + context.height()/2
            }

            menu.layoutChangedTree()

          }
        }
        
        viewside.focus = function() {
          container.anim.animate( container, {alpha:2,time:250,ease:animator.inOutQuad})
        }
        viewside.defocus = function() {
          container.anim.animate( container, {alpha:1,time:250,ease:animator.inOutQuad})
        }

        viewside.click = function() {
          if (context != null && context.focused) return
          console.log("clicked",container.json)

          if (inputside.active == false) {
            if (parameters.clickfunction) parameters.clickfunction()
            return
          }

          if (close.focused) return
          if (gogo.focused) return

          inputside.input.input.focus()

        }

        return container

      }      
      

      instance.relativeDrag = function(x,y) {
        if (this.focused != true) return false
        if (this.focusdrag != null) this.focusdrag(x,y)
        return true
      }

      instance.layoutFunction = function(item,x,y,index) {
        if (item.targetposition == null) {
          item.position.x = x
          item.position.y = y
        } else if ( x != item.targetposition.x || y != item.targetposition.y ) {
          //item.anim.stop()
          item.anim.animate( item.position, {x:x,y:y,time:500,ease:animator.outQuad} )
        }
        item.targetposition = {x:x,y:y}
      }

      instance.layoutChanged = function() {
        var cols = Math.max(1,Math.floor(this.parent.width()/(this.itemwidth+this.itempad*2)))

        //console.log("LAYOUTCHANGED!!!!!2",instance.identifier,this.instance.children.length)

        var colypos = []
        for (var i=0;i<cols;i++) {
          colypos.push(0)
        }
        var y = 0
        var col = 0

        this.instance.children.sort( function(a,b) {
          return a[instance.sort] < b[instance.sort] ? -1 : 1
        })


        for (var i=0;i<this.instance.children.length;i++) {
          for (var c=0;c<cols;c++) {
            if (colypos[c] < colypos[col]) col = c
          }
          var realitemwidth = this.itemwidth + this.itempad
          var item = this.instance.children[i]
          
          //item.position.x = -(cols*realitemwidth - realitemwidth)/2 + col*realitemwidth
          //item.position.y = -this.height()/2 + item.height()/2 + colypos[col]
          var x = -(cols*realitemwidth - realitemwidth)/2 + col*realitemwidth
          var y = -this.height()/2 + item.height()/2 + colypos[col]

          this.layoutFunction(item,x,y,i,instance)

          colypos[col] = colypos[col] + item.height() + this.itempad

          //console.log("pos ",col,colypos[0],colypos[1],item.position.x,item.position.y)
        }

        
        var height = 0
        for (var c=0;c<cols;c++) {
          if (colypos[c] > height) height = colypos[c]
        }
        this.contentsize.height = height
      }

      return instance
    }
  }

})()