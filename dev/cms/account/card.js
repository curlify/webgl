(function(){

  return {
    new : function(cms,json) {

      var instance = rectangle.new(viewWidth,viewHeight,{red:0.79,green:0.79,blue:0.79})

      var headerheight = 50
      var accountname = instance.add( text.new(json.name,48,cms.fontname,{red:0,green:0,blue:0}))

      var menuscroll = instance.add( scrollable.new("ad list",200,viewHeight) )
      var itemwidth = 200

      var metadatarowheight = 50
      var metadatarows = 2
      var metadataheight = metadatarowheight*metadatarows

      var itempad = 15
      
      createCORSRequest('GET', 'http://curlify.io/api/ads/account_id/'+json.id).then( function(response){

        var cmsJson = JSON.parse(response);

        console.log("Ads for account "+json.id,cmsJson)

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

          var adname = metadata.add( text.new(item.json.name,24,cms.fontname,{red:0,green:0,blue:0}) )
          adname.position.y = -metadataheight/2+metadatarowheight/2

          var modified = metadata.add( text.new(item.json.modified,24,cms.fontname,{red:0,green:0,blue:0}) )
          modified.position.y = -metadataheight/2+metadatarowheight

          var deletebutton = item.add( button.new(cms.buttons1.children[5]) )
          deletebutton.scale.x = 0.5
          deletebutton.scale.y = 0.5
          deletebutton.position.x = -itemwidth/2
          deletebutton.position.y = -item.height()/2
          deletebutton.focus = function() {
            scene.stealPointers(this)
          }
          deletebutton.click = function() {
            console.log('http://curlify.io/api/ads/'+json.id)
            createCORSRequest('DELETE', 'http://curlify.io/api/ads/'+json.id).then( function(response){
              console.log(response)
            }, function(error){
              console.log("error deleting",error)
            })
          }

          var itemimage = item.add( image.new("http://curlify.io/api/assets/"+item.json.splash_asset_id+"/content") )
          itemimage.onload = function() {
            var scale = (itemwidth-itempad) / itemimage.size.width

            itemimage.scale.x = scale
            itemimage.scale.y = scale

            item.size.width = itemimage.width()
            item.size.height = itemimage.height() + metadataheight

            itembg.size.width = item.size.width
            itembg.size.height = item.size.height

            itemimage.position.y = -metadataheight/2

            metadata.position.y = item.height()/2-metadataheight/2
            deletebutton.position.x = -itemwidth/2
            deletebutton.position.y = -item.height()/2

            instance.layoutChanged()
          }
          item.click = function() {
            console.log("clicked",this.json)
            cms.selectAd( item.json )
            scene.closeScene( {alpha:0,time:500,ease:animator.inOutQuad} )
          }
          }
        }

        if (cmsJson.error != null) {
          console.log("No ads")
          var item = menuscroll.add( object.new("error container",itemwidth*0.9,itemheight*0.9) )
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
        if (insert.div == null) {
          var div = document.createElement('div');
          div.innerHTML = "<center>Ad name <br><input type='text' id='adName'>";
          document.body.appendChild(div);
          div.setAttribute('style','font-size: 250%; position: relative; left: 25px; top: -75%; width: 90%;')
          console.log("new div!")
          insert.div = div
        } else {
          var name = document.getElementById('adName')
          var params = "account_id="+json.id+"&ads_type_id=1&name="+name.value
          console.log(params)
          createCORSRequest('POST', 'http://curlify.io/api/ads', params).then( function(response){
            console.log(response)
            scene.replaceScene( cms.accountmenu.new(cms) )
          }, function(error){
            console.log("error",error)
          })
          document.body.removeChild(insert.div)
          insert.div = null
        }
      }

      var del = instance.add( button.new( cms.buttons2.children[5] ) )
      del.scale.x = 0.5
      del.scale.y = 0.5
      del.click = function() {
        createCORSRequest('DELETE', 'http://curlify.io/api/accounts/'+json.id).then( function(response){
          cms.accountmenu.defaultpos = cms.accountmenu.defaultpos - 1
          scene.replaceScene( cms.accountmenu.new(cms) )
          console.log(response)
        }, function(error){
          console.log("error",error)
        })
      }

      instance.layoutChanged = function() {
        instance.size.width = viewWidth*0.7
        instance.size.height = viewHeight*0.8

        del.position.x = -instance.width()/2
        del.position.y = -instance.height()/2

        insert.position.y = instance.height()/2

        accountname.position.y = -instance.height()/2 + headerheight/2

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