
(function() {

  var curScript = document.currentScript || document._currentScript;

  var curlify = curScript.curlify

  var jsonfile = (function() {

    return {
      json : null,
      open : function(filename) {

        var zipfile = curlify.localVars.zipfile

        var rv = {}
        if (zipfile != null) {
          var zipEntry = zipfile.file(filename)
          if (zipEntry != null) rv = JSON.parse(zipEntry.asText())
        } else {

        }
        this.json = rv
        return this
      },
    }

  })()

  curlify.module("jsonfile",jsonfile)

})()
