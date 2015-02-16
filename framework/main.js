
(function() {

  console.log("inititalize main")

  var scene = curlify.getModule("scene")

  var glcanvas;
  var aspectratioZoom = true
  var touch = false;
  var lasttouch = null;
  var imageid = 0
  var running = false
  var appendedElements = []


  // PUBLIC MEMBERS
  curlify.sensors = {acceleration:null,rotation:null,orientation:null}
  curlify.zipfile = null
  curlify.layoutWidth = null
  curlify.layoutHeight = null
  curlify.layoutOffset = {x:0,y:0}
  curlify.layoutScale = {x:1,y:1}

  curlify.gl = null
  curlify.camera = null

  curlify.viewWidth = null
  curlify.viewHeight = null

  curlify.screenWidth = null
  curlify.screenHeight = null



  // PRIVATE FUNCTIONS
  var createProjection = function(right, top, near, far) {
    var m = mat4.create();
    m[0] = near/right
    m[5] = near/top
    m[10] = -(far + near)/(far - near)
    m[11] = -1
    m[14] = -2*far*near/(far - near)
    return m
  }

  var createProjectionAndView = function(w,h,near,far) {
    //var projectionMatrix = mat4.perspective( 120, h/w, near, far );
    var projectionMatrix = createProjection(1, h/w, near,far);

    var viewMatrix = mat4.identity( mat4.create() );
    mat4.translate( viewMatrix, viewMatrix, vec3.clone([0,0,-(far-near)/2]) );
    var quadToScreenScale = ((far-near)/2)/near;

    var cam = {near:near,far:far,width:w,height:h,projectionMatrix:projectionMatrix, viewMatrix:viewMatrix, translateScale:quadToScreenScale};
    return cam
  };

  function initWebGL(canvas) {
    curlify.gl = null;
    
    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      curlify.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}
    
    // If we don't have a GL context, give up now
    if (!curlify.gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      curlify.gl = null;
    }
    
    return curlify.gl;
  }

  function mousedown(e) {
    if (scene.isAnimating() || touch == true) return
    console.log("mousedown : "+e.clientX+","+e.clientY,curlify.layoutOffset.x,curlify.layoutOffset.y)
    var tgt = e.currentTarget.getBoundingClientRect()
    touch = true
    var target = scene.getPointerUser()
    if (target == null) return
    target.press((e.clientX-tgt.left-curlify.layoutOffset.x)*curlify.layoutScale.x,(e.clientY-tgt.top-curlify.layoutOffset.y)*curlify.layoutScale.y)
    target.drag((e.clientX-tgt.left-curlify.layoutOffset.x)*curlify.layoutScale.x,(e.clientY-tgt.top-curlify.layoutOffset.y)*curlify.layoutScale.y)
  }

  function mouseup(e) {
    scene.resetPointerStealer()
    if (scene.isAnimating() || touch == false) return
    console.log("mouseup : "+e.clientX+","+e.clientY)
    var tgt = e.currentTarget.getBoundingClientRect()
    touch = false
    var target = scene.getPointerUser()
    if (target == null) return
    target.release((e.clientX-tgt.left-curlify.layoutOffset.x)*curlify.layoutScale.x,(e.clientY-tgt.top-curlify.layoutOffset.y)*curlify.layoutScale.y)
  }

  function mouseout(e) {
    //console.log("mouseout : "+e.clientX+","+e.clientY)
    if (touch) mouseup(e)
  }

  function mousemove(e) {
    if (scene.isAnimating() || touch == false) return
    //console.log("mousemove : "+e.clientX+","+e.clientY)
    var tgt = e.currentTarget.getBoundingClientRect()
    var target = scene.getPointerUser()
    if (target == null) return
    if (touch) {
      target.drag((e.clientX-tgt.left-curlify.layoutOffset.x)*curlify.layoutScale.x,(e.clientY-tgt.top-curlify.layoutOffset.y)*curlify.layoutScale.y)
    }
  }

  function touchstart(e) {
    if (scene.isAnimating() || touch == true) return
    //console.log("touchstart : "+e.touches[0].pageX+","+e.touches[0].pageY)
    var tgt = e.currentTarget.getBoundingClientRect()
    touch = true
    var target = scene.getPointerUser()
    if (target == null) return
    target.press((e.touches[0].pageX-tgt.left-curlify.layoutOffset.x)*curlify.layoutScale.x,(e.touches[0].pageY-tgt.top-curlify.layoutOffset.y)*curlify.layoutScale.y)
    target.drag((e.touches[0].pageX-tgt.left-curlify.layoutOffset.x)*curlify.layoutScale.x,(e.touches[0].pageY-tgt.top-curlify.layoutOffset.y)*curlify.layoutScale.y)
    lasttouch = e
  }

  function touchend(e) {
    scene.resetPointerStealer()
    if (scene.isAnimating() || touch == false ) return
    //console.log("touchend : "+lasttouch.touches[0].pageX+","+lasttouch.touches[0].pageY)
    var tgt = e.currentTarget.getBoundingClientRect()
    touch = false
    var target = scene.getPointerUser()
    if (target == null) return
    target.release(lasttouch.touches[0].pageX-tgt.left-curlify.layoutOffset.x,lasttouch.touches[0].pageY-tgt.top-curlify.layoutOffset.y)
  }

  function touchmove(e) {
    e.preventDefault()
    if (scene.isAnimating() || touch == false) return
    //console.log("touchmove : "+e.touches[0].pageX+","+e.touches[0].pageY)
    var tgt = e.currentTarget.getBoundingClientRect()
    var target = scene.getPointerUser()
    if (target == null) return
    if (touch) {
      target.drag((e.touches[0].pageX-tgt.left-curlify.layoutOffset.x)*curlify.layoutScale.x,(e.touches[0].pageY-tgt.top-curlify.layoutOffset.y)*curlify.layoutScale.y)
    }
    lasttouch = e
  }

  function deviceMotionHandler(e) {
    // Grab the acceleration from the results
    curlify.sensors.acceleration = e.acceleration;
    // Grab the rotation rate from the results
    curlify.sensors.rotation = e.rotationRate;
  }

  function deviceOrientationHandler(e) {
    curlify.sensors.orientation = e;
  }

  function orientationChanged() {
    console.log("ORIENTATION CHANGED")
  }

  function resizeCanvas() {
     // only change the size of the canvas if the size it's being displayed
     // has changed.
     var width = glcanvas.clientWidth;
     var height = glcanvas.clientHeight;
     if (glcanvas.width != width ||
         glcanvas.height != height) {

       curlify.layoutWidth = width
       curlify.layoutHeight = height
       curlify.layoutScale = {x: curlify.screenWidth/curlify.layoutWidth, y:curlify.screenHeight/curlify.layoutHeight}

       curlify.viewWidth = curlify.screenWidth
       curlify.viewHeight = curlify.screenHeight

       var usescale = Math.max( curlify.layoutScale.x, curlify.layoutScale.y )
       if (aspectratioZoom) {
         usescale = Math.min( curlify.layoutScale.x, curlify.layoutScale.y )

         curlify.viewWidth = width*usescale
         curlify.viewHeight = height*usescale
       }
       curlify.layoutScale.x = usescale
       curlify.layoutScale.y = usescale

       curlify.layoutWidth = Math.floor(curlify.screenWidth*(1/usescale))
       curlify.layoutHeight = Math.floor(curlify.screenHeight*(1/usescale))

       curlify.layoutOffset.x = (width-curlify.layoutWidth)/2,
       curlify.layoutOffset.y = (height-curlify.layoutHeight)/2

       glcanvas.width = glcanvas.clientWidth
       glcanvas.height = glcanvas.clientHeight

       //console.log("resized",glcanvas.width,glcanvas.height,viewWidth,curlify.viewHeight)

     }

     //console.log("resizeCanvas",glcanvas.clientWidth,glcanvas.clientHeight,curlify.screenWidth,curlify.screenHeight,glcanvas.width,glcanvas.height)

  }

  function mergeRecursive(obj1, obj2) {
    for (var p in obj2) {
      try {
        // Property in destination object set; update its value.
        if ( obj2[p].constructor==Object ) {
          obj1[p] = mergeRecursive(obj1[p], obj2[p]);
        } else {
          obj1[p] = obj2[p];
        }
      } catch(e) {
        // Property in destination object not set; create it and set its value.
        obj1[p] = obj2[p];
      }
    }
    return obj1;
  }

  // PUBLIC FUNCTIONS

  curlify.assert = function(condition, message) {
      if (!condition) {
          throw message || "Assertion failed";
      }
  }

  curlify.spawn = function(generatorFunc) {
    return function() {
      function continuer(verb, arg) {
        var result;
        try {
          result = generator[verb](arg);
        } catch (err) {
          return Promise.reject(err);
        }
        if (result.done) {
          return result.value;
        } else {
          return Promise.resolve(result.value).then(onFulfilled, onRejected);
        }
      }
      var generator = generatorFunc.apply(this, arguments);
      var onFulfilled = continuer.bind(continuer, "next");
      var onRejected = continuer.bind(continuer, "throw");
      return onFulfilled();
    }
  }

  curlify.require = function(script) {
    //console.log("require(",script,")")

    // check for internal framework module and instantly return for easier syntax
    var module = curlify.getModule(script)
    if (module != null) {
      //console.log("return module '"+script+"'",module)
      return module
    }

    // all other modules are returned as promises
    return new Promise(function(resolve, reject) {
      
      var scriptid = script
      var element = document.getElementById(scriptid)

      // script not found - load and eval into element.scriptobject
      if (element == null) {

         // NB: all loadable zips must contain a main.js with cmsscript object
         // NB: no cache for zip objects
        if (script.slice(-4) == ".zip") {
          JSZipUtils.getBinaryContent(script, function(err, data) {
            if(err) {
              reject(Error("require zip load failed for '"+script+"' with '"+err+"'"))
              return
            }
            curlify.zipfile = new JSZip(data);
            var adscriptfile = curlify.zipfile.file("main.js")
            if (adscriptfile == null) {
              curlify.zipfile = null
              reject(Error("require failed for '"+script+"' with 'main.js not found inside zip'"))
              return
            }
            var scriptobject = null
            try {
              scriptobject = eval(adscriptfile.asText())
            } catch (e) {
              curlify.zipfile = null
              reject(Error("require eval failed for zip '"+script+"' with '"+e+"'"))
              return
            }
            resolve(scriptobject)
            //curlify.zipfile = null
          })

        // .js file
        } else if (script.slice(-3) == ".js") {

          // create element for cache purposes. NB: this means url-fetched .js files will be cached
          element = document.createElement('script')
          element.setAttribute('id',scriptid)
          element.setAttribute('type',"script-container")
          document.head.appendChild(element);
          appendedElements.push(scriptid)

          curlify.createCORSRequest('GET', script)
            .then( function(response)
            {
              try {
                element.scriptobject = eval(response)
              } catch (e) {
                reject(Error("require eval failed for '"+script+"' with '"+e+"'"))
                return
              }
              resolve(element.scriptobject)
            }, function(error) {
              reject(Error("require load failed for '"+script+"' with '"+error+"'"))
              return
            })
        } else {
          reject(Error("require failed for '"+script+"' with 'unsupported source'"))
          return
        }

      // return element.scriptobject
      } else {
        //if (callback != null) callback(element.scriptobject)
        resolve(element.scriptobject)
      }
    })
  }

  curlify.addImageElement = function() {
    var elementid = "curlify_image_"+imageid

    var element = document.createElement('img')
    element.setAttribute('id',elementid)
    document.body.appendChild(element);
    appendedElements.push(elementid)

    imageid = imageid + 1
    return element
  }

  curlify.createCORSRequest = function(method, url) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr) {

        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, true);

      } else if (typeof XDomainRequest != "undefined") {

        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.open(method, url);

      } else {

        // Otherwise, CORS is not supported by the browser.
        xhr = null;
        reject(Error("createCORSRequest failed with 'XMLHttpRequest not supported'"))
        return
      }

      xhr.onload = function() {
        // This is called even on 404 etc
        // so check the status
        if (xhr.status == 200) {
          // Resolve the promise with the response text
          resolve(xhr.response);
        } else {
          // Otherwise reject with the status text
          // which will hopefully be a meaningful error
          reject(Error("cors request failed with '"+xhr.statusText+"'"));
        }
      };

      // Handle network errors
      xhr.onerror = function() {
        reject(Error("cors request failed with 'Network Error'"));
      };  

      xhr.send()      
    })
  }

  curlify.getRandom = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  curlify.render = function() {
    var gl = curlify.gl

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.FRONT);

    gl.viewport(curlify.layoutOffset.x, curlify.layoutOffset.y, curlify.layoutWidth, curlify.layoutHeight)
    
    scene.render()
  }

  curlify.setRenderInterval = function(ms) {
    if (curlify.intervalId != null) window.clearInterval(curlify.intervalId)
    curlify.intervalId = window.setInterval(curlify.render, ms);
  }

  curlify.stop = function() {

    if (true) return
    console.log("Cleaning up...")

    if (glcanvas == null) {
      console.log("ERROR: canvas not set")
      return
    }
    if ('ontouchstart' in window) {
      glcanvas.removeEventListener("touchstart", touchstart, false);
      glcanvas.removeEventListener("touchmove", touchmove, false);
      glcanvas.removeEventListener("touchend", touchend, false);
    } else {
      glcanvas.removeEventListener("mousedown", mousedown, false);
      glcanvas.removeEventListener("mousemove", mousemove, false);
      glcanvas.removeEventListener("mouseup", mouseup, false);
    }

    if (window.DeviceMotionEvent) {
      window.removeEventListener('devicemotion', deviceMotionHandler, false)
    }
    if (window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientation', deviceOrientationHandler, false)
    }

    window.removeEventListener('orientationchange', orientationChanged);

    scene.removeAllScenes()

    for (var i=0;i<appendedElements.length;i++) {
      var scriptid = appendedElements[i]
      var element = document.getElementById(scriptid)
      element.parentNode.removeChild(element);
      console.log("... removed element "+scriptid)
    }
    appendedElements = []

    if (curlify.intervalId != null) {
      console.log("... stopping render interval")
      window.clearInterval(curlify.intervalId);
    }

    running = false
  }

  curlify.start = function(parameters) {

    if ( running ) curlify.stop()
    running = true

    curlify.assert( parameters.canvas != null )
    curlify.assert( parameters.script != null )

    var canvas = parameters.canvas
    var script = parameters.script
    var width = parameters.width
    var height = parameters.height

    curlify.screenWidth = (width ? width : 480)
    curlify.screenHeight = (height ? height : 852)

    // reuse glcanvas if targeting the same canvas as previously
    var newglcanvas = document.getElementById(canvas);
    if (glcanvas != null) {
      if (newglcanvas != glcanvas) {
        console.log("canvas changed - initialize new webgl")
        glcanvas = newglcanvas
        curlify.gl = initWebGL(glcanvas);
      }
    } else {
      glcanvas = newglcanvas
      curlify.gl = initWebGL(glcanvas);
    }

    if ('ontouchstart' in window) {
      //console.log("USE TOUCH MOUSE")
      glcanvas.addEventListener("touchstart", touchstart, false);
      glcanvas.addEventListener("touchmove", touchmove, false);
      glcanvas.addEventListener("touchend", touchend, false);
    } else {
      //console.log("USE REGULAR MOUSE")
      glcanvas.addEventListener("mousedown", mousedown, false);
      glcanvas.addEventListener("mousemove", mousemove, false);
      glcanvas.addEventListener("mouseup", mouseup, false);
    }

    resizeCanvas()

    curlify.camera = createProjectionAndView(curlify.screenWidth,curlify.screenHeight,3,100);

    // Only continue if WebGL is available and working  
    if (curlify.gl) {
      if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', deviceMotionHandler, false)
      } else {
        alert("DeviceMotionEvent not supported")
      }
      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', deviceOrientationHandler, false)
      } else {
        alert("DeviceOrientationEvent not supported")
      }

      window.addEventListener('orientationchange', orientationChanged);
      
      curlify.require( script )
        .then( function(scriptobject)
        {
          scene.openScene( scriptobject.new() )
          if (parameters.renderInterval != null) curlify.setRenderInterval(parameters.renderInterval)
        }
      )
    }

  }

})()