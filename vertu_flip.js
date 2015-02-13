
(function() {

  var object = curlify.require("object")
  var fbo_object = curlify.require("fbo_object")
  var masked_image = curlify.require("masked_image")
  var rectangle = curlify.require("rectangle")
  var animator = curlify.require("animator")
  var carousel = curlify.require("carousel")
  var fps = curlify.require("fps")

  return {
    new : function() {

      var instance = object.new ("application")

      Promise.all([
        curlify.require("cmsloader.js"),
        curlify.require("vertuad.js")]
        )
        .then(function(requires) {

          var cmsloader = requires[0]
          var ad = requires[1]

          var feeds = [{url:"https://api.curlify.com/api/dev/app/a64130f6dc2570f1f6dc60c78bc32801/ads?id="+String(Math.random()), filename:"demos.json"}]
          instance.cmsloader = cmsloader.new(feeds)
          
          /*
          // same as masked_image except texture is flipped
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
              v_tex_coord = vec2(a_tex_coordinate.x,1.0-a_tex_coordinate.y); \
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
            uniform sampler2D u_mask_texture; \
            uniform float     u_alpha; \
            \
            void main() { \
              \
              vec4 color = texture2D(u_texture, v_tex_coord); \
              vec4 mask_color = texture2D(u_mask_texture, v_tex_coord); \
              \
              gl_FragColor = color * mask_color.a * u_alpha; \
            } \
            ',
            type: "x-shader/x-fragment"
          }

          var vertexShader = createShader(gl, vertex)
          var fragmentShader = createShader(gl, fragment)
          var masked_fbo_program = loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_texture","u_mask_texture","u_alpha","u_model","u_view","u_projection"]);
          */

          // flipped to accomodate fbo input
          var flipbuffer = gl.createBuffer();
          flipbuffer.itemSize = 2;
          flipbuffer.numItems = 4;
          gl.bindBuffer(gl.ARRAY_BUFFER, flipbuffer);
          vertices = [
            -1, -1, 0, 1,
             1, -1, 1, 1,
            -1,  1, 0, 0,
             1,  1, 1, 0,
          ];
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);    

          instance.cmsloader.onload = function(json) {
            console.log("cmsloader.onload")
            instance.json = json
            
            var reveal = { name:"reveal", show:[], hide:[], order_draw:true }
            reveal.show.push( {target:'transition_value',startposition:1,endposition:0,func:animator.linear} )
            //reveal.show.push( {target:'rotate.y',startposition:Math.PI*0.8,endposition:0,func:animator.linear} )
            reveal.hide.push( {target:'transition_value',startposition:0,endposition:-1,func:animator.linear} )
            //reveal.hide.push( {target:'rotate.y',startposition:0,endposition:Math.PI*0.8,func:animator.linear} )

            var curlstack = instance.add( carousel.new() )
            curlstack.transition = reveal
            //curlstack.wrap = true
            instance.stack = curlstack

            curlstack.carouselmoved = function(selitem) {
              var current = curlstack.getItem( selitem )
              console.log("carouselmoved",selitem,curlstack.currentad,current)
              if ( current != curlstack.currentad ) {
                console.log("really activate")
                if (curlstack.currentad != null) curlstack.currentad.deactivate()
                curlstack.currentad = current
                curlstack.currentad.activate()
              }
            }

            var leftmask = fbo_object.new()
            var boxl = leftmask.add( rectangle.new(leftmask.width()/2,leftmask.height(),{red:1,green:1,blue:1}))
            boxl.position.x = -boxl.width()/2
            leftmask.updateFbo()

            var rightmask = fbo_object.new()
            var box = rightmask.add( rectangle.new(rightmask.width()/2,rightmask.height(),{red:1,green:1,blue:1}))
            box.position.x = box.width()/2
            rightmask.updateFbo()

            for (var i = 0; i <= json.length - 1; i++) {
              new function() {
                var flip = curlstack.add( object.new("pageflip"+i) )
                flip.transition_value = 0
                //flip.page = flip.add( image.new(json[i].splash) )
                flip.page = flip.add( ad.new(instance,json[i]) )
                flip.page.visible = false
                flip.page.dobypassFbo = true
                flip.page.fboUpdatesDisabled = true

                flip.page.onload = function() {
                  flip.leftpart = flip.add( masked_image.new(flip.page,leftmask) )
                  //flip.leftpart.glProgram = masked_fbo_program
                  flip.leftpart.buffer = flipbuffer
                  flip.leftpart.drawbackside = true
                  //flip.leftpart.alpha = 0.5
                  flip.rightpart = flip.add( masked_image.new(flip.page,rightmask) )
                  flip.rightpart.buffer = flipbuffer
                  //flip.rightpart.glProgram = masked_fbo_program
                  flip.rightpart.drawbackside = true
                  //flip.rightpart.alpha = 0.5
                }
                flip.activate = function() {
                  console.log("activate : "+i)
                  flip.page.activate()
                }
                flip.deactivate = function() {
                  console.log("deactivate : "+i)
                  flip.page.deactivate()
                }
                
                flip.preStep = function(timedelta){
                  if (flip.leftpart == null) return
                  if (flip.rightpart == null) return
                  var percent = -this.transition_value
                  
                  // hide flippers when item is selected
                  flip.leftpart.visible = true
                  flip.rightpart.visible = true
                  flip.page.visible = false
                  if (flip.page.dobypassFbo) flip.page.updateFbo()
                  flip.page.dobypassFbo = false
                  if (Math.abs(percent) < 0.01) {
                    flip.leftpart.visible = false
                    flip.rightpart.visible = false
                    flip.page.visible = true
                    flip.page.dobypassFbo = true
                  }
                  
                  flip.reverseDrawOrder = false
                  if (percent <= -0.5 && flip.index == 0) flip.reverseDrawOrder = true

                  flip.leftpart.rotate.y = Math.min(0,percent*Math.PI)
                  flip.rightpart.rotate.y = Math.max(0,percent*Math.PI)
                  
                }
              }
            }

            curlstack.carouselmoved(1)
            

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
