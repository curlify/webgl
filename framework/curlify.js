/**
@preserve

Curlify - A javascript webgl framework
<http://curlify.io>

(c) 2013-2015 Curlify LLC
*/
(function() {

  var curScript = document.currentScript || document._currentScript;

  console.log("initialize curlify",curScript)

  curScript.curlify = {

    modules : {},

    localVars : {},

    extract : function(obj, objId) {
      var code = []
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          try {
            eval('var ' + i)
            code.push('var ' + i + '=' + objId + '["' + i + '"]')
          } catch (e) {}
        }
      }
      return code.join(';')
    },

    module : function(id,codeobject) {
      //console.log("curlify.module",id,codeobject)
      if (this.modules[id] != null ) {
        console.log("WARNING: overwriting module",id)
      }
      if (codeobject == null) {
        console.log("ERROR: setting null code as module '"+id+"'")
      }
      this.modules[id] = codeobject
    },

    getModule : function(id) {
      //console.log("curlify.getModule('"+id+"')",modules[id])
      return this.modules[id]
    },

    clearModuleBuffersAndPrograms : function() {
      console.log("clearModuleBuffersAndPrograms()")

      // loop all modules and reset glprograms
      for (var i in this.modules){
        var module = this.modules[i]
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

  // local variables for scripts local scope - evil
  curScript.curlify.localVars.sensors = {acceleration:null,rotationRate:null,orientation:{alpha:0,beta:0,gamma:0}, damped_orientation:{alpha:0,beta:0,gamma:0,inertia:10}}
  curScript.curlify.localVars.zipfile = null
  curScript.curlify.localVars.layoutWidth = null
  curScript.curlify.localVars.layoutHeight = null
  curScript.curlify.localVars.layoutOffset = {x:0,y:0}
  curScript.curlify.localVars.layoutScale = {x:1,y:1}

  curScript.curlify.localVars.gl = null
  curScript.curlify.localVars.camera = null

  curScript.curlify.localVars.viewWidth = null
  curScript.curlify.localVars.viewHeight = null

  curScript.curlify.localVars.screenWidth = null
  curScript.curlify.localVars.screenHeight = null


})()
