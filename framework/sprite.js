
(function() {

  var curScript = document.currentScript || document._currentScript;

  var curlify = curScript.curlify
  
  var object = curlify.getModule("object")
  var focusable = curlify.getModule("focusable")
  var image = curlify.getModule("image")

  var localNewFromSheet = function( sheet,loop,limitamount,limitoffsetstart, REPLACE_OBJECT ) {
    limitamount = (limitamount ? limitamount : sheet.frames.length)
    limitoffsetstart = (limitoffsetstart ? limitoffsetstart : 0)

    var instance = (REPLACE_OBJECT ? REPLACE_OBJECT : focusable.new("spritesheet "+sheet.name))
    
    for (var i=limitoffsetstart;i<limitoffsetstart+limitamount;i++) {
      var p = instance.add( image.new(sheet.frames[i]) )
      p.visible = false
      p.active = false
    }
    instance.size.width=sheet.spritewidth
    instance.size.height=sheet.spriteheight
    
    instance.frame = instance.children[0]
    instance.frametimervalue=0
    instance.frametime = 35

    //console.log("newFromSheet",sheet.name,limitoffsetstart,limitamount,instance.children.length)

    instance.restart = function(instant) {
      instance.frametimervalue=0
      var completefunc = instance.restart
      if (loop == false) completefunc = null
      var delay = (instance.loopdelay && !instant ? instance.loopdelay : 0)
      instance.anim.animate( instance, {frametimervalue:instance.children.length,start:delay,time:instance.frametime*instance.children.length,onComplete:completefunc})
    }

    instance.preStep = function(timedelta) {
      //console.log(instance.frame,Math.floor(instance.frametimervalue),instance.children.length)
      instance.frame.visible = false
      var index = Math.floor(instance.frametimervalue)
      if (index > instance.children.length-1) return
      instance.frame = instance.children[index]
      instance.frame.visible = true
    }
    
    instance.start = function() {
      if (instance.anim.animations.length > 0) {
        if (instance.anim.animations[0].paused) {
          instance.anim.resume()
          return
        }
      }
      instance.restart()
    }
    
    instance.stop = function() {
      instance.anim.pause()
    }
    
    instance.unload = function() {
      instance.anim.stop()
    }

    if (loop != false) instance.restart(true)

    return instance
  }

  var sprite = (function() {
    return {

      newSheet : function( source,xsize,ysize ) {

        var result = {spritewidth:0,spriteheight:0,frames:[]}

        if ( source instanceof Array) {
          var w = xsize
          var h = ysize

          var canvas = document.createElement("canvas");
          canvas.width = w
          canvas.height = h
          var context = canvas.getContext('2d');
          //console.log("sprite.newSheet.onload",typeof(canvas),canvas)

          var loaded = 0
          for (var i=0;i<source.length;i++) {
            new function() {
              var img = image.loadImage(source[i])
              img.onload = function() {
                context.drawImage(img,0,0)
                result.frames.push( image.new(canvas) )
                context.clearRect ( 0 , 0 , canvas.width, canvas.height )
                loaded = loaded + 1
                if (loaded == source.length) {
                  if (result.onload != null) result.onload()
                }
              }
            }
          }

          //console.log("sprite.newSheet",source,source.length,xsize,ysize,result.frames.length)
          
          result.spritewidth=w
          result.spriteheight=h
          result.name = "array "+source.length

        } else {
          var sheet = image.loadImage(source)
          sheet.onload = function() {

            var w = sheet.width/xsize
            var h = sheet.height/ysize

            var canvas = document.createElement("canvas");
            canvas.width = w
            canvas.height = h
            var context = canvas.getContext('2d');
            //console.log("sprite.newSheet.onload",typeof(canvas),canvas)

            for (var y=0;y<ysize;y++) {
              for (var x=0;x<xsize;x++) {
                context.drawImage(sheet, -x*w, -y*h)
                result.frames.push( image.new(canvas) )
                context.clearRect ( 0 , 0 , canvas.width, canvas.height )
              }
            }

            //console.log("sprite.newSheet",source,sheet.width,sheet.height,xsize,ysize,result.frames.length)
            
            result.spritewidth=w
            result.spriteheight=h
            result.name = source

            if (result.onload != null) result.onload()
          }
        }

        return result
      },

      newFromSheet : function( sheet,loop,limitamount,limitoffsetstart, REPLACE_OBJECT ) {
        return localNewFromSheet( sheet,loop,limitamount,limitoffsetstart, REPLACE_OBJECT )
      },


      new : function(source,xsize,ysize,loop,limitamount,limitoffsetstart) {
        var sheet = this.newSheet(source,xsize,ysize)
        var instance = object.new("sprite loader")
        instance.sheet = sheet

        instance.promise = new Promise(function(resolve, reject) {
          instance.resolve = resolve
          instance.reject = reject
        })

        sheet.onload = function() {
          localNewFromSheet(sheet,loop,limitamount,limitoffsetstart,instance)
          if (instance.onload != null) instance.onload()
          instance.resolve(instance)
        }

        return instance
      },

    }

  })()

  curlify.module("sprite",sprite)

})()
