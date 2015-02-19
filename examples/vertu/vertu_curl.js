
(function() {

  return {
    new : function() {

      var instance = object.new ("application")

      Promise.all([
        require("cmsloader.js"),
        require("vertuad.js"),
        require("curled_image.js"),
        ]).then(function(requires){

          var cmsloader = requires[0]
          var ad = requires[1]
          var curled_image = requires[2]

          console.log(curled_image)

          var feeds = [{url:"https://api.curlify.com/api/dev/app/9f648c3f885a88757baf7e4bd4867f00/ads?id="+String(Math.random()), filename:"demos.json"}]
          instance.cmsloader = cmsloader.new(feeds)
          
          var vertex = {
            text: '\
              attribute vec2 a_position;\
              attribute vec2 a_tex_coordinate;\
              \
              uniform mat4 u_projection;\
              uniform mat4 u_view;\
              uniform mat4 u_model;\
              \
              uniform vec2 cylPos;\
              uniform vec2 N;\
              uniform float R;\
              \
              varying vec2 v_tex_coord;\
              varying vec3 v_normal;\
              \
              void main() {\
                vec2 pos = vec2(a_position.x,a_position.y);\
                float d = dot(pos.xy - cylPos, N);\
                float zMultiplier = 10.0;\
                float hack = 0.79;\
                if (d > 0.0 ) {\
                  v_normal = vec3(0.0, 0.0, 1.0);\
                  gl_Position = u_projection*u_view*u_model*vec4(pos.xy, 0.0, 1.0);\
                } else if (d < -0.88) {\
                  vec2 C = vec2(pos.xy - d * N);\
                  vec2 V = C + vec2( -d * N.x - N.x*hack, -d * N.y - N.y*hack);\
                  v_normal = vec3(0.0, 0.0, -1.0);\
                  gl_Position = u_projection*u_view*u_model*vec4( V, R*2.0*zMultiplier, 1.0);\
                } else {\
                  vec3 C = vec3(pos.xy - d * N, R);\
                  vec3 V = C + R * vec3( sin(d/R) * N.x, sin(d/R) * N.y, -cos(d/R));\
                  v_normal = (C - V) / R;\
                  V.z = V.z*zMultiplier;\
                  gl_Position = u_projection*u_view*u_model*vec4(V, 1.0);\
                }\
                v_tex_coord = vec2(a_tex_coordinate.x,1.0-a_tex_coordinate.y);\
              }\
            ',
            type: "x-shader/x-vertex"
          }
          var fragment = {
            text: '\
              precision mediump float;\
              \
              varying vec2      v_tex_coord;\
              varying vec3      v_normal;\
              \
              uniform sampler2D u_texture;\
              uniform float     u_alpha;\
              uniform vec3      u_shadow_color;\
              \
              void main() {\
                vec3 light = vec3(0.0, 0.0, -1.0);\
                float dotprod = dot(v_normal, -light);\
                float shadow = min(1.0,max(0.20,dotprod * 1.0));\
                vec4 color = texture2D(u_texture, v_tex_coord);\
                gl_FragColor = vec4((color.rgb + ((u_shadow_color - color.rgb) * (1.0-shadow))), color.a*u_alpha);\
              }\
            ',
            type: "x-shader/x-fragment"
          }
          //initial + (final - initial) * pos
          var vertexShader = glutils.createShader(gl, vertex)
          var fragmentShader = glutils.createShader(gl, fragment)

          var inverse_curl_program = glutils.loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_texture","u_alpha","u_shadow_color","u_model","u_view","u_projection","cylPos","N","R"]);
          
          instance.cmsloader.onload = function(json) {
            console.log("cmsloader.onload")
            instance.json = json

            var reveal = { name:"reveal", show:[], hide:[], reverse_draw:true }
            reveal.show.push( {target:'position.z',startposition:-1,endposition:0,func:animator.linear} )
            reveal.hide.push( {target:'position.z',startposition:0,endposition:-1,func:animator.inOutQuad} )

            var stack = instance.add( carousel.new("stack",0,0) )
            stack.transition = reveal
            //stack.wrap = true

            instance.stack = stack

            stack.carouselmoved = function(selitem) {
              var current = stack.getItem( selitem )
              console.log("carouselmoved",selitem,stack.currentad,current)
              if ( current != stack.currentad ) {
                if (stack.currentad != null) stack.currentad.child.deactivate()
                stack.currentad = current
                stack.currentad.child.activate()
              }
            }

            for (var i = 0; i <= json.length - 1; i++) {
              new function() {
                var index = i
                var container = object.new("page"+i)
                var adpage = container.add( ad.new(instance,json[i]) )
                adpage.visible = false

                // flip quad to accomodate for source being an fbo
                var curl = container.add( curled_image.new(adpage) )
                curl.glProgram = inverse_curl_program
                curl.shadow_color = [0.0,0.0,0.0]
                if (index == 0 || index == 1) curl.shadow_color = [0.25,0.25,0.25]
                container.activate = function() {
                  adpage.activate()
                  curl.resetcurl()
                }
                container.deactivate = function() {
                  adpage.deactivate()
                }
                curl.relativePress = function(x,y){
                  if ((y < viewHeight/3 || x < viewWidth/3) && (y>-viewHeight/3 || x > -viewWidth/3)) return
                  curl.pressTimestamp = sys.timestamp()

                  if ( y > 0 ) {
                    console.log("FOCUS CURL")
                    scene.stealPointers(this)
                    curl.anim.stop()

                    curl.pressStart.x = screenWidth/2
                    curl.pressOffset.x = (x-curl.pointerPos.x)
                    curl.pressOffset.y = (y-curl.pointerPos.y)
                  } else {

                    console.log("PREVIOUS SHEET",stack.selected(),container.identifier)

                    if (container.identifier == "page0") return
                    curl.resetcurl(false)

                    stack.moveto(stack.selected()-1)

                  }
                }

                curl.onrelease = function() {
                  var pressTime = sys.timestamp()-curl.pressTimestamp
                  console.log("TIME PRESSED",pressTime,sys.timestamp(),curl.pressTimestamp)
                  if ( stack.selected() < stack.itemcontainer.children.length && (curl.cylPos[0] < 0 || curl.cylPos[1] < 0 || pressTime < 200)) {
                    curl.anim.stop()
                    curl.anim.animate( curl.pointerPos, {x:-screenWidth/2*1.5,y:-screenHeight/2*1.5,time:2000,ease:animator.inOutQuad,onComplete:
                      function() {
                        stack.moveto(stack.selected())
                      }
                    })
                  } else {
                    curl.resetcurl()
                  }
                }

                var demo = stack.add( container )
              }
            }

            stack.carouselmoved(1)

          }
          
          instance.cmsloader.updatefeed()
          
          instance.step = function() {
              fps.updateFps()
          }

        })

      return instance
    }
  }

})()
