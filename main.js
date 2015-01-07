
var gl; // A global variable for the WebGL context

var screenWidth = null;
var screenHeight = null;

var camera = null;

var scenestack = [];

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
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

function render() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);

  gl.viewport(0, 0, screenWidth, screenHeight)

  scenestack[0].draw();
}

function start() {
  var canvas = document.getElementById("glcanvas");

  screenWidth = canvas.width;
  screenHeight = canvas.height;

  camera = createProjectionAndView(screenWidth,screenHeight,3,100);

  gl = initWebGL(canvas);      // Initialize the GL context
  
  // Only continue if WebGL is available and working
  
  if (gl) {
    
    scenestack.push( new app() );

    //console.log( mat4.str( testrectangle.viewMatrix ) );
    //console.log( mat4.str( testrectangle.projectionMatrix ) );

    var intervalId = setInterval(render, 100);
    //render();
  }
}
