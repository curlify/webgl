/**
@preserve

Curlify - A javascript webgl framework
<http://curlify.io>

(c) 2013-2015 Curlify LLC
*/
(function() {

  console.log("initialize curlify",document.currentScript,document.currentScript.nodeParent)

  document.currentScript.curlify = {

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
  document.currentScript.curlify.localVars.sensors = {acceleration:null,rotation:null,orientation:null}
  document.currentScript.curlify.localVars.zipfile = null
  document.currentScript.curlify.localVars.layoutWidth = null
  document.currentScript.curlify.localVars.layoutHeight = null
  document.currentScript.curlify.localVars.layoutOffset = {x:0,y:0}
  document.currentScript.curlify.localVars.layoutScale = {x:1,y:1}

  document.currentScript.curlify.localVars.gl = null
  document.currentScript.curlify.localVars.camera = null

  document.currentScript.curlify.localVars.viewWidth = null
  document.currentScript.curlify.localVars.viewHeight = null

  document.currentScript.curlify.localVars.screenWidth = null
  document.currentScript.curlify.localVars.screenHeight = null


})()
