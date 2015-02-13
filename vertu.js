
var app = function() {

    var instance = new object ("application")

    var feeds = [{url:"https://api.curlify.com/api/dev/app/76728cee445d6dc8d3979d8af7b48a47/ads?id="+String(Math.random()), filename:"demos.json"}]
    instance.cmsloader = cmsloader.new(feeds)
    
    /*
    instance.cmsloader.onload = function(json) {
      console.log("cmsloader.onload")
      instance.json = json

      var reveal = { name:"reveal", show:[], hide:[], reverse_draw:true }
      reveal.show.push( {target:'position.x',startposition:0,endposition:0,func:animator.linear} )
      //reveal.show.push( {target:'rotate.y',startposition:Math.PI*0.8,endposition:0,func:animator.linear} )
      reveal.hide.push( {target:'position.x',startposition:0,endposition:-screenWidth*1.0,func:animator.inOutQuad} )
      //reveal.hide.push( {target:'rotate.y',startposition:0,endposition:Math.PI*0.8,func:animator.linear} )

      var curlstack = instance.add( carousel.new() )
      curlstack.transition = reveal
      //curlstack.wrap = true

      curlstack.carouselmoved = function(selitem) {
        var current = curlstack.getItem( selitem )
        //console.log("carouselmoved",selitem,curlstack.currentad,current)
        if ( current != curlstack.currentad ) {
          if (curlstack.currentad != null) curlstack.currentad.child.deactivate()
          curlstack.currentad = current
          curlstack.currentad.child.activate()
        }
      }

      for (var i = 0; i <= json.length - 1; i++) {
        new function() {
          var demo = curlstack.add( ad.new(instance,json[i]) )
        }
      }

      curlstack.carouselmoved(1)

    }
    
    instance.cmsloader.updatefeed()
    */

    /*
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

    instance.cmsloader.onload = function(json) {
      console.log("cmsloader.onload")
      instance.json = json
      /*
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
            flip.leftpart.glProgram = masked_fbo_program
            flip.leftpart.drawbackside = true
            //flip.leftpart.alpha = 0.5
            flip.rightpart = flip.add( masked_image.new(flip.page,rightmask) )
            flip.rightpart.glProgram = masked_fbo_program
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
      */


      var curl_program = {
        glProgram : null,
        getProgram : function() {
          if (this.glProgram == null) this.loadProgram()
          return this.glProgram
        },
        loadProgram : function() {
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
                v_tex_coord = a_tex_coordinate;\
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
              \
              void main() {\
                vec3 light = vec3(0.0, 0.0, -1.0);\
                float shadow = min(1.0,max(0.25,dot(v_normal, -light) * 1.0));\
                vec4 color = texture2D(u_texture, v_tex_coord);\
                gl_FragColor = vec4(color.r*shadow,color.g*shadow,color.b*shadow,color.a * u_alpha);\
              }\
            ',
            type: "x-shader/x-fragment"
          }

          var vertexShader = createShader(gl, vertex)
          var fragmentShader = createShader(gl, fragment)

          this.glProgram = loadProgram(gl, [vertexShader, fragmentShader], ["a_position","a_tex_coordinate"], ["u_texture","u_alpha","u_model","u_view","u_projection","cylPos","N","R"]);

        }
      };


      var curl = instance.add( image.new("splash.png",plane.new("curlable",15,15)) )
      curl.drawbackside = true
      curl.depthtest = true
      curl.glProgram = curl_program.getProgram()
      curl.cylPos = [0,0]
      curl.cylDir = [0,0]
      curl.cylRad = 0.25
      curl.pressStart = {x:screenWidth/2,y:screenHeight/2}
      curl.pointerPos = {x:screenWidth/2,y:screenHeight/2}
      curl.pressOffset = {x:0,y:0}

      curl.resetcurl = function() {
        //console.log("resetcurl")
        curl.anim.stop()
        curl.anim.animate( curl.pointerPos, {x:curl.pressStart.x,y:curl.pressStart.y,time:1000,ease:animator.inOutQuad,onComplete:curl.randomcurl})
        curl.anim.animate( curl.pressOffset, {x:0,y:0,time:1000,ease:animator.inOutQuad})
      }
      curl.randomcurl = function() {
        //console.log("randomcurl")
        curl.anim.stop()
        curl.pressStart = {x:screenWidth/2,y:screenHeight/2}
        curl.pointerPos = {x:screenWidth/2,y:screenHeight/2}
        curl.anim.animate( curl.pointerPos, {x:screenWidth/2-getRandom(90,100),y:screenHeight/2-getRandom(100,150),time:1000,ease:animator.inOutQuad,onComplete:curl.resetcurl})
      }
      curl.step = function(timedelta) {
        var x = curl.pointerPos.x-curl.pressOffset.x
        var y = curl.pointerPos.y-curl.pressOffset.y
        this.cylPos = [ x/(this.size.width/2)*1.1,y/(this.size.height/2)*1.1 ]
        this.cylDir = [(x-this.pressStart.x) / this.size.width,(y-this.pressStart.y) / this.size.height,0]
        this.cylDir = vec3.normalize( this.cylDir )
      }

      curl.relativePress = function(x,y){
        if (y < screenHeight/3) return
        scene.stealPointers(this)
        curl.anim.stop()

        if (x < 0) {
          curl.anim.animate( curl.pointerPos, {x:curl.pressStart.x,y:curl.pressStart.y,time:100,ease:animator.inOutQuad})
          curl.anim.animate( curl.pressOffset, {x:0,y:0,time:100,ease:animator.inOutQuad,onComplete:
            function() {
              curl.pressStart.x = -screenWidth/2
              curl.pressOffset.x = 0
              curl.pressOffset.y = 0
              curl.pointerPos.x = x
              curl.pointerPos.y = y              
            }
          })
        } else {
          curl.pressStart.x = screenWidth/2
          curl.pressOffset.x = (x-curl.pointerPos.x)
          curl.pressOffset.y = (y-curl.pointerPos.y)
        }
      }
      curl.relativeDrag = function(x,y) {
        if (curl.anim.animations != 0) return
        curl.pointerPos.x = x
        curl.pointerPos.y = y
      }
      curl.relativeRelease = function(x,y) {
        if (curl.anim.animations != 0) return
        console.log("cylinder: ",this.cylPos[0],this.cylPos[1])
        curl.resetcurl()
      }
      curl.resetcurl()
      
      curl.draw = function() {

        if (this.texture == null) {
          //console.log("texture not loaded",this.identifier)
          return
        }

        gl.useProgram(this.glProgram.program);

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.uniform1i(this.glProgram.u_texture_handle, 0)

        gl.uniform1f(this.glProgram.u_alpha_handle, this.absolutealpha());
        
        gl.uniform2f(this.glProgram.cylPos_handle, this.cylPos[0], this.cylPos[1])
        gl.uniform2f(this.glProgram.N_handle, this.cylDir[0], this.cylDir[1])
        gl.uniform1f(this.glProgram.R_handle, this.cylRad)

        gl.uniformMatrix4fv(this.glProgram.u_projection_handle, false, this.projectionMatrix);
        gl.uniformMatrix4fv(this.glProgram.u_view_handle, false, this.viewMatrix);
        gl.uniformMatrix4fv(this.glProgram.u_model_handle, false, this.quadModelMatrix);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.glProgram.a_position_handle)
        gl.enableVertexAttribArray(this.glProgram.a_tex_coordinate_handle)

        gl.vertexAttribPointer(this.glProgram.a_position_handle, this.buffer.itemSize, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.glProgram.a_tex_coordinate_handle, this.buffer.itemSize, gl.FLOAT, false, 16, 8);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)
        gl.drawElements(gl.TRIANGLES, this.indices.indexCount, gl.UNSIGNED_SHORT, 0)
      };
      
      curl.spin = function() {
        curl.rotate.y = 0
        curl.anim.animate( curl.rotate, {y:Math.PI*2,time:20000,onComplete:curl.spin})
      }
      //curl.spin()
      //curl.rotate.y = 0.5


    }

    instance.cmsloader.updatefeed()
    

