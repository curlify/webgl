
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

var app = function() {

    var instance = new object ("application")

    for (var i=1; i <= 50; i++) {
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

    instance.add( new image("adCanvas-logo.png") )

    instance.step = function() {
        fps.updateFps()
    }

    return instance
}
