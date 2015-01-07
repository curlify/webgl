
var app = function() {

    var instance = new object ("application")
    instance.position.x = 50
    instance.rotate.x = 0.95
    instance.scale.x = 2

    var testrectangle = new rectangle(50,50)
    testrectangle.position.x = 50
    testrectangle.rotate.z = -0.25
    testrectangle.scale.y = 0.5
    instance.add( testrectangle )

    instance.anim.animate( instance.position, {x:0, time:2500, ease:animator.inOutQuad, onComplete:
      function() {
        console.log("all done here")
      }
    })

    return instance
}
