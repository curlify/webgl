
(function() {

  var curScript = document.currentScript || document._currentScript;

  var curlify = curScript.curlify
  
  var button = (function() {

    console.log("initialize button module")

    var image = curlify.getModule("image")
    var focusable = curlify.getModule("focusable")

    return {
      new : function(source) {
        /*
        var instance = curlify.mergeRecursive(focusable.new(),image.new(source))
        return instance
        */
        
        var focusable = image.new(source)
        focusable.focused = false
        focusable.hovered = false
        focusable.identifier = "button : "+source

        focusable.hit = function(x,y) {
          if (x < -this.width()/2 || x > this.width()/2 || y < -this.height()/2 || y > this.height()/2) return false
          return true
        }

        focusable.relativePress = function(x,y) {
          if (this.hit(x,y)) {
            if (this.focus != null) this.focus(x,y)
            this.focused = true
            return true
          }
          return false
        }

        focusable.relativeDrag = function(x,y) {
          if (this.focused != true) return false
          if (this.hit(x,y) != true) {
            if (this.defocus != null) this.defocus(x,y)
            this.focused = false
          } else {
            if (this.focusdrag != null) this.focusdrag(x,y)
          }
          return true
        }

        focusable.relativeRelease = function(x,y) {
          if (this.focused != true) return false
          //if (this.click != null) this.click(x,y)
          if (this.defocus != null) this.defocus(x,y)
          this.focused = false
          return true
        }

        focusable.hover = function(x,y) {
          var used = false
          if (this.hit(x,y)) {
            if (this.hovered == false && this.hover_focus != null) this.hover_focus(x,y)
            this.hovered = true
            used = true
          } else {
            if (this.hovered && this.hover_defocus != null) {
              this.hover_defocus(x,y)
              used = true
            }
            this.hovered = false
          }
          return used
        }

        focusable.resethover = function() {
          if (this.hovered && this.hover_defocus != null) this.hover_defocus()
          this.hovered = false
        }

        focusable.pointerReset = function() {
          //console.log("pointerReset",this.identifier)
          if (this.defocus != null) this.defocus(0,0)
          this.focused = false
        }

        return focusable;
        
      }
    }

  })()

  curlify.module("button",button)
})()

