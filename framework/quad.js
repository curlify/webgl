
(function() {

  var curlify = document.currentScript.curlify

  var quad = (function() {

    console.log("initialize quad module")

    var glutils = curlify.getModule("glutils")
    var object = curlify.getModule("object")

    return {

      buffer : null,
      
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
                v_tex_coord = a_tex_coordinate;\
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
                gl_FragColor = vec4(color.rgb, color.a * u_alpha);\
              }\
            ',
            type: "x-shader/x-fragment"
          }

          var gl = curlify.localVars.gl

          var vertexShader = glutils.createShader(gl, vertex)
          var fragmentShader = glutils.createShader(gl, fragment)

          this.glProgram = glutils.loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_texture","u_alpha","u_model","u_view","u_projection"]);

        }
      },

      new : function(ident,width,height) {

        var gl = curlify.localVars.gl
        var screenWidth = curlify.localVars.screenWidth

        if (this.buffer == null) {
          this.buffer = gl.createBuffer();
          this.buffer.itemSize = 2;
          this.buffer.numItems = 4;

          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
          var vertices = [
            -1, -1, 0, 0,
             1, -1, 1, 0,
            -1,  1, 0, 1,
             1,  1, 1, 1,
          ];
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);    
        }

        var instance = object.new(ident,width,height);

        instance.glProgram = this.default_program.getProgram()
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
          mat4.scale(this.quadModelMatrix,this.quadModelMatrix,[(this.size.width)/multiplier,(-this.size.height)/multiplier,1]);
        };

        instance.draw = function() {

          if (this.texture == null) {
            //console.log("texture not loaded",this.identifier)
            return
          }

          gl.useProgram(this.glProgram.program);

          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, this.texture)
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
      },

    };

  })()

  curlify.module("quad",quad)

})()
