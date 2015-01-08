
var rectangle_program = null;


var rectangle = function(width,height,color) {
  var rectangle = new quad("rectangle",width,height);

  if (rectangle_program == null) {
    var vertexShader = createShaderFromScript(gl,"rectangle-vertex-shader");
    var fragmentShader = createShaderFromScript(gl,"rectangle-fragment-shader");
    rectangle_program = loadProgram(gl, [vertexShader, fragmentShader]);

    rectangle_program.a_position_handle = gl.getAttribLocation(rectangle_program, "a_position");
    rectangle_program.u_red_handle = gl.getUniformLocation(rectangle_program, "u_red");
    rectangle_program.u_green_handle = gl.getUniformLocation(rectangle_program, "u_green");
    rectangle_program.u_blue_handle = gl.getUniformLocation(rectangle_program, "u_blue");
    rectangle_program.u_alpha_handle = gl.getUniformLocation(rectangle_program, "u_alpha");
    rectangle_program.u_model_handle = gl.getUniformLocation(rectangle_program, "u_model");
    rectangle_program.u_view_handle = gl.getUniformLocation(rectangle_program, "u_view");
    rectangle_program.u_projection_handle = gl.getUniformLocation(rectangle_program, "u_projection");

    rectangle_program.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rectangle_program.buffer);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    rectangle_program.buffer.itemSize = 3;
    rectangle_program.buffer.numItems = 4;
  }

  rectangle.render = function() {
    if (this.blend == false) {
      gl.disable( gl.BLEND )
    } else {
      gl.enable( gl.BLEND )
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    gl.useProgram(rectangle_program);

    gl.uniform1f(rectangle_program.u_red_handle, this.color.red);
    gl.uniform1f(rectangle_program.u_green_handle, this.color.green);
    gl.uniform1f(rectangle_program.u_blue_handle, this.color.blue);
    gl.uniform1f(rectangle_program.u_alpha_handle, this.absolutealpha());

    gl.uniformMatrix4fv(rectangle_program.u_projection_handle, false, this.projectionMatrix);
    gl.uniformMatrix4fv(rectangle_program.u_view_handle, false, this.viewMatrix);
    gl.uniformMatrix4fv(rectangle_program.u_model_handle, false, this.quadModelMatrix);
    
    gl.enableVertexAttribArray(rectangle_program.a_position_handle)
    gl.bindBuffer(gl.ARRAY_BUFFER, rectangle_program.buffer);
    gl.vertexAttribPointer(rectangle_program.a_position_handle, rectangle_program.buffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectangle_program.buffer.numItems);
  };

  rectangle.color = (color == null ? {red:1, green:1, blue:1} : color);

  return rectangle;
}

