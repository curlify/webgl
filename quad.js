
var quad = function(ident,width,height) {

  var quad = new object(ident,width,height);
  quad.quadModelMatrix = mat4.identity( mat4.create() );
  quad.updateModelMatrix = function() {
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
    mat4.set(this.modelMatrix,this.quadModelMatrix);

    var multiplier = screenWidth/this.translateScale;
    mat4.scale(this.quadModelMatrix,vec3.create([(this.size.width)/multiplier,(-this.size.height)/multiplier,1]));
  };

  return quad;
};