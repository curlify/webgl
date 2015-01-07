
var rectangle_program = null;


var rectangle = function(width,height,color) {
  var rectangle = new quad("rectangle",width,height);

  if (rectangle_program == null) {
    var vertexShader = createShaderFromScript(gl,"rectangle-vertex-shader");
    var fragmentShader = createShaderFromScript(gl,"rectangle-fragment-shader");
    rectangle_program = loadProgram(gl, [vertexShader, fragmentShader]);
  }

  rectangle.a_position_handle = gl.getAttribLocation(rectangle_program, "a_position");
  rectangle.u_red_handle = gl.getUniformLocation(rectangle_program, "u_red");
  rectangle.u_green_handle = gl.getUniformLocation(rectangle_program, "u_green");
  rectangle.u_blue_handle = gl.getUniformLocation(rectangle_program, "u_blue");
  rectangle.u_alpha_handle = gl.getUniformLocation(rectangle_program, "u_alpha");
  rectangle.u_model_handle = gl.getUniformLocation(rectangle_program, "u_model");
  rectangle.u_view_handle = gl.getUniformLocation(rectangle_program, "u_view");
  rectangle.u_projection_handle = gl.getUniformLocation(rectangle_program, "u_projection");

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

  rectangle.render = function() {
    gl.useProgram(rectangle_program);

    gl.uniform1f(this.u_red_handle, this.color.red);
    gl.uniform1f(this.u_green_handle, this.color.green);
    gl.uniform1f(this.u_blue_handle, this.color.blue);
    gl.uniform1f(this.u_alpha_handle, this.absolutealpha());

    gl.uniformMatrix4fv(this.u_projection_handle, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.u_view_handle, false, this.viewMatrix);
    gl.uniformMatrix4fv(this.u_model_handle, false, this.quadModelMatrix);
    
    gl.enableVertexAttribArray(this.a_position_handle)
    gl.bindBuffer(gl.ARRAY_BUFFER, rectangle_program.buffer);
    gl.vertexAttribPointer(this.a_position_handle, rectangle_program.buffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectangle_program.buffer.numItems);
  };

  rectangle.color = (color == null ? {red:1, green:1, blue:1} : color);

  return rectangle;
}

