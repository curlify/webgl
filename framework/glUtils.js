
(function() {

var curlify = document.currentScript.curlify

var glutils = (function(){

  console.log("initialize glutils module")

  var error = function(msg) {
    if (window.console) {
      if (window.console.error) {
        window.console.error(msg);
      }
      else if (window.console.log) {
        window.console.log(msg);
      }
    }
  }

  /**
   * Loads a shader.
   * @param {!WebGLContext} gl The WebGLContext to use.
   * @param {string} shaderSource The shader source.
   * @param {number} shaderType The type of shader.
   * @param {function(string): void) opt_errorCallback callback for errors.
   * @return {!WebGLShader} The created shader.
   */
  var loadShader = function(gl, shaderSource, shaderType, opt_errorCallback) {
    var errFn = opt_errorCallback || error;
    // Create the shader object
    var shader = gl.createShader(shaderType);

    // Load the shader source
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check the compile status
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      // Something went wrong during compilation; get the error
      lastError = gl.getShaderInfoLog(shader);
      errFn("*** Error compiling shader '" + shader + "':" + lastError);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  return {

    /**
     * Creates a program, attaches shaders, binds attrib locations, links the
     * program and calls useProgram.
     * @param {!Array.<!WebGLShader>} shaders The shaders to attach
     * @param {!Array.<string>} opt_attribs The attribs names.
     * @param {!Array.<number>} opt_locations The locations for the attribs.
     */
    loadProgram : function(gl, shaders, opt_attribs, opt_uniforms) {

      var glProgram = {}

      var program = gl.createProgram();
      for (var ii = 0; ii < shaders.length; ++ii) {
        gl.attachShader(program, shaders[ii]);
      }
      /*
      if (opt_attribs) {
        for (var ii = 0; ii < opt_attribs.length; ++ii) {
          gl.bindAttribLocation(
              program,
              opt_locations ? opt_locations[ii] : ii,
              opt_attribs[ii]);
        }
      }
      */
      gl.linkProgram(program);

      // Check the link status
      var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!linked) {
          // something went wrong with the link
          lastError = gl.getProgramInfoLog (program);
          error("Error in program linking:" + lastError);

          gl.deleteProgram(program);
          return null;
      }

      if (opt_attribs) {
        for (var ii = 0; ii < opt_attribs.length; ++ii) {
          var handleName = opt_attribs[ii]+"_handle"
          //console.log("attrib",handleName)
          glProgram[handleName] = gl.getAttribLocation(program,opt_attribs[ii])
        }
      }
      if (opt_uniforms) {
        for (var ii = 0; ii < opt_uniforms.length; ++ii) {
          var handleName = opt_uniforms[ii]+"_handle"
          //console.log("uniform",handleName)
          glProgram[handleName] = gl.getUniformLocation(program,opt_uniforms[ii])
        }
      }

      glProgram.program = program

      return glProgram;
    },

    createShader : function(
        gl, shaderScript, opt_shaderType, opt_errorCallback) {
      var shaderType;
      var shaderSource = shaderScript.text;

      if (!opt_shaderType) {
        if (shaderScript.type == "x-shader/x-vertex") {
          shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type == "x-shader/x-fragment") {
          shaderType = gl.FRAGMENT_SHADER;
        } else if (shaderType != gl.VERTEX_SHADER && shaderType != gl.FRAGMENT_SHADER) {
          throw("*** Error: unknown shader type");
          return null;
        }
      }

      return loadShader(
          gl, shaderSource, opt_shaderType ? opt_shaderType : shaderType,
          opt_errorCallback);
    },

  }

})()

curlify.module("glutils",glutils)

})()
