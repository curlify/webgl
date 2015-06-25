
(function() {

  var curScript = document.currentScript || document._currentScript;

  var curlify = curScript.curlify

  var object = (function() {

    console.log("initialize object module")

    var scene = curlify.getModule("scene")
    var animator = curlify.getModule("animator")
    var sys = curlify.getModule("sys")
    var mat4 = curlify.getModule("mat4")
    var vec3 = curlify.getModule("vec3")

    function array_move(array, old_index, new_index) {
        if (new_index >= array.length) {
            var k = new_index - array.length;
            while ((k--) + 1) {
                array.push(undefined);
            }
        }
        array.splice(new_index, 0, array.splice(old_index, 1)[0]);
        return array; // for testing purposes
    };

    return {
      new : function(ident,width,height) {


        eval(curlify.extract(curlify.localVars,"curlify.localVars"))

        // create as monitored objects for animation optimisations (ie. don't draw if not needed)
        // -- turns out this is quite slow :(
        /*
        var monitored_vec3 = function(x,y,z) 
        {
          return {
            x_value:x ? x : 0,
            y_value:y ? y : 0,
            z_value:z ? z : 0,
            get x() { return this.x_value },
            set x(val) { if (val == this.x_value) return; curlify.requestRender(); this.x_value = val },
            get y() { return this.y_value },
            set y(val) { if (val == this.y_value) return; curlify.requestRender(); this.y_value = val },
            get z() { return this.z_value },
            set z(val) { if (val == this.z_value) return; curlify.requestRender(); this.z_value = val },
          }
        }
        var monitored_size = function(w,h)
        {
          return {
            width_value:(w == null ? screenWidth : w),
            height_value:(h == null ? screenHeight : h),
            get width() { return this.width_value },
            set width(val) { if (val == this.width_value) return; curlify.requestRender(); this.width_value = val },
            get height() { return this.height_value },
            set height(val) { if (val == this.height_value) return; curlify.requestRender(); this.height_value = val },
          }
        }

        var monitored_vec3 = function(x,y,z) {
          return {
            x : (x ? x : 0),
            y : (y ? y : 0),
            z : (z ? z : 0),
          }
        }

        var monitored_size = function(w,h) {
          return {
            width : (w == null ? screenWidth : w),
            height : (h == null ? screenHeight : h),
          }
        }
        */

        return {

          identifier : (ident == null ? "object identifier" : ident),
          position : {x:0,y:0,z:0},//new monitored_vec3,//
          rotate : {x:0,y:0,z:0},//new monitored_vec3,//
          scale : {x:1,y:1,z:1},//new monitored_vec3(1,1,1),//
          origo : {x:0,y:0,z:0},//new monitored_vec3,//
          size : {width:width==null?screenWidth:width, height:height==null?screenHeight:height},//new monitored_size(width,height),//
          children : [],
          active : true, // pointers
          visible : true, // draw
          disabled : false, // step
          alpha : 1,
          /*
          visible_value : true,
          get visible() { return this.visible_value },
          set visible(val) { if (val == this.visible_value) return; curlify.requestRender(); this.visible_value = val; },
          alpha_value : 1,
          get alpha() { return this.alpha_value },
          set alpha(val) { if (val == this.alpha_value) return; curlify.requestRender(); this.alpha_value = val; },
          */

          blend : true,
          drawbackside : false,
          depthtest : false,
          disableGlStateUpdates : false, // optimisation for particles

          projectionMatrix : camera.projectionMatrix,
          viewMatrix : camera.viewMatrix,
          modelMatrix : mat4.create(),
          modelViewMatrix : mat4.create(),
          origoMatrix : mat4.create(),
          translateScale : camera.translateScale,

          preUpdateModelMatrix : mat4.create(),

          anim : animator.new(),
          timervalue : 0,
          //lastdraw : 0,
          laststep : 0,

          add : function(child) {
            child.parent = this;
            this.children.push( child )
            return child
          },

          updateModelMatrix : function() {
            mat4.identity(this.modelMatrix);
            if (this.position.x != 0 || this.position.y != 0 || this.position.z != 0) {
              var translateScale = screenWidth/(this.translateScale*2)
              mat4.translate(this.modelMatrix,this.modelMatrix,vec3.clone([this.position.x/translateScale,-this.position.y/translateScale,this.position.z/translateScale]) );
            }
            if (this.rotate.z != 0) mat4.rotateZ(this.modelMatrix,this.modelMatrix,-this.rotate.z);
            if (this.rotate.y != 0) mat4.rotateY(this.modelMatrix,this.modelMatrix,-this.rotate.y);
            if (this.rotate.x != 0) mat4.rotateX(this.modelMatrix,this.modelMatrix,-this.rotate.x);
            if (this.scale.x != 1 || this.scale.y != 1 || this.scale.z != 1) mat4.scale(this.modelMatrix,this.modelMatrix,vec3.clone([this.scale.x,this.scale.y,this.scale.z]));
            if (this.origo.x != 0 || this.origo.y != 0 || this.origo.z != 0) {
              var translateScale = screenWidth/(this.translateScale*2)
              mat4.translate(this.modelMatrix,this.modelMatrix,vec3.clone([-this.origo.x/translateScale,this.origo.y/translateScale,-this.origo.z/translateScale]) );
            }

          },

          update : function() {
            //console.log("update : "+this.identifier,this.size.width,this.size.height)

            mat4.copy(this.preUpdateModelMatrix,this.modelMatrix)

            if (this.parent != null && this.parent.modelViewMatrix != null) {
              this.viewMatrix = this.parent.modelViewMatrix;
            }
            
            if (this.origo.x != 0 || this.origo.y != 0 || this.origo.z != 0) {
              var translateScale = screenWidth/(this.translateScale*2)
              mat4.identity(this.origoMatrix)
              mat4.translate(this.origoMatrix,this.origoMatrix,vec3.clone([this.origo.x/translateScale,-this.origo.y/translateScale,this.origo.z/translateScale]) );
              mat4.multiply(this.viewMatrix, this.viewMatrix, this.origoMatrix )
            }
            this.updateModelMatrix();

            if (this.children.length > 0) {
              mat4.copy( this.modelViewMatrix,this.viewMatrix );
              mat4.multiply( this.modelViewMatrix, this.modelViewMatrix, this.modelMatrix );
            }

            if (!curlify.renderRequired && !mat4.equals(this.modelMatrix,this.preUpdateModelMatrix)) curlify.renderRequired = true
          },

          updateGlStates : function() {
            
            if (this.depthtest) {
              gl.enable( gl.DEPTH_TEST )
              gl.depthFunc( gl.LEQUAL )
            } else {
              gl.disable( gl.DEPTH_TEST )
            }

            if (this.blend == false) {
              gl.disable( gl.BLEND )
            } else {
              gl.enable( gl.BLEND )
              //gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
              gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
              //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
              //gl.blendFunc(gl.ONE, gl.ONE)
            }

            if (this.drawbackside == true) {
              gl.disable( gl.CULL_FACE )
            } else {
              gl.enable( gl.CULL_FACE )
              gl.cullFace(gl.FRONT)
            }
            

          },

          stepTree : function() {
            //console.log("stepTree : "+this.identifier+" children : "+this.children.length)
            
            if (this.disabled == true) return

            this.anim.step()

            if (this.preStep != null) this.preStep()
            if (this.step != null) {
              var timedelta = Math.max(1,Math.min(sys.timestamp()-this.laststep,60))
              this.laststep = sys.timestamp()
              this.step(timedelta)
            }
            this.update();

            for (var i = 0; i < this.children.length; i++) {
              this.children[i].stepTree();
            };

            if (this.postStep != null) this.postStep()
            
          },

          drawTree : function() {
            //console.log("drawTree : "+this.identifier+" children : "+this.children.length)

            //var timedelta = Math.min(sys.timestamp()-this.lastdraw,60)
            //this.lastdraw = sys.timestamp()

            if (this.visible == false) return

            if (this.disableGlStateUpdates != true) this.updateGlStates()

            if (this.preDraw != null) this.preDraw();
            if (this.draw != null) this.draw();
            if (this.reverseDrawOrder) {
              for (var i = this.children.length-1; i >= 0; i--) {
                this.children[i].drawTree();
              };
            } else {
              for (var i = 0; i < this.children.length; i++) {
                this.children[i].drawTree();
              };
            }
            if (this.postDraw != null) this.postDraw();

          },

          layoutChangedTree : function() {

            if (this.layoutChanged != null) this.layoutChanged()
            for (var i=0;i<this.children.length;i++) {
              this.children[i].layoutChangedTree()
            }

          },

          press : function(x,y) {

            var used = false

            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].press(x,y)
            }
            
            if (this.relativePress != null) {
              var relx = (x-screenWidth/2)-this.absolutex()
              var rely = (y-screenHeight/2)-this.absolutey()
              used = this.relativePress(relx,rely)
            }
            if (this.absolutePress != null) used = this.absolutePress(x,y)

            return used
          },

          drag : function(x,y) {

            var used = false
            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].drag(x,y)
            }
            
            if (this.relativeDrag != null) {
              var relx = (x-screenWidth/2)-this.absolutex()
              var rely = (y-screenHeight/2)-this.absolutey()
              used = this.relativeDrag(relx,rely)
            }
            if (this.absoluteDrag != null ) used = this.absoluteDrag(x,y)
            
            return used
          },

          release : function(x,y) {

            var used = false
            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].release(x,y)
            }
            
            if (this.relativeRelease != null) {
              var relx = (x-screenWidth/2)-this.absolutex()
              var rely = (y-screenHeight/2)-this.absolutey()
              used = this.relativeRelease(relx,rely)
            }
            if (this.absoluteRelease != null) used = this.absoluteRelease(x,y)
            
            return used
          },

          swipe : function(dragdir) {

            var used = false
            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].swipe(dragdir)
            }

            var xspeed = Math.abs(dragdir.x)
            var yspeed = Math.abs(dragdir.y)

            //console.log("swipe",xspeed,yspeed)
            
            if (xspeed > yspeed) {
              if (dragdir.x > 0) {
                return this.swipeLeft ? this.swipeLeft(xspeed) : false
              } else {
                return this.swipeRight ? this.swipeRight(xspeed) : false
              }
            } else {
              if (dragdir.y > 0) {
                return this.swipeUp ? this.swipeUp(yspeed) : false
              } else {
                return this.swipeDown ? this.swipeDown(yspeed) : false
              }
            }

            return used
          },

          resetpress : function() {
            //console.log("resetpress",this.identifier)
            if (this.active != true) return
            for (var i=this.children.length-1; i>=0;i--) {
              this.children[i].resetpress()
            }
            if (this != scene.getpointerStealer() && this.pointerReset != null) this.pointerReset()
          },

          hoverTree : function(x,y) {

            var uselist = []
            
            for (var i=this.children.length-1; i >= 0; i--) {
              var used = []
              if (this.children[i].active) used = this.children[i].hoverTree(x,y)
              if (used.length > 0) {
                for (var k=0;k<used.length;k++) uselist.push( used[k] )
              }
            }

            if (this.hit != null) {
              var relx = (x-screenWidth/2)-this.absolutex()
              var rely = (y-screenHeight/2)-this.absolutey()
              if (this.hit(relx,rely)) uselist.push( this )
            }

            return uselist
          },

          unfocused_press : function(x,y) {

            var used = false

            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].unfocused_press(x,y)
            }
            
            if (this.unfocused_relativePress != null) {
              var relx = (x-screenWidth/2)-this.absolutex()
              var rely = (y-screenHeight/2)-this.absolutey()
              used = this.unfocused_relativePress(relx,rely)
            }
            if (this.unfocused_absolutePress != null) used = this.unfocused_absolutePress(x,y)

            return used
          },

          unfocused_drag : function(x,y) {

            var used = false
            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].unfocused_drag(x,y)
            }
            
            if (this.unfocused_relativeDrag != null) {
              var relx = (x-screenWidth/2)-this.absolutex()
              var rely = (y-screenHeight/2)-this.absolutey()
              used = this.unfocused_relativeDrag(relx,rely)
            }
            if (this.unfocused_absoluteDrag != null ) used = this.unfocused_absoluteDrag(x,y)
            
            return used
          },

          unfocused_release : function(x,y) {

            var used = false
            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].unfocused_release(x,y)
            }
            
            if (this.unfocused_relativeRelease != null) {
              var relx = (x-screenWidth/2)-this.absolutex()
              var rely = (y-screenHeight/2)-this.absolutey()
              used = this.unfocused_relativeRelease(relx,rely)
            }
            if (this.unfocused_absoluteRelease != null) used = this.unfocused_absoluteRelease(x,y)
            
            return used
          },
          //käy kaikki läpi
          //listaan osuneet
          //poimitaan alin

          //focusoidulle press/drag/release

          //defaultissa toimii kuten toivottu
          //scrollablessa hyvä niin kauan kun yritetään liikuttaa
          // - jotain eventtiä tarvitsee passata koko puulle
          // -- tyyliin press mutta niin ettei se tee

          //hover - etsi fokusoitavat - valitse päälimmäinen
          //

          // ylösalas scroll
          // vasenoikea scroll
          // button

          // button - press,drag
          // vasenoikea - unfocused_press,unfocused_drag
          // ylösalas - unfocused_press,unfocused_drag

          // hoverfocusoidulle eventit
          // jos joku unfocused päättääkin että tarvitsee focuksen, stealpointers

          // x position within parent
          x : function() {
            return this.position.x
          },

          // y position within parent
          y : function() {
            return this.position.y
          },

          // width
          width : function() {
            return this.size.width*this.scale.x
          },

          // height
          height : function() {
            return this.size.height*this.scale.y
          },

          // top
          top : function() {
            return this.position.y-this.height()/2
          },

          // bottom
          bottom : function() {
            return this.position.y+this.height()/2
          },

          // left
          left : function() {
            return this.position.x-this.width()/2
          },

          // right
          right : function() {
            return this.position.x+this.width()/2
          },

          absolutex : function() {
            var parentx = 0
            if (this.parent != null) parentx = this.parent.absolutex()
            return parentx+this.x()
          },

          absolutey : function() {
            var parenty = 0
            if (this.parent != null) parenty = this.parent.absolutey()
            return parenty+this.y()
          },

          absolutescalex : function() {
            var parentscalex = 1
            if (this.parent != null) parentscalex = this.parent.absolutescalex()
            return parentscalex*this.scale.x
          },

          absolutescaley : function() {
            var parentscaley = 1
            if (this.parent != null) parentscaley = this.parent.absolutescaley()
            return parentscaley*this.scale.y
          },

          absolutealpha : function() {
            var parenta = 1.0
            if (this.parent != null) parenta = this.parent.absolutealpha()
            return parenta*this.alpha
          },

          activate : function() {
            this.active = true
            if (this.postActivate != null) this.postActivate()
          },

          deactivate : function() {
            this.active = false
            if (this.postDeactivate != null) this.postDeactivate()
          },

          removeTree : function() {

            for (var i=0;i<this.children.length;i++) {
              this.children[i].removeTree()
            }
            this.children = []

            if (this.destroy) this.destroy()

          },

          removeSelf : function() {

            this.removeTree()

            if (this.parent == null) return

            for (var i=0;i<this.parent.children.length;i++) {
              if (this.parent.children[i] == this) {
                //console.log("removing: "+this.identifier+" from "+this.parent.identifier)
                this.parent.children.splice(i,1)
                break
              }
            }

          },

          bringToFront : function() {
            if (this.parent == null) return

            for (var i=0;i<this.parent.children.length;i++) {
              if (this == this.parent.children[i]) {
                array_move(this.parent.children,i,this.parent.children.length-1)
                break;
              }
            }
          },

          sendToBack : function() {
            if (this.parent == null) return

            for (var i=0;i<this.parent.children.length;i++) {
              if (this == this.parent.children[i]) {
                array_move(this.parent.children,i,0)
                break;
              }
            }
          },

        }

      }
    }
  })()

  curlify.module("object",object)

})()
