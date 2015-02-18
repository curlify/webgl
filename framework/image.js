
(function() {

  var curlify = document.currentScript.curlify

  var image = (function() {

    console.log("initialize image module")

    var quad = curlify.getModule("quad")

    return {
      loadImage : function(source) {

        var zipfile = curlify.localVars.zipfile

        var image = null
        if ( typeof(source) != "string" ) {
          console.log("ERROR: image.loadImage source is not of type string",source)
          return null
        }
        //console.log("image.new(",source,")",zipfile)
        image = new Image() //curlify.addImageElement()
        if (zipfile != null) {
          var zipEntry = zipfile.file(source)
          console.log("image.source zip",zipEntry,source,zipfile)
          image.src = 'data:image/jpg;base64,' + JSZip.base64.encode(zipEntry.asBinary())
        } else {
          //console.log("image source file")
          image.crossOrigin = 'anonymous';
          image.src = source;
        }
        return image
      },

      new : function(source,geometry) {

        var gl = curlify.localVars.gl

        var instance = (geometry ? geometry : quad.new("image : "+source))

        instance.size.width = null
        instance.size.height = null

        //instance.glProgram = image_program.getProgram()

        if ( source instanceof HTMLElement ) {

          //console.log("image.new from canvas",source)

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

            //console.log("image.new from Object",source)
            
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

          //console.log("image.new from string",source)

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

            //console.log("texture loaded : "+instance.size.width+"x"+instance.size.height)

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

    }
  })()

  curlify.module("image",image)

})()
