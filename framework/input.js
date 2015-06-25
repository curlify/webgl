
(function() {

  var curlify = document.currentScript.curlify
  
  var input = (function() {

    console.log("initialize input module")
    var button = curlify.getModule("button")

    return {
      new : function(width,fontSize,inputparameters) {

        var gl = curlify.localVars.gl

        fontSize = fontSize || 14

        var canvas = document.createElement("canvas");
        canvas.width = width || 150
        canvas.height = fontSize + 15

        //console.log(canvas.width,canvas.height)
        
        var instance = button.new(canvas)
        instance.size.width = canvas.width
        instance.size.height = canvas.height

        inputparameters = inputparameters || {}
        inputparameters.canvas = canvas
        inputparameters.fontSize = fontSize
        inputparameters.width = inputparameters.width || canvas.width
        //inputparameters.height = canvas.height

        instance.input = new CanvasInput(inputparameters);

        instance.input.onupdate = function() {
          curlify.renderRequired = true
        }

        instance.click = function() {
          instance.input.focus()
        }

        instance.preDraw = function() {
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        }

        instance.destroy = function() {
          /*
          if (this.texture != null) {
            gl.deleteTexture(this.texture)
            this.texture = null
          }
          */
          if (instance.input == null) return
          instance.input.destroy()
          instance.input = null
        }

        return instance;
        
      }
    }

  })()

  curlify.module("input",input)
})()

