
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

var app = function() {

    var instance = new object ("application")

    for (var i=1; i <= 75; i++) {
        new function() {
        var rect = instance.add( new rectangle(50,50,{red: Math.random(), green: Math.random(), blue:Math.random()}) )
        rect.identifier = "rectangle "+i
        rect.position.x=getRandom(-screenWidth/2, screenWidth/2)
        rect.position.y=getRandom(-screenHeight/2, screenHeight/2)
        
        rect.spin = function() {
            rect.rotate.z = 0
            rect.anim.animate( rect.rotate, {z:Math.PI*2, time:getRandom(1000,2000), onComplete:
                function() {
                    rect.spin()
                }
            })
        }
        rect.spin()
        }()
    }

    var rect = instance.add( new rectangle(100,100) )
    rect.position.x = screenWidth/2
    
    var logo2 = rect.add( new image("adCanvas-logo.png") )
    logo2.onload = function() {
        logo2.position.x = -logo2.size.width/2
        console.log(logo2.position.x,logo2.size.width)
    }
    
    var logo = instance.add( new image("adCanvas-logo.png") )
    logo.onload = function() {
        console.log(logo.size.width)
        logo.position.x = -screenWidth/2 + logo.size.width/2
    }
    logo.relativePress = function(x,y){
        console.log("press",x,y)
    }
    logo.relativeDrag = function(x,y){
        console.log("drag : ",x,y)
    }
    //var icon = instance.add( new image("icon.png") )

    instance.step = function() {
        fps.updateFps()
    }

    return instance
}
