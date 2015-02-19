
(function() {

  var curlify = document.currentScript.curlify

  var fbo_object = (function() {

    console.log("initialize fbo_object module")

    var glutils = curlify.getModule("glutils")
    var scene = curlify.getModule("scene")
    var quad = curlify.getModule("quad")
    var sys = curlify.getModule("sys")

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

          var gl = curlify.localVars.gl

          var vertexShader = glutils.createShader(gl, vertex)
          var fragmentShader = glutils.createShader(gl, fragment)

          this.glProgram = glutils.loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_texture","u_alpha","u_model","u_view","u_projection"]);
        }
      },      

      new : function(identifier,w,h,disable_alpha) {

        var gl = curlify.localVars.gl

        var instance = quad.new("fbo_object : "+identifier,w,h);

        instance.glProgram = this.default_program.getProgram()
        console.log("fbo_object.new(",instance.dentifier,instance.size.width,instance.size.height,curlify.localVars.screenWidth,curlify.localVars.screenHeight,")")

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

        var colormode = (disable_alpha ? gl.RGB : gl.RGBA)

        gl.texImage2D(gl.TEXTURE_2D, 0, colormode, instance.framebuffer.width, instance.framebuffer.height, 0, colormode, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, instance.texture, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        instance.preStep = function(timedelta) {
          var timelapsed = sys.timestamp()-this.lastUpdated

          if (this.fboUpdatesDisabled || this.dobypassFbo) return
          if (timelapsed >= this.updateInterval) {
            instance.updateFbo()
          }
        }

        instance.updateFbo = function() {
          scene.addFboUpdate(instance)
        }

        instance.renderFbo = function() {
          gl.bindTexture(gl.TEXTURE_2D, null);
          var previousframebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING)

          var previousscreenWidth = curlify.localVars.screenWidth
          var previousscreenHeight = curlify.localVars.screenHeight
          var previouslayoutwidth = curlify.localVars.layoutWidth
          var previouslayoutheight = curlify.localVars.layoutHeight
          var previouslayoutoffset = {x:curlify.localVars.layoutOffset.x,y:curlify.localVars.layoutOffset.y}

          gl.viewport(0, 0, instance.size.width, instance.size.height)
          gl.bindFramebuffer(gl.FRAMEBUFFER, instance.framebuffer);
          gl.clearColor(0.0, 0.0, 0.0, 0.0);
          gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

          curlify.localVars.screenWidth = instance.size.width
          curlify.localVars.screenHeight = instance.size.height
          curlify.localVars.layoutWidth = instance.size.width
          curlify.localVars.layoutHeight = instance.size.height
          curlify.localVars.layoutOffset = {x:0,y:0}
          screenWidth = curlify.localVars.screenWidth 
          screenHeight = curlify.localVars.screenHeight
          layoutWidth = curlify.localVars.layoutWidth 
          layoutHeight = curlify.localVars.layoutHeight
          layoutOffset = curlify.localVars.layoutOffset

          for (var i = 0; i < instance.children.length; i++) {
            instance.children[i].parent = null;
            instance.children[i].viewMatrix = curlify.localVars.camera.viewMatrix
            instance.children[i].drawTree();
          };

          curlify.localVars.screenWidth = previousscreenWidth
          curlify.localVars.screenHeight = previousscreenHeight
          curlify.localVars.layoutWidth = previouslayoutwidth
          curlify.localVars.layoutHeight = previouslayoutheight
          curlify.localVars.layoutOffset = previouslayoutoffset
          screenWidth = curlify.localVars.screenWidth 
          screenHeight = curlify.localVars.screenHeight
          layoutWidth = curlify.localVars.layoutWidth 
          layoutHeight = curlify.localVars.layoutHeight
          layoutOffset = curlify.localVars.layoutOffset

          gl.viewport(curlify.localVars.layoutOffset.x, curlify.localVars.layoutOffset.y, curlify.localVars.layoutWidth, curlify.localVars.layoutHeight)
          gl.bindFramebuffer(gl.FRAMEBUFFER, previousframebuffer);

          instance.lastUpdated = sys.timestamp()
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

          gl.useProgram(this.glProgram.program);

          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, instance.texture)
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
      }
    }

  })()

  curlify.module("fbo_object",fbo_object)

})()


