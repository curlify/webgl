(function(){

  return {
    new : function(cms,target,items) {

      var width = 200
      var height = 50
      var pad = 15
      var itempad = 3

      var cx = cms.sorted_scrollable.new(cms,"context menu",width,(height+itempad)*items.length)

      console.log(cms,target,items)

      var createContextItem = function(item) {
        var container = focusable.new(item.title,width,height)
        container.item = item
        container.alpha = 3

        var bg = container.add( rectangle.new(container.width(),container.height(),{red:1,green:1,blue:1}) )
        bg.alpha = 0.3

        var metadata = container.add( focusable.new("metadata",container.width(),container.height()) )

        var adname = metadata.add( text.new(container.item.title,16,cms.fontname,{red:0,green:0,blue:0},metadata.width()-pad,null,"left") )
        adname.position.x = pad//-metadata.width()/2+pad
        adname.alpha = 0.35

        container.focus = function() {
          scene.stealPointers(this)
          container.anim.animate( container, {alpha:1,time:250,ease:animator.inOutQuad})
        }
        container.defocus = function() {
          container.anim.animate( container, {alpha:3,time:250,ease:animator.inOutQuad})
        }

        container.click = function() {
          container.parent.parent.removeSelf()
          item.action()
        }

        return container
      }

      cx.layoutFunction = function(item,x,y,index,scroll) {
        if (item.targetposition == null) {
          //console.log(this,this.reverseanimation,cx.reverseanimation)
          item.position.x = x
          item.alpha = 0

          if (this.reverseanimation) {
            item.position.y = -scroll.contentsize.height/2
            item.anim.animate( item.position, {x:x,y:y,start:index*150,time:500,ease:animator.outQuad} )
            item.anim.animate( item, {alpha:3,start:index*150,time:500,ease:animator.linear} )
          } else {
            item.position.y = scroll.contentsize.height/2
            item.anim.animate( item.position, {x:x,y:y,start:(items.length-index)*150,time:500,ease:animator.outQuad} )
            item.anim.animate( item, {alpha:3,start:(items.length-index)*150,time:500,ease:animator.linear} )
          }
          //item.rotate.x = Math.PI
          //item.anim.animate( item.rotate, {x:0,start:index*150,time:2500,ease:animator.outElastic} )
        } else if ( x != item.targetposition.x || y != item.targetposition.y ) {
          item.anim.animate( item.position, {x:x,y:y,time:500,ease:animator.outQuad} )
          //console.log("BUT WHYY")
        }
        item.targetposition = {x:x,y:y}
      }

      cx.itempad = itempad
      //cx.itemwidth = itemwidth
      cx.movethreshold = 10

      cx.relativePress = function(x,y) {
        if (this.hit(x,y)) {
          if (this.focus != null) this.focus(x,y)
          this.focused = true
          return true
        }
        this.active = false
        this.anim.animate( this, {alpha:0,time:250,ease:animator.inOutQuad,onComplete:
          function() {
            cx.removeSelf()
          }
        })
        return true
      }

      for (var i=0;i<items.length;i++) {
        var f = cx.add( createContextItem(items[i]) )
        f.id = i
        items[i].menuitem = target
      }

      //target.add( cx )
      //cx.layoutChangedTree()

      return cx

    }
  }

})()