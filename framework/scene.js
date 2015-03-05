
(function() {

  var curlify = document.currentScript.curlify
  
  var scene = (function() {

    console.log("initialize scene module")

    var animator = curlify.getModule("animator")
    var sys = curlify.getModule("sys")

    var scenestack = []
    var fboUpdateList = []
    var sceneanim = animator.new()
    var pointerStealer = null

    var lastframe = 0
    var move = function(source,target,inertia,timedelta) {
      if (timedelta > 100) timedelta = 100
      var dir = 1
      if (source > target) dir = -1
      var move = (-dir*timedelta / (inertia*16.66)) * Math.abs(source-target)
      if (Math.abs(move) < 0.0001) { source = target } else { source = source-move }
      if (dir == 1 && source > target) source = target
      if (dir == -1 && source < target) source = target
      return source
    }

    var damp = function(source,target,value,limit,td) {
      var diff = target[value]-source[value]
      if (Math.abs(diff) > limit) {
        var dir = diff / Math.abs(diff)
        target[value] = move(target[value],source[value]+(dir*360),target.inertia,td)
        if (dir==-1 && target[value] < -180) target[value] = target[value]+360
        if (dir==1 && target[value] > 180) target[value] = target[value]-360
      } else {
        target[value] = move(target[value],source[value],target.inertia,td)
      }
    }

    return {

      render : function() {

        var td = sys.timestamp()-lastframe
        lastframe = sys.timestamp()

        damp(curlify.localVars.sensors.orientation,curlify.localVars.sensors.damped_orientation,"alpha",180,td)
        damp(curlify.localVars.sensors.orientation,curlify.localVars.sensors.damped_orientation,"beta",180,td)
        damp(curlify.localVars.sensors.orientation,curlify.localVars.sensors.damped_orientation,"gamma",180,td)

        //var ts = sys.timestamp()
        sceneanim.step()

        if (sceneanim.animations.length > 0) {
          var prevscene = scenestack[scenestack.length-2]
          prevscene.stepTree()
          prevscene.drawTree()
        }

        var target = scenestack[scenestack.length-1]
        if (target == null) return

        //var ts1 = sys.timestamp()
        target.stepTree()
        //var ts2 = sys.timestamp()
        target.drawTree()
        //var ts3 = sys.timestamp()

        for (var i=0;i<fboUpdateList.length;i++) {
          new function() {
            var fbo = fboUpdateList[i]
            fbo.renderFbo()
          }
        }
        fboUpdateList = []
        //var ts4 = sys.timestamp()

        //console.log((ts1-ts)+","+(ts2-ts1)+","+(ts3-ts2)+","+(ts4-ts3))

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
