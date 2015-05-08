(function(){

  return {
    new : function(cms,identifier,width,height) {

      var instance = scrollable.new(identifier,width,height)

      instance.itemwidth = 200
      instance.itempad = 20

      instance.swipespeed = viewHeight
      instance.swipefunc = animator.linear

      instance.sort = "id"

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