
(function() {

  var carousel = (function() {

    console.log("initialize carousel module")

    var object = curlify.getModule("object")
    var focusable = curlify.getModule("focusable")
    var animator = curlify.getModule("animator")
    var scene = curlify.getModule("scene")
    var sys = curlify.getModule("sys")

    return {

      new : function(ident,width,height) {

        var container = focusable.new(ident,width,height);

        var coverflow = { name:"coverflow", show:[], hide:[] }
        coverflow.show.push( {target:'position.x',startposition:curlify.screenWidth*1.0,endposition:0,func:animator.linear} )
        coverflow.show.push( {target:'rotate.y',startposition:Math.PI*0.8,endposition:0,func:animator.linear} )
        coverflow.show.push( {target:'scale.x',startposition:0.6,endposition:1,func:animator.linear} )
        coverflow.show.push( {target:'scale.y',startposition:0.6,endposition:1,func:animator.linear} )
        //coverflow.show.push( {target:'alpha',startposition:0.3,endposition:1,func:animator.linear} )
        coverflow.hide.push( {target:'position.x',startposition:0,endposition:-curlify.screenWidth*1.0,func:animator.linear} )
        coverflow.hide.push( {target:'rotate.y',startposition:0,endposition:-Math.PI*0.8,func:animator.linear} )
        coverflow.hide.push( {target:'scale.x',startposition:1,endposition:0.6,func:animator.linear} )
        coverflow.hide.push( {target:'scale.y',startposition:1,endposition:0.6,func:animator.linear} )
        //coverflow.hide.push( {target:'alpha',startposition:1,endposition:0.3,func:animator.linear} )

        container.contentsize = {width:container.size.width, height:container.size.height}
        container.inertia = 5
        container.swipespeed = curlify.screenWidth
        container.movespeed = 1.0
        container.movethreshold = 60
        container.itemsize = curlify.screenWidth
        container.transition = coverflow
        container.unload_distance = 1.0
        container.wrap = false
        container.bounceOnWrap = false
        container.alwaysmove = false
        container.nevermove = false
        container.selecteditem = 1
        container.moveToSelectedItem = true

        var instance = container.add( object.new("carousel") )
        instance.targetposition = {x:0, y:0, z:0}
        instance.pressOffset = {x:0,y:0}

        var itemcontainer = container.add( object.new("item container") )
        itemcontainer.targetposition = {x:0, y:0, z:0}

        container.instance = instance
        container.itemcontainer = itemcontainer

        var move = function(source,target,timedelta) {
          //console.log("move",source,target,timedelta)
          if (timedelta > 100) timedelta = 100
          var dir = 1
          if (source > target) dir = -1
          var move = (-dir*timedelta / (container.inertia*16.66)) * Math.abs(source-target)
          if (Math.abs(move) < 0.0001) { source = target } else { source = source-move }
          if (dir == 1 && source > target) source = target
          if (dir == -1 && source < target) source = target
          return source
        }

        instance.setMoving = function(diffx,diffy) {
          if (scene.getpointerStealer() == null && container.nevermove != true) {
            //console.log("setMoving()",diffx,diffy,container.movethreshold)
            scene.stealPointers( container )
            if (container.stolePointers != null) container.stolePointers(diffx,diffy)
            instance.moving = true
          }
        }

        container.focus = function(x,y) {
          //console.log("focus carousel",container.identifier,instance.moving)
          if (instance.moving) {
            instance.moving = false
            instance.targetposition.x=instance.position.x
            instance.targetposition.y=instance.position.y
          }
          instance.pressOffset = {x:instance.targetposition.x-(x*container.movespeed)/curlify.screenWidth*2,y:instance.targetposition.y-y*container.movespeed}
          container.pressStarted = {x:x,y:y}
              
        }

        container.focusdrag = function(x,y) {
          var newx = instance.pressOffset.x+(x*container.movespeed)/curlify.screenWidth*2
          var newy = instance.pressOffset.y+(y*container.movespeed)/curlify.screenHeight*2
          var diffx = container.pressStarted.x-x
          var diffy = container.pressStarted.y-y

          //console.log("focusdrag",container.identifier,diffx,container.movethreshold/curlify.screenWidth,instance.moving)
          if ((container.alwaysmove || container.contentsize.width != container.size.width) && Math.abs(diffx) > container.movethreshold) instance.setMoving(diffx,diffy)

          if (instance.moving) {
            instance.targetposition.x = newx
            instance.targetposition.y = newy
          }
        }

        container.defocus = function(x,y) {
          var selitem = Math.floor(-instance.targetposition.x+0.5)
          //console.log("container.defocus",x,y,selitem)
          if (container.moveToSelectedItem) {
            instance.targetposition.x = -selitem
          }
          container.selecteditem = selitem
          if (container.selecteditem < 0) {
            container.selecteditem = (container.wrap ? itemcontainer.children.length+selitem : 0)
          }
          if (container.selecteditem > (itemcontainer.children.length-1)) {
            container.selecteditem = (container.wrap ? selitem-itemcontainer.children.length : (itemcontainer.children.length-1))
          }
          container.selecteditem = container.selecteditem + 1
          if (container.carouselmoved != null) container.carouselmoved(container.selecteditem)
        }
        
        container.postDraw = function() {
          if (container.wrap) {
            for (var i=0;i <itemcontainer.children.length;i++) {
              var item = itemcontainer.children[i]
              var originalactive = item.active
              var originalvisible = item.visible
              var originalitemposition = item.itemposition
              item.itemposition = originalitemposition + itemcontainer.children.length
              item.stepTree()
              item.drawTree()
              item.itemposition = originalitemposition - itemcontainer.children.length
              item.stepTree()
              item.drawTree()
              item.itemposition = originalitemposition
              item.step(0)
              item.visible = originalvisible
              item.active = originalactive
            }
          }
        }

        container.selected = function() {
          return container.selecteditem
        }

        container.getItem = function(index) {
          return itemcontainer.children[index-1]
        }

        container.moveto = function(item,instant) {
          instance.targetposition.x = -item
          if (instant) instance.position.x = instance.targetposition.x
          container.selecteditem = item
          if (container.carouselmoved != null) container.carouselmoved(item+1)
        }

        container.step = function(timedelta) {

          var xlimit = -itemcontainer.children.length+1
          var ylimit = -itemcontainer.children.length+1
          var bouncewidth = 0.75
          var bounceheight = 0.75

          if (container.wrap == false || (container.bounceOnWrap && (instance.position.x > xlimit-bouncewidth && instance.position.x < bouncewidth))) {
            if (container.bounceOnWrap) {
              bouncewidth = bouncewidth * 2
              bounceheight = bounceheight * 2
            }
            if (instance.targetposition.x > bouncewidth) instance.targetposition.x = bouncewidth
            if (instance.targetposition.y > bounceheight) instance.targetposition.y = bounceheight
            if (instance.targetposition.x < xlimit-bouncewidth) instance.targetposition.x = xlimit-bouncewidth
            if (instance.targetposition.y < ylimit-bounceheight) instance.targetposition.y = ylimit-bounceheight

            if (container.focused == false) {
              if (instance.targetposition.x > 0) instance.targetposition.x = move(instance.targetposition.x,0,timedelta/2)
              if (instance.targetposition.y > 0) instance.targetposition.y = move(instance.targetposition.y,0,timedelta/2)
              if (instance.targetposition.x < xlimit) instance.targetposition.x = move(instance.targetposition.x,xlimit,timedelta/2)
              if (instance.targetposition.y < ylimit) instance.targetposition.y = move(instance.targetposition.y,ylimit,timedelta/2)
            }
          } else {
            
            if (instance.targetposition.x > 1) {
              console.log("switch",instance.position.x,instance.targetposition.x,container.contentsize.width)
              instance.targetposition.x = instance.targetposition.x - itemcontainer.children.length
              instance.position.x = instance.position.x - itemcontainer.children.length
              instance.pressOffset.x = instance.pressOffset.x - itemcontainer.children.length
            } else if (instance.targetposition.x < -itemcontainer.children.length) {
              console.log("+++switch2",instance.position.x,instance.targetposition.x)
              instance.targetposition.x = instance.targetposition.x + itemcontainer.children.length
              instance.position.x = instance.position.x + itemcontainer.children.length
              instance.pressOffset.x = instance.pressOffset.x + itemcontainer.children.length
            }
            
          }

          var td = timedelta
          if (td > 100) td = 1

          if (container.focused == false) td = timedelta/2
          if (container.alwaysmove || container.contentsize.width != container.size.width) instance.position.x = move(instance.position.x,instance.targetposition.x,td)
          if (container.alwaysmove || container.contentsize.height != container.size.height) instance.position.y = move(instance.position.y,instance.targetposition.y,td)

          if (container.focused == false && instance.position.x == instance.targetposition.x && instance.position.y == instance.targetposition.y) instance.moving = false

          if (instance.moving) {
            //sys.requestRepaint()
          }
        }

        container.getDistance = function() {
          var dist = (instance.position.x*container.itemsize+(this.itemposition*container.itemsize)) / curlify.screenWidth
          return dist
        }

        container.setContentSize = function() {
          container.contentsize.width = container.itemsize * itemcontainer.children.length
        }

        // add children to itemcontainer, not container
        container.add = function(child,indx) {

          var indx = itemcontainer.children.length

          var carouselobject = focusable.new("carousel item container")
          carouselobject.add( child )
          carouselobject.parent = itemcontainer
          itemcontainer.children.push( carouselobject )

          itemcontainer.drawTree = function() {
            var timedelta = Math.min(sys.timestamp()-this.lastdraw,60)
            this.lastdraw = sys.timestamp()

            if (this.visible == false) return

            this.update();
            if (this.preDraw != null) this.preDraw();
            if (this.draw != null) this.draw();

            if (container.transition.order_draw) {
              var drawstack = []
              for (var i=0;i<this.children.length;i++){
                drawstack.push(this.children[i])
              }
              function compare(a,b) {
                if (Math.abs(a.dist) > Math.abs(b.dist))
                   return -1;
                return 1;
              }
              drawstack.sort(compare)

              for (var i=0;i<drawstack.length;i++) {
                drawstack[i].drawTree()
              }
            } else {
              if (this.reverseDrawOrder) {
                for (var i = this.children.length-1; i >= 0; i--) {
                  this.children[i].drawTree();
                };
              } else {
                for (var i = 0; i < this.children.length; i++) {
                  this.children[i].drawTree();
                };
              }
            }

            if (this.postDraw != null) this.postDraw();      
          }

          child.carouselobject = carouselobject

          carouselobject.index = indx
          carouselobject.child = child
          carouselobject.itemposition = indx

          carouselobject.getDistance = container.getDistance

          carouselobject.step = function(timedelta) {
            var dist = this.getDistance()
            this.dist = dist

            if (dist <= -container.unload_distance || dist >= container.unload_distance) {
              if (this.unload_content != null && this.content != null) this.unload_content()
            } else {
              if (this.load_content != null && this.content == null) {
                this.load_content()
              }
            }

            this.active = true
            if (Math.abs(dist) > 0.2) this.active = false

            this.visible = true
            if (Math.abs(dist) > 1) this.visible = false

            if (this.distance == dist || Math.abs(dist) > 2) return
            this.distance = dist

            var trans = container.transition
            if (trans.reverse_draw) 
              itemcontainer.reverseDrawOrder=true
            else
              itemcontainer.reverseDrawOrder=false
            if (dist >= 0) {
              for (var i=0;i<trans.show.length;i++) {
                var show = trans.show[i]
                if (show.target == 'position.x') this.position.x = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
                else if (show.target == 'position.y') this.position.y = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
                else if (show.target == 'position.z') this.position.z = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
                else if (show.target == 'scale.x') this.scale.x = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
                else if (show.target == 'scale.y') this.scale.y = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
                else if (show.target == 'rotate.x') this.rotate.x = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
                else if (show.target == 'rotate.y') this.rotate.y = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
                else if (show.target == 'rotate.z') this.rotate.z = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
                else if (show.target == 'alpha') this.alpha = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
                else if (show.target == 'transition_value') this.transition_value = show.func( show.startposition, show.endposition, Math.abs(1.0-dist) )
              }
            } else {
              for (var i=0;i<trans.hide.length;i++) {
                var hide = trans.hide[i]
                if (hide.target == 'position.x') this.position.x = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
                else if (hide.target == 'position.y') this.position.y = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
                else if (hide.target == 'position.z') this.position.z = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
                else if (hide.target == 'scale.x') this.scale.x = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
                else if (hide.target == 'scale.y') this.scale.y = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
                else if (hide.target == 'rotate.x') this.rotate.x = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
                else if (hide.target == 'rotate.y') this.rotate.y = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
                else if (hide.target == 'rotate.z') this.rotate.z = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
                else if (hide.target == 'alpha') this.alpha = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
                else if (hide.target == 'transition_value') this.transition_value = hide.func( hide.startposition, hide.endposition, Math.abs(dist) )
              }
            }

          }

          itemcontainer.itemaddposition = itemcontainer.itemaddposition + 1

          container.setContentSize()

          return carouselobject

        }

        return container;

      },

    }

  })()

  curlify.module("carousel",carousel)

})()
