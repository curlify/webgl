(function(){

  return {
    new : function() {

      var instance = object.new()

      instance.fontname = "Roboto"

      var calculateSize = function() {

        var multiplier = 1000 / Math.min(window.innerWidth,window.innerHeight)
        console.log("calculateSize",multiplier,window.innerWidth,window.innerHeight,screen.width,screen.height,window.devicePixelRatio)

        instance.sizeMultiplier = 1//multiplier

        instance.buttonscale = 0.5

        instance.menuwidth = 250
        instance.menuitemheight = 80

        instance.itembackgroundpad = 8
        instance.metadatapad = 15
        instance.metadataheight = 50

      }
      calculateSize()

      var loading = instance.add( rectangle.new(0,5,{red:1,green:1,blue:1}) )
      loading.total = 3
      loading.current = 0
      loading.advance = function() {
        loading.current = loading.current + 1
        loading.size.width = (loading.current/loading.total)*viewWidth
        instance.layoutChanged()
      }

      instance.layoutChanged = function() {
        loading.position.x = -viewWidth/2+loading.width()/2
        loading.position.y = viewHeight/2-loading.height()/2
      }

      // method
      // url
      // headers (header,value)
      // postdata
      instance.restRequest = function(params) {

        var method = params.method || "GET"
        var url = params.url

        console.log("restRequest",params)

        return new Promise(function(resolve, reject) {

          var xhr = new XMLHttpRequest();

          if ("withCredentials" in xhr) {

            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.open(method, url, true);

          } else if (typeof XDomainRequest != "undefined") {

            // Otherwise, check if XDomainRequest.
            // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
            xhr = new XDomainRequest();
            xhr.open(method, url);

          } else {

            // Otherwise, CORS is not supported by the browser.
            xhr = null;
            reject(Error("createCORSRequest failed with 'XMLHttpRequest not supported'"))
            return
          }

          xhr.onload = function() {
            // This is called even on 404 etc
            // so check the status
            if (xhr.status == 200) {
              // Resolve the promise with the response text
              resolve(xhr.response);
            } else {
              // Otherwise reject with the status text
              // which will hopefully be a meaningful error
              reject(Error("cors request failed with '"+xhr.statusText+"'"));
            }
          };

          // Handle network errors
          xhr.onerror = function() {
            reject(Error("cors request failed with 'Network Error'"));
          };  

          if ( params.headers != null) {
            for (var i=0;i<params.headers.length;i++) {
              xhr.setRequestHeader(params.headers[i].header, params.headers[i].value)
            }
          }
          if (instance.access_token) {
            xhr.setRequestHeader('access_token', 'h63hdkhf-djdudu-mdmd73-msnmsn')
          }

          if (params.postdata != null && params.postdata instanceof FormData == false) {
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
          }

          xhr.send(params.postdata)
        })
      }

      instance.buttons1 = sprite.new("cms_buttons_1.png",8,11)
      instance.buttons2 = sprite.new("cms_buttons_2.png",8,11)
      instance.buttons3 = sprite.new("cms_buttons_3.png",8,11)
      instance.buttons1.onload = loading.advance
      instance.buttons2.onload = loading.advance
      instance.buttons3.onload = loading.advance

      Promise.all( [
        require("sorted_scrollable.js"),
        require("account.js"),
        require("ad.js"),
        require("files.js"),
        require("preview.js"),
        require("options.js"),
        require("login.js"),
        require("contextmenu.js"),
        instance.buttons1.promise,
        instance.buttons2.promise,
        instance.buttons3.promise,
        ]).then(
        function(requires) {

          instance.sorted_scrollable = requires[0]

          instance.accountview = requires[1]
          instance.adview = requires[2]
          instance.filesview = requires[3]
          instance.previewview = requires[4]
          instance.optionsview = requires[5]
          instance.loginview = requires[6]
          instance.contextmenu = requires[7]

          var main = instance.add( object.new() )
          main.alpha = 0
          main.active = false

          var login = instance.add( object.new() )
          var bg = login.add( rectangle.new(instance.menuwidth,instance.menuwidth,{red:1,green:1,blue:1}) )
          bg.drawbackside = true
          bg.alpha = 0.25
          login.alpha = 0
          login.active = false

          login.create = function() {

            if (login.userid != null) {
              login.userid.input.focus()
              return
            }

            var submit = function() {
              var userid = login.userid.input.value()//window.localStorage.getItem("userid")
              var password = login.password.input.value()//window.localStorage.getItem("password")

              login.anim.animate( login.rotate, {y:Math.PI,time:500,ease:animator.inOutQuad,onComplete:
                function() {
                  instance.authenticate(userid,password)
                }
              })
            }

            var useridparameters = {
              placeHolder: 'userid',
              onsubmit: submit
            }

            var userid = login.add( input.new(bg.width(),28,useridparameters) )
            userid.position.y = -40
            userid.input.focus()
            login.userid = userid

            var title = login.add( text.new("userid",12,instance.fontname,{red:1,green:1,blue:1},userid.width(),null,"left") )
            title.alpha = 0.4
            title.position.y = userid.position.y-userid.height()/2-title.height()/2

            var passwordparameters = {
              placeHolder: 'password',
              onsubmit: submit
            }

            var password = login.add( input.new(bg.width(),28,passwordparameters) )
            password.position.y = 20
            login.password = password
            var title = login.add( text.new("password",12,instance.fontname,{red:1,green:1,blue:1},password.width(),null,"left") )
            title.alpha = 0.4
            title.position.y = password.position.y-password.height()/2-title.height()/2


            var gogo = login.add( button.new( instance.buttons2.children[1] ) )
            gogo.scale.x = 0.3
            gogo.scale.y = 0.3
            gogo.position.y = 80
            gogo.click = submit

          }

          var buttons = main.add( object.new() )
          var buttonwidth = 60
          buttons.size.width = buttonwidth*3

          var zoomin = buttons.add( button.new(instance.buttons3.children[19]) )
          zoomin.scale.x = 0.5
          zoomin.scale.y = 0.5
          zoomin.position.x = buttons.width()/2-buttonwidth/2-buttonwidth*2
          zoomin.alpha = 0.25
          zoomin.focus = function() {
            zoomin.anim.animate( zoomin, {alpha:1,time:250,ease:animator.inOutQuad})
          }
          zoomin.defocus = function() {
            zoomin.anim.animate( zoomin, {alpha:0.25,time:250,ease:animator.inOutQuad})
          }
          zoomin.click = function() {
            var value = window.localStorage.getItem("zoomlevel")
            console.log("zoom in",value)
            value = isNaN(value) ? 1 : value

            if (value < 0.5) return
            window.localStorage.setItem("zoomlevel",Number(value) - 0.1)
            location.reload()
          }
          var zoomout = buttons.add( button.new(instance.buttons3.children[21]) )
          zoomout.scale.x = 0.5
          zoomout.scale.y = 0.5
          zoomout.position.x = buttons.width()/2-buttonwidth/2-buttonwidth*1
          zoomout.alpha = 0.25
          zoomout.focus = function() {
            zoomout.anim.animate( zoomout, {alpha:1,time:250,ease:animator.inOutQuad})
          }
          zoomout.defocus = function() {
            zoomout.anim.animate( zoomout, {alpha:0.25,time:250,ease:animator.inOutQuad})
          }
          zoomout.click = function() {
            var value = window.localStorage.getItem("zoomlevel")
            console.log("zoom in",value)
            value = isNaN(value) ? 1 : value
            if (value > 3) return
            window.localStorage.setItem("zoomlevel",Number(value) + 0.1)
            location.reload()
          }
          var logout = buttons.add( button.new(instance.buttons3.children[40]) )
          logout.scale.x = 0.5
          logout.scale.y = 0.5
          logout.position.x = buttons.width()/2-buttonwidth/2-buttonwidth*0
          logout.alpha = 0.25
          logout.focus = function() {
            logout.anim.animate( logout, {alpha:1,time:250,ease:animator.inOutQuad})
          }
          logout.defocus = function() {
            logout.anim.animate( logout, {alpha:0.25,time:250,ease:animator.inOutQuad})
          }
          logout.click = function() {
            location.reload()
          }

          var menu = main.add( object.new() )
          menu.size.width = instance.menuwidth

          var content = main.add( object.new() )
          //var content = main.add( rectangle.new() )
          content.change = function(newcontent) {
            content.anim.animate( content, {alpha:0,time:250,ease:animator.inOutQuad,onComplete:
              function() {
                if ( content.script != null ) content.script.removeSelf()
                content.script = null
                content.children = []
                content.script = content.add(newcontent)
                newcontent.layoutChangedTree()
                content.alpha = 1
                newcontent.alpha = 0
                newcontent.anim.animate( newcontent, {alpha:1,time:250,ease:animator.inOutQuad})
              }
            })
          }
          instance.content = content

          var menuscroll = menu.add( instance.sorted_scrollable.new(instance,"main menu",menu.width(),viewHeight) )
          menuscroll.itemwidth = menu.size.width
          menuscroll.itempad = 2

          var scrollitem = menuscroll.add( object.new("fakeitem",menuscroll.itemwidth,-menuscroll.itempad) )
          var selector = scrollitem.add( rectangle.new(3,instance.menuitemheight,{red:24/255,green:249/255,blue:249/255}) )
          scrollitem.id = 1
          selector.position.x = -scrollitem.width()/2+selector.width()/2

          scrollitem.currentChanged = function() {
            scrollitem.id = menuscroll.current.id-0.01
            console.log(scrollitem.id,menuscroll.current.height())
            selector.anim.animate( selector.size, {height:menuscroll.current.height(),time:250,ease:animator.inOutQuad} )
            selector.anim.animate( selector.position, {y:menuscroll.current.height()/2+menuscroll.itempad/2,time:250,ease:animator.inOutQuad} )
            menuscroll.layoutChangedTree()
          }

          menuscroll.addItem = function(titlestr,valuestr,target) {
            var container = menuscroll.add( focusable.new() )
            container.id = menuscroll.instance.children.length

            container.size.width = this.itemwidth-this.itempad
            container.size.height = instance.menuitemheight

            var bg = container.add( rectangle.new(this.width(),0,{red:1,green:1,blue:1}) )
            //bg.position.x = -bg.width()/4
            bg.alpha = 0
            bg.show = function() {
              bg.anim.stop()
              bg.anim.animate( bg, {alpha:0.25,time:250,ease:animator.outQuad})
            }
            bg.hide = function() {
              bg.anim.stop()
              bg.anim.animate( bg, {alpha:0,time:250,ease:animator.outQuad})
            }
            container.bg = bg

            var textpad = 20
            var textcontainer = container.add( object.new() )
            textcontainer.size.width = container.width()-textpad*2
            textcontainer.size.height = container.height()-textpad*2

            var title = textcontainer.add( text.new(titlestr,12,instance.fontname,{red:1,green:1,blue:1},textcontainer.width(),null,"left") )
            title.alpha = 0.4
            //title.position.x = -textcontainer.width()/2
            title.position.y = -container.height()/2+title.height()/2+textpad/2

            var addValue = function(val) {
              var value = textcontainer.add( text.new(val,28,instance.fontname,{red:1,green:1,blue:1},textcontainer.width(),null,"left") )

              var targetheight = value.height() > 30 ? instance.menuitemheight + value.height()-30 : instance.menuitemheight
              container.size.height = targetheight

              bg.anim.animate( bg.size, {height:targetheight,time:250,ease:animator.outQuad})

              value.alpha = 0
              //value.position.x = -textcontainer.width()/2
              value.position.y = titlestr.length > 0 ? 5 : 0
              value.anim.animate( value, {alpha:1,time:250,ease:animator.inOutQuad})

              title.anim.animate( title.position, {y: -container.height()/2+title.height()/2+textpad/1.5, time:250,ease:animator.outQuad} )

              menuscroll.layoutChangedTree()

              value.change = function(newval) {
                value.anim.animate( value, {alpha:0,time:250,ease:animator.inOutQuad,onComplete:
                  function() {
                    addValue(newval)
                    scrollitem.currentChanged()
                  }
                })
              }
              container.value = value
            }
            addValue(valuestr)

            bg.size.height = container.size.height-this.itempad


            container.focus = function() {
              container.anim.animate( container, {alpha:2,time:250,ease:animator.inOutQuad})
              //bg.anim.animate( bg.position, {x:0,time:250,ease:animator.inOutQuad})
            }
            container.defocus = function() {
              container.anim.animate( container, {alpha:1,time:250,ease:animator.inOutQuad})
              //bg.anim.animate( bg.position, {x:-bg.width()/4,time:250,ease:animator.inOutQuad})
            }
            container.click = function() {
              //this.bringToFront()

              menuscroll.current.bg.show()
              bg.hide()

              menuscroll.current = container

              content.change( target.new(instance) )

              scrollitem.currentChanged()

            }

            return container

          }

          var logo = menuscroll.add( object.new("logo") )
          logo.id = 0
          var bg = logo.add( rectangle.new(0,0,{red:1,green:1,blue:1}) )
          //bg.alpha = 0.0//25
          bg.visible = false
          var img = logo.add( image.new("curlify_logo.png") )
          img.onload = function() {
            var sc = menuscroll.itemwidth / img.width()
            this.scale.x = sc
            this.scale.y = sc

            logo.size.width = img.width()
            logo.size.height = img.height()

            bg.size.width = logo.width()
            bg.size.height = logo.height()

            instance.layoutChangedTree()
          }

          var toggle = logo.add( button.new(instance.buttons3.children[32]))
          toggle.scale.x = 0.5
          toggle.scale.y = 0.5
          toggle.alpha = 0.25
          toggle.position.x = menu.width()/2 + toggle.width()/2
          toggle.click = function() {

            if (menu.size.width > 0) {
              toggle.anim.animate( toggle.rotate, {z:Math.PI,time:500,ease:animator.inOutQuad})
              toggle.anim.animate( toggle, {alpha:1,time:500,ease:animator.inOutQuad})
              menu.anim.animate( menu.position, {x:-viewWidth/2-instance.menuwidth/2,time:500,ease:animator.inOutQuad,onComplete:
                function() {
                  instance.layoutChangedTree()
                }
              })
              menu.size.width = 0
            } else {
              toggle.anim.animate( toggle.rotate, {z:0,time:500,ease:animator.inOutQuad})
              toggle.anim.animate( toggle, {alpha:0.25,time:500,ease:animator.inOutQuad})
              menu.anim.animate( menu.position, {x:-viewWidth/2+instance.menuwidth/2,time:500,ease:animator.inOutQuad,onComplete:
                function() {
                  instance.layoutChangedTree()
                }
              })
              menu.size.width = instance.menuwidth
            }
            
          }

          //menuscroll.user = menuscroll.addItem( "USER", "VESA", "user.js" )
          menuscroll.account = menuscroll.addItem( "ACCOUNT", "", instance.accountview )
          menuscroll.current = menuscroll.account

          /*
          var divider = menuscroll.add( object.new("divider") )
          divider.id = 1000
          divider.size.height = instance.menuitemheight

          var d = divider.add( rectangle.new( menuscroll.itemwidth, 2, {red:1,green:1,blue:1} ) )
          d.alpha = 0.25
          */

          /*menuscroll.options = menuscroll.addItem("", "Options",instance.optionsview)
          menuscroll.options.id = 1001
          menuscroll.options.bg.show()*/

          instance.layoutChanged = function() {
            console.log("layoutChanged cms")

            calculateSize()

            instance.size.width = viewWidth
            instance.size.height = viewHeight

            content.size.width = viewWidth-menu.width()
            content.size.height = viewHeight-logo.height()-menuscroll.itempad

            menu.position.x = -viewWidth/2-instance.menuwidth/2+menu.width()

            content.position.x = menu.width()/2
            content.position.y = viewHeight/2-content.height()/2

            //buttons.size.width = content.width()
            buttons.size.height = logo.height()
            buttons.position.x = viewWidth/2 - buttons.width()/2 - 15
            buttons.position.y = -viewHeight/2 + buttons.height()/2

            //menuscroll.size.width = instance.width()
            //menuscroll.contentsize.width = menuscroll.size.width
            menuscroll.size.height = instance.height()
          }
          instance.layoutChangedTree()

          instance.choseAccount = function(account) {
            instance.account = account
            instance.ad = null

            menuscroll.account.value.change( account.name )

            if ( menuscroll.ad == null ) {
              menuscroll.ad = menuscroll.addItem( "AD", "", instance.adview )
              instance.layoutChangedTree()
            }
            menuscroll.ad.value.change( "" )
            menuscroll.ad.click()

            if( menuscroll.preview != null) {
              menuscroll.preview.removeSelf()
              menuscroll.files.removeSelf()
              menuscroll.preview = null
              menuscroll.files = null
            }

            instance.layoutChangedTree()
              
          }

          instance.choseAd = function(ad) {
            instance.ad = ad
            menuscroll.ad.value.change( ad.name )

            if (menuscroll.preview == null) {
              menuscroll.preview = menuscroll.addItem( "", "Preview", instance.previewview )
              menuscroll.files = menuscroll.addItem( "", "Files", instance.filesview )
              menuscroll.files.bg.show()
              instance.layoutChangedTree()
            }
            menuscroll.preview.click()

          }

          instance.showlogin = function() {
            login.create()
            main.active = false
            main.anim.animate( main, {alpha:0,time:500,ease:animator.inOutQuad})
            loading.anim.animate( loading, {alpha:0,time:500,ease:animator.inOutQuad,onComplete:
              function() {
                login.active = true
                login.anim.animate( login, {alpha:1,time:500,ease:animator.inOutQuad})
              }}
            )
          }
          instance.showmain = function() {
            login.active = false
            login.anim.animate( login, {alpha:0,time:500,ease:animator.inOutQuad})
            loading.anim.animate( loading, {alpha:0,time:500,ease:animator.inOutQuad,onComplete:
              function() {
                menuscroll.account.click()
                login.rotate.y = 0
                main.active = true
                main.anim.animate( main, {alpha:1,time:500,ease:animator.inOutQuad})
              }}
            )
          }

          instance.authenticate = function(userid,password) {
            instance.restRequest({
              method: 'GET',
              url: 'http://curlify.io/api/authenticate.php',
              postdata: 'userid='+userid+"&password="+password,
            }).then( function(response) {
              var cmsJson = JSON.parse(response);
              console.log(response)
              instance.showmain()
            },
            function(e) {
              console.log(e)
              instance.showmain()
            })
          }

          var userid = window.localStorage.getItem("userid")
          var password = window.localStorage.getItem("password")

          if (userid && password) {
            instance.authenticate(userid,password)
          } else {
            instance.showlogin()
          }

        },
        function(e) {
          console.log(e)
        }

      )

      instance.step = function(timedelta) {
        fps.updateFps()
      }

      return instance
    }
  }

})()