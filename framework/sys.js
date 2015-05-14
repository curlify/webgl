
(function() {
  var curScript = document.currentScript || document._currentScript;

  var curlify = curScript.curlify
  
  var sys = (function(){

    console.log("initialize sys module")

    return {
      timestamp : function() {
        return Date.now();
      },

      ismobile : {
        Android: function() {
          return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function() {
          return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function() {
          return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        FireFox: function() {
          return navigator.userAgent.match(/Firefox/i)
        }, 
        Opera: function() {
          return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
          return navigator.userAgent.match(/IEMobile/i);
        },
        any: function() {
          return (sys.ismobile.Android() || sys.ismobile.BlackBerry() || sys.ismobile.iOS() || sys.ismobile.Opera() || sys.ismobile.Windows());
        }
      },

    }

  })()

  curlify.module("sys",sys)
})()


