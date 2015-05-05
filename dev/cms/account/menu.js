(function(){

  return {
    new : function(cms) {

      var instance = object.new()

      var bg = instance.add( rectangle.new() )

      var accounts = instance.add( carousel.new() )
      accounts.wrap = false
      accounts.alpha = 0
      //accounts.itemsize = viewWidth*0.5

      accounts.addLastCard = function() {
        var acc = accounts.add( rectangle.new(viewWidth*0.7,viewHeight*0.8,{red:1,green:1,blue:1}) )
        acc.layoutChanged = function() {
          acc.size.width = viewWidth*0.9
          acc.size.height = viewHeight*0.9
        }

        var newaccount = acc.add( button.new( cms.buttons2.children[2] ) )
        newaccount.click = function() {

          if (accounts.div == null) {
            var div = document.createElement('div');
            div.innerHTML = "<center>Account name <br><input type='text' id='accountName'>";
            document.body.appendChild(div);
            div.setAttribute('style','font-size: 250%; position: relative; left: 25px; top: -75%; width: 90%;')

            console.log("new div!")

            accounts.div = div
          } else {

            var name = document.getElementById('accountName')

            console.log(name)

            var params = "accounts_type_id=1&name="+name.value
            createCORSRequest('POST', 'http://curlify.io/api/accounts', params).then( function(response){
              console.log(response)
            }, function(error){
              console.log("error",error)
            })

            document.body.removeChild(accounts.div)
            accounts.div = null

          }
        }
        accounts.anim.animate( accounts, {alpha:1,time:500,ease:animator.inOutQuad})
      }

      createCORSRequest('GET', 'http://curlify.io/api/accounts').then( function(response){
        var cmsJson = JSON.parse(response);

        var adcard = require("account/card.js").then( function(adcard) {
          for (var i=0;i<cmsJson.length;i++) {
            console.log(cmsJson[i])

            var acc = accounts.add( adcard.new(cms,cmsJson[i]) )
          }
          
          accounts.addLastCard()
        })
        
      }, function(error){
        accounts.addLastCard()
      })

      var closebutton = instance.add( button.new( cms.buttons2.children[3] ) )
      closebutton.click = function(x,y) {
        scene.closeScene( {alpha:0,time:500,ease:animator.inOutQuad} )
      }

      instance.layoutChanged = function() {
        instance.size.width = viewWidth
        instance.size.height = viewHeight*0.8

        bg.size.width = instance.size.width 
        bg.size.height = instance.size.height

        closebutton.position.x = viewWidth/2-75
        closebutton.position.y = -viewHeight/2+75

        accounts.itemsize = viewWidth

        var coverflow = { name:"coverflow", show:[], hide:[], order_draw:true }
        coverflow.show.push( {target:'position.x',startposition:viewWidth*1.0,endposition:0,func:animator.linear} )
        coverflow.show.push( {target:'rotate.y',startposition:Math.PI*0.8,endposition:0,func:animator.linear} )
        coverflow.show.push( {target:'scale.x',startposition:0.6,endposition:1,func:animator.linear} )
        coverflow.show.push( {target:'scale.y',startposition:0.6,endposition:1,func:animator.linear} )
        //coverflow.show.push( {target:'alpha',startposition:0.3,endposition:1,func:animator.linear} )
        coverflow.hide.push( {target:'position.x',startposition:0,endposition:-viewWidth*1.0,func:animator.linear} )
        coverflow.hide.push( {target:'rotate.y',startposition:0,endposition:-Math.PI*0.8,func:animator.linear} )
        coverflow.hide.push( {target:'scale.x',startposition:1,endposition:0.6,func:animator.linear} )
        coverflow.hide.push( {target:'scale.y',startposition:1,endposition:0.6,func:animator.linear} )
        //coverflow.hide.push( {target:'alpha',startposition:1,endposition:0.3,func:animator.linear} )

        accounts.transition = coverflow

      }
      instance.layoutChanged()

      return instance
    }
  }

})()