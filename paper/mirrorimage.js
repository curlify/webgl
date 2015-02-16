
var mirrorimage_program = {
  program : null,
  getProgram : function() {
    if (this.glProgram == null) this.loadProgram()
    return this.glProgram
  },
  loadProgram : function() {
    var vertex = {
      text: '\
      attribute vec2 a_position; \
      attribute vec2 a_tex_coordinate; \
      \
      uniform mat4 u_projection; \
      uniform mat4 u_view; \
      uniform mat4 u_model; \
      \
      varying vec2 v_tex_coord; \
      \
      void main() { \
        gl_Position = u_projection*u_view*u_model*vec4(a_position, 0.0, 1.0); \
        v_tex_coord = a_tex_coordinate; \
      } \
      ',
      type: "x-shader/x-vertex"
    }
    var fragment = {
      text: '\
      precision mediump float; \
      \
      varying vec2      v_tex_coord; \
      \
      uniform sampler2D u_texture; \
      uniform float     u_alpha; \
      \
      void main() { \
        \
        float offset = 1.0 - v_tex_coord.y*2.0; \
        float alpha = u_alpha * offset; \
        \
        vec4 color = texture2D(u_texture, vec2(v_tex_coord.x,1.0-v_tex_coord.y)); \
        \
        gl_FragColor = color * alpha; \
      } \
      ',
      type: "x-shader/x-fragment"
    }

    var vertexShader = createShader(gl, vertex)
    var fragmentShader = createShader(gl, fragment)
    this.glProgram = loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_alpha","u_model","u_view","u_projection"]);

  }
}

var mirrorimage = function(source) {
  var instance = image.new(source);

  instance.glProgram = mirrorimage_program.getProgram()

  return instance
}


mirrorimage.new = function(source) {
  return new mirrorimage(source)
}

