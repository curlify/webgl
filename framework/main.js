
(function() {

  var revision = "6.9"

  console.log("initialize main",revision)

  var currentScript = document.currentScript
  var curlify = document.currentScript.curlify

  // evil extraction of all modules to local variables so that scripts have 'object' etc. defined already
  eval(curlify.extract(curlify.modules,"curlify.modules"))
  eval(curlify.extract(curlify.localVars,"curlify.localVars"))

  var glcanvas
  var glclearcolor = 0.0
  var aspectratioZoom = true
  var touch = false
  var lasttouch = null
  var renderRequested = true
  var imageid = 0
  var running = false
  var appendedElements = []


  // PRIVATE FUNCTIONS
  function createProjection(right, top, near, far) {
    var m = mat4.clone([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    m[0] = near/right
    m[5] = near/top
    m[10] = -(far + near)/(far - near)
    m[11] = -1
    m[14] = -2*far*near/(far - near)
    return m
  }

  function createProjectionAndView(w,h,near,far) {
    var projectionMatrix = createProjection(1, h/w, near,far);
    //var projectionMatrix = mat4.create()
    //mat4.perspective( projectionMatrix, 60, h/w, near, far );

    var viewMatrix = mat4.create();
    mat4.translate( viewMatrix, viewMatrix, vec3.clone([0,0,-(far-near)/2]) );
    //var viewMatrix = mat4.clone([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
    //mat4.lookAt( viewMatrix, vec3.clone([0,0,-(far-near)/2]), vec3.clone([0,0,0]), vec3.clone([0,1,0]))
    var quadToScreenScale = ((far-near)/2)/near;

    var cam = {near:near,far:far,width:w,height:h,projectionMatrix:projectionMatrix, viewMatrix:viewMatrix, translateScale:quadToScreenScale};
    return cam
  };

  function initWebGL(canvas,parameters) {
    gl = null;
    
    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      // {premultipliedAlpha: false}
      gl = canvas.getContext("webgl", parameters) || canvas.getContext("experimental-webgl");
    }
    catch(e) {}
    
    //var sharedResourcesExtension = gl.getExtension("WEBGL_shared_resources");
    //console.log("shared",sharedResourcesExtension)

    // If we don't have a GL context, give up now
    if (!gl) {
      console.log("ERROR: Unable to initialize WebGL in target node");
      gl = null;
    }

    return gl;
  }

  function mousedown(e) {
    if (scene.isAnimating() || touch == true) return
    var tgt = e.currentTarget.getBoundingClientRect()
    console.log("mousedown : "+e.clientX+","+e.clientY+" | "+window.pageXOffset+","+window.pageYOffset+" | "+tgt.left+","+tgt.top)
    touch = true
    var target = scene.getPointerUser()
    if (target == null) return
    target.press((e.clientX-tgt.left-layoutOffset.x)*layoutScale.x,(e.clientY-tgt.top-layoutOffset.y)*layoutScale.y)
    target.drag((e.clientX-tgt.left-layoutOffset.x)*layoutScale.x,(e.clientY-tgt.top-layoutOffset.y)*layoutScale.y)
  }

  function mouseup(e) {
    scene.resetPointerStealer()
    if (scene.isAnimating() || touch == false) return
    console.log("mouseup : "+e.clientX+","+e.clientY)
    var tgt = e.currentTarget.getBoundingClientRect()
    touch = false
    var target = scene.getPointerUser()
    if (target == null) return
    target.release((e.clientX-tgt.left-layoutOffset.x)*layoutScale.x,(e.clientY-tgt.top-layoutOffset.y)*layoutScale.y)
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
      target.drag((e.clientX-tgt.left-layoutOffset.x)*layoutScale.x,(e.clientY-tgt.top-layoutOffset.y)*layoutScale.y)
    }
  }

  function touchstart(e) {
    if (scene.isAnimating() || touch == true) return
    var tgt = e.currentTarget.getBoundingClientRect()
    //console.log("touchstart : "+e.touches[0].pageX+","+e.touches[0].pageY+" | "+window.pageXOffset+","+window.pageYOffset+" | "+tgt.left+","+tgt.top)
    touch = true
    var target = scene.getPointerUser()
    if (target == null) return
    target.press((e.touches[0].pageX-tgt.left-window.pageXOffset-layoutOffset.x)*layoutScale.x,(e.touches[0].pageY-tgt.top-window.pageYOffset-layoutOffset.y)*layoutScale.y)
    target.drag((e.touches[0].pageX-tgt.left-window.pageXOffset-layoutOffset.x)*layoutScale.x,(e.touches[0].pageY-tgt.top-window.pageYOffset-layoutOffset.y)*layoutScale.y)
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
    target.release((lasttouch.touches[0].pageX-tgt.left-window.pageXOffset-layoutOffset.x)*layoutScale.x,(lasttouch.touches[0].pageY-tgt.top-window.pageYOffset-layoutOffset.y)*layoutScale.y)
  }

  function touchmove(e) {
    e.preventDefault()
    if (scene.isAnimating() || touch == false) return
    //console.log("touchmove : "+e.touches[0].pageX+","+e.touches[0].pageY)
    var tgt = e.currentTarget.getBoundingClientRect()
    var target = scene.getPointerUser()
    if (target == null) return
    if (touch) {
      target.drag((e.touches[0].pageX-tgt.left-window.pageXOffset-layoutOffset.x)*layoutScale.x,(e.touches[0].pageY-tgt.top-window.pageYOffset-layoutOffset.y)*layoutScale.y)
    }
    lasttouch = e
  }

  function deviceMotionHandler(e) {
    // Grab the acceleration from the results
    sensors.acceleration = e.acceleration;

    // Grab the rotation rate from the results
    sensors.rotationRate = e.rotationRate;

    //console.log("alpha: "+e.rotation.alpha)
  }

  var orientation_hack = (sys.ismobile.any() ? -180 : 0)
  function deviceOrientationHandler(e) {
    // make orientation -180 -> 180 on all devices
    if (e==null) return
    //console.log("alpha: "+e.alpha+","+(e.alpha+orientation_hack)+","+orientation_hack)
    sensors.orientation = {alpha:e.alpha+orientation_hack,beta:e.beta,gamma:e.gamma};
  }

  function orientationChanged() {
    //console.log("orientationChanged() "+","+screen.orientation+","+screen.width+","+screen.height+" : "+glcanvas.clientWidth+","+glcanvas.clientHeight)
    window.requestAnimationFrame( curlify.resizeCanvas )
  }

  function resizeCanvas() {
    //console.log("resizeCanvas",glcanvas)
    var realToCSSPixels = window.devicePixelRatio || 1;
    realToCSSPixels = 1

    var width = Math.floor(glcanvas.clientWidth * realToCSSPixels);
    var height = Math.floor(glcanvas.clientHeight * realToCSSPixels);

    //console.log("resizeCanvas"+" "+glcanvas.clientWidth+"x"+glcanvas.clientHeight+" * "+realToCSSPixels+" "+width+"x"+height+" "+glcanvas.width+"x"+glcanvas.height)

    layoutWidth = width
    layoutHeight = height
    layoutScale = {x: screenWidth/layoutWidth, y:screenHeight/layoutHeight}

    //console.log("layoutScale",layoutScale.x,layoutScale.y)

    viewWidth = screenWidth
    viewHeight = screenHeight

    var usescale = Math.max( layoutScale.x, layoutScale.y )
    if (aspectratioZoom) {
      usescale = Math.min( layoutScale.x, layoutScale.y )
      viewWidth = width*usescale
      viewHeight = height*usescale
      //console.log("using aspect ratio zoom",width,height,viewWidth,viewHeight,screenWidth,screenHeight)
    }
    layoutScale.x = usescale
    layoutScale.y = usescale

    layoutWidth = Math.floor(screenWidth*(1/usescale))
    layoutHeight = Math.floor(screenHeight*(1/usescale))

    layoutOffset.x = (width-layoutWidth)/2,
    layoutOffset.y = (height-layoutHeight)/2

    glcanvas.width = glcanvas.clientWidth
    glcanvas.height = glcanvas.clientHeight

    //console.log("resized",glcanvas.width,glcanvas.height,viewWidth,viewHeight)
    curlify.localVars.layoutWidth = layoutWidth
    curlify.localVars.layoutHeight = layoutHeight
    curlify.localVars.layoutScale = layoutScale
    curlify.localVars.layoutOffset = layoutOffset

    curlify.localVars.viewWidth = viewWidth
    curlify.localVars.viewHeight = viewHeight

    curlify.localVars.screenWidth = screenWidth
    curlify.localVars.screenHeight = screenHeight

    console.log("resizeCanvas"+" "+glcanvas.clientWidth+"x"+glcanvas.clientHeight+" "+screenWidth+"x"+screenHeight+" "+layoutWidth+"x"+layoutHeight+" "+glcanvas.width+","+glcanvas.height)

  }
  curlify.resizeCanvas = resizeCanvas

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

  function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }


  function spawn(generatorFunc) {
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

  function createCORSRequest(method, url) {
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


  function require(script) {
    //console.log("require(",script,")")

    // check for internal framework module and instantly return for easier syntax
    var module = curlify.getModule(script)
    if (module != null) {
      console.log("return module '"+script+"'",module)
      return module
    }

    // all other modules are returned as promises
    return new Promise(function(resolve, reject) {
      
      var scriptid = script
      var element = document.getElementById(scriptid)

      //console.log("returning promise")

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
            zipfile = new JSZip(data);
            curlify.localVars.zipfile = zipfile
            //console.log("require zip file",zipfile)
            var adscriptfile = zipfile.file("main.js")
            if (adscriptfile == null) {
              zipfile = null
              curlify.localVars.zipfile = null
              reject(Error("require failed for '"+script+"' with 'main.js not found inside zip'"))
              return
            }
            //console.log("require adscript file",adscriptfile.asText())
            var scriptobject = null
            try {
              scriptobject = eval(adscriptfile.asText())
            } catch (e) {
              zipfile = null
              curlify.localVars.zipfile = null
              reject(Error("require eval failed for zip '"+script+"' with '"+e+"'"))
              return
            }
            //console.log("require scriptobject",scriptobject)
            resolve(scriptobject)
            //zipfile = null
          })

        // .js / jsonp file - all other types handled as a script
        } else /*if (script.slice(-3) == ".js")*/ {

          // create element for cache purposes. NB: this means url-fetched .js files will be cached
          element = document.createElement('script')
          element.setAttribute('id',scriptid)
          element.setAttribute('type',"text/javascript")

          document.head.appendChild(element);
          appendedElements.push(scriptid)

          if (script.slice(-3) == ".js") {
            createCORSRequest('GET', script)
              .then( function(response)
              {
                try {
                  element.scriptobject = eval(response)
                } catch (e) {
                  reject(Error("require eval failed for '"+script+"' with '"+e+"'",response))
                  return
                }
                resolve(element.scriptobject)
              }, function(error) {
                reject(Error("require load failed for '"+script+"' with '"+error+"'"))
                return
              })
          } else {
            element.setAttribute('src',script)
            element.onload = function() {
              resolve()
            }
            element.onerror = function() {
              reject(Error("require failed for '"+script+"'"))
            }
          }

        /*} else {
          reject(Error("require failed for '"+script+"' with 'unsupported source'"))
          return*/
        }

      // return element.scriptobject
      } else {
        //if (callback != null) callback(element.scriptobject)
        resolve(element.scriptobject)
      }
    })
  }

  // unused - explore this instead of Image.new() in image.js etc
  curlify.addImageElement = function() {
    var elementid = "curlify_image_"+imageid

    var element = document.createElement('img')
    element.setAttribute('id',elementid)
    document.body.appendChild(element);
    appendedElements.push(elementid)

    imageid = imageid + 1
    return element
  }

  function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();
    return (rect.bottom >= 0 && rect.right >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight) && rect.left <= (window.innerWidth || document.documentElement.clientWidth));
  }

  // PUBLIC FUNCTIONS

  // this is really only for object.js
  curlify.requestRender = function() {
    renderRequested = true
  }

  curlify.render = function() {

    if (running == false) return

    //window.requestAnimationFrame( curlify.render )

    if ( document.hidden || isElementInViewport( glcanvas ) == false/* || renderRequested == false*/ ) return

    //zipfile = null
    //curlify.localVars.zipfile = null

    renderRequested = false

    //gl.colorMask(true, true, true, true);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    //gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.FRONT);

    //console.log(layoutOffset.x,layoutOffset.y,layoutWidth,layoutHeight)
    gl.viewport(layoutOffset.x, layoutOffset.y, layoutWidth, layoutHeight)
    
    scene.render()

    /*
    glclearcolor = glclearcolor + 0.01
    glclearcolor = Math.min(1.0,glclearcolor)
    gl.clearColor(1, 1, 1, glclearcolor);
    gl.colorMask(false, false, false, true);
    gl.clear(gl.COLOR_BUFFER_BIT);
    */
  }

  curlify.stop = function() {

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
      glcanvas.removeEventListener ("mouseout", mouseout, false);
    }

    if (window.DeviceMotionEvent) {
      window.removeEventListener('devicemotion', deviceMotionHandler, false)
    }
    if (window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientation', deviceOrientationHandler, false)
    }

    window.removeEventListener('orientationchange', orientationChanged);
    window.removeEventListener('resize', orientationChanged);

    scene.removeAllScenes()

    for (var i=0;i<appendedElements.length;i++) {
      var scriptid = appendedElements[i]
      var element = document.getElementById(scriptid)
      element.parentNode.removeChild(element);
      //console.log("... removed element "+scriptid)
    }
    appendedElements = []

    if (curlify.intervalId != null) {
      //console.log("... stopping render interval")
      window.clearInterval(curlify.intervalId);
    }

    curlify.clearModuleBuffersAndPrograms()

    running = false
  }

  curlify.start = function(parameters) {

    console.log("curlify.start",parameters,revision)

    if ( running ) curlify.stop()
    running = true

    if (parameters.script == null){
      console.log("ERROR: no script source set")
      return
    }

    screenWidth = (parameters.width ? parameters.width : 480)
    screenHeight = (parameters.height ? parameters.height : 852)
    curlify.localVars.screenWidth = screenWidth
    curlify.localVars.screenHeight = screenHeight

    glcanvas = parameters.canvas ? document.getElementById(parameters.canvas) : currentScript.parentNode
    curlify.localVars.glcanvas = glcanvas

    if (glcanvas == null) {
      parameters.canvas ? console.log("ERROR: cannot find canvas to draw on:",parameters.canvas) : console.log("ERROR: no canvas to draw to as parentNode:",glcanvas)
      return
    }

    resizeCanvas()

    gl = initWebGL(glcanvas,parameters.glparameters);

    curlify.localVars.gl = gl
    // Only continue if WebGL is available and working  
    if (gl == null) {
      console.log("ERROR: could not initialize webgl")
      return
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
      glcanvas.addEventListener ("mouseout", mouseout, false);
    }

    camera = createProjectionAndView(screenWidth,screenHeight,3,100);
    curlify.localVars.camera = camera

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', deviceMotionHandler, false)
    } else {
      console.log("DeviceMotionEvent not supported")
    }
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', deviceOrientationHandler, false)
    } else {
      console.log("DeviceOrientationEvent not supported")
    }

    var supportsOrientationChange = "onorientationchange" in window,
        orientationEvent = supportsOrientationChange && sys.ismobile.iOS() && false ? "orientationchange" : "resize";

    window.addEventListener(orientationEvent, function() {
        //console.log('rotation:' + window.orientation + " " + orientationEvent + " " + screen.width);
        orientationChanged()
    }, false);

    //window.addEventListener('orientationchange', orientationChanged, false);
    require( parameters.script )
      .then( function(scriptobject)
      {
        scene.openScene( scriptobject.new() )

        if (parameters.onload != null) parameters.onload()

        zipfile = null
        curlify.localVars.zipfile = null

        //window.requestAnimationFrame( curlify.render )
        curlify.intervalId = window.setInterval( curlify.render, 1000/60 )
        //curlify.render()
      }
    )
  }


})()