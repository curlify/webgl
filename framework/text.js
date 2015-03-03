
(function() {

  var curlify = document.currentScript.curlify

  function createMultilineText(ctx, textToWrite, maxWidth, text) {
    textToWrite = textToWrite.replace("\n"," ");
    var currentText = textToWrite;
    var futureText;
    var subWidth = 0;
    var maxLineWidth = 0;
    
    var wordArray = textToWrite.split(" ");
    var wordsInCurrent, wordArrayLength;
    wordsInCurrent = wordArrayLength = wordArray.length;
    
    // Reduce currentText until it is less than maxWidth or is a single word
    // futureText var keeps track of text not yet written to a text line
    while (ctx.measureText(currentText).width > maxWidth && wordsInCurrent > 1) {
      wordsInCurrent--;
      var linebreak = false;
      
      currentText = futureText = "";
      for(var i = 0; i < wordArrayLength; i++) {
        if (i < wordsInCurrent) {
          currentText += wordArray[i];
          if (i+1 < wordsInCurrent) { currentText += " "; }
        }
        else {
          futureText += wordArray[i];
          if(i+1 < wordArrayLength) { futureText += " "; }
        }
      }
    }
    text.push(currentText); // Write this line of text to the array
    maxLineWidth = ctx.measureText(currentText);
    
    // If there is any text left to be written call the function again
    if(futureText) {
      subWidth = createMultilineText(ctx, futureText, maxWidth, text);
      if (subWidth > maxLineWidth) { 
        maxLineWidth = subWidth;
      }
    }
    
    // Return the maximum line width
    return maxLineWidth;
  }

  
  var text = (function() {

    console.log("initialize text module")

    var quad = curlify.getModule("quad")

    return {
      new : function(txt,fontsize,fontface,color,w,h) {

        var gl = curlify.localVars.gl
        var screenWidth = curlify.localVars.screenWidth

        var w = w ? w : screenWidth

        var instance = quad.new("text : "+txt+" : "+w+","+h);
        console.log("NEW TEXT: "+instance.identifier)

        // create 2d canvas context
        instance.canvas = document.createElement("canvas");
        instance.canvas.width = w
        instance.canvas.height = fontsize*2
        instance.context = instance.canvas.getContext('2d');

        instance.context.fillStyle = "rgba("+color.red*255+","+color.green*255+","+color.blue*255+",255)";  // This determines the text colour, it can take a hex value or rgba value (e.g. rgba(255,0,0,0.5))
        instance.context.textAlign = "center"; // This determines the alignment of text, e.g. left, center, right
        instance.context.textBaseline = "middle";  // This determines the baseline of the text, e.g. top, middle, bottom
        instance.context.font = fontsize+"px "+fontface;  // This determines the size of the text and the font family used

        //instance.context.fillText(txt,w/2,h/2)

        var textlines = []
        var textX, textY;
        var textToWrite = txt;
        var textHeight = fontsize;
        var maxWidth = w;

        createMultilineText(instance.context, txt, w, textlines)
        var canvasX = maxWidth;
        var canvasY = textHeight*(textlines.length+1);
        
        textX = canvasX/2;
        var offset = (canvasY - textHeight*(textlines.length+1)) * 0.5;

        for(var i = 0; i < textlines.length; i++) {
          textY = (i+1)*textHeight + offset;
          instance.context.fillText(textlines[i], textX,  textY);
          console.log(textlines[i],textX,textY)
        }
        
        instance.size.width = instance.canvas.width
        instance.size.height = instance.canvas.height

        /*
        var data = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
                   '<foreignObject width="100%" height="100%">' +
                   '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:40px">' +
                     '<em>I</em> like' + 
                     '<span style="color:white; text-shadow:0 0 2px blue;">' +
                     'cheese</span>' +
                   '</div>' +
                   '</foreignObject>' +
                   '</svg>';

        var DOMURL = window.URL || window.webkitURL || window;

        var img = new Image();
        var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        var url = DOMURL.createObjectURL(svg);
        img.crossOrigin = 'anonymous';

        img.onload = function () {
          instance.context.drawImage(img, 0, 0);
          DOMURL.revokeObjectURL(url);
          
          gl.bindTexture(gl.TEXTURE_2D, instance.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, instance.canvas);

          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        img.src = url;
        */

        instance.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, instance.texture);

        // Set the parameters so we can render any size video.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        //gl.generateMipmap(gl.TEXTURE_2D);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, instance.canvas);

        return instance;
      }

    }

  }())

  curlify.module("text",text)

}())

