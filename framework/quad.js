
var quad = {}

quad.new = function(ident,width,height) {

  if (quad.buffer == null) {
    quad.buffer = gl.createBuffer();
    quad.buffer.itemSize = 2;
    quad.buffer.numItems = 4;

    gl.bindBuffer(gl.ARRAY_BUFFER, quad.buffer);
    vertices = [
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);    
  }

  var instance = object.new(ident,width,height);

  instance.glProgram = image_program.getProgram()
  instance.quadModelMatrix = mat4.identity( mat4.create() );

  instance.updateModelMatrix = function() {
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
    mat4.set(this.modelMatrix,this.quadModelMatrix);

    var multiplier = screenWidth/this.translateScale;
    mat4.scale(this.quadModelMatrix,vec3.create([(this.size.width)/multiplier,(-this.size.height)/multiplier,1]));
  };

  instance.draw = function() {

    if (instance.texture == null) {
      //console.log("texture not loaded",this.identifier)
      return
    }

    gl.useProgram(this.glProgram.program);

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, instance.texture)
    gl.uniform1i(this.glProgram.u_texture_handle, 0)

    gl.uniform1f(this.glProgram.u_alpha_handle, this.absolutealpha());

    gl.uniformMatrix4fv(this.glProgram.u_projection_handle, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.glProgram.u_view_handle, false, this.viewMatrix);
    gl.uniformMatrix4fv(this.glProgram.u_model_handle, false, this.quadModelMatrix);
    
    var buffer = (this.buffer ? this.buffer : quad.buffer)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(this.glProgram.a_position_handle)
    gl.enableVertexAttribArray(this.glProgram.a_tex_coordinate_handle)

    gl.vertexAttribPointer(this.glProgram.a_position_handle, buffer.itemSize, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this.glProgram.a_tex_coordinate_handle, buffer.itemSize, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.numItems);
  };

  return instance;
};
