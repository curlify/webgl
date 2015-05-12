(function(){

  return {
    new : function(cms) {

      var instance = object.new()

      var bg = instance.add( rectangle.new(0,0,{red:1,green:1,blue:1}) )
      bg.visible = false//bg.alpha = 0
      bg.layoutChanged = function() {
        bg.size.width = instance.width()
        bg.size.height = instance.height()
      }

      var menuscroll = instance.add( cms.sorted_scrollable.new(cms,"main menu",viewWidth,viewHeight) )
      
      var addNewCard = function() {
        var f = menuscroll.addItem( {
          sortid: 9999999,
          image: cms.buttons2.children[2],
          imageloaded: function(image) {
            console.log("asdflökdfs")
            image.scale.x = 3
            image.scale.y = 3
          },
          clickfunction: function() {
            this.menuitem.showinput()
          },
          inputparameters: {
            placeHolder: 'ad name',
          },
          inputfunction: function(value) {
            cms.restRequest({
              method: 'POST',
              url: 'http://curlify.io/api/ads',
              postdata: "account_id="+cms.account.id+"&ads_type_id=1&name="+value,
            }).then( function(response){
              console.log(response)
              cms.content.change( cms.adview.new(cms) )
            }, function(error){
              console.log("error",error)
            }) 
          },
        })
        return f
      }

      var addAdCard = function(json) {

        var splash = json.splash_asset_id ? "http://curlify.io/api/assets/"+json.splash_asset_id+"/content" : null
        var f = menuscroll.addItem( {
          metadata: json.name,
          sortid: json.id,
          image: splash,
          clickfunction: function() {
            cms.choseAd( json )
          },
          inputparameters: {
            value: json.name,
          },
          inputfunction: function(value) {
            cms.restRequest({
              method:'PUT',
              url: 'http://curlify.io/api/ads/'+json.id,
              postdata: "account_id="+cms.account.id+"&name="+value,
            }).then( function(response){
              console.log(response)

              cms.content.change( cms.adview.new(cms) )
            }, function(error){
              console.log("error",error)
            })
          },
          contextitems: [
            { title : "Duplicate",
              action : function() {
                console.log("FOO")
              }
            },
            { title : "Rename",
              action : function() {
                console.log("FOO",this)
                this.menuitem.showinput()
              }
            },
            { title : "Delete",
              action : function() {
                createCORSRequest('DELETE', 'http://curlify.io/api/ads/'+json.id).then( function(response){
                  cms.content.change( cms.adview.new(cms) )
                  console.log(response)
                }, function(error){
                  console.log("error",error)
                })
              }
            },
          ],
        })
        return f
      }


      cms.restRequest( {
        method: 'GET',
        url: 'http://curlify.io/api/ads/account_id/'+cms.account.id
      }).then( function(response){
        var cmsJson = JSON.parse(response);

        var index = 0
        var nextItem = function() {

          if (cmsJson.error != null || index >= cmsJson.length) {
            var f = addNewCard()
            f.alpha = 0
            f.anim.animate( f, {alpha:1,time:250,ease:animator.inQuad})
            menuscroll.layoutChangedTree()
            return
          }

          var f = addAdCard( cmsJson[index] )
          f.alpha = 0
          f.anim.animate( f, {alpha:1,time:250,ease:animator.inQuad})
          menuscroll.layoutChangedTree()

          index = index + 1

          instance.anim.animate( instance, {time:100,onComplete:nextItem})
        }

        nextItem()

      }, function(error){
        addNewCard()
      })

      instance.layoutChanged = function() {
        console.log("account layout changed",instance.parent.width(),instance.parent.height())
        instance.size.width = instance.parent.width()
        instance.size.height = instance.parent.height()

        menuscroll.size.width = instance.width()
        menuscroll.contentsize.width = menuscroll.width()
        menuscroll.size.height = instance.height()
      }

      return instance
    }
  }

})()