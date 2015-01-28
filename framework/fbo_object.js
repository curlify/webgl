
var fbo_program = {
  program : null,
  getProgram : function() {
    if (this.program == null) this.loadProgram()
    return this.program
  },
  loadProgram : function() {
    var vertex = {
      text: '\
        attribute vec2 a_position;\
        attribute vec2 a_tex_coordinate;\
        \
        uniform mat4 u_projection;\
        uniform mat4 u_view;\
        uniform mat4 u_model;\
        \
        varying vec2 v_tex_coord;\
        \
        void main() {\
          gl_Position = u_projection*u_view*u_model*vec4(a_position, 0.0, 1.0);\
          v_tex_coord = vec2(a_tex_coordinate.x,1.0-a_tex_coordinate.y);\
        }\
        ',
      type: "x-shader/x-vertex"
    }
    var fragment = {
      text: '\
        precision mediump float;\
        \
        varying vec2      v_tex_coord;\
        \
        uniform sampler2D u_texture;\
        uniform float     u_alpha;\
        \
        void main() {\
          vec4 color = texture2D(u_texture, v_tex_coord);\
          gl_FragColor = color * u_alpha;\
        }\
      ',
      type: "x-shader/x-fragment"
    }

    var vertexShader = createShader(gl, vertex)
    var fragmentShader = createShader(gl, fragment)
    var program = loadProgram(gl, [vertexShader, fragmentShader]);

    program.a_position_handle = gl.getAttribLocation(program, "a_position");
    program.a_tex_coordinate_handle = gl.getAttribLocation(program, "a_tex_coordinate");

    program.u_alpha_handle = gl.getUniformLocation(program, "u_alpha");
    program.u_model_handle = gl.getUniformLocation(program, "u_model");
    program.u_view_handle = gl.getUniformLocation(program, "u_view");
    program.u_projection_handle = gl.getUniformLocation(program, "u_projection");

    program.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, program.buffer);
    vertices = [
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    program.buffer.itemSize = 2;
    program.buffer.numItems = 4;

    this.program = program
  }
};


var fbo_object = function(identifier,w,h) {

  var instance = new quad("fbo_object : "+identifier,w,h);

  instance.program = fbo_program.getProgram()
  console.log("fbo_object.new(",instance.dentifier,instance.size.width,instance.size.height,")")

  instance.dobypassFbo = false
  instance.lastUpdated = -99999
  instance.updateInterval = 0

  instance.framebuffer = gl.createFramebuffer();
  instance.framebuffer.width = instance.size.width
  instance.framebuffer.height = instance.size.height
  gl.bindFramebuffer(gl.FRAMEBUFFER, instance.framebuffer);

  instance.texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, instance.texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, instance.framebuffer.width, instance.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, instance.texture, 0);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  instance.preStep = function(timedelta) {
    var timelapsed = sys.timestamp()-this.lastUpdated

    if (this.fboUpdatesDisabled || this.dobypassFbo) return
    if (timelapsed >= this.updateInterval) {
      instance.updateFbo()
    }
  }

  instance.updateFbo = function() {
    var previousframebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING)

    var previousscreenwidth = screenWidth
    var previousscreenheight = screenHeight
    var previouslayoutwidth = layoutWidth
    var previouslayoutheight = layoutHeight
    var previouslayoutoffset = {x:layoutOffset.x,y:layoutOffset.y}

    gl.viewport(0, 0, this.size.width, this.size.height)
    gl.bindFramebuffer(gl.FRAMEBUFFER, instance.framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    screenWidth = this.size.width
    screenHeight = this.size.height
    layoutWidth = this.size.width
    layoutHeight = this.size.height
    layoutOffset = {x:0,y:0}

    for (var i = 0; i < this.children.length; i++) {
      this.children[i].parent = null;
      this.children[i].viewMatrix = camera.viewMatrix
      this.children[i].drawTree();
    };

    screenWidth = previousscreenwidth
    screenHeight = previousscreenheight
    layoutWidth = previouslayoutwidth
    layoutHeight = previouslayoutheight
    layoutOffset = previouslayoutoffset

    gl.viewport(layoutOffset.x, layoutOffset.y, layoutWidth, layoutHeight)
    gl.bindFramebuffer(gl.FRAMEBUFFER, previousframebuffer);

    this.lastUpdated = sys.timestamp()
  }

  instance.drawTree = function() {
    var timedelta = Math.min(sys.timestamp()-this.lastdraw,60)
    this.lastdraw = sys.timestamp()

    if (this.visible == false) return

    this.update();

    if (this.dobypassFbo) {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].parent = this
        this.children[i].viewMatrix = this.modelViewMatrix
        this.children[i].drawTree();
      };
    } else {
      if (this.draw != null) this.draw();
    }
    if (this.postDraw != null) this.postDraw();
  }

  instance.draw = function() {

    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, instance.texture)
    gl.uniform1i(this.program.u_texture_handle, 0)

    gl.uniform1f(this.program.u_alpha_handle, this.absolutealpha());

    gl.uniformMatrix4fv(this.program.u_projection_handle, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.program.u_view_handle, false, this.viewMatrix);
    gl.uniformMatrix4fv(this.program.u_model_handle, false, this.quadModelMatrix);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.program.buffer);
    gl.enableVertexAttribArray(this.program.a_position_handle)
    gl.enableVertexAttribArray(this.program.a_tex_coordinate_handle)

    gl.vertexAttribPointer(this.program.a_position_handle, this.program.buffer.itemSize, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this.program.a_tex_coordinate_handle, this.program.buffer.itemSize, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.program.buffer.numItems);
  };

  return instance;
}

fbo_object.new = function(identifier,w,h) {
  return new fbo_object(identifier,w,h)
}

