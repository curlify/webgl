
(function() {

  var curlify = document.currentScript.curlify

  var animator = curlify.getModule("animator")
  var carousel = curlify.getModule("carousel")

  var carousel_vertical = (function() {

    return {
      new : function(ident,width,height) {

        var screenWidth = curlify.localVars.screenWidth
        var screenHeight = curlify.localVars.screenHeight
        
        var move_in = { name:"move in", show:[], hide:[] }
        move_in.show.push( {target:'position.y',startposition:screenHeight,endposition:0,func:animator.outQuad} )
        move_in.show.push( {target:'alpha',startposition:0,endposition:1,func:animator.outExpo} )
        move_in.hide.push( {target:'position.y',startposition:0,endposition:0,func:animator.linear} )
        move_in.hide.push( {target:'alpha',startposition:1,endposition:0,func:animator.inExpo} )

        var instance = carousel.new(ident,width,height);
        instance.itemsize = screenHeight
        instance.transition = move_in

        instance.getDistance = function() {
          var dist = (instance.instance.position.y*instance.itemsize+(this.itemposition*instance.itemsize)) / screenHeight
          return dist
        }

        instance.setContentSize = function() {
          // MÄMÄ BUGAA!
          instance.contentsize.height = instance.itemsize * instance.itemcontainer.children.length
          //console.log(instance.contentsize.height)
        }

        
        instance.focus = function(x,y) {
          //console.log("focus carousel_vertical",instance.identifier,instance.instance.moving)
          
          if (instance.instance.moving) {
            instance.instance.moving = false
            instance.instance.targetposition.x=instance.instance.position.x
            instance.instance.targetposition.y=instance.instance.position.y
          }
          
          instance.instance.pressOffset = {x:instance.instance.targetposition.x-(x*instance.movespeed)/screenWidth*2,y:instance.instance.targetposition.y-(y*instance.movespeed)/screenHeight*2}
          instance.pressStarted = {x:x,y:y}
        }

        instance.focusdrag = function(x,y) {
          var newx = instance.instance.pressOffset.x+(x*instance.movespeed)/screenWidth*2
          var newy = instance.instance.pressOffset.y+(y*instance.movespeed)/screenHeight*2
          var diffx = instance.pressStarted.x-x
          var diffy = instance.pressStarted.y-y

          //console.log("focusdrag",instance.identifier,scene.getpointerStealer(),diffy,instance.movethreshold,instance.instance.moving)
          if ((instance.alwaysmove || instance.contentsize.height != instance.size.height) && Math.abs(diffy) > instance.movethreshold) instance.instance.setMoving(diffx,diffy)

          if (instance.instance.moving) {
            instance.instance.targetposition.x = newx
            instance.instance.targetposition.y = newy
          }
        }
        

        instance.defocus = function(x,y) {
          var selitem = Math.floor(-instance.instance.targetposition.y+0.5)
          if (instance.moveToSelectedItem) {
            instance.instance.targetposition.y = -selitem
          }
          instance.selecteditem = selitem
          if (instance.selecteditem < 0) {
            if (instance.wrap) {
              instance.selecteditem = instance.itemcontainer.children.length+selitem
            } else {
              instance.selecteditem = 0
            }
          }
          if (instance.selecteditem > (instance.itemcontainer.children.length-1)) {
            if (instance.wrap) {
              instance.selecteditem = selitem-instance.itemcontainer.children.length
            } else {
              instance.selecteditem = instance.itemcontainer.children.length-1
            }
          }
          instance.selecteditem = instance.selecteditem + 1
          if (instance.carouselmoved != null) instance.carouselmoved(instance.selecteditem)
        }

        instance.moveto = function(item,instant) {
          instance.instance.targetposition.y = -item
          if (instant) instance.instance.position.y = instance.instance.targetposition.y
          instance.selecteditem = item
          if (instance.carouselmoved != null) instance.carouselmoved(item)
        }


        return instance;

      },

    }

  })()

  curlify.module("carousel_vertical",carousel_vertical)

})()
