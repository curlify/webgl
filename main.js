var viewWidth = null
var viewHeight = null

var screenWidth = null
var screenHeight = null

var gl = null
var camera = null


var curlify = (function() {

  var glcanvas;

  var aspectratioZoom = true

  var touch = false;
  var lasttouch = null;

  var imageid = 0


  // PUBLIC MEMBERS
  var instance = {}
  instance.sensors = {acceleration:null,rotation:null,orientation:null}
  instance.zipfile = null
  instance.layoutWidth = null
  instance.layoutHeight = null
  instance.layoutOffset = {x:0,y:0}
  instance.layoutScale = {x:1,y:1}

  instance.running = false
  instance.appendedElements = []


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
    mat4.translate( viewMatrix, vec3.create([0,0,-(far-near)/2]) );
    var quadToScreenScale = ((far-near)/2)/near;

    var cam = {near:near,far:far,width:w,height:h,projectionMatrix:projectionMatrix, viewMatrix:viewMatrix, translateScale:quadToScreenScale};
    return cam
  };

  function initWebGL(canvas) {
    gl = null;
    
    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}
    
    // If we don't have a GL context, give up now
    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      gl = null;
    }
    
    return gl;
  }

  function mousedown(e) {
    if (scene.isAnimating() || touch == true) return
    console.log("mousedown : "+e.clientX+","+e.clientY,instance.layoutOffset.x,instance.layoutOffset.y)
    touch = true
    var target = scene.getPointerUser()
    if (target == null) return
    target.press((e.clientX-instance.layoutOffset.x)*instance.layoutScale.x,(e.clientY-instance.layoutOffset.y)*instance.layoutScale.y)
    target.drag((e.clientX-instance.layoutOffset.x)*instance.layoutScale.x,(e.clientY-instance.layoutOffset.y)*instance.layoutScale.y)
  }

  function mouseup(e) {
    scene.resetPointerStealer()
    if (scene.isAnimating() || touch == false) return
    console.log("mouseup : "+e.clientX+","+e.clientY)
    touch = false
    var target = scene.getPointerUser()
    if (target == null) return
    target.release((e.clientX-instance.layoutOffset.x)*instance.layoutScale.x,(e.clientY-instance.layoutOffset.y)*instance.layoutScale.y)
  }

  function mouseout(e) {
    //console.log("mouseout : "+e.clientX+","+e.clientY)
    if (touch) mouseup(e)
  }

  function mousemove(e) {
    if (scene.isAnimating() || touch == false) return
    //console.log("mousemove : "+e.clientX+","+e.clientY)
    var target = scene.getPointerUser()
    if (target == null) return
    if (touch) {
      target.drag((e.clientX-instance.layoutOffset.x)*instance.layoutScale.x,(e.clientY-instance.layoutOffset.y)*instance.layoutScale.y)
    }
  }

  function touchstart(e) {
    if (scene.isAnimating() || touch == true) return
    //console.log("touchstart : "+e.touches[0].pageX+","+e.touches[0].pageY)
    touch = true
    var target = scene.getPointerUser()
    if (target == null) return
    target.press((e.touches[0].pageX-instance.layoutOffset.x)*instance.layoutScale.x,(e.touches[0].pageY-instance.layoutOffset.y)*instance.layoutScale.y)
    target.drag((e.touches[0].pageX-instance.layoutOffset.x)*instance.layoutScale.x,(e.touches[0].pageY-instance.layoutOffset.y)*instance.layoutScale.y)
    lasttouch = e
  }

  function touchend(e) {
    scene.resetPointerStealer()
    if (scene.isAnimating() || touch == false ) return
    //console.log("touchend : "+lasttouch.touches[0].pageX+","+lasttouch.touches[0].pageY)
    touch = false
    var target = scene.getPointerUser()
    if (target == null) return
    target.release(lasttouch.touches[0].pageX-instance.layoutOffset.x,lasttouch.touches[0].pageY-instance.layoutOffset.y)
  }

  function touchmove(e) {
    e.preventDefault()
    if (scene.isAnimating() || touch == false) return
    //console.log("touchmove : "+e.touches[0].pageX+","+e.touches[0].pageY)
    var target = scene.getPointerUser()
    if (target == null) return
    if (touch) {
      target.drag((e.touches[0].pageX-instance.layoutOffset.x)*instance.layoutScale.x,(e.touches[0].pageY-instance.layoutOffset.y)*instance.layoutScale.y)
    }
    lasttouch = e
  }

  function deviceMotionHandler(e) {
    // Grab the acceleration from the results
    instance.sensors.acceleration = e.acceleration;
    // Grab the rotation rate from the results
    instance.sensors.rotation = e.rotationRate;
  }

  function deviceOrientationHandler(e) {
    instance.sensors.orientation = e;
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

       instance.layoutWidth = width
       instance.layoutHeight = height
       instance.layoutScale = {x: screenWidth/instance.layoutWidth, y:screenHeight/instance.layoutHeight}

       viewWidth = screenWidth
       viewHeight = screenHeight

       var usescale = Math.max( instance.layoutScale.x, instance.layoutScale.y )
       if (aspectratioZoom) {
         usescale = Math.min( instance.layoutScale.x, instance.layoutScale.y )

         viewWidth = width*usescale
         viewHeight = height*usescale
       }
       instance.layoutScale.x = usescale
       instance.layoutScale.y = usescale

       instance.layoutWidth = Math.floor(screenWidth*(1/usescale))
       instance.layoutHeight = Math.floor(screenHeight*(1/usescale))

       instance.layoutOffset.x = (width-instance.layoutWidth)/2,
       instance.layoutOffset.y = (height-instance.layoutHeight)/2

       glcanvas.width = glcanvas.clientWidth
       glcanvas.height = glcanvas.clientHeight

       console.log("resized",glcanvas.width,glcanvas.height,viewWidth,viewHeight)

     }

     console.log("resizeCanvas",glcanvas.clientWidth,glcanvas.clientHeight,screenWidth,screenHeight,glcanvas.width,glcanvas.height)

  }

  function MergeRecursive(obj1, obj2) {
    for (var p in obj2) {
      try {
        // Property in destination object set; update its value.
        if ( obj2[p].constructor==Object ) {
          obj1[p] = MergeRecursive(obj1[p], obj2[p]);
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

  instance.assert = function(condition, message) {
      if (!condition) {
          throw message || "Assertion failed";
      }
  }

  instance.require = function(script,callback) {
    console.log("require(",script,")")

     // NB: all loadable zips must contain a main.js with cmsscript object
    if (script.slice(-4) == ".zip") {
      
      JSZipUtils.getBinaryContent(script, function(err, data) {
        if(err) {
          console.log("ERROR: unable to load script zip",script,err)
          return
        }
        instance.zipfile = new JSZip(data);
        var adscriptfile = instance.zipfile.file("main.js")
        if (adscriptfile == null) {
          console.log("ERROR: no main.js found in zip")
          instance.zipfile = null
          return
        }
        
        var scriptid = script.replace("/","_")
        var element = document.createElement('script')
        element.text = adscriptfile.asText()
        element.setAttribute('id',scriptid)
        element.setAttribute('type',"text/javascript")
        document.head.appendChild(element);
        instance.appendedElements.push(scriptid)

        callback(eval("cmsscript"))
        instance.zipfile = null
      })
      
    } else {
      var scriptid = script.replace("/","_")
      var element = document.getElementById(scriptid)
      if (element == null) {
        console.log("create element",script,scriptid)
        element = document.createElement('script')
        element.setAttribute('src',script+".js")
        element.setAttribute('id',scriptid)
        element.setAttribute('type',"text/javascript")
        element.onload=function(){
          console.log("script loaded",script,eval(script))
          callback(eval(script))
        }
        element.onerror=function(){
          console.log("ERROR: script load failed",script)
          callback(null)
        }
        document.head.appendChild(element);
        instance.appendedElements.push(scriptid)
      } else {
        if (callback != null) {
          callback(eval(script))
        }
      }
    }

  }

  instance.addImageElement = function() {
    var elementid = "curlify_image_"+imageid

    var element = document.createElement('img')
    element.setAttribute('id',elementid)
    document.body.appendChild(element);
    instance.appendedElements.push(elementid)

    imageid = imageid + 1
    return element
  }

  instance.createCORSRequest = function(method, url) {
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

    }
    return xhr;
  }

  instance.getRandom = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  instance.render = function() {
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.FRONT);

    gl.viewport(instance.layoutOffset.x, instance.layoutOffset.y, instance.layoutWidth, instance.layoutHeight)
    
    scene.render()
  }

  instance.setRenderInterval = function(ms) {
    if (instance.intervalId != null) window.clearInterval(instance.intervalId)
    instance.intervalId = window.setInterval(instance.render, ms);
  }

  instance.stop = function() {

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

    for (var i=0;i<instance.appendedElements.length;i++) {
      var scriptid = instance.appendedElements[i]
      var element = document.getElementById(scriptid)
      element.parentNode.removeChild(element);
      console.log("... removed element "+scriptid)
    }
    instance.appendedElements = []

    if (instance.intervalId != null) {
      console.log("... stopping render interval")
      window.clearInterval(instance.intervalId);
    }

    instance.running = false
  }

  instance.start = function(parameters) {

    if ( instance.running ) instance.stop()
    instance.running = true

    instance.assert( parameters.canvas != null )
    instance.assert( parameters.script != null )

    var canvas = parameters.canvas
    var script = parameters.script
    var width = parameters.width
    var height = parameters.height

    screenWidth = (width ? width : 480)
    screenHeight = (height ? height : 852)

    // reuse glcanvas if targeting the same canvas as previously
    var newglcanvas = document.getElementById(canvas);
    if (glcanvas != null) {
      if (newglcanvas != glcanvas) {
        console.log("canvas changed - initialize new webgl")
        glcanvas = newglcanvas
        gl = initWebGL(glcanvas);
      }
    } else {
      glcanvas = newglcanvas
      gl = initWebGL(glcanvas);
    }

    if ('ontouchstart' in window) {
      console.log("USE TOUCH MOUSE")
      glcanvas.addEventListener("touchstart", touchstart, false);
      glcanvas.addEventListener("touchmove", touchmove, false);
      glcanvas.addEventListener("touchend", touchend, false);
    } else {
      console.log("USE REGULAR MOUSE")
      glcanvas.addEventListener("mousedown", mousedown, false);
      glcanvas.addEventListener("mousemove", mousemove, false);
      glcanvas.addEventListener("mouseup", mouseup, false);
    }

    resizeCanvas()

    camera = createProjectionAndView(screenWidth,screenHeight,3,100);

    // Only continue if WebGL is available and working  
    if (gl) {
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
      
      instance.require( script,
        function(scriptobject) {
          scene.openScene( scriptobject.new() )
          if (parameters.renderInterval != null) instance.setRenderInterval(parameters.renderInterval)
        }
      )
    }

  }

  return instance

})()