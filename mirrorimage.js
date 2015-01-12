
var mirrorimage_program = null;


var mirrorimage = function(source) {
  var mirrorimage = new quad("mirrorimage : "+source);

  if (mirrorimage_program == null) {
    var vertexShader = createShaderFromScript(gl,"mirrorimage-vertex-shader");
    var fragmentShader = createShaderFromScript(gl,"mirrorimage-fragment-shader");
    mirrorimage_program = loadProgram(gl, [vertexShader, fragmentShader]);
    
    mirrorimage_program.a_position_handle = gl.getAttribLocation(mirrorimage_program, "a_position");
    mirrorimage_program.a_tex_coordinate_handle = gl.getAttribLocation(mirrorimage_program, "a_tex_coordinate");

    mirrorimage_program.u_alpha_handle = gl.getUniformLocation(mirrorimage_program, "u_alpha");
    mirrorimage_program.u_model_handle = gl.getUniformLocation(mirrorimage_program, "u_model");
    mirrorimage_program.u_view_handle = gl.getUniformLocation(mirrorimage_program, "u_view");
    mirrorimage_program.u_projection_handle = gl.getUniformLocation(mirrorimage_program, "u_projection");

    mirrorimage_program.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mirrorimage_program.buffer);
    vertices = [
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    mirrorimage_program.buffer.itemSize = 2;
    mirrorimage_program.buffer.numItems = 4;
  }

  mirrorimage.image = new Image();
  mirrorimage.image.crossOrigin = '';
  mirrorimage.image.src = source;
  mirrorimage.image.onload = function() {

    if (mirrorimage.image == null) return
    mirrorimage.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, mirrorimage.texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mirrorimage.image);

    mirrorimage.size.width = mirrorimage.image.width
    mirrorimage.size.height = mirrorimage.image.height

    console.log("mirrorimage texture loaded : "+mirrorimage.size.width+"x"+mirrorimage.size.height)

    mirrorimage.loaded = true
    if (mirrorimage.onload != null) mirrorimage.onload()
  }

  mirrorimage.render = function() {

    if (mirrorimage.loaded != true) {
      //console.log("texture not loaded")
      return
    }

    if (this.blend == false) {
      gl.disable( gl.BLEND )
    } else {
      gl.enable( gl.BLEND )
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    gl.useProgram(mirrorimage_program);

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, mirrorimage.texture)
    gl.uniform1i(mirrorimage_program.u_texture_handle, 0)

    gl.uniform1f(mirrorimage_program.u_alpha_handle, this.absolutealpha());

    gl.uniformMatrix4fv(mirrorimage_program.u_projection_handle, false, this.projectionMatrix);
    gl.uniformMatrix4fv(mirrorimage_program.u_view_handle, false, this.viewMatrix);
    gl.uniformMatrix4fv(mirrorimage_program.u_model_handle, false, this.quadModelMatrix);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, mirrorimage_program.buffer);
    gl.enableVertexAttribArray(mirrorimage_program.a_position_handle)
    gl.enableVertexAttribArray(mirrorimage_program.a_tex_coordinate_handle)

    gl.vertexAttribPointer(mirrorimage_program.a_position_handle, mirrorimage_program.buffer.itemSize, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(mirrorimage_program.a_tex_coordinate_handle, mirrorimage_program.buffer.itemSize, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, mirrorimage_program.buffer.numItems);
  };

  return mirrorimage;
}

mirrorimage.new = function(source) {
  return new mirrorimage(source)
}

