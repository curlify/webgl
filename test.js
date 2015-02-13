
var curlify = (function(){

  var addScript = function(url) {
    console.log("addScript",url)
    var xhr = new XMLHttpRequest();

    if ("withCredentials" in xhr) {

      // Check if the XMLHttpRequest object has a "withCredentials" property.
      // "withCredentials" only exists on XMLHTTPRequest2 objects.
      xhr.open("GET", url, true);
      xhr.onload = function(){
        console.log("addScript loaded",url)
        eval(xhr.responseText)
      }
      xhr.onerror = function(){
        console.log("ERROR: addScript failed",url)
      }
      xhr.onreadystatechange=function(){
        console.log("statechanged",xhr.readyState,xhr.status,xhr.responseText)
        if (xhr.readyState==4 && xhr.status==200) {
          console.log("addScript loaded",url)
          eval(xhr.responseText)
        }
      }

    } else if (typeof XDomainRequest != "undefined") {

      // Otherwise, check if XDomainRequest.
      // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
      xhr = new XDomainRequest();
      xhr.onload = function(){
        console.log("addScript loaded",url)
        eval(xhr.responseText)
      }
      xhr.onerror = function(){
        console.log("ERROR: addScript failed",url)
      }
      xhr.open("GET", url);

    } else {

      // Otherwise, CORS is not supported by the browser.
      xhr = null;

    }
    return xhr;
  }
  
  return {
    start : function(parameters) {
      addScript("https://api.curlify.com/api/dev/app/76728cee445d6dc8d3979d8af7b48a47/ads")
      addScript("http://curlify.io/dev/jszip.min.js")
      addScript("http://curlify.io/dev/jszip-utils.min.js")
      addScript("http://curlify.io/dev/glMatrix.min.js")
    }
  }
})()
