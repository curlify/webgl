# webgl
WebGL framework

<h4>Usage</h4>
```html
  <canvas style="width: 480;height: 200">
    <script onload="this.curlify.start({script:'http://api.curlify.com/units/ads/1769/assets/dev.zip',renderInterval:1000/60})" type="text/javascript" src="../curlify.min.js"></script>
  </canvas>
```

<h4>curlify.start parameters</h4>
<h6>required</h6>
script: url of zip or .js file to launch
<h6>optional</h6>
canvas: target canvas - defaults to document.currentScript.parentNode
renderInterval: interval for render calls to this script - defaults to no interval, ie. curlify.render must be called from somewhere else

<h4>Brief explanation</h4>
- curlify.js creates the module container into document.currentScript.curlify.
- All modules declare and add themselves as modules via curlify.module function
- main.js evals curlify.localVars and curlify.modules into local variable scope for scripts to use
- main.js registers public methods (start, stop, render, setRenderInterval) which can be called from outside
- curlify.start initializes webgl context, adds event listeners and requires initial script
- curlify.stop removes event listeners, all scenes (running scripts), loaded dom elements (scripts), clears interval, clears module opengl buffers and loaded programs
