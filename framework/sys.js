
sys = {}

sys.timestamp = function() {
  return new Date().getTime();
}

sys.ismobile = {

    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
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
}
