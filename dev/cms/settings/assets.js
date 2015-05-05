(function(){

  return {
    new : function(cms) {

      var instance = object.new()

      var bg = instance.add( rectangle.new(0,0,{red:0.79,green:0.79,blue:0.79}) )

      var headerheight = 50
      var adname = instance.add( text.new(cms.selectedAd.name,48,cms.fontname,{red:0,green:0,blue:0}))

      var menuscroll = instance.add( scrollable.new("ad list",200,viewHeight) )
      var itemwidth = 200
      var itempad = 15

      var metadatarowheight = 50
      var metadatarows = 1
      var metadataheight = metadatarowheight*metadatarows
      
      createCORSRequest('GET', 'http://curlify.io/api/assets/ad_id/'+cms.selectedAd.id).then( function(response){
        var cmsJson = JSON.parse(response);

        for (var i=0;i<cmsJson.length;i++) {
          new function() {
          //console.log(cmsJson[i])
          var item = menuscroll.add( focusable.new(cmsJson[i].name,itemwidth,metadataheight ) )
          item.json = cmsJson[i]

          item.focus = function() {
            item.anim.animate( item.scale, {x:1.2,y:1.2,time:250,ease:animator.inOutQuad})
            item.bringToFront()
          }
          item.defocus = function() {
            item.anim.animate( item.scale, {x:1,y:1,time:250,ease:animator.inOutQuad})
          }

          var itembg = item.add( rectangle.new(item.size.width-itempad*2,item.size.height,{red:1,green:1,blue:1}) )

          var metadata = item.add( object.new("metadata") )
          var filename = metadata.add( text.new(item.json.filename,24,cms.fontname,{red:0,green:0,blue:0}) )
          filename.position.y = -metadataheight/2+metadatarowheight/2

          var deletebutton = item.add( button.new(cms.buttons1.children[5]) )
          deletebutton.scale.x = 0.5
          deletebutton.scale.y = 0.5
          deletebutton.position.x = -itemwidth/2
          deletebutton.position.y = -item.height()/2
          deletebutton.focus = function() {
            scene.stealPointers(this)
          }
          deletebutton.click = function() {
            console.log('http://curlify.io/api/assets/'+item.json.id)
            createCORSRequest('DELETE', 'http://curlify.io/api/assets/'+item.json.id).then( function(response){
              console.log(response)
              scene.replaceScene( cms.settingsmenu.new(cms) )
            }, function(error){
              console.log("error deleting",error)
            })
          }

          var itemimage = item.add( image.new("http://curlify.io/api/assets/"+item.json.id+"/content") )
          itemimage.onload = function() {
            var scale = (itemwidth-itempad) / itemimage.size.width

            itemimage.scale.x = scale
            itemimage.scale.y = scale

            item.size.width = itemimage.width()
            item.size.height = itemimage.height() + metadataheight

            itembg.size.width = item.size.width
            itembg.size.height = item.size.height

            itemimage.position.y = -metadataheight/2

            deletebutton.position.x = -itemwidth/2
            deletebutton.position.y = -item.height()/2

            metadata.position.y = item.height()/2-metadataheight/2

            instance.layoutChanged()
          }
          item.click = function() {
            console.log("clicked",this.json)
            window.open("http://curlify.io/api/assets/"+item.json.id+"/content")
            //cms.selectAd( cmsJson[i] )
            //scene.closeScene( {alpha:0,time:500,ease:animator.inOutQuad} )
          }
          }
        }

        if (cmsJson.error != null) {
          console.log("No assets")
          var item = menuscroll.add( object.new("error container",itemwidth,metadataheight) )
          var itembg = item.add( rectangle.new(item.size.width,item.size.height,{red:1,green:1,blue:1}) )
          item.layoutChanged = function() {
            console.log("item layoutChanged")
            itembg.size.width = item.size.width
            itembg.size.height = item.size.height
          }
          var errortext = item.add( text.new(cmsJson.error.status,24,cms.fontname,{red:0,green:0,blue:0}) )
        }

        instance.layoutChanged()

      }, function(error){
        console.log("error",error)
      })


      var insert = instance.add( button.new( cms.buttons2.children[2] ) )
      insert.scale.x = 0.5
      insert.scale.y = 0.5
      insert.click = function() {
        var div = document.createElement('div');
        div.innerHTML = "<input type='file' id='file-select' multiple/>";
        document.body.appendChild(div);
        //div.setAttribute('style','font-size: 250%; position: relative; left: 25px; top: -75%; width: 90%;')
        //console.log("new div!")
        insert.div = div

        var fileselect = document.getElementById('file-select');
        fileselect.click()

        fileselect.onchange = function() {
          var files = fileselect.files;
          var formdata = new FormData()
          console.log(files)

          for (var i=0;i<files.length;i++) {
            console.log("append",files[i].name)
            formdata.append("userfile[]",files[i],files[i].name)
          }

          createCORSRequest('POST', 'http://curlify.io/api/multi.php?adid='+cms.selectedAd.id, formdata).then( function(response){
            console.log(response)
            scene.replaceScene( cms.settingsmenu.new(cms) )
          }, function(error){
            console.log("error",error)
          })

          document.body.removeChild(insert.div)
          insert.div = null
        }

      }

      instance.layoutChanged = function() {
        instance.size.width = viewWidth
        instance.size.height = viewHeight*0.8

        bg.size.width = instance.size.width 
        bg.size.height = instance.size.height

        insert.position.y = instance.height()/2

        adname.position.y = -instance.height()/2 + headerheight/2

        menuscroll.size.width = instance.width()
        menuscroll.contentsize.width = menuscroll.size.width
        menuscroll.size.height = instance.height()

        var cols = Math.floor(instance.width()/itemwidth)

        var colypos = []
        for (var i=0;i<cols;i++) {
          colypos.push(0)
        }
        var y = 0
        var col = 0

        for (var i=0;i<menuscroll.instance.children.length;i++) {
          for (var c=0;c<cols;c++) {
            if (colypos[c] < colypos[col]) col = c
          }
          var item = menuscroll.instance.children[i]
          item.position.x = -(cols*itemwidth - itemwidth)/2 + col*itemwidth
          item.position.y = -menuscroll.height()/2 + headerheight + item.height()/2 + itempad + colypos[col]
          colypos[col] = colypos[col] + item.height() + itempad

          //console.log("pos ",col,colypos[0],colypos[1],item.position.x,item.position.y)
        }

        
        var height = 0
        for (var c=0;c<cols;c++) {
          if (colypos[c] > height) height = colypos[c]
        }
        menuscroll.contentsize.height = height
        
      }

      instance.layoutChanged()

      return instance
    }
  }

})()