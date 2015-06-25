
(function() {

var curScript = document.currentScript || document._currentScript;

var curlify = curScript.curlify

var animator = (function() {

  console.log("initialize animator module")

  var sys = curlify.getModule("sys")

  var CONFIG_KEYS = {
    time : true,
    ease : true,
    start : true,
    onComplete : true,
  }

  return {

    new : function() {

      var instance = {

        animations : [],

        animate : function(target, config) {
          if (config.ease == null) {
            config.ease = animator.linear
          }

          if (config.start == null) config.start = 0;

          var keys = []
          var init = []
          var final = []
          // gather initial values
          for (var key in config) {
            var value = config[key]
            if (CONFIG_KEYS[key] == null) {

              if (target[key] == null) {
                console.log("ERROR: Animated property cannot be initially nil : "+key)
              } else {
                keys.push( key )
                init.push( target[key] )
                final.push( value )
              }
            }
          }

          this.animations.push(
            {
              keys : keys,
              target : target,
              start : sys.timestamp() + config.start,
              deadline : sys.timestamp() + config.start + config.time,
              config : config,
              init : init,
              final : final,
            }
          )

          //console.log("request step",this.animations)

          //window.requestAnimationFrame(this.step)
          //curlify.requestRender()
        },

        step : function() {

          var dead = []
          var now = Date.now()

          if (this.animations.length > 0) curlify.renderRequired = true

          var key = null          
          for (var k=0;k<this.animations.length;k++) {
            key = k

            var animation = this.animations[key]
            var deadline = animation.deadline
            var pos = 0
            
            if (animation.paused == true) {
              now = animation.pausetimestamp
            }
            
            if (now < animation.deadline) {
              pos = 1.0 - ((animation.deadline - now) / animation.config.time)
            } else if (now < animation.start) {
              pos = 0.0
            } else {
              pos = 1.0
              dead.push(key)
            }

            pos = Math.max(pos, 0.00001)

            for (var i=0;i<animation.keys.length;i++){
              var animkey = animation.keys[i]
              var initial = animation.init[i]
              var finalval = animation.final[i]
              animation.target[animkey] = animation.config.ease( initial, finalval, pos )
            }
            
            
          }

          
          //remove dead animations
          for (i = dead.length-1; i >= 0; i--) {
            var completeFunc = this.animations[dead[i]].config.onComplete
            this.animations.splice(dead[i],1)
            if (completeFunc != null) {
              completeFunc()
            }
          }

        },

        pause : function() {
          for (var k in this.animations) {
            this.animations [k].paused = true
            this.animations [k].pausetimestamp = sys.timestamp()
          }
        },

        resume : function() {
          for (var k in this.animations) {
            this.animations [k].paused = false
            this.animations [k].deadline = this.animations [k].deadline + (sys.timestamp() - this.animations [k].pausetimestamp)
          }
          //window.requestAnimationFrame(this.step)
          //curlify.requestRender()
        },

        stop : function() {
          for (var k in this.animations) {
            this.animations [k].keys = []
            this.animations [k].init = []
            this.animations [k].final = []
            this.animations [k].config.onComplete = null
          }
          this.animations = []
        },
      }

      return instance
    }

  };

})()


animator.linear = function(initial, final, pos) {
  return initial + (final - initial) * pos
}

animator.inQuad = function(initial, final, pos) {
  return initial + (final - initial) * pos * pos
}

animator.outQuad = function(initial, final, pos) {
  return initial + -(final - initial) * pos * (pos - 2)
}

animator.inOutQuad = function(initial, final, pos) {
  if (pos < 0.5) {
    pos = pos * 2 // map range [0, 0.5) value to range [0, 1.0)
    return initial + (final - initial)/2 * pos * pos
  } else {
    pos = (pos - 0.5) * 2 // map range [0.5, 1.0] to range [0, 1.0]
    return initial - (final - initial)/2 * (pos * (pos - 2) - 1)
  }
}

animator.inCubic = function(initial, final, pos) {
  return initial + (final - initial) * pos * pos * pos;
}

animator.outCubic = function(initial, final, pos) {
  pos = pos - 1 // map range [0, 1.0) to range [-1, 0)
  return initial + (final - initial) * (pos * pos * pos + 1)
}

animator.inOutCubic = function(initial, final, pos) {
  if (pos < 0.5) {
    pos = pos * 2 // map range [0, 0.5) to range [0, 1.0)
    return initial + (final - initial)/2 * pos * pos * pos
  } else {
    pos = (pos - 0.5) * 2  - 1 // map range [0.5, 1.0] to range [-1, 0]
    return initial + (final - initial)/2 * (pos * pos * pos + 2)
  }
}

animator.inQuart = function(initial, final, pos) {
  return initial + (final - initial) * pos * pos * pos * pos
}

animator.outQuart = function(initial, final, pos) {
  pos = pos - 1 // map range [0, 1.0) to range [-1, 0)
  return initial - (final - initial) * (pos * pos * pos * pos - 1)
}

animator.inOutQuart = function(initial, final, pos) {
  if (pos < 0.5) {
    pos = pos * 2 // map range [0, 0.5) to range [0, 1.0)
    return initial + (final - initial)/2 * pos * pos * pos * pos
  } else {
    pos = (pos - 0.5) * 2  - 1 // map range [0.5, 1.0] to range [-1, 0]
    return initial - (final - initial)/2 * (pos * pos * pos *pos - 2)
  }
}

animator.inSine = function(initial, final, pos) {
  return initial + (final - initial) * (1 - Math.cos(pos * Math.PI/2))
}

animator.outSine = function(initial, final, pos) {
  return initial + (final - initial) * Math.sin(pos * Math.PI/2)
}

animator.inOutSine = function(initial, final, pos) {
  return initial - (final - initial)/2 * (Math.cos(Math.PI * pos) - 1)
}

animator.inExpo = function(initial, final, pos) {
  pos = pos - 1 // map range [0, 1.0] to range [-1, 0]
  return initial + (final - initial) * Math.pow(2, 10*pos)
}

animator.outExpo = function(initial, final, pos) {
  return initial + (final - initial) * (1 - Math.pow(2, -10*pos))
}

animator.inOutExpo = function(initial, final, pos) {
  if (pos < 0.5) {
    pos = pos * 2 - 1 // map range [0, 1.0) to range [-1, 0)
    return initial + (final - initial)/2 * Math.pow(2, 10*pos)
  } else {
    pos = (pos - 0.5) * 2 // map range [0.5, 1.0] to range [0, 1.0]
    return initial + (final - initial)/2 * (2 - Math.pow(2, -10*pos))
  }
}

animator.inCirc = function(initial, final, pos) {
  return initial + (final - initial) * (1 - Math.sqrt(1 - pos*pos))
}

animator.outCirc = function(initial, final, pos) {
  pos = pos - 1 // map range [0, 1.0] to range [-1, 0]
  return initial + (final - initial) * Math.sqrt(1 - pos*pos)
}

animator.inOutCirc = function(initial, final, pos) {
  if (pos < 0.5) {
    pos = pos * 2 // map range [0, 0.5) to range [0, 1.0)
    return initial + (final - initial)/2 * (1 - Math.sqrt(1 - pos*pos))
  } else {
    pos = (pos - 0.5) * 2  - 1 // map range [0.5, 1.0] to range [-1, 0]
    return initial + (final - initial)/2 * (1 + Math.sqrt(1 - pos*pos))
  }
}

animator.inElastic = function(initial, final, pos) {
  pos = pos - 1 // Map range [0, 1] to range [-1, 0]
  return initial - (final - initial) * Math.pow(2.0, 10.0*pos) * Math.sin((pos - 0.0777777) * 6.0 * Math.PI)
}

animator.outElastic = function(initial, final, pos) {
  return initial + (final - initial) * (Math.pow(2.0, -10.0*pos) * Math.sin((pos - 0.0777777) * 6.0 * Math.PI) + 1)
}


curlify.module("animator",animator)

})()

