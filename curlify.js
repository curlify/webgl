/*
Curlify - A javascript webgl framework
<http://curlify.io>

(c) 2015 Curlify Ou
*/

var curlify = (function() {

  console.log("initialize curlify")

  var modules = {}

  return {

    module : function(id,codeobject) {
      //console.log("curlify.module",id,codeobject)
      if (modules[id] != null ) {
        console.log("WARNING: overwriting module",id)
      }
      if (codeobject == null) {
        console.log("ERROR: setting null code as module '"+id+"'")
      }
      modules[id] = codeobject
    },

    getModule : function(id) {
      //console.log("curlify.getModule('"+id+"')",modules[id])
      return modules[id]
    },

  }

})()
