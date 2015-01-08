
var object = function(ident,width,height) {

  return {
    identifier : (ident == null ? "object identifier" : ident),
    position : {x:0, y:0, z:0},
    rotate : {x:0, y:0, z:0},
    scale : {x:1, y:1, z:1},
    size : {width:(width == null ? screenWidth : width), height:(height == null ? screenHeight : height)},
    children : [],

    projectionMatrix : camera.projectionMatrix,
    viewMatrix : camera.viewMatrix,
    modelMatrix : mat4.identity( mat4.create() ),
    modelViewMatrix : mat4.identity( mat4.create() ),
    translateScale : camera.translateScale,
    identityMatrix : mat4.identity( mat4.create() ),

    anim : new animator(),

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
      if (this.rotate.z != 0) mat4.rotateZ(modelMatrix,this.rotate.z);
      if (this.rotate.y != 0) mat4.rotateY(modelMatrix,this.rotate.y);
      if (this.rotate.x != 0) mat4.rotateX(modelMatrix,this.rotate.x);
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

      if (this.step != null) this.step();
      this.anim.step();
      this.update();
      if (this.render != null) this.render();
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].draw();
      };

    },

    absolutealpha : function() {
      return 1;
    }
  }

};