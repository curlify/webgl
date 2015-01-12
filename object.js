
var object = function(ident,width,height) {

  return {
    identifier : (ident == null ? "object identifier" : ident),
    position : {x:0, y:0, z:0},
    rotate : {x:0, y:0, z:0},
    scale : {x:1, y:1, z:1},
    size : {width:(width == null ? screenWidth : width), height:(height == null ? screenHeight : height)},
    children : [],
    active : true,
    visible : true,
    alpha : 1,

    projectionMatrix : camera.projectionMatrix,
    viewMatrix : camera.viewMatrix,
    modelMatrix : mat4.identity( mat4.create() ),
    modelViewMatrix : mat4.identity( mat4.create() ),
    translateScale : camera.translateScale,
    identityMatrix : mat4.identity( mat4.create() ),

    anim : new animator(),
    lastdraw : 0,

    add : function(child) {
      child.parent = this;
      this.children.push( child )
      return child
    },

    updateModelMatrix : function() {
      var modelMatrix = this.modelMatrix;
      mat4.set(this.identityMatrix,modelMatrix);
      if (this.position.x != 0 || this.position.y != 0 || this.position.z != 0) {
        var translateScale = screenWidth/(this.translateScale*2)
        mat4.translate(modelMatrix,vec3.create([this.position.x/translateScale,-this.position.y/translateScale,this.position.z/translateScale]) );
      }
      if (this.rotate.z != 0) mat4.rotateZ(modelMatrix,-this.rotate.z);
      if (this.rotate.y != 0) mat4.rotateY(modelMatrix,-this.rotate.y);
      if (this.rotate.x != 0) mat4.rotateX(modelMatrix,-this.rotate.x);
      if (this.scale.x != 1 || this.scale.y != 1 || this.scale.z != 1) mat4.scale(modelMatrix,vec3.create([this.scale.x,this.scale.y,this.scale.z]));

      this.modelMatrix = modelMatrix;
    },

    update : function() {
      //console.log("update : "+this.identifier)

      var mvMatrix = this.viewMatrix;
      if (this.parent != null && this.parent.modelViewMatrix != null) {
        mvMatrix = this.parent.modelViewMatrix;
      }
      this.viewMatrix = mvMatrix;
      this.updateModelMatrix();

      if (this.children.length > 0) {
        mat4.set( this.viewMatrix, this.modelViewMatrix );
        mat4.multiply( this.modelViewMatrix, this.modelMatrix );
      }

    },

    draw : function() {
      //console.log("draw : "+this.identifier+" children : "+this.children.length)

      var timedelta = Math.min(sys.timestamp()-this.lastdraw,60)
      this.lastdraw = sys.timestamp()
      if (this.step != null) this.step(timedelta);
      this.anim.step();

      if (this.visible == false) return

      this.update();
      if (this.render != null) this.render();
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].draw();
      };
      if (this.postRender != null) this.postRender();

    },

    press : function(x,y) {

      var used = false
      if (this.relativePress != null) {
        var relx = (x-screenWidth/2)-this.absolutex()
        var rely = (y-screenHeight/2)-this.absolutey()
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
        var relx = (x-screenWidth/2)-this.absolutex()
        var rely = (y-screenHeight/2)-this.absolutey()
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
        var relx = (x-screenWidth/2)-this.absolutex()
        var rely = (y-screenHeight/2)-this.absolutey()
        used = this.relativeRelease(relx,rely)
      }
      if (this.absoluteRelease != null) used = this.absoluteRelease(x,y)
      
      for (var i=this.children.length-1; i >= 0; i--) {
        if (this.children[i].active) used = this.children[i].release(x,y)
      }
      
      return used
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

    absolutealpha : function() {
      var parenta = 1.0
      if (this.parent != null) parenta = this.parent.absolutealpha()
      return parenta*this.alpha
    },
  }

};

object.new = function(ident,width,height) {
  return new object(ident,width,height)
}


