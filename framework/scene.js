
(function() {

  var curlify = document.currentScript.curlify
  
  var scene = (function() {

    console.log("initialize scene module")

    var animator = curlify.getModule("animator")

    var scenestack = []
    var fboUpdateList = []
    var sceneanim = animator.new()
    var pointerStealer = null

    return {

      render : function() {
        sceneanim.step()

        if (sceneanim.animations.length > 0) {
          var prevscene = scenestack[scenestack.length-2]
          prevscene.stepTree()
          prevscene.drawTree()
        }

        var target = scenestack[scenestack.length-1]
        if (target == null) return
        target.stepTree()
        target.drawTree()

        for (var i=0;i<fboUpdateList.length;i++) {
          new function() {
            var fbo = fboUpdateList[i]
            fbo.renderFbo()
          }
        }
        fboUpdateList = []

      },

      openScene : function (scene,showanim,hideanim) {
        var prevscene = scenestack[scenestack.length-1]
        scenestack.push(scene)
        if (showanim != null) sceneanim.animate( scene, showanim )
        if (prevscene == null) return
        if (hideanim != null) sceneanim.animate( prevscene, hideanim )
      },

      closeScene : function(hideanim,showanim) {
        var scene = scenestack[scenestack.length-1]
        var prevscene = scenestack[scenestack.length-2]
        if (hideanim != null) {
          var callback = hideanim.onComplete
          var completefunc = function() {
            if (callback != null) callback()
            scenestack.splice(scenestack.length-1,1)
            console.log("remove scene from stack",scene.identifier,scenestack.length)
          }
          hideanim.onComplete = completefunc
          sceneanim.animate( scene, hideanim )
        } else {
          scenestack.splice(scenestack.length-1,1)
        }
        if (prevscene == null) return
        if (showanim != null) sceneanim.animate( prevscene, showanim )
      },

      removeAllScenes : function() {
        scenestack = []
        fboUpdateList = []
        sceneanim.stop()
        pointerStealer = null
      },

      isAnimating : function() {
        return sceneanim.animations.length > 0 ? true : false
      },

      getPointerUser : function() {
        return pointerStealer ? pointerStealer : scenestack[scenestack.length-1]
      },

      getpointerStealer : function() {
        return pointerStealer
      },

      stealPointers : function(obj) {
        console.log("stealPointers",obj)
        var target = pointerStealer ? pointerStealer : scenestack[scenestack.length-1]
        pointerStealer = obj
        target.resetpress()
      },

      resetPointerStealer : function() {
        pointerStealer = null
      },

      addFboUpdate : function(obj) {
        fboUpdateList.push(obj)
      },
    }

  })()

  curlify.module("scene",scene)

})()
