
var focusable = {}
focusable.new = function(ident,width,height) {

  var focusable = quad.new(ident,width,height);
  focusable.focused = false

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
    if (this.click != null) this.click(x,y)
    if (this.defocus != null) this.defocus(x,y)
    this.focused = false
    return true
  }

  focusable.pointerReset = function() {
    //console.log("pointerReset",this.identifier)
    if (this.defocus != null) this.defocus(0,0)
    this.focused = false
  }

  return focusable;
};
