
var gl; // A global variable for the WebGL context
var canvas;

var viewWidth = null
var viewHeight = null

var screenWidth = 480;
var screenHeight = 852

var layoutWidth = null
var layoutHeight = null
var layoutOffset = {x:0,y:0}
var layoutScale = {x:1,y:1}

var aspectratioZoom = true

var camera = null;
var scenestack = [];

var pointerStealer = null
var sceneanim = animator.new()

var quadBuffer = {}

var scene = {

  openScene : function (scene,showanim,hideanim) {
    var prevscene = scenestack[scenestack.length-1]
    scenestack.push(scene)
    if (showanim != null) sceneanim.animate( scene, showanim )
    if (prevscene == null) return
    if (hideanim != null) sceneanim.animate( prevscene, hideanim )
  },

  closeScene : function(hideanim,showanim) {
    var scene = scenestack[scenestack.length-1]
    var prevscene = scenestack[scenestack.length-2]
    if (hideanim != null) {
      var callback = hideanim.onComplete
      var completefunc = function() {
        if (callback != null) callback()
        scenestack.splice(scenestack.length-1,1)
        console.log("remove scene from stack",scene.identifier,scenestack.length)
      }
      hideanim.onComplete = completefunc
      sceneanim.animate( scene, hideanim )
    } else {
      scenestack.splice(scenestack.length-1,1)
    }
    if (prevscene == null) return
    if (showanim != null) sceneanim.animate( prevscene, showanim )
  },

  getpointerStealer : function() {
    return pointerStealer
  },

  stealPointers : function(obj) {
    console.log("stealPointers",obj)
    var target = pointerStealer ? pointerStealer : scenestack[scenestack.length-1]
    pointerStealer = obj
    target.resetpress()
  }

}

var touch = false;
var lasttouch = null;

var sensors = {acceleration:null,rotation:null,orientation:null}

var zip = null

function require(script,callback) {
  console.log("require(",script,")")
  
  var scriptid = script.replace("/","_")
  var element = document.getElementById(scriptid)
  if (element == null) {
    console.log("create element",script,scriptid)
    element = document.createElement('script')
    element.setAttribute('src',script+".js")
    element.setAttribute('id',scriptid)
    element.setAttribute('type',"text/javascript")
    element.onload=callback
    document.head.appendChild(element);
  } else {
    if (callback != null) callback()
  }
}

function ziprequire(zipfile) {
  var element = document.createElement('script')
  element.type = "text/javascript"
  element.text = zipfile.asText()
  document.head.appendChild(element);
  return (cmsscript.new())
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

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

function createCORSRequest(method, url) {
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

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

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
  if (sceneanim.animations.length > 0 || touch == true) return
  console.log("mousedown : "+e.clientX+","+e.clientY,layoutOffset.x,layoutOffset.y)
  touch = true
  var target = pointerStealer ? pointerStealer : scenestack[scenestack.length-1]
  if (target == null) return
  target.press((e.clientX-layoutOffset.x)*layoutScale.x,(e.clientY-layoutOffset.y)*layoutScale.y)
  target.drag((e.clientX-layoutOffset.x)*layoutScale.x,(e.clientY-layoutOffset.y)*layoutScale.y)
}

function mouseup(e) {
  if (sceneanim.animations.length > 0 || touch == false) return
  console.log("mouseup : "+e.clientX+","+e.clientY)
  touch = false
  var target = pointerStealer ? pointerStealer : scenestack[scenestack.length-1]
  if (target == null) return
  target.release((e.clientX-layoutOffset.x)*layoutScale.x,(e.clientY-layoutOffset.y)*layoutScale.y)
  pointerStealer = null
}

function mouseout(e) {
  console.log("mouseout : "+e.clientX+","+e.clientY)
  if (touch) mouseup(e)
}

function mousemove(e) {
  if (sceneanim.animations.length > 0 || touch == false) return
  console.log("mousemove : "+e.clientX+","+e.clientY)
  var target = pointerStealer ? pointerStealer : scenestack[scenestack.length-1]
  if (target == null) return
  if (touch) {
    target.drag((e.clientX-layoutOffset.x)*layoutScale.x,(e.clientY-layoutOffset.y)*layoutScale.y)
  }
}

function touchstart(e) {
  if (sceneanim.animations.length > 0 || touch == true) return
  //console.log("touchstart : "+e.touches[0].pageX+","+e.touches[0].pageY)
  touch = true
  var target = pointerStealer ? pointerStealer : scenestack[scenestack.length-1]
  if (target == null) return
  target.press((e.touches[0].pageX-layoutOffset.x)*layoutScale.x,(e.touches[0].pageY-layoutOffset.y)*layoutScale.y)
  target.drag((e.touches[0].pageX-layoutOffset.x)*layoutScale.x,(e.touches[0].pageY-layoutOffset.y)*layoutScale.y)
  lasttouch = e
}

function touchend(e) {
  if (sceneanim.animations.length > 0 || touch == false ) return
  //console.log("touchend : "+lasttouch.touches[0].pageX+","+lasttouch.touches[0].pageY)
  touch = false
  var target = pointerStealer ? pointerStealer : scenestack[scenestack.length-1]
  if (target == null) return
  target.release(lasttouch.touches[0].pageX-layoutOffset.x,lasttouch.touches[0].pageY-layoutOffset.y)
  pointerStealer = null
}

function touchmove(e) {
  e.preventDefault()
  if (sceneanim.animations.length > 0 || touch == false) return
  //console.log("touchmove : "+e.touches[0].pageX+","+e.touches[0].pageY)
  var target = pointerStealer ? pointerStealer : scenestack[scenestack.length-1]
  if (target == null) return
  if (touch) {
    target.drag((e.touches[0].pageX-layoutOffset.x)*layoutScale.x,(e.touches[0].pageY-layoutOffset.y)*layoutScale.y)
  }
  lasttouch = e
}

function deviceMotionHandler(e) {
  // Grab the acceleration from the results
  sensors.acceleration = e.acceleration;
  // Grab the rotation rate from the results
  sensors.rotation = e.rotationRate;
}

function deviceOrientationHandler(e) {
  sensors.orientation = e;
}

function render() {
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE)
  gl.cullFace(gl.FRONT);

  gl.viewport(layoutOffset.x, layoutOffset.y, layoutWidth, layoutHeight)
  
  sceneanim.step()

  if (sceneanim.animations.length > 0) {
    var prevscene = scenestack[scenestack.length-2]
    prevscene.stepTree()
    prevscene.drawTree()
  }

  var target = scenestack[scenestack.length-1]
  if (target == null) return
  target.stepTree()
  target.drawTree()
}

