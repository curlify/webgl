
var image_program = null;


var image = function(source) {
  var image = new quad("image : "+source);

  if (image_program == null) {
    var vertexShader = createShaderFromScript(gl,"image-vertex-shader");
    var fragmentShader = createShaderFromScript(gl,"image-fragment-shader");
    image_program = loadProgram(gl, [vertexShader, fragmentShader]);
    
    image_program.a_position_handle = gl.getAttribLocation(image_program, "a_position");
    image_program.a_tex_coordinate_handle = gl.getAttribLocation(image_program, "a_tex_coordinate");

    image_program.u_alpha_handle = gl.getUniformLocation(image_program, "u_alpha");
    image_program.u_model_handle = gl.getUniformLocation(image_program, "u_model");
    image_program.u_view_handle = gl.getUniformLocation(image_program, "u_view");
    image_program.u_projection_handle = gl.getUniformLocation(image_program, "u_projection");

    image_program.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, image_program.buffer);
    vertices = [
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    image_program.buffer.itemSize = 2;
    image_program.buffer.numItems = 4;
  }

  image.image = new Image();
  image.image.crossOrigin = '';
  image.image.src = source;
  image.image.onload = function() {

    if (image.image == null) return
    image.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, image.texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.image);

    image.size.width = image.image.width
    image.size.height = image.image.height

    console.log("texture loaded : "+image.size.width+"x"+image.size.height)

    image.loaded = true
    if (image.onload != null) image.onload()
  }

  image.render = function() {

    if (image.loaded != true) {
      //console.log("texture not loaded")
      return
    }

    if (this.blend == false) {
      gl.disable( gl.BLEND )
    } else {
      gl.enable( gl.BLEND )
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    gl.useProgram(image_program);

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, image.texture)
    gl.uniform1i(image_program.u_texture_handle, 0)

    gl.uniform1f(image_program.u_alpha_handle, this.absolutealpha());

    gl.uniformMatrix4fv(image_program.u_projection_handle, false, this.projectionMatrix);
    gl.uniformMatrix4fv(image_program.u_view_handle, false, this.viewMatrix);
    gl.uniformMatrix4fv(image_program.u_model_handle, false, this.quadModelMatrix);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, image_program.buffer);
    gl.enableVertexAttribArray(image_program.a_position_handle)
    gl.enableVertexAttribArray(image_program.a_tex_coordinate_handle)

    gl.vertexAttribPointer(image_program.a_position_handle, image_program.buffer.itemSize, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(image_program.a_tex_coordinate_handle, image_program.buffer.itemSize, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, image_program.buffer.numItems);
  };

  return image;
}

image.new = function(source) {
  return new image(source)
}