/*
    
    var leftmask = fbo_object.new()
    var box = leftmask.add( rectangle.new(leftmask.width()/2,leftmask.height(),{red:1,green:1,blue:1}))
    box.position.x = -box.width()/2
    leftmask.updateFbo()

    var rightmask = fbo_object.new()
    var box = rightmask.add( rectangle.new(rightmask.width()/2,rightmask.height(),{red:1,green:1,blue:1}))
    box.position.x = box.width()/2
    rightmask.updateFbo()

    var flip = instance.add( object.new("pageflip") )
    flip.page = image.new("splash.png")
    flip.page.onload = function() {
      flip.left = flip.add( masked_image.new(flip.page,leftmask) )
      flip.left.drawbackside = true
      flip.right = flip.add( masked_image.new(flip.page,rightmask) )
      flip.right.drawbackside = true
    }
    flip.relativeDrag = function(x,y) {
      var percent = -x/(viewWidth/2)
      flip.reverseDrawOrder = false
      if (percent <= -0.5) flip.reverseDrawOrder = true
      flip.left.rotate.y = Math.min(0,percent*Math.PI)
      flip.right.rotate.y = Math.max(0,percent*Math.PI)
    }
*/    
    
    instance.step = function() {
        fps.updateFps()
    }

    return instance
}

app.new = function() {
  return new app()
}
