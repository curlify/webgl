
(function() {

  var curlify = document.currentScript.curlify

  var object = curlify.getModule("object")
  var quad = curlify.getModule("quad")

  var plane = (function() {

    console.log("initialize plane module")

    return {
      new : function(ident,cols,rows,width,height) {

        var gl = curlify.localVars.gl
        var screenWidth = curlify.localVars.screenWidth
        var screenHeight = curlify.localVars.screenHeight

        var instance = object.new(ident,width,height);

        var colVertexCount = cols + 1
        var rowVertexCount = rows + 1

        var ysize = instance.size.height/instance.size.width

        var vertices = []
        for (var y=0;y<rowVertexCount;y++){
          var vy = (-1 + (y*2)/rows)*ysize
          var vv = y/rows
          for (var x=0;x<colVertexCount;x++){
            var vx = -1 + x*2/cols
            var vu = x/cols
            vertices.push( vx, vy, vu, vv )
          }
        }
        instance.buffer = gl.createBuffer();
        instance.buffer.itemSize = 2; 
        instance.buffer.numItems = 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, instance.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);    

        //console.log(vertices)

        var indices = []
        var j = 0
        for (var row = 0; row < rows; row++) {
          for (var col = 0; col < cols; col++) {
            // First triangle
            indices.push(  row      * colVertexCount + col     )   // 1
            indices.push(  row      * colVertexCount + col + 1 )   // 2
            indices.push( (row + 1) * colVertexCount + col     )   // 3
            // Second triangle                                             
            indices.push(  row      * colVertexCount + col + 1 )   // 2
            indices.push( (row + 1) * colVertexCount + col + 1 )   // 4
            indices.push( (row + 1) * colVertexCount + col     )   // 3
            j = j + 6
          }
        }
        instance.indices = gl.createBuffer();
        instance.indices.indexCount = indices.length
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, instance.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        //console.log(indices)
        //console.log("indexCount",instance.indices.indexCount)
        

        instance.glProgram = quad.default_program.getProgram()
        instance.quadModelMatrix = mat4.create();

        instance.updateModelMatrix = function() {
          mat4.identity(this.modelMatrix);
          if (this.position.x != 0 || this.position.y != 0 || this.position.z != 0) {
            var translateScale = screenWidth/(this.translateScale*2)
            mat4.translate(this.modelMatrix,this.modelMatrix,[this.position.x/translateScale,-this.position.y/translateScale,this.position.z/translateScale] );
          }
          if (this.rotate.z != 0) mat4.rotateZ(this.modelMatrix,this.modelMatrix,-this.rotate.z);
          if (this.rotate.y != 0) mat4.rotateY(this.modelMatrix,this.modelMatrix,-this.rotate.y);
          if (this.rotate.x != 0) mat4.rotateX(this.modelMatrix,this.modelMatrix,-this.rotate.x);
          if (this.scale.x != 1 || this.scale.y != 1 || this.scale.z != 1) mat4.scale(this.modelMatrix,this.modelMatrix,[this.scale.x,this.scale.y,this.scale.z]);
          if (this.origo.x != 0 || this.origo.y != 0 || this.origo.z != 0) {
            var translateScale = screenWidth/(this.translateScale*2)
            mat4.translate(this.modelMatrix,this.modelMatrix,vec3.clone([-this.origo.x/translateScale,this.origo.y/translateScale,-this.origo.z/translateScale]) );
          }

          mat4.copy(this.quadModelMatrix,this.modelMatrix);

          var multiplier = screenWidth/this.translateScale;
          mat4.scale(this.quadModelMatrix,this.quadModelMatrix,[(this.size.width)/multiplier,(-this.size.height)/multiplier*1/ysize,1]);
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
          
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
          gl.enableVertexAttribArray(this.glProgram.a_position_handle)
          gl.enableVertexAttribArray(this.glProgram.a_tex_coordinate_handle)

          gl.vertexAttribPointer(this.glProgram.a_position_handle, this.buffer.itemSize, gl.FLOAT, false, 16, 0);
          gl.vertexAttribPointer(this.glProgram.a_tex_coordinate_handle, this.buffer.itemSize, gl.FLOAT, false, 16, 8);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)
          gl.drawElements(gl.TRIANGLES, this.indices.indexCount, gl.UNSIGNED_SHORT, 0)
        };

        return instance;
      }
    }

  })()

  curlify.module("plane",plane)

})()
