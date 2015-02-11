
var video = function(source) {
  var video = focusable.new("video : "+source);

  video.glProgram = image_program.getProgram()

  // load the video
  video.player = document.createElement("video");
  var videoready = false;
  video.player.autoplay = true;
  video.player.loop = true;
  video.player.oncanplay = function(){ videoready=true; }
  
  video.player.onerror = function()
  {
    var err = "unknown error";
    
    switch(video.player.error.code)
    {
      case 1: err = "video loading aborted"; break;
      case 2: err = "network loading error"; break;
      case 3: err = "video decoding failed / corrupted data or unsupported codec"; break;
      case 4: err = "video not supported"; break;
    }; 
    
    console.log("Error: " + err + " (errorcode="+video.player.error.code+")");
  };
  
  if (zip != null && source.slice(0, 4) != "http" ) {
    var zipEntry = zip.file(source)
    console.log("video.source zip",zipEntry,source,zip)
    video.player.type = "video/mp4"
    video.player.src = 'data:video/mp4;base64,' + JSZip.base64.encode(zipEntry.asBinary())
  } else {
    console.log("video.source ",source)
    video.player.src = source
    video.player.crossOrigin = "anonymous";
  }

  if (sys.ismobile.any()) {
    // workaround for mobiles not starting play otherwise
    video.click = function(x,y) {
      console.log("video click",x,y)
      video.player.play()
    }
    video.focus = function(x,y) {
      console.log("video focus",x,y)
    }
  }
  
  function startVideo() {
    console.log("startVideo")
    video.player.play();
  }  

  function videoDone() {
    console.log("videoDone")
  }
  video.preload = "auto"
  video.player.addEventListener("canplaythrough", startVideo, true);
  video.player.addEventListener("ended", videoDone, true);

  function videoprogress() {
    console.log("progress")
  }
  function videoplaying() {
    console.log("playing")
  }
  function videostalling() {
    console.log("stalling")
  }
  function videosuspend() {
    console.log("suspend")
  }
  video.player.addEventListener("progress", videoprogress, true);
  video.player.addEventListener("playing", videoplaying, true);
  video.player.addEventListener("stalling", videostalling, true);
  video.player.addEventListener("suspend", videosuspend, true);

  // try to disable the iPhone video fullscreen mode:
  video.player.setAttribute("playsinline", "");
  video.player.setAttribute("webkit-playsinline", "");

  video.player.load()
  video.player.play()

  video.texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, video.texture);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 0, 0])); // transparent

  // Set the parameters so we can render any size video.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  video.draw = function() {

    if (video.loaded != true) {
      //console.log("texture not loaded")

      if (videoready) {

        //video.size.width = video.player.width
        //video.size.height = video.player.height

        console.log("video texture loaded : "+video.size.width+"x"+video.size.height)

        if (video.onload != null) video.onload()
        video.loaded = true
      }

      return
    }

    gl.useProgram(this.glProgram.program);

    gl.activeTexture(gl.TEXTURE0)

    //console.log("setting no mipmaps")
    gl.bindTexture(gl.TEXTURE_2D, video.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video.player);

    gl.uniform1i(this.glProgram.u_texture_handle, 0)

    gl.uniform1f(this.glProgram.u_alpha_handle, this.absolutealpha());

    gl.uniformMatrix4fv(this.glProgram.u_projection_handle, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.glProgram.u_view_handle, false, this.viewMatrix);
    gl.uniformMatrix4fv(this.glProgram.u_model_handle, false, this.quadModelMatrix);
    
    var buffer = (this.buffer ? this.buffer : quad.buffer)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(this.glProgram.a_position_handle)
    gl.enableVertexAttribArray(this.glProgram.a_tex_coordinate_handle)

    gl.vertexAttribPointer(this.glProgram.a_position_handle, buffer.itemSize, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this.glProgram.a_tex_coordinate_handle, buffer.itemSize, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffer.numItems);
  };


  video.checkstatus = function() {
    console.log("video status : "+video.player.paused + " : " + video.player.buffered + " : "+video.player.error)
    console.log("readyState  :"+video.player.readyState)
    console.log("startDate  :"+video.player.startDate)
    console.log("duration  :"+video.player.duration)
    console.log("currentSrc  :"+video.player.currentSrc)
    video.anim.animate(video, {alpha:1,time:2000,onComplete:video.checkstatus})
    /*if (video.loaded && videoready) {
      if (video.player.paused) {
        console.log("trying to start")
        video.player.play()
      }
    }*/
  }
  //video.checkstatus()

  return video;
}

video.new = function(source) {
  return new video(source)
}

