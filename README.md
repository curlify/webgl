# webgl
WebGL framework

<h4>Usage</h4>
```html
<html> 
  <body>
    <canvas style="width: 480;height: 200">
      <script onload="this.curlify.start({script:'http://api.curlify.com/units/ads/1773/assets/dev.zip',renderInterval:1000/60})" type="text/javascript" src="http://curlify.io/dev/curlify.min.js"></script>
    </canvas>
  </body>
</html> 
  
```

<h4>curlify.start parameters</h4>
<h6>required</h6>
<i>script:</i> url of zip or .js file to launch
<h6>optional</h6>
<i>width:</i> sets layout resolution width (screenWidth in scripts) - defaults to 480<br>
<i>height:</i> sets layout resolution height (screenHeight in scripts) - defaults to 852<br>
<i>canvas:</i> target canvas - defaults to document.currentScript.parentNode<br>

<h4>Brief explanation</h4>
- curlify.js creates the module container into document.currentScript.curlify.
- All modules declare and add themselves as modules via curlify.module function
- main.js evals curlify.localVars and curlify.modules into local variable scope for scripts to use
- main.js registers public methods (start, stop, render, setRenderInterval) which can be called from outside
- curlify.start initializes webgl context, adds event listeners and requires initial script
- curlify.render renders a frame of the current scene tree if the canvas is visible to the user. window.requestAnimationFrame loop is initialized.
- curlify.stop removes event listeners, all scenes (running scripts), loaded dom elements (scripts), clears interval, clears module opengl buffers and loaded programs
