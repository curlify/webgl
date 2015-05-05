(function(){

  return {
    new : function(cms,json) {

      var instance = rectangle.new(viewWidth,viewHeight,{red:0.79,green:0.79,blue:0.79})


      var menuscroll = instance.add( scrollable.new("ad list",200,viewHeight) )
      var itemwidth = 200
      var itemheight = 350
      
      createCORSRequest('GET', 'http://curlify.io/api/ads/account_id/'+json.id).then( function(response){

        var cmsJson = JSON.parse(response);

        console.log("Ads for account "+json.id,cmsJson)

        for (var i=0;i<cmsJson.length;i++) {
          new function() {
          console.log(cmsJson[i])
          var item = menuscroll.add( focusable.new(cmsJson[i].name,itemwidth*0.9,itemheight*0.9 ) )
          item.json = cmsJson[i]
          var itembg = item.add( rectangle.new(item.size.width,item.size.height,{red:1,green:1,blue:1}) )
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

        var cols = Math.floor(instance.width()/itemwidth)
        menuscroll.size.height = instance.height()

        console.log("COLS: ",cols,viewWidth,menuscroll.instance.children.length)

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