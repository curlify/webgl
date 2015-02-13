(function() {

  var glutils = curlify.require("glutils")
  var animator = curlify.require("animator")
  var object = curlify.require("object")
  var image = curlify.require("image")
  var plane = curlify.require("plane")

  console.log("curled_image included")

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
            uniform vec2 cylPos;\
            uniform vec2 N;\
            uniform float R;\
            \
            varying vec2 v_tex_coord;\
            varying vec3 v_normal;\
            \
            void main() {\
              vec2 pos = vec2(a_position.x,a_position.y);\
              float d = dot(pos.xy - cylPos, N);\
              float zMultiplier = 10.0;\
              float hack = 0.79;\
              if (d > 0.0 ) {\
                v_normal = vec3(0.0, 0.0, 1.0);\
                gl_Position = u_projection*u_view*u_model*vec4(pos.xy, 0.0, 1.0);\
              } else if (d < -0.88) {\
                vec2 C = vec2(pos.xy - d * N);\
                vec2 V = C + vec2( -d * N.x - N.x*hack, -d * N.y - N.y*hack);\
                v_normal = vec3(0.0, 0.0, -1.0);\
                gl_Position = u_projection*u_view*u_model*vec4( V, R*2.0*zMultiplier, 1.0);\
              } else {\
                vec3 C = vec3(pos.xy - d * N, R);\
                vec3 V = C + R * vec3( sin(d/R) * N.x, sin(d/R) * N.y, -cos(d/R));\
                v_normal = (C - V) / R;\
                V.z = V.z*zMultiplier;\
                gl_Position = u_projection*u_view*u_model*vec4(V, 1.0);\
              }\
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
            varying vec3      v_normal;\
            \
            uniform sampler2D u_texture;\
            uniform float     u_alpha;\
            \
            void main() {\
              vec3 light = vec3(0.0, 0.0, -1.0);\
              float shadow = min(1.0,max(0.25,dot(v_normal, -light) * 1.0));\
              vec4 color = texture2D(u_texture, v_tex_coord);\
              gl_FragColor = vec4(color.r*shadow,color.g*shadow,color.b*shadow,color.a * u_alpha);\
            }\
          ',
          type: "x-shader/x-fragment"
        }

        var vertexShader = glutils.createShader(curlify.gl, vertex)
        var fragmentShader = glutils.createShader(curlify.gl, fragment)

        this.glProgram = glutils.loadProgram(curlify.gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_texture","u_alpha","u_model","u_view","u_projection","cylPos","N","R"]);

      }
    },

    new : function( source ) {
      var gl = curlify.gl

      var curl = image.new(source,plane.new("curlable",15,15))
      curl.drawbackside = true
      curl.depthtest = true
      curl.glProgram = this.default_program.getProgram()
      curl.cylPos = [0,0]
      curl.cylDir = [0,0]
      curl.cylRad = 0.25
      curl.pressStart = {x:curlify.screenWidth/2,y:curlify.screenHeight/2}
      curl.pointerPos = {x:curlify.screenWidth/2,y:curlify.screenHeight/2}
      curl.pressOffset = {x:0,y:0}

      curl.resetcurl = function(allowrandom) {
        //console.log("resetcurl",allowrandom)
        var endfunc = (allowrandom == false ? null : curl.randomcurl)
        curl.anim.stop()
        curl.anim.animate( curl.pointerPos, {x:curl.pressStart.x,y:curl.pressStart.y,time:1000,ease:animator.inOutQuad,onComplete:endfunc})
        curl.anim.animate( curl.pressOffset, {x:0,y:0,time:1000,ease:animator.inOutQuad})
      }
      curl.randomcurl = function() {
        //console.log("randomcurl")
        curl.anim.stop()
        curl.pressStart = {x:curlify.screenWidth/2,y:curlify.screenHeight/2}
        curl.pointerPos = {x:curlify.screenWidth/2,y:curlify.screenHeight/2}
        curl.anim.animate( curl.pointerPos, {x:curlify.screenWidth/2-curlify.getRandom(90,100),y:curlify.screenHeight/2-curlify.getRandom(100,150),time:1000,ease:animator.inOutQuad,onComplete:curl.resetcurl})
      }
      curl.step = function(timedelta) {
        var x = Math.min(curlify.screenWidth/2,curl.pointerPos.x-curl.pressOffset.x)
        var y = Math.min(curlify.screenHeight/2,curl.pointerPos.y-curl.pressOffset.y)
        this.cylPos = [ x/(this.size.width/2)*1.1,y/(this.size.height/2)*1.1 ]
        this.cylDir = [(x-this.pressStart.x) / this.size.width,(y-this.pressStart.y) / this.size.height,0]
        this.cylDir = vec3.normalize( this.cylDir,this.cylDir )
      }

      curl.relativePress = function(x,y){
        if (y < curlify.screenHeight/3 || x < curlify.screenWidth/3) return
        scene.stealPointers(this)
        curl.anim.stop()

        curl.pressStart.x = curlify.screenWidth/2
        curl.pressOffset.x = (x-curl.pointerPos.x)
        curl.pressOffset.y = (y-curl.pointerPos.y)
      }
      curl.relativeDrag = function(x,y) {
        if (curl.anim.animations != 0) return
        curl.pointerPos.x = x
        curl.pointerPos.y = y
      }
      curl.relativeRelease = function(x,y) {
        if (curl.anim.animations != 0) return
        //console.log("cylinder: ",this.cylPos[0],this.cylPos[1])

        if (this.onrelease != null)
          this.onrelease()
        else
          curl.resetcurl()
      }

      curl.draw = function() {

        if (this.texture == null) {
          //console.log("texture not loaded",this.identifier)
          return
        }

        gl.useProgram(this.glProgram.program);

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.uniform1i(this.glProgram.u_texture_handle, 0)

        gl.uniform1f(this.glProgram.u_alpha_handle, this.absolutealpha());

        gl.uniform3f(this.glProgram.u_shadow_color_handle, this.shadow_color[0], this.shadow_color[1], this.shadow_color[2]);
        
        gl.uniform2f(this.glProgram.cylPos_handle, this.cylPos[0], this.cylPos[1])
        gl.uniform2f(this.glProgram.N_handle, this.cylDir[0], this.cylDir[1])
        gl.uniform1f(this.glProgram.R_handle, this.cylRad)

        gl.uniformMatrix4fv(this.glProgram.u_projection_handle, false, this.projectionMatrix);
        gl.uniformMatrix4fv(this.glProgram.u_view_handle, false, this.viewMatrix);
        gl.uniformMatrix4fv(this.glProgram.u_model_handle, false, this.quadModelMatrix);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.glProgram.a_position_handle)
        gl.enableVertexAttribArray(this.glProgram.a_tex_coordinate_handle)

        gl.vertexAttribPointer(this.glProgram.a_position_handle, this.buffer.itemSize, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.glProgram.a_tex_coordinate_handle, this.buffer.itemSize, gl.FLOAT, false, 16, 8);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)
        gl.drawElements(gl.TRIANGLES, this.indices.indexCount, gl.UNSIGNED_SHORT, 0)
      };

      //curl.resetcurl()

      return curl
    }

  }

})()

