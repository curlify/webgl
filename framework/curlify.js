/*!
Curlify - A javascript webgl framework
<http://curlify.io>

(c) 2013-2015 Curlify LLC
*/
(function() {

  console.log("initialize curlify",document.currentScript)

  var modules = {}

  document.currentScript.curlify = {

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

    clearModuleBuffersAndPrograms : function() {
      console.log("clearModuleBuffersAndPrograms()")

      // loop all modules and reset glprograms
      for (var i in modules){
        var module = modules[i]
        console.log("checking",module.id)
        if (module.default_program != null) {
          console.log("clearing module program",module.id)
          module.default_program.glProgram = null
        }
        if (module.buffer != null) {
          console.log("clearing module buffer",module.id)
          module.buffer = null
        }
      }
    },

  }

})()
