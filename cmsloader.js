

var cmsloader = function(feeds) {

    var instance = new object ("cms loader")

    instance.feeds = feeds
    instance.feed = instance.feeds[0]

    instance.updatefeed = function(feed) {
        if (feed==null) feed = instance.feed
        if (feed.url == null || feed.filename == null) {
          console.log("ERROR: feed has no url or filename",feed.url,feed.filename)
          if (failedfunction != null) failedfunction()
          return
        }

        console.log("updatefeed",feed.url)
        feed.request = createCORSRequest('GET', feed.url);
        if (!feed.request) {
          throw new Error('CORS not supported');
        }

        feed.request.onload = function() {
            console.log("feed.request.onload")
            var cmsJson = JSON.parse(this.responseText);
            if (instance.onload != null) instance.onload(cmsJson)
        }
        feed.request.onerror = function() {
            console.log("feed.request.onerror")
            if (instance.onerror != null) instance.onerror()
        }
        feed.request.send()


    }

    return instance
}

cmsloader.new = function(feeds) {
    return new cmsloader(feeds)
}
