
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function createCORSRequest(method, url) {
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

  }
  return xhr;
}


var cmsloader = function() {

    var instance = new object ("cms loader")

    instance.feeds = []
    //instance.feeds.push( {url:"http://api.curlify.com/api/dev/app/d5cd526c52888fd2e0c8d88eaf79117f/ads",filename:"vesa2dev.json"} )
    instance.feeds.push( {url:"server/d5cd526c52888fd2e0c8d88eaf79117f.ads",filename:"vesa2dev.json"} )
    instance.feed = instance.feeds[0]

    instance.updatefeed = function(feed) {
        if (feed==null) feed = instance.feed
        if (feed.url == null || feed.filename == null) {
          console.log("ERROR: feed has no url or filename",feed.url,feed.filename)
          if (failedfunction != null) failedfunction()
          return
        }

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

cmsloader.new = function() {
    return new cmsloader()
}