function resizeCanvas() {
   // only change the size of the canvas if the size it's being displayed
   // has changed.
   var width = canvas.clientWidth;
   var height = canvas.clientHeight;
   if (canvas.width != width ||
       canvas.height != height) {

     layoutWidth = width
     layoutHeight = height
     layoutScale = {x: screenWidth/layoutWidth, y:screenHeight/layoutHeight}

     viewWidth = screenWidth
     viewHeight = screenHeight

     var usescale = Math.max( layoutScale.x, layoutScale.y )
     if (aspectratioZoom) {
       usescale = Math.min( layoutScale.x, layoutScale.y )

       viewWidth = width*usescale
       viewHeight = height*usescale
     }
     layoutScale.x = usescale
     layoutScale.y = usescale

     layoutWidth = Math.floor(screenWidth*(1/usescale))
     layoutHeight = Math.floor(screenHeight*(1/usescale))

     layoutOffset.x = (width-layoutWidth)/2,
     layoutOffset.y = (height-layoutHeight)/2

     canvas.width = canvas.clientWidth
     canvas.height = canvas.clientHeight

     console.log("resized",canvas.width,canvas.height,viewWidth,viewHeight)

   }

   console.log("resizeCanvas",canvas.clientWidth,canvas.clientHeight,screenWidth,screenHeight,canvas.width,canvas.height)

}

function start() {
  canvas = document.getElementById("glcanvas");

  if ('ontouchstart' in window) {
    console.log("USE TOUCH MOUSE")
    canvas.addEventListener("touchstart", touchstart, false);
    canvas.addEventListener("touchmove", touchmove, false);
    canvas.addEventListener("touchend", touchend, false);
  } else {
    console.log("USE REGULAR MOUSE")
    canvas.addEventListener("mousedown", mousedown, false);
    canvas.addEventListener("mousemove", mousemove, false);
    canvas.addEventListener("mouseup", mouseup, false);
  }

  gl = initWebGL(canvas);      // Initialize the GL context
  
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

    quadBuffer = gl.createBuffer();
    quadBuffer.itemSize = 2;
    quadBuffer.numItems = 4;

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    vertices = [
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    var main = document.getElementById("main");
    console.log("start main script",main)

    require( main.getAttribute("app"),
      function() {
        console.log("app loaded")
        scenestack.push( app.new() );
        var intervalId = setInterval(render, 1000/60);
      }
    )

  }
}
