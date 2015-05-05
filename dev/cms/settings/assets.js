(function(){

  return {
    new : function(cms) {

      var instance = object.new()

      var bg = instance.add( rectangle.new(0,0,{red:0.79,green:0.79,blue:0.79}) )

      var menuscroll = instance.add( scrollable.new("ad list",200,viewHeight) )
      var itemwidth = 200
      var itemheight = 350
      
      createCORSRequest('GET', 'http://curlify.io/api/assets/ad_id/'+cms.selectedAd.id).then( function(response){
        var cmsJson = JSON.parse(response);

        for (var i=0;i<cmsJson.length;i++) {
          new function() {
          console.log(cmsJson[i])
          var item = menuscroll.add( focusable.new(cmsJson[i].name,itemwidth*0.9,itemheight*0.9 ) )
          item.json = cmsJson[i]
          var itembg = item.add( rectangle.new(item.size.width,item.size.height,{red:1,green:1,blue:1}) )
          item.click = function() {
            console.log("clicked",this.json)
            //cms.selectAd( cmsJson[i] )
            //scene.closeScene( {alpha:0,time:500,ease:animator.inOutQuad} )
          }
          }
        }

        if (cmsJson.error != null) {
          console.log("No assets")
          var item = menuscroll.add( object.new("error container",itemwidth*0.9,itemheight*0.9) )
          var itembg = item.add( rectangle.new(item.size.width,item.size.height,{red:1,green:1,blue:1}) )
          item.layoutChanged = function() {
            console.log("item layoutChanged")
            itembg.size.width = item.size.width
            itembg.size.height = item.size.height
          }
          var errortext = item.add( text.new(cmsJson.error.status,24,"helvetica",{red:0,green:0,blue:0}) )
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
        console.log("new div!")
        insert.div = div

        var fileselect = document.getElementById('file-select');
        fileselect.click()

        fileselect.onchange = function() {
          console.log("WOOP")
          var files = fileselect.files;
          var formdata = new FormData()
          console.log(files)

          for (var i=0;i<files.length;i++) {
            console.log("append",files[i].name)
            formdata.append(files[i].name,files[i],files[i].name)
          }

          createCORSRequest('POST', 'http://curlify.io/api/upload.php?adid='+cms.selectedAd.id, formdata).then( function(response){
            console.log(response)
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

        menuscroll.size.height = instance.height()

        itemwidth = instance.size.width
        itemheight = 50

        var cols = 1

        var y = -menuscroll.height()/2+itemheight/2
        for (var i=0;i<menuscroll.instance.children.length;i+=cols) {
          for (var c=0;c<cols;c++) {
            var index = i+c
            if (index >=menuscroll.instance.children.length) continue
            var item = menuscroll.instance.children[index]
            item.position.x = -(cols*itemwidth - itemwidth)/2 + c*itemwidth
            item.position.y = y
          }
          y = y + itemheight
        }

        menuscroll.contentsize.height = y+itemheight/2

      }

      instance.layoutChanged()

      return instance
    }
  }

})()