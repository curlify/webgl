
var jsonfile = {
  json : null,
  open : function(filename) {
    var rv = {}
    if (zip != null) {
      var zipEntry = zip.file(filename)
      if (zipEntry != null) rv = JSON.parse(zipEntry.asText())
    } else {

    }
    this.json = rv
    return this
  },
}

