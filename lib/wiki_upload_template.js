//  getToken('Main Page', processResults);

var getToken = function(pageTitle, callback) {
  var url = 'http://wiki.lingsync.org/api.php?action=query&titles=' + pageTitle + '&prop=info&intoken=edit&format=json';
  makeRequest('GET', url, null, callback);
};

var processResults = function(results) {
  var resultsObj = JSON.parse(results);
  var token = resultsObj.query.pages[Object.keys(resultsObj.query.pages)[0]].edittoken;

  editPage(token);
};

var editPage = function(token) {

  // var roots = [window.roots[1], window.roots[2]];

  for (var i in roots) {

    var wikistring =
      "===''" + roots[i].morpheme + "''=== " + "\n" + "'''''" + roots[i].type + ".'''''" + "\n" + "\n" + "''dialect: ''" + roots[i].dialect + " ''variant: ''" + roots[i].variant + " ''plural: ''" + roots[i].plural + "\n" + "\n" + "*transitivity: " + roots[i].transitivity + "\n" + "*transSuffix: " + roots[i].transSuffix + "\n" + "*intransSuffix: " + roots[i].intransSuffix + "\n" + "\n" +
      "====Definitions====" + "\n" + "*En: " + roots[i].engMean + "\n" + "*Fr: " + roots[i].freMean + "\n" + "\n" +
      "====Other Information====" + "\n" + "*key: " + roots[i].key + "\n" + "*nature: " + roots[i].nature + "\n" + "*number: " + roots[i].number + "\n" + "*compositionRoot: " + roots[i].compositionRoot + "\n" + "*antipassive: " + roots[i].antipassive + "\n" + "*source: " + roots[i].source + "\n" + "*cf: " + roots[i].cf + "\n" + "\n" +
      "====Source====" + "\n" + "[http://inuktitutcomputing.ca/Download/info.php The UQAILAUT Project]";

    var data = {};
    data.format = 'json';
    data.action = 'edit';
    data.summary = roots[i].morpheme;
    data.title = roots[i].morpheme;
    data.text = wikistring;
    // data.basetimestamp = '2009-06-22T13:52:41ZZ';
    data.contentformat = 'text/x-wiki';
    data.token = token;

    var url = 'http://wiki.lingsync.org/api.php';

    makeRequest('POST', url, data, function(arg) {
      console.log('msg: ' + arg);
    });

  }

};

var makeRequest = function(reqType, url, data, callback) {
  var xhrq = new XMLHttpRequest();
  var context = this;
  var multipart = '';
  var sep = '----------------';

  xhrq.open(reqType, url, true);

  if (reqType === 'POST' || 'PUT') {
    var boundary = Math.random().toString().substr(2);
    xhrq.setRequestHeader('Content-Type', 'multipart/form-data; charset=utf-8; boundary=' + sep + boundary);

    for (var key in data) {
      if (key == 'text') {
        multipart += '--' + sep + boundary +
        '\r\nContent-Disposition: form-data; name=' + key +
        '\r\nContent-Type: text/x-wiki' +
        '\r\n\r\n' + data[key] + '\r\n';
      } else {
        multipart += '--' + sep + boundary +
        '\r\nContent-Disposition: form-data; name=' + key +
        '\r\nContent-Type: text/plain' +
        '\r\n\r\n' + data[key] + '\r\n';
      }
    }
    multipart += '--' + sep + boundary + '--\r\n';
    xhrq.send(multipart);
  } else {
    xhrq.send(null);
  }

  xhrq.onreadystatechange = function() {
    if (xhrq.readyState === 4) {
      if (xhrq.status === 200) {
        callback(xhrq.responseText);
      } else {
        callback(xhrq.responseText);
      }
    } else {
      //still processing
    }
  };
};
