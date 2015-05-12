(function(){

  return {
    new : function(cms) {

      var instance = object.new()


      instance.layoutChanged = function() {
        instance.size.width = instance.parent.width()
        instance.size.height = instance.parent.height()
      }

      return instance
    }
  }

})()