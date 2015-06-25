
(function() {

  var revision = "10"
  console.log("initialize main",revision,document.currentScript)

  var scaleMulti = 1

  var currentScript = document.currentScript // need local reference so curlify.start gets correct element
  var curlify = currentScript.curlify

  // evil extraction of all modules to local variables so that scripts have 'object' etc. defined already
  eval(curlify.extract(curlify.modules,"curlify.modules"))
  eval(curlify.extract(curlify.localVars,"curlify.localVars"))

  curlify.scene = scene
  curlify.renderRequired = false

  var glcanvas
  var glclearcolor = 0.0
  var aspectratioZoom = true

  var touch = false
  var lasttouch = null

  var hoverlist = []
  var hoverfocus = null

  var lastPointerPosition = {x:0,y:0}
  var pointerTargetDirection = {x:0,y:0}
  var pointerDirection = {x:0,y:0}
  var pointerTimestamp = 0

  //var renderRequested = true
  var imageid = 0
  var running = false
  var appendedElements = []

  var allowDefaultPointerEvent = false

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
    catch(e) {console.log(e);}
    
    //var sharedResourcesExtension = gl.getExtension("WEBGL_shared_resources");
    //console.log("shared",sharedResourcesExtension)

    // If we don't have a GL context, give up now
    if (gl === undefined) {
      console.log("ERROR: Unable to initialize WebGL in target node");
      gl = null;
    }

    return gl;
  }

  function swipestart(rel) {
    pointerTimestamp = sys.timestamp()

    lastPointerPosition.x = rel.x
    lastPointerPosition.y = rel.y
    
    pointerDirection.x = 0
    pointerDirection.y = 0

    pointerTargetDirection.x = 0
    pointerTargetDirection.y = 0
  }
  function swipedrag(rel) {
    var timedelta = sys.timestamp()-pointerTimestamp

    var xmove = rel.x-lastPointerPosition.x
    var ymove = rel.y-lastPointerPosition.y

    var td = Math.max(timedelta,16.66)
    pointerTargetDirection.x = xmove/(td/16.66)
    pointerTargetDirection.y = ymove/(td/16.66)

    if (pointerDirection.y < 0) pointerDirection.y = Math.min(pointerDirection.y,pointerTargetDirection.y)
    if (pointerDirection.y > 0) pointerDirection.y = Math.max(pointerDirection.y,pointerTargetDirection.y)
    if (pointerDirection.x < 0) pointerDirection.x = Math.min(pointerDirection.x,pointerTargetDirection.x)
    if (pointerDirection.x > 0) pointerDirection.x = Math.max(pointerDirection.x,pointerTargetDirection.x)

    var targetdir = pointerTargetDirection.y/Math.abs(pointerTargetDirection.y)
    var dir = pointerDirection.y/Math.abs(pointerDirection.y)
    if (targetdir != dir) pointerDirection.y = pointerTargetDirection.y

    var targetdir = pointerTargetDirection.x/Math.abs(pointerTargetDirection.x)
    var dir = pointerDirection.x/Math.abs(pointerDirection.x)
    if (targetdir != dir) pointerDirection.x = pointerTargetDirection.x

    lastPointerPosition.x = rel.x
    lastPointerPosition.y = rel.y
  }
  function swipeend(position) {
    var xmax = viewWidth*0.08
    var ymax = viewHeight*0.07

    var xdir = pointerDirection.x
    if (xdir > 0) xdir = Math.min(1.0,xdir/xmax)
    if (xdir < 0) xdir = Math.max(-1.0,xdir/xmax)

    var ydir = pointerDirection.y
    if (ydir > 0) ydir = Math.min(1.0,ydir/ymax)
    if (ydir < 0) ydir = Math.max(-1.0,ydir/ymax)

    var swipedir = {x:xdir,y:ydir}
    //console.log("swipeend",swipedir,pointerDirection,xmax,ymax)
    return swipedir
  }

  function mousedown(e) {
    if (scene.isAnimating() || touch == true) return

    var tgt = e.currentTarget.getBoundingClientRect()
    //console.log("mousedown : "+e.clientX+","+e.clientY+" | "+window.pageXOffset+","+window.pageYOffset+" | "+tgt.left+","+tgt.top,scene.getPointerUser())
    touch = true
    var target = scene.getPointerUser()
    if (target == null) return
    var rel = {x: (e.clientX*scaleMulti-tgt.left-layoutOffset.x)*layoutScale.x, y: (e.clientY*scaleMulti-tgt.top-layoutOffset.y)*layoutScale.y}

    //console.log("mousedown",rel.x,rel.y)
    // find out which objects are hit
    var list = target.hoverTree(rel.x,rel.y)
    hoverlist = list
    if (list.length > 0) {
      hoverfocus = list[0]

      // send press/drag events to hit object
      hoverfocus.press(rel.x,rel.y)
      hoverfocus.drag(rel.x,rel.y)

      //console.log("hoverfocus:",hoverfocus)
    } else {
      hoverfocus = null
    }

    swipestart(rel)

    // original target gets unfocused events
    target.unfocused_press(rel.x,rel.y)
    target.unfocused_drag(rel.x,rel.y)
  }

  function mouseup(e) {
    if (scene.isAnimating() || touch == false) {
      scene.resetPointerStealer()
      return
    }
    //console.log("mouseup : "+e.clientX+","+e.clientY)
    var tgt = e.currentTarget.getBoundingClientRect()
    touch = false
    var target = scene.getPointerUser()
    if (target == null) return
    var rel = {x: (e.clientX*scaleMulti-tgt.left-layoutOffset.x)*layoutScale.x, y: (e.clientY*scaleMulti-tgt.top-layoutOffset.y)*layoutScale.y}
    var swipedir = swipeend(rel)
    if (target.swipe(swipedir)) {
      //console.log("yes, swipe in fact")
      target.resetpress()
    } else {
      if (hoverfocus != null) hoverfocus.release(rel.x,rel.y)
      target.unfocused_release(rel.x,rel.y)
    }
    scene.resetPointerStealer()
  }

  function mouseout(e) {
    //console.log("mouseout : "+e.clientX+","+e.clientY)
    if (touch) mouseup(e)
    if (hoverfocus != null) {
      hoverfocus.hover(-999999,-999999)
      return
    }
  }

  function mousemove(e) {
    if (scene.isAnimating()) return
    //console.log("mousemove : "+e.clientX+","+e.clientY)
    var tgt = e.currentTarget.getBoundingClientRect()
    var target = scene.getPointerUser()
    if (target == null) return
    var rel = {x: (e.clientX*scaleMulti-tgt.left-layoutOffset.x)*layoutScale.x, y: (e.clientY*scaleMulti-tgt.top-layoutOffset.y)*layoutScale.y}

    // find out which objects are hit
    var list = target.hoverTree(rel.x,rel.y)
    hoverlist = list
    if (touch) {

      if (list.length > 0) {
        if (hoverfocus != list[0] && hoverfocus != null) hoverfocus.resetpress()
        hoverfocus = list[0]
        // send drag events to hit object
        hoverfocus.drag(rel.x,rel.y)
      } else {
        if (hoverfocus != null) hoverfocus.resetpress()
        hoverfocus = null
      }

      swipedrag(rel)
      target.unfocused_drag(rel.x,rel.y)
    } else {
      var list = target.hoverTree(rel.x,rel.y)

      if (hoverfocus != null && list.length == 0) {
        hoverfocus.hover(-999999,-999999)
        hoverfocus = null
        return
      }
      if (list.length == 0) return
      if (hoverfocus != null && hoverfocus != list[0]) hoverfocus.hover(-99999,-999999)

      hoverfocus = list[0]
      var relx = (rel.x-screenWidth/2)-hoverfocus.absolutex()
      var rely = (rel.y-screenHeight/2)-hoverfocus.absolutey()
      hoverfocus.hover(relx,rely)
      //console.log("hover",hoverfocus.identifier)
    }
  }

  function touchstart(e) {
    allowDefaultPointerEvent = false
    //console.log("touchstart",touch)
    if (scene.isAnimating() || touch == true) return
    var tgt = e.currentTarget.getBoundingClientRect()
    //console.log("touchstart : "+e.touches[0].pageX+","+e.touches[0].pageY+" | "+window.pageXOffset+","+window.pageYOffset+" | "+tgt.left+","+tgt.top)
    touch = true
    var target = scene.getPointerUser()
    if (target == null) return
    var rel = {x: (e.touches[0].pageX*scaleMulti-tgt.left-window.pageXOffset-layoutOffset.x)*layoutScale.x, y: (e.touches[0].pageY*scaleMulti-tgt.top-window.pageYOffset-layoutOffset.y)*layoutScale.y}
    //console.log("rel: "+rel.x,rel.y)
    swipestart(rel)
    target.press(rel.x,rel.y)
    target.drag(rel.x,rel.y)
    lasttouch = e
    if (allowDefaultPointerEvent == false) e.preventDefault()
  }

  function touchend(e) {
    allowDefaultPointerEvent = false
    if (scene.isAnimating() || touch == false ) {
      scene.resetPointerStealer()
      return
    }
    //console.log("touchend : "+lasttouch.touches[0].pageX+","+lasttouch.touches[0].pageY)
    var tgt = e.currentTarget.getBoundingClientRect()
    touch = false
    var target = scene.getPointerUser()
    if (target == null) return
    var rel = {x: (lasttouch.touches[0].pageX*scaleMulti-tgt.left-window.pageXOffset-layoutOffset.x)*layoutScale.x, y: (lasttouch.touches[0].pageY*scaleMulti-tgt.top-window.pageYOffset-layoutOffset.y)*layoutScale.y}
    var swipedir = swipeend(rel)
    if (target.swipe(swipedir)) {
      target:resetpress()
    } else {
      target.release(rel.x,rel.y)
    }
    scene.resetPointerStealer()
  }

  function touchmove(e) {
    if (scene.isAnimating() || touch == false) return
    //console.log("touchmove : "+e.touches[0].pageX+","+e.touches[0].pageY)
    var tgt = e.currentTarget.getBoundingClientRect()
    var target = scene.getPointerUser()
    if (target == null) return
    if (touch) {
      var rel = {x: (e.touches[0].pageX*scaleMulti-tgt.left-window.pageXOffset-layoutOffset.x)*layoutScale.x, y: (e.touches[0].pageY*scaleMulti-tgt.top-window.pageYOffset-layoutOffset.y)*layoutScale.y}
      swipedrag(rel)
      target.drag(rel.x,rel.y)
    }
    lasttouch = e
    if (allowDefaultPointerEvent == false) e.preventDefault()
  }
  var hasRotation = true;
  var isany_mobile = sys.ismobile.any();
  if(sys.ismobile.FireFox())
  {
    hasRotation = false;
  }
  function deviceMotionHandler(e) {
    // Grab the acceleration from the results
    sensors.acceleration = e.acceleration;
    if(isany_mobile && (sensors.acceleration === null || sensors.acceleration.x === null)) // Compatibility with some browsers
    {
      sensors.acceleration = e.accelerationIncludingGravity;
    } 

    // Grab the rotation rate from the results
    
    if(hasRotation && (e.rotationRate === null || e.rotationRate.alpha === null)) // Some Android browsers don't know how to handle rotationRate, orientation hack does it nicely
    {
      hasRotation = false;
    }
    else if(hasRotation) {
      sensors.rotationRate = e.rotationRate;
    }

    //console.log("alpha: "+e.rotation.alpha)
  }

  var orientation_hack = (isany_mobile ? -180 : 0)
  function deviceOrientationHandler(e) {
    // make orientation -180 -> 180 on all devices
    if (e==null) return
    //console.log("alpha: "+e.alpha+","+(e.alpha+orientation_hack)+","+orientation_hack)
    if(isany_mobile && !hasRotation && sensors.orientation !== null && sensors.orientation.alpha !== null) // Orientation hack for rotation
    {
      sensors.rotationRate = {beta:sensors.orientation.alpha-(e.alpha+orientation_hack),alpha:sensors.orientation.beta-e.beta,gamma:sensors.orientation.gamma-e.gamma};
    }
    sensors.orientation = {alpha:e.alpha+orientation_hack,beta:e.beta,gamma:e.gamma};
  }

  function orientationChanged() {
    /*
    console.log("orientationChanged() "+","+screen.orientation+","+screen.width+","+screen.height+" : "+glcanvas.clientWidth+","+glcanvas.clientHeight)
    window.clearTimeout( curlify.orientationInterval )
    curlify.orientationInterval = window.setInterval(
      function() {
        curlify.resizeCanvas()
        window.clearTimeout( curlify.orientationInterval )
      },
      250
    )*/

    window.requestAnimationFrame( curlify.resizeCanvas )
  }

  function wheelHandler(e) {
    //console.log(e)
    e.preventDefault()
    
    if (scene.isAnimating() || hoverlist.length == 0) return

    for (var i=0;i<hoverlist.length;i++) {
      var target = hoverlist[i]
      if (target.wheel != null) {
        target.wheel( e.wheelDeltaX, e.wheelDeltaY )
        break
      }
    }

  }

  function resizeCanvas() {
    //console.log("resizeCanvas",glcanvas)

    //var realToCSSPixels = window.devicePixelRatio || 1;

    var width = Math.floor(glcanvas.clientWidth*scaleMulti);
    var height = Math.floor(glcanvas.clientHeight*scaleMulti);

    //console.log("resizeCanvas"+" "+glcanvas.clientWidth+"x"+glcanvas.clientHeight+" * "+window.devicePixelRatio+" "+width+"x"+height+" "+glcanvas.width+"x"+glcanvas.height)

    
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

    glcanvas.width = width
    glcanvas.height = height

    //console.log("resized",glcanvas.width,glcanvas.height,viewWidth,viewHeight)
    curlify.localVars.layoutWidth = layoutWidth
    curlify.localVars.layoutHeight = layoutHeight
    curlify.localVars.layoutScale = layoutScale
    curlify.localVars.layoutOffset = layoutOffset

    curlify.localVars.viewWidth = viewWidth
    curlify.localVars.viewHeight = viewHeight

    curlify.localVars.screenWidth = screenWidth
    curlify.localVars.screenHeight = screenHeight

    console.log("resizeCanvas"+" "+glcanvas.clientWidth+"x"+glcanvas.clientHeight+" "+screenWidth+"x"+screenHeight+" "+layoutWidth+"x"+layoutHeight+" "+glcanvas.width+","+glcanvas.height+" "+viewWidth+"x"+viewHeight)

    scene.layoutChanged()
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

  function createCORSRequest(method, url, params) {
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

      if (params != null && params instanceof FormData == false) {
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      }
      xhr.send(params)      
    })
  }


  function require(script) {
    //console.log("require(",script,")")

    // check for internal framework module and instantly return for easier syntax
    var module = curlify.getModule(script)
    if (module != null) {
      console.log("return module '"+script+"'",module)
      return new Promise(function(resolve,reject) {
        resolve(module)
      })
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

            var jsfiles = zipfile.filter(function (relativePath, file){
              if (relativePath.slice(-3) == ".js") return true
              return false
            })

            //console.log("files matching .js",jsfiles)

            var mainscriptfile = null
            var mainscriptobject = null

            for (var i=0;i<jsfiles.length;i++) {
              new function() {
              var file = jsfiles[i]
              var scripto = null
              var e = null
              try {
                scripto = eval(file.asText())
              } catch (e) {
                console.log("error evaluating file "+file.name+" with '"+e+"'")
              }
              if (file.name == "main.js") {
                mainscriptfile = file
                mainscriptobject = scripto
                if (e) {
                  zipfile = null
                  curlify.localVars.zipfile = null
                  reject(Error("require eval failed for zip '"+script+"' with '"+e+"'"))
                  return
                }
              }
              }
            }

            //var adscriptfile = zipfile.file("main.js")
            if (mainscriptfile == null) {
              zipfile = null
              curlify.localVars.zipfile = null
              reject(Error("require failed for '"+script+"' with 'main.js not found inside zip'"))
              return
            }
            //console.log("require adscript file",adscriptfile.asText())
            /*
            try {
              mainscriptobject = eval(adscriptfile.asText())
            } catch (e) {
              zipfile = null
              curlify.localVars.zipfile = null
              reject(Error("require eval failed for zip '"+script+"' with '"+e+"'"))
              return
            }
            */

            //console.log("require scriptobject",scriptobject)
            resolve(mainscriptobject)
            //zipfile = null
          })

        // .js / jsonp file - all other types handled as a script
        } else /*if (script.slice(-3) == ".js")*/ {

          if (zipfile != null) {

            var scriptfile = zipfile.file( script )
            if (scriptfile == null) {
              reject(Error("require with zip failed for script "+script))
              return
            }
            
            var scriptobject = null
            try {
              scriptobject = eval(scriptfile.asText())
            } catch (e) {
              reject(Error("require with zip failed for script "+script+" with "+e))
              return
            }

            resolve(scriptobject)
            return

          } else {

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

  /*
  // this is really only for object.js
  curlify.requestRender = function() {
    renderRequested = true
  }
  */

  curlify.render = function() {

    if (running == false) return

    //window.requestAnimationFrame( curlify.render )

    if ( document.hidden || isElementInViewport( glcanvas ) == false/* || renderRequested == false*/ ) return

    //zipfile = null
    //curlify.localVars.zipfile = null

    //renderRequested = false
    /*
    //gl.colorMask(true, true, true, true);
    gl.disable(gl.DEPTH_TEST);
    //gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.FRONT);
    */

    //console.log(layoutOffset.x,layoutOffset.y,layoutWidth,layoutHeight,glcanvas.width,glcanvas.height)
    //gl.viewport(0, 0, layoutWidth, layoutHeight)

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

    console.log("curlify.start",parameters,revision,Date.now())

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
    curlify.localVars.autosize = parameters.autosize

    var realToCSSPixels = window.devicePixelRatio || 1;
    //realToCSSPixels = 1
    // TODO: fix pointers / fbos - layout is wrong in other words
    scaleMulti = sys.ismobile.any() ? realToCSSPixels : 2
    if(parameters.autosize === true)
    {
      var scale=1/window.devicePixelRatio;
      if(sys.ismobile.Android() && ! sys.ismobile.FireFox() || sys.ismobile.iOS()) // All webkit browsers handle zoom very nicely
      {
          glcanvas.parentNode.style.zoom = scale;
      }
      else // Rest are rubbish.
      {
          glcanvas.style.width = window.devicePixelRatio+"00%"; // We can add that it takes previous value and multiplies it, but right now I assume, it's a fullscreen ad
          glcanvas.style.height = window.devicePixelRatio+"00%";
          var parStyle = glcanvas.parentNode.getAttribute("style");
          glcanvas.parentNode.setAttribute("style",parStyle+"-moz-transform: scale("+scale+");-moz-transform-origin: 0 0;-o-transform: scale("+scale+");-o-transform-origin: 0 0;zoom:"+scale+";transform: scale("+scale+");transform-origin: 0 0;");
      }
    }
    

    if (glcanvas === null) {
      parameters.canvas ? console.log("ERROR: cannot find canvas to draw on:",parameters.canvas) : console.log("ERROR: no canvas to draw to as parentNode:",glcanvas)
      return
    }

    resizeCanvas()

    gl = initWebGL(glcanvas,parameters.glparameters);

    curlify.localVars.gl = gl
    // Only continue if WebGL is available and working  
    if (gl === undefined) {
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

    glcanvas.addEventListener("wheel", wheelHandler, false);

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

        //zipfile = null
        //curlify.localVars.zipfile = null

        if (parameters.framerate == 0) return

        var framerate = (parameters.framerate ? parameters.framerate : 60)
        console.log("setting interval",parameters,framerate,parameters.framerate,Date.now())

        //window.requestAnimationFrame( curlify.render )
        curlify.intervalId = window.setInterval( curlify.render, 1000/framerate )
        //curlify.render()
      },
      function(e) {
        console.log(e)
        alert( "Could not load initial script: "+parameters.script )
      }
    )
  }


})()