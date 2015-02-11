
var image_program = {
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
          gl_FragColor = color * u_alpha;\
        }\
      ',
      type: "x-shader/x-fragment"
    }

    var vertexShader = createShader(gl, vertex)
    var fragmentShader = createShader(gl, fragment)

    this.glProgram = loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_texture","u_alpha","u_model","u_view","u_projection"]);

  }
};

var image = {}

image.loadImage = function(source) {

  var image = null
  // type is file, other option is another image in which case we just refer to that objects texture
  if ( typeof(source) == "string" ) {

    console.log("image.new(",source,")",curlify.zipfile)

    image = curlify.addImageElement()

    if (curlify.zipfile != null) {
      console.log("image.source zip",zipEntry,source,curlify.zipfile)
      var zipEntry = curlify.zipfile.file(source)
      image.src = 'data:image/jpg;base64,' + JSZip.base64.encode(zipEntry.asBinary())
    } else {
      console.log("image source file")
      image.crossOrigin = 'anonymous';
      image.src = source;
    }
  } 

  return image

}

image.new = function(source,geometry) {

  var instance = (geometry ? geometry : quad.new("image : "+source))

  instance.size.width = null
  instance.size.height = null

  //instance.glProgram = image_program.getProgram()

  if ( source instanceof HTMLElement ) {

    console.log("image.new from canvas",source)

    instance.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, instance.texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    if (instance.size.width == null) instance.size.width = source.width
    if (instance.size.height == null) instance.size.height = source.height
    
    instance.loaded = true
    if (instance.onload != null) instance.onload()

  } else if ( source instanceof Object ) {

    if (source.texture != null || source.size != null ) {

      console.log("image.new from Object",source)
      
      instance.texture = source.texture
      instance.image = source.image

      if (instance.size.width == null) instance.size.width = source.size.width
      if (instance.size.height == null) instance.size.height = source.size.height

      instance.loaded = true
      if (instance.onload != null) instance.onload()

    } else {

      console.log("ERROR: image.new from unknown Object",source)

    }

  } else if ( typeof(source) == "string" ) {

    console.log("image.new from string",source)

    instance.image = image.loadImage(source)
    instance.image.onload = function() {
      if (image == null) {
        console.log("image == null!")
        return
      }
      instance.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, instance.texture);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, instance.image);

      if (instance.size.width == null) instance.size.width = instance.image.width
      if (instance.size.height == null) instance.size.height = instance.image.height

      console.log("texture loaded : "+instance.size.width+"x"+instance.size.height)

      instance.loaded = true
      if (instance.onload != null) instance.onload()
    }
    instance.image.onerror = function() {
      console.log("texture load failed",source)
    }

  } else {

    console.log("ERROR: image.new from unknown object",source)

  }

  return instance;
}
