
var submenu = function(mainjson,json) {

  var instance = new fbo_object ("submenu")

  var splash = instance.add( image.new(json.splash) )
  splash.onload = function() {
    instance.updateFbo()
  }

  var content = instance.add( object.new("content") )

  instance.updateFbo()
  instance.fboUpdatesDisabled = true

  instance.step = function(timedelta) {
    if (instance.dobypassFbo == false) {
      if (this.absolutescalex() == 1 && this.absolutescaley() == 1 && this.absolutex() == 0) {
        instance.dobypassFbo = true
        console.log("do bypass",this.identifier,this.absolutex(),this.absolutex())
      }
    } else {
      if (this.absolutescalex() != 1 || this.absolutescaley() != 1 || this.absolutex() != 0) {
        console.log("stop bypass",this.identifier)
        instance.dobypassFbo = false
        instance.updateFbo()
      }
    }
  }

  instance.activate = function() {
    console.log("submenu",json.name,"activate()")
    instance.active = true

    instance.fboUpdatesDisabled = false

    content.anim.stop()
    content.alpha = 0
    content.timervalue = 0

    content.anim.animate( content, {timervalue:0,time:500,onComplete:
      function() {
        var multiplier = 0.45

        var scale = { name:"scale", show:[], hide:[] }
        scale.show.push( {target:'transition_value',startposition:screenHeight,endposition:0,func:animator.linear} )
        scale.hide.push( {target:'transition_value',startposition:0,endposition:-screenHeight,func:animator.linear} )

        // vertical carousel for scaling - makes this a lot easier
        var scaleable = content.add( carousel_vertical.new("scaleable",screenWidth,screenHeight) )
        scaleable.transition = scale
        scaleable.itemsize = screenHeight/2 - (screenHeight*multiplier)/2
        scaleable.alwaysmove = true
        scaleable.inertia = 2
        scaleable.itemcontainer.position.y = screenHeight/2 - (screenHeight*multiplier)/2
        scaleable.openitem = null
        scaleable.movethreshold = 20 // needs to be less than settingscarousel

        // one object inbetween because carousels modify the step -function of their children
        var thumbcontainer = scaleable.add( object.new("thumbs container"))
        thumbcontainer.transition_value = 0


        // custom move animation for carousel - padding for items
        var carouselItemSize = screenWidth + (4/multiplier) // 4px in thumbnail mode translated
        var basic_move = { name:"move", show:[], hide:[] }
        basic_move.show.push( {target:'position.x',startposition:carouselItemSize,endposition:0,func:animator.linear} )
        basic_move.hide.push( {target:'position.x',startposition:0,endposition:-carouselItemSize,func:animator.linear} )

        // thumbs is 'closed' by default
        var thumbs = thumbcontainer.add( carousel.new("carousel 1",screenWidth,screenHeight*multiplier) )
        thumbs.position.y = -4 // bottom 'padding'
        // thumbs.position.y = screenHeight/2 - (screenHeight/2)*multiplier
        thumbs.alwaysmove = true
        thumbs.itemsize = screenWidth*multiplier
        thumbs.inertia = 8
        thumbs.swipespeed = screenWidth*2
        thumbs.movethreshold = 20
        thumbs.movespeed = 2
        // thumbs.wrap = true
        // thumbs.bounceOnWrap = true
        thumbs.moveToSelectedItem = false
        thumbs.transition = basic_move
        for (var i=0;i < mainjson.length;i++) {
          var adjson = mainjson[i]
          //var adthumbs = thumbs.add( adcarousel.new(instance,adjson) )
          //var adthumbs = thumbs.add( image.new(adjson.splash) )
          var adthumbs = thumbs.add( ad.new(scaleable,adjson))

          adthumbs.scale.x = multiplier
          adthumbs.scale.y = multiplier
          adthumbs.active = false
          scaleable.targetitem = adthumbs

          // workaround for scale not affecting position
          adthumbs.child.y = function() {
            return -scaleable.itemcontainer.position.y
          }
        }

        //thumbs.moveto(2,true)

        thumbs.postStep = function() {
          if (scaleable.openitem != null) return
          if (scene.getpointerStealer() == scaleable) return

          var percent = -thumbs.instance.position.x / (thumbs.itemcontainer.children.length-1) // % of carousel scrolled
          var offset = ((carouselItemSize*multiplier)-screenWidth)/2 // required offset to put first item on left of screen
          thumbs.itemcontainer.targetposition.x = offset - percent*offset*2 // current offset for items so last item is on right
          // console.log(thumbs.itemcontainer.position.x,percent)
        }

        thumbcontainer.postStep = function() { // after item step, scale item to match size
          // if scaleable.openitem != null then return end
          // if scaleable.targetitem == nil then return end

          var sc = 1 + (this.transition_value/-scaleable.itemsize)*((1/multiplier)-1)

          scaleable.targetitem.child.scale.x = sc
          scaleable.targetitem.child.scale.y = sc
          scaleable.targetitem.child.position.y = -(sc-1)*(screenHeight/2+thumbs.position.y*1.5) // make object move to center

          var basesize = screenWidth*multiplier
          thumbs.itemsize = basesize + (scaleable.targetitem.child.width()*multiplier - basesize)/2
          if (thumbs.itemsize < basesize) thumbs.itemsize = basesize
        }

        var openthumbs = scaleable.add( object.new("dummy object for thumbs") ) // empty item, 2nd state for thumbs (open)
        openthumbs.transition_value = 0
        openthumbs.press = function(x,y) { // forward pointers to actual thumbs
          thumbs.press(x,y)
        }
        openthumbs.drag = function(x,y) { // forward pointers to actual thumbs
          thumbs.drag(x,y)
        }
        openthumbs.release = function(x,y) { // forward pointers to actual thumbs
          thumbs.release(x,y)
        }
        openthumbs.keydown = function(key) {
          thumbs.keydown(key)
        }

        // scaleable stole pointers - set selected object for scaling
        scaleable.stolePointers = function() {
          if (scaleable.openitem != null) return

          var offset = (scaleable.pressStarted.x-thumbs.itemcontainer.position.x)/(screenWidth/2)
          console.log("offset for selection",offset, thumbs.itemcontainer.position.x)

          var selected = Math.floor(-thumbs.instance.targetposition.x+0.5+offset) + 1
          if (selected < 1) {
            // selected = #thumbs.itemcontainer.children + selected
            selected = 1
            thumbs.instance.position.x = thumbs.instance.position.x - thumbs.itemcontainer.children.length
            thumbs.instance.targetposition.x = thumbs.instance.targetposition.x - thumbs.itemcontainer.children.length
          }
          if (selected > thumbs.itemcontainer.children.length) {
            // selected = selected - #thumbs.itemcontainer.children
            selected = thumbs.itemcontainer.children.length
            thumbs.instance.position.x = thumbs.instance.position.x + thumbs.itemcontainer.children.length
            thumbs.instance.targetposition.x = thumbs.instance.targetposition.x + thumbs.itemcontainer.children.length
          }
          var item = thumbs.getItem( selected )
          scaleable.targetitem = item

          thumbs.instance.targetposition.x = -item.itemposition
          thumbs.itemcontainer.targetposition.x = 0 // reset itemcontainer offset so selected item is centered on screen
        }
        
        // clicked scaleable - open item
        scaleable.click = function(x,y) {
          if (scene.getpointerStealer() != null) return
          if (scaleable.openitem != null) return
          console.log("scaleable.click",x,y,scaleable.pressStarted.x)
          scene.stealPointers( scaleable )
          scaleable.stolePointers()

          scaleable.moveto(1)
        }

        // scaleable opened/closed
        scaleable.carouselmoved = function(selected) {
          //console.log(this)
          if (selected == 2 && scaleable.openitem == null) {
            var selitem = thumbs.selected()
            console.log("thumb carousel moved",selitem)
            scaleable.openitem = scaleable.targetitem.child
            scaleable.openitem.activate()
            // NB: missing postactivate
            //thumbs.nevermove = true
            //settingscarousel.nevermove = true
            console.log("open item",scaleable.openitem.identifier,selitem)
          } else if (selected == 1 && scaleable.openitem) {
            console.log("close item")
            scaleable.openitem.deactivate()
            // NB: missing postactivate
            scaleable.openitem = null
            //thumbs.nevermove = false
            //settingscarousel.nevermove = false
          }
        }
        
        scaleable.closead = function() {
          scaleable.moveto(0)
        }
        
        scaleable.hit = function(x,y) {
          var sc = scaleable.targetitem.child.scale.y*multiplier
          var toplimit = this.height()/2-sc*screenHeight
          if (x < -this.width()/2 || x > this.width()/2 || y < toplimit || y > this.height()/2) return false
          return true
        }

        content.anim.animate( content, {alpha:1,time:500,ease:animator.inOutQuad})
        
      }
    })

  }

  instance.deactivate = function() {
    content.anim.stop()
    content.anim.animate( content, {alpha:0,time:250,ease:animator.inOutQuad,onComplete:
      function() {
        console.log("remove menuitems")
        content.children = []
        // disable fbo updates when deactivated
        instance.fboUpdatesDisabled = true
      }
    })
  }

  return instance
}

submenu.new = function(mainjson,json) {
  return new submenu(mainjson,json)
}
