
(function() {

  var curlify = document.currentScript.curlify
  
  var scene = curlify.getModule("scene")
  var animator = curlify.getModule("animator")
  var object = curlify.getModule("object")
  var focusable = curlify.getModule("focusable")

  var scrollable = (function(){
    return {
      new : function(ident,width,height) {
        var container = focusable.new(ident,width,height)

        container.contentsize = {width:container.size.width,height:container.size.height}
        container.movespeed = 1.0
        container.movethreshold = 40
        container.swipespeed = (curlify.screenWidth+curlify.screenHeight)/2 * 5
        container.maxspeed = 200
        container.inertia = 7
        container.zeroposition = 0
        container.loaddistance = curlify.screenHeight
        container.visibledistance = container.loaddistance
        container.itempad = 0
        container.centerslots = false

        container.swipefunc = animator.inQuad

        var instance = container.add( object.new("scrollable") )
        container.instance = instance
        
        instance.targetposition = {x:0,y:0,z:0}

        var move = function(source,target,timedelta) {
          //console.log("move",source,target,timedelta)
          if (timedelta > 100) timedelta = 100
          var dir = 1
          if (source > target) dir = -1
          var move = (-dir* (timedelta/ (16.66*container.inertia) )) * Math.abs(source-target)
          var maxspeed = (timedelta/16.66) * container.maxspeed
          
          if (move > maxspeed) move = maxspeed
          if (move < -maxspeed) move = -maxspeed
          if (Math.abs(move) < 0.00001) {
            source = target
          } else {
            source = source-move
          }
          if (dir == 1 && source > target) source = target
          if (dir == -1 && source < target) source = target
          return source
        }

        container.focus = function(x,y) {
          //print("focus",x,y,this.identifier)

          instance.pressOffset = {x:instance.position.x-x*container.movespeed,y:instance.position.y-y*container.movespeed}
          if (instance.moving) {
            instance.resetpress()
            instance.moving = false
          }
        }

        container.defocus = function(x,y) {
          if (scene.getpointerStealer() == container) {
            //instance.moving = false
            container.centeronslots()
          }
          console.log("DEFOCUS",container.identifier,instance.position.y,instance.targetposition.y)
        }

        container.centeronslots = function() {
          if (container.centerslots) {
            var sel = Math.floor((container.selected() / (curlify.screenWidth+container.itempad)))
            container.movetox(sel*(curlify.screenWidth+container.itempad)+curlify.screenWidth/2)
          }
        }

        instance.setMoving = function() {
          //print("setmoving!",instance.identifier)
          if (instance.moving == false && scene.getpointerStealer() == null) {
            scene.stealPointers( container )
            instance.moving = true
          }
        }

        container.focusdrag = function(x,y) {
          var newx = instance.pressOffset.x+x*container.movespeed
          var newy = instance.pressOffset.y+y*container.movespeed
          var diffx = newx-instance.targetposition.x
          var diffy = newy-instance.targetposition.y
          //var difflen = Math.sqrt(diffx^2 + diffy^2)

          if (container.contentsize.width != container.size.width && Math.abs(diffx) > container.movethreshold) instance.setMoving()
          if (container.contentsize.height != container.size.height && Math.abs(diffy) > container.movethreshold) instance.setMoving()

          //print(instance.moving)
          //print(container.contentsize.height,container.size.height,Math.abs(diffy),container.movethreshold,this.identifier)

          if (instance.moving) {
            instance.targetposition.x = newx
            instance.targetposition.y = newy
          }
        }

        container.step = function(timedelta) {

          var xlimit = -(container.contentsize.width-container.size.width)+container.zeroposition
          var ylimit = -(container.contentsize.height-container.size.height)

          var td = timedelta
          if (td > 66) td = 66

          if (container.enforcelimits != false) {
            if (instance.targetposition.x > container.size.width/4+container.zeroposition) instance.targetposition.x = container.size.width/4+container.zeroposition
            if (instance.targetposition.y > container.size.height/4) instance.targetposition.y = container.size.height/4
            if (instance.targetposition.x < xlimit-container.size.width/4) instance.targetposition.x = xlimit-container.size.width/4
            if (instance.targetposition.y < ylimit-container.size.height/4) instance.targetposition.y = ylimit-container.size.height/4

            if (container.focused == false) {
              if (instance.targetposition.x > container.zeroposition) instance.targetposition.x = move(instance.targetposition.x,container.zeroposition,timedelta/2)
              if (instance.targetposition.y > 0) instance.targetposition.y = move(instance.targetposition.y,0,timedelta/2)
              if (instance.targetposition.x < xlimit) instance.targetposition.x = move(instance.targetposition.x,xlimit,timedelta/2)
              if (instance.targetposition.y < ylimit) instance.targetposition.y = move(instance.targetposition.y,ylimit,timedelta/2)
            }
          }

          if (container.focused == false) td = td/2

          if (container.contentsize.width != container.size.width) instance.position.x = move(instance.position.x,instance.targetposition.x,td)
          if (container.contentsize.height != container.size.height) instance.position.y = move(instance.position.y,instance.targetposition.y,td)

          if (container.focused == false && instance.position.x == instance.targetposition.x && instance.position.y == instance.targetposition.y) instance.moving = false

          /*
          if (instance.moving) {
            sys.requestRepaint()
            //print("repaint:",instance.position.x,instance.targetposition.x,instance.position.y,instance.targetposition.y)
          }
          */
        }

        container.selected = function() {
          return Math.floor(instance.targetposition.x)// + Math.floor(instance.targetposition.y)
        }

        container.movetox = function(pos,instant) {
          if (instant) instance.position.x = pos
          instance.targetposition.x = pos
        }

        container.movetoy = function(pos,instant) {
          if (instant) instance.position.y = pos
          instance.targetposition.y = pos
        }

        container.prepare = function() {
          container.step(0)
          for (var i=0;i<instance.children.length;i++) {
            instance.children[i].step(0)
          }
        }

        var limitx = curlify.screenWidth*4
        var limity = curlify.screenHeight*4
        var l2=-limitx
        var r2=limitx
        var t2=-limity
        var b2=limity
        container.intersectsScreen = function( r ) {
          var x = r.absolutex()
          var y = r.absolutey()
          var l1=x-r.width()/2
          var r1=x+r.width()/2
          var t1=y-r.height()/2
          var b1=y+r.height()/2
          return !( l2 > r1 || r2 < l1 || t2 > b1 || b2 < t1 )
        }

        // add children to instance, not container
        container.add = function(child,indx) {
          //var index = indx
          //if (index == null) index = instance.children.length+1
          var index = (indx ? indx : instance.children.length)
          child.parent = instance
          //table.insert( instance.children, index, child )
          instance.children.push(child)

          /*
          var camera = this.getCamera()
          if (camera != null)
            child.updateCamera( camera )
          }
          */

          child.step = function(timedelta) {
            this.xdistance = this.absolutex()

            var dist = Math.sqrt( Math.pow(this.xdistance,2)+Math.pow(this.absolutey(),2) )
            if (dist < container.loaddistance) {
              if (this.load_content != null && this.loaded == false) this.load_content()
            } else {
              var unloaddistance = container.unloaddistance
              if (unloaddistance == null) unloaddistance = container.loaddistance
              if (dist > unloaddistance) {
                if (this.load_content != null && this.unload_content != null && this.loaded) this.unload_content()
              }
            }

            if (dist < container.visibledistance) {
              this.visible = true
            } else {
              this.visible = false
            }

            this.distance = dist

            
            //if (instance.moving) this.distance = 1

          }

          return child
        }


        return container
      }
    }
  })()

  curlify.module("scrollable",scrollable)

})()
