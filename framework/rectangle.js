
(function() {

  var curScript = document.currentScript || document._currentScript;

  var curlify = curScript.curlify

  var rectangle = (function(){

    console.log("initialize rectangle module")

    var glutils = curlify.getModule("glutils")
    var quad = curlify.getModule("quad")
    var mat4 = curlify.getModule("mat4")

    return {

      default_program : {
        glProgram : null,
        getProgram : function() {
          if (this.glProgram == null) this.loadProgram()
          return this.glProgram
        },
        loadProgram : function() {
          var vertex = {
            text: '\
              attribute vec2 a_position;\
              \
              uniform mat4 u_projection;\
              uniform mat4 u_view;\
              uniform mat4 u_model;\
              \
              void main() {\
                gl_Position = u_projection*u_view*u_model*vec4(a_position, 0.0, 1.0);\
              }',
            type: 'x-shader/x-vertex'
          }

          var fragment = {
            text: '\
              precision mediump float;\
              \
              uniform float     u_red;\
              uniform float     u_green;\
              uniform float     u_blue;\
              uniform float     u_alpha;\
              \
              void main() {\
                gl_FragColor = vec4( u_red, u_green, u_blue, 1.0 ) * u_alpha;\
              }',
            type: 'x-shader/x-fragment'
          }

          var gl = curlify.localVars.gl

          var vertexShader = glutils.createShader(gl, vertex)
          var fragmentShader = glutils.createShader(gl, fragment)
          this.glProgram = glutils.loadProgram(gl, [vertexShader, fragmentShader], ["a_position"], ["u_red", "u_green", "u_blue", "u_alpha","u_model","u_view","u_projection"]);
        }
      },

      new : function(width,height,color) {

        var gl = curlify.localVars.gl

        var instance = quad.new("rectangle",width,height);

        instance.glProgram = this.default_program.getProgram()
        instance.color = (color == null ? {red:0, green:0, blue:0} : color);

        instance.draw = function() {
          gl.useProgram(this.glProgram.program);

          gl.uniform1f(this.glProgram.u_red_handle, this.color.red);
          gl.uniform1f(this.glProgram.u_green_handle, this.color.green);
          gl.uniform1f(this.glProgram.u_blue_handle, this.color.blue);
          gl.uniform1f(this.glProgram.u_alpha_handle, this.absolutealpha());

          gl.uniformMatrix4fv(this.glProgram.u_projection_handle, false, this.projectionMatrix);
          gl.uniformMatrix4fv(this.glProgram.u_view_handle, false, this.viewMatrix);
          gl.uniformMatrix4fv(this.glProgram.u_model_handle, false, this.quadModelMatrix);
          
          var buffer = (this.buffer ? this.buffer : quad.buffer)

          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.enableVertexAttribArray(this.glProgram.a_position_handle)

          gl.vertexAttribPointer(this.glProgram.a_position_handle, buffer.itemSize, gl.FLOAT, false, 16, 0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.numItems);
        };

        return instance
      },

    }
  })()

  curlify.module("rectangle",rectangle)
})()

