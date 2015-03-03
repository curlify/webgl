
(function() {

  return {
    new : function() {
      var instance = object.new ("application")

      Promise.all([
        require("cmsloader.js"),
        require("ad.js"),
        ]).then(function(requires){

          var cmsloader = requires[0]
          var ad = requires[1]

          var mirrorimage_program = {
            program : null,
            getProgram : function() {
              if (this.glProgram == null) this.loadProgram()
              return this.glProgram
            },
            loadProgram : function() {
              var vertex = {
                text: '\
                attribute vec2 a_position; \
                attribute vec2 a_tex_coordinate; \
                \
                uniform mat4 u_projection; \
                uniform mat4 u_view; \
                uniform mat4 u_model; \
                \
                varying vec2 v_tex_coord; \
                \
                void main() { \
                  gl_Position = u_projection*u_view*u_model*vec4(a_position, 0.0, 1.0); \
                  v_tex_coord = a_tex_coordinate; \
                } \
                ',
                type: "x-shader/x-vertex"
              }
              var fragment = {
                text: '\
                precision mediump float; \
                \
                varying vec2      v_tex_coord; \
                \
                uniform sampler2D u_texture; \
                uniform float     u_alpha; \
                \
                void main() { \
                  \
                  float offset = 1.0 - v_tex_coord.y*2.0; \
                  float alpha = u_alpha * offset; \
                  \
                  vec4 color = texture2D(u_texture, vec2(v_tex_coord.x,1.0-v_tex_coord.y)); \
                  \
                  gl_FragColor = color * alpha; \
                } \
                ',
                type: "x-shader/x-fragment"
              }

              var vertexShader = glutils.createShader(gl, vertex)
              var fragmentShader = glutils.createShader(gl, fragment)
              this.glProgram = glutils.loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_alpha","u_model","u_view","u_projection"]);

            }
          }


          var ratio = 0.6
          var w=screenWidth*ratio
          var h=screenHeight*ratio
          var content = instance.add( carousel.new("content") )
          content.wrap = true
          content.itemsize = screenWidth*0.5
          content.inertia = 5
          //content.swipespeed = screenWidth/8
          //content.movethreshold = 0

          var info = instance.add( object.new("info area") )
          info.position.y = -300

          info.updatetext = function(ad,speed) {
            console.log("info.updatetext",ad.name,speed)
            info.anim.stop()
            var speed = speed ? speed : 250
            info.anim.animate( info, {alpha:0,time:speed,ease:animator.inOutQuad,onComplete:
              function() {
                info.children = []
                var title = info.add( text.new(ad.name,30,"helvetica",{red:1,green:1,blue:1}) )
                info.anim.animate( info, {alpha:1,time:speed,ease:animator.inOutQuad} )
              }
            })
          }

          //var sheet = instance.add(sprite.new("numbers.png",10,1,true))

          //var feeds = [{url:"http://d8ziyg2nhed2g.cloudfront.net/api/dev/app/95d05cac1afad8db0f4dcf74b532aca3/ads", filename:"boomdev.json"}]
          //var feeds = [{url:"http://d8ziyg2nhed2g.cloudfront.net/api/dev/app/346dfa689e975449cda04225b0fdb772/ads?id="+String(Math.random()), filename:"demos.json"}]
          var feeds = [{url:"http://d8ziyg2nhed2g.cloudfront.net/api/dev/app/59d7822f219c694c39b4ef8b72f4983f/ads?id="+String(Math.random()), filename:"adcanvas_webgl.json"}]
          instance.cmsloader = cmsloader.new(feeds)
          instance.cmsloader.onload = function(json) {
            console.log("cmsloader.onload")
            /*
            var cats = content.add( video.new("http://d8d913s460fub.cloudfront.net/videoserver/cat-test-video-320x240.mp4") )
            //var cats = content.add( video.new("small.mp4") )
            cats.size.width = w
            cats.size.height = h
            */

            //var title = content.add( text.new("fofofo this is crap, bullcrap",32,"monospace",w,h) )

            /*
            var fbo = content.add( fbo_object.new("fbo test",w,h) )
            //fbo.dobypassFbo = true
            fbo.updateInterval = 250

            var test = fbo.add( object.new("bogus") )
            test.alpha = 0.5
            test.draw = function() {
              //console.log( this.absolutealpha() )
            }
            var bg = fbo.add( rectangle.new(w,h,{red:1,green:0,blue:1}) )
            bg.alpha = 0.5
            var wtf = fbo.add( rectangle.new(50,50) )
            wtf.position.x = -w/2
            wtf.position.y = -h/2
            var box = fbo.add( rectangle.new(300,150,{red:1,green:1,blue:1}) )
            box.drawbackside = true
            box.move = function() {
              box.rotate.y = 0
              box.anim.animate( box.rotate, {y:Math.PI*2,time:2000,onComplete:box.move} )
            }
            box.move()
            fbo.relativeRelease = function(x,y) {
              console.log(fbo.dobypassFbo,!fbo.dobypassFbo)
              fbo.dobypassFbo = !fbo.dobypassFbo
            }
            */
            content.carouselmoved = function(selitem) {
              console.log("carouselmoved",selitem)
              if (info.selected == selitem) return
              if (selitem < 1) selitem = json.length-1+selitem
              if (selitem > json.length) selitem = selitem-(json.length-1)
              console.log("real selitem",selitem)
              info.selected = selitem
              info.updatetext( json[selitem-1] )
            }

            for (var i = 0; i <= json.length - 1; i++) {
              new function() {

              if (i == 0) {
                info.updatetext(json[i],0)
              }

              var carouselobject = content.add( focusable.new("carousel object") )
              carouselobject.json = json[i]
              carouselobject.click = function(x,y) {
                console.log("click"+carouselobject.json.name,instance.scale.x,instance.scale.y)

                if (instance.anim.animations.length > 0) return

                instance.anim.animate( instance.scale, {y:screenHeight/h,x:screenWidth/w,time:250,ease:animator.inOutQuad,onComplete:
                  function() {
                    var adscene = ad.new(instance,carouselobject.json)
                    adscene.onload = function() {
                      scene.openScene( adscene )
                    }
                  }
                } )

              }

              var boxdepth = w*0.1

              var poster = carouselobject.add( object.new("poster") )
              
              var left = poster.add( rectangle.new(boxdepth,h) )
              left.drawbackside = true
              left.rotate.y = Math.PI/2
              left.position.x = -w/2
              left.position.z = -boxdepth/2
              left.blend = true
              left.alpha = 0.75

              var right = poster.add( rectangle.new(boxdepth,h) )
              right.drawbackside = true
              right.rotate.y = -Math.PI/2
              right.position.x = w/2
              right.position.z = -boxdepth/2
              right.blend = true
              right.alpha = 0.75

              var back = poster.add( rectangle.new(w,h,{red:1,green:1,blue:1}) )
              back.blend = true

              var splash = poster.add( image.new(json[i].splash) )
              splash.onload = function() {
                this.size.width = w
                this.size.height = h
                //this.visible = false
                back.visible = false
              }

              var postermirror = carouselobject.add( object.new("poster mirror") )
              postermirror.alpha = 0.75
              postermirror.position.y = h*1.8*ratio
              //postermirror.step = function(timedelta) {
                //postermirror.position.x = carouselobject.carouselobject.absolutex()
                //postermirror.scale.x = carouselobject.carouselobject.scale.x
                //postermirror.scale.y = carouselobject.carouselobject.scale.y
                //postermirror.rotate.y = carouselobject.carouselobject.rotate.y
                //postermirror.visible = carouselobject.carouselobject.visible
              //}


              var mirrorleft = postermirror.add( rectangle.new(boxdepth,h) )
              mirrorleft.drawbackside = true
              mirrorleft.rotate.y = Math.PI/2
              mirrorleft.position.x = -w/2
              mirrorleft.position.z = -boxdepth/2
              mirrorleft.blend = true
              mirrorleft.alpha = 0.75

              var mirrorright = postermirror.add( rectangle.new(boxdepth,h) )
              mirrorright.drawbackside = true
              mirrorright.rotate.y = -Math.PI/2
              mirrorright.position.x = w/2
              mirrorright.position.z = -boxdepth/2
              mirrorright.blend = true
              mirrorright.alpha = 0.75

              var mirrortop = postermirror.add( rectangle.new(w,boxdepth) )
              mirrortop.drawbackside = true
              mirrortop.rotate.x = -Math.PI/2
              mirrortop.position.z = -boxdepth/2
              mirrortop.position.y = -h/2
              mirrortop.blend = true
              mirrortop.alpha = 0.75

              var mirrorback = postermirror.add( rectangle.new(w,h,{red:1,green:1,blue:1}) )
              mirrorback.blend = true
              mirrorback.position.y = h*2*ratio

              var mirror = postermirror.add( image.new(json[i].splash) )
              mirror.glProgram = mirrorimage_program.getProgram()
              mirror.onload = function() {
                this.size.width = w
                this.size.height = h
                //mirrorback.visible = false
              }
            }
            };
          }
          instance.cmsloader.updatefeed()

          //console.log("moveto 12")
          //content.moveto(10)

          instance.scenefocus = function() {
            console.log("SCENEFOCUS++++++++++++++")
            instance.anim.animate( instance.scale, {x:1,y:1,time:250,ease:animator.inOutQuad} )
          }

          instance.step = function() {
              fps.updateFps()
          }

      })

      return instance
    }
  }
}())
