
(function() {

  var curlify = document.currentScript.curlify

  var mesh = (function(){

    console.log("initialize mesh module")

    var glutils = curlify.getModule("glutils")
    var object = curlify.getModule("object")
    var image = curlify.getModule("image")

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
              attribute vec3 a_position;\
              attribute vec3 a_normal;\
              attribute vec2 a_tex_coordinate;\
              \
              uniform mat4 u_projection;\
              uniform mat4 u_view;\
              uniform mat4 u_model;\
              \
              varying vec3 v_normal;\
              varying vec2 v_tex_coord;\
              \
              void main() {\
                mat4 modelViewProj = u_projection*u_view*u_model;\
                gl_Position = modelViewProj * vec4(a_position, 1.0);\
                v_normal = vec3(modelViewProj * vec4(a_normal, 0.0));\
                v_tex_coord = a_tex_coordinate;\
              }\
            ',
            type: "x-shader/x-vertex"
          }
          var fragment = {
            text: '\
              precision mediump float;\
              \
              varying vec3      v_normal;\
              varying vec2      v_tex_coord;\
              \
              uniform sampler2D u_texture;\
              uniform float     u_alpha;\
              \
              void main() {\
                vec4 color = texture2D(u_texture, v_tex_coord);\
                float diffuse = max(dot(normalize(v_normal), vec3(0.0, 0.0, 1.0)), 0.0) + 0.3;\
                gl_FragColor = color * u_alpha;\
              }\
            ',
            type: "x-shader/x-fragment"
          }

          var gl = curlify.localVars.gl

          var vertexShader = glutils.createShader(gl, vertex)
          var fragmentShader = glutils.createShader(gl, fragment)

          this.glProgram = glutils.loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_normal","a_tex_coordinate"], ["u_texture","u_alpha","u_model","u_view","u_projection"]);

        }
      },

      new : function(source,texture) {

        var gl = curlify.localVars.gl
        var zipfile = curlify.localVars.zipfile

        var instance = object.new("mesh : "+source)
        instance.depthtest = true
        instance.drawbackside = true

        instance.loaded = false
        if (texture != null) {
          var img = image.loadImage(texture)
          img.onload = function() {
            instance.texture = gl.createTexture();

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, instance.texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            instance.loaded = true
          }
          img.onerror = function() {
            console.log("ERROR: texture load failed for mesh "+source+" : "+texture)
            instance.loaded = true
          }
        } else {
          console.log("WARNING: no texture defined for mesh "+source)
          instance.loaded = true
        }

        if (zipfile != null) {

          console.log("zipfile load",source)
          var zipEntry = zipfile.file(source)
          instance.mesh = new OBJ.Mesh(zipEntry.asBinary())
          OBJ.initMeshBuffers(gl, instance.mesh);

        } else {

          console.log("download load",texture)
          OBJ.downloadMeshes( {
            "model" : source,
          }, function(meshes) {
            instance.mesh = meshes.model
            OBJ.initMeshBuffers(gl, instance.mesh);
          });

        }

        instance.draw = function() {
          //console.log("drawing",mesh)
          if (this.loaded == false || this.mesh == null) return

          gl.useProgram(this.glProgram.program);

          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, instance.texture)
          gl.uniform1i(this.glProgram.u_texture_handle, 0)

          gl.uniform1f(this.glProgram.u_alpha_handle, this.absolutealpha());

          gl.uniformMatrix4fv(this.glProgram.u_projection_handle, false, this.projectionMatrix);
          gl.uniformMatrix4fv(this.glProgram.u_view_handle, false, this.viewMatrix);
          gl.uniformMatrix4fv(this.glProgram.u_model_handle, false, this.modelMatrix);
          
          gl.enableVertexAttribArray(this.glProgram.a_position_handle);
          gl.enableVertexAttribArray(this.glProgram.a_normal_handle);
          gl.enableVertexAttribArray(this.glProgram.a_tex_coordinate_handle);

          // now to render the mesh
          gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
          gl.vertexAttribPointer(this.glProgram.a_position_handle, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

          if (!this.mesh.textures.length) {
            gl.disableVertexAttribArray(this.glProgram.a_tex_coordinate_handle);
          } else {
            // if the texture vertexAttribArray has been previously
            // disabled, then it needs to be re-enabled
            gl.enableVertexAttribArray(this.glProgram.a_tex_coordinate_handle);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.textureBuffer);
            gl.vertexAttribPointer(this.glProgram.a_tex_coordinate_handle, this.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
          }

          gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
          gl.vertexAttribPointer(this.glProgram.a_normal_handle, this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
          gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        }

        instance.glProgram = this.default_program.getProgram()

        return instance
      },

    }
  })()

  curlify.module("mesh",mesh)
})()

