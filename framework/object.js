
(function() {

  var object = (function() {

    console.log("initialize object module")

    var scene = curlify.getModule("scene")
    var animator = curlify.getModule("animator")
    var sys = curlify.getModule("sys")

    return {
      new : function(ident,width,height) {

        var gl = curlify.gl

        return {

          identifier : (ident == null ? "object identifier" : ident),
          position : {x:0, y:0, z:0},
          rotate : {x:0, y:0, z:0},
          scale : {x:1, y:1, z:1},
          size : {width:(width == null ? curlify.screenWidth : width), height:(height == null ? curlify.screenHeight : height)},
          children : [],
          active : true,
          visible : true,
          alpha : 1,

          blend : true,
          drawbackside : false,
          depthtest : false,

          projectionMatrix : curlify.camera.projectionMatrix,
          viewMatrix : curlify.camera.viewMatrix,
          modelMatrix : mat4.identity( mat4.create() ),
          modelViewMatrix : mat4.identity( mat4.create() ),
          translateScale : curlify.camera.translateScale,
          identityMatrix : mat4.identity( mat4.create() ),

          anim : animator.new(),
          timervalue : 0,
          lastdraw : 0,
          laststep : 0,

          add : function(child) {
            child.parent = this;
            this.children.push( child )
            return child
          },

          updateModelMatrix : function() {
            var modelMatrix = this.modelMatrix;
            mat4.copy(modelMatrix,this.identityMatrix);
            if (this.position.x != 0 || this.position.y != 0 || this.position.z != 0) {
              var translateScale = curlify.screenWidth/(this.translateScale*2)
              mat4.translate(modelMatrix,modelMatrix,vec3.clone([this.position.x/translateScale,-this.position.y/translateScale,this.position.z/translateScale]) );
            }
            if (this.rotate.z != 0) mat4.rotateZ(modelMatrix,modelMatrix,-this.rotate.z);
            if (this.rotate.y != 0) mat4.rotateY(modelMatrix,modelMatrix,-this.rotate.y);
            if (this.rotate.x != 0) mat4.rotateX(modelMatrix,modelMatrix,-this.rotate.x);
            if (this.scale.x != 1 || this.scale.y != 1 || this.scale.z != 1) mat4.scale(modelMatrix,modelMatrix,vec3.clone([this.scale.x,this.scale.y,this.scale.z]));

            this.modelMatrix = modelMatrix;
          },

          update : function() {
            //console.log("update : "+this.identifier,this.size.width,this.size.height)

            var mvMatrix = this.viewMatrix;
            if (this.parent != null && this.parent.modelViewMatrix != null) {
              mvMatrix = this.parent.modelViewMatrix;
            }
            this.viewMatrix = mvMatrix;
            this.updateModelMatrix();

            if (this.children.length > 0) {
              mat4.copy( this.modelViewMatrix,this.viewMatrix );
              mat4.multiply( this.modelViewMatrix, this.modelViewMatrix, this.modelMatrix );
            }

            if (this.depthtest) {
              gl.enable( gl.DEPTH_TEST )
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
            
            var timedelta = Math.max(1,Math.min(sys.timestamp()-this.laststep,60))
            this.laststep = sys.timestamp()

            this.anim.step()

            if (this.preStep != null) this.preStep()
            if (this.step != null) this.step(timedelta)

            for (var i = 0; i < this.children.length; i++) {
              this.children[i].stepTree();
            };

            if (this.postStep != null) this.postStep()
            
          },

          drawTree : function() {
            //console.log("drawTree : "+this.identifier+" children : "+this.children.length)

            var timedelta = Math.min(sys.timestamp()-this.lastdraw,60)
            this.lastdraw = sys.timestamp()

            if (this.visible == false) return

            this.update();
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

          press : function(x,y) {

            var used = false
            if (this.relativePress != null) {
              var relx = (x-curlify.screenWidth/2)-this.absolutex()
              var rely = (y-curlify.screenHeight/2)-this.absolutey()
              used = this.relativePress(relx,rely)
            }
            if (this.absolutePress != null) used = this.absolutePress(x,y)

            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].press(x,y)
            }
            
            return used
          },

          drag : function(x,y) {

            var used = false
            if (this.relativeDrag != null) {
              var relx = (x-curlify.screenWidth/2)-this.absolutex()
              var rely = (y-curlify.screenHeight/2)-this.absolutey()
              used = this.relativeDrag(relx,rely)
            }
            if (this.absoluteDrag != null ) used = this.absoluteDrag(x,y)
            
            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].drag(x,y)
            }
            
            return used
          },

          release : function(x,y) {

            var used = false
            if (this.relativeRelease != null) {
              var relx = (x-curlify.screenWidth/2)-this.absolutex()
              var rely = (y-curlify.screenHeight/2)-this.absolutey()
              used = this.relativeRelease(relx,rely)
            }
            if (this.absoluteRelease != null) used = this.absoluteRelease(x,y)
            
            for (var i=this.children.length-1; i >= 0; i--) {
              if (this.children[i].active) used = this.children[i].release(x,y)
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

        }

      }
    }
  })()

  curlify.module("object",object)

})()
