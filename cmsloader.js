
(function() {

  var object = curlify.require("object")

  console.log("initialize cmsloader")

  return {
    new : function(feeds) {

      var instance = object.new("cms loader")

      console.log("new instance of cmsloader")

      instance.feeds = feeds
      instance.feed = instance.feeds[0]

      instance.updatefeed = function(feed) {
        if (feed==null) feed = instance.feed
        if (feed.url == null || feed.filename == null) {
          console.log("ERROR: feed has no url or filename",feed.url,feed.filename)
          if (failedfunction != null) failedfunction()
          return
        }
        
        curlify.createCORSRequest('GET', feed.url).then(function(response){
          var cmsJson = JSON.parse(response);
          if (instance.onload != null) instance.onload(cmsJson)
        },function(error){
          if (instance.onerror != null) instance.onerror()
        })
        

      }

      return instance
    }

  }

})()
