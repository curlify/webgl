
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

var app = function() {

    var instance = new object ("application")

    for (var i=1; i <= 10; i++) {
        var rect = instance.add( new rectangle(50,50,{red: Math.random(), green: Math.random(), blue:Math.random()}) )
        rect.identifier = "rectangle "+i
        rect.position.x=getRandom(-screenWidth/2, screenWidth/2)
        rect.position.y=getRandom(-screenHeight/2, screenHeight/2)
        
        rect.spin = function() {
            console.log("spin "+this.identifier)
            rect.rotate.z = 0
            rect.anim.animate( rect.rotate, {z:200, time:getRandom(100000,200000), onComplete:
                function() {
                    console.log("yes, done "+this.identifier+" : "+rect.rotate.z+" : "+instance.children.length)
                    //rect.spin()

                    /*for (n=0;n <instance.children.length;n++) {
                        console.log(instance.children[n].rotate.z)
                    }*/
                }
            })
        }
        rect.spin()
    }

    instance.add( new image("adCanvas-logo.png") )

    instance.step = function() {
        fps.updateFps()
    }

    return instance
}
