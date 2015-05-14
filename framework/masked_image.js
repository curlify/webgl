
(function() {

  var curScript = document.currentScript || document._currentScript;

  var curlify = curScript.curlify

  var glutils = curlify.getModule("glutils")
  var image = curlify.getModule("image")
  var quad = curlify.getModule("quad")

  var masked_image = (function() {

    console.log("initialize masked_image module")

    return {

      default_program : {
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
            uniform sampler2D u_mask_texture; \
            uniform float     u_alpha; \
            \
            void main() { \
              \
              vec4 color = texture2D(u_texture, v_tex_coord); \
              vec4 mask_color = texture2D(u_mask_texture, v_tex_coord); \
              \
              gl_FragColor = color * mask_color.a * u_alpha; \
            } \
            ',
            type: "x-shader/x-fragment"
          }

          var gl = curlify.localVars.gl

          var vertexShader = glutils.createShader(gl, vertex)
          var fragmentShader = glutils.createShader(gl, fragment)
          this.glProgram = glutils.loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_texture","u_mask_texture","u_alpha","u_model","u_view","u_projection"]);

        }
      },

      new : function(source,mask) {

        var gl = curlify.localVars.gl
        
        var instance = image.new(source);
        instance.identifier = "masked_image : "+source+" : "+mask

        console.log(instance.identifier)

        instance.mask = mask
        instance.glProgram = this.default_program.getProgram()

        instance.draw = function() {

          if (instance.loaded != true) {
            //console.log("texture not loaded",this.identifier)
            return
          }

          gl.useProgram(this.glProgram.program);

          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, instance.texture)
          gl.uniform1i(this.glProgram.u_texture_handle, 0)

          gl.activeTexture(gl.TEXTURE1)
          gl.bindTexture(gl.TEXTURE_2D, instance.mask.texture)
          gl.uniform1i(this.glProgram.u_mask_texture_handle, 1)

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
        }

        return instance
      }
    }
  })()

  curlify.module("masked_image",masked_image)

})()

