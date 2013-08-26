var http = require('http'),
  https = require('https'),
  express = require('express'),
  app = express(),
  fs = require('fs'),
  search = require('./lib/search'),
  node_config = require("./lib/nodeconfig_devserver"),
  couch_keys = require("./lib/couchkeys_devserver");

//read in the specified filenames as the security key and certificate
node_config.httpsOptions.key = fs.readFileSync(node_config.httpsOptions.key);
node_config.httpsOptions.cert = fs.readFileSync(node_config.httpsOptions.cert);

// var connect = node_config.usersDbConnection.protocol + couch_keys.username + ':' +
//   couch_keys.password + '@' + node_config.usersDbConnection.domain +
//   ':' + node_config.usersDbConnection.port +
//   node_config.usersDbConnection.path;
// var nano = require('nano')(connect);

// configure Express
app.configure(function() {
  app.use(express.favicon());
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  var allowCrossDomain = function(req, res, next) {
    var check = false;
    if (req.headers.origin) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      check = true;
    }
    if (req.headers['access-control-request-method']) {
      res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
      check = true;
    }
    if (req.headers['access-control-request-headers']) {
      res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
      check = true;
    }
    if (check) {
      res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }

    // intercept OPTIONS method
    if (check && req.method == 'OPTIONS') {
      res.send(200);
    } else {
      next();
    }
  };

  app.use(allowCrossDomain);
  app.use(app.router);
});

/*
 * Routes
 */

app.post('/train/lexicon/:pouchname', function(req, res) {

  var pouchname = req.params.pouchname;

  var couchoptions = JSON.parse(JSON.stringify(node_config.corpusOptions));

  couchoptions.path = '/' + pouchname + '/_design/pages/_view/get_datum_fields';
  couchoptions.auth = "public:none"; // Not indexing non-public data couch_keys.username + ':' + couch_keys.password;
  makeJSONRequest(couchoptions, undefined, function(statusCode, result) {

    res.send(result);

    // for (var i = 0; i < result.rows.length; i++) {
    //   (function(index) {

    //     var datumid = result.rows[index].id;
    //     var record = '' + JSON.stringify(result.rows[index].key);
    //     // var cleaned = record.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
    //     var esoptions = {
    //       host: 'lexicondev.lingsync.org',
    //       path: '/' + pouchname + '/datums/' + datumid,
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    //         'Content-Length': record.length,
    //         'Connection': 'Keep-Alive'
    //       }
    //     };

    //     makeJSONRequest(esoptions, record, function(statusCode, results) {
    //       console.log(results);
    //       res.send(statusCode);
    //     });

    //   })(i);

    // }

  });

});

app.post('/search/:pouchname', function(req, res) {

  var pouchname = req.params.pouchname;
  var queryString = req.body.value;
  var queryTokens = search.processQueryString(queryString);
  var elasticsearchTemplateString = search.addQueryTokens(queryTokens);

  var searchoptions = JSON.parse(JSON.stringify(node_config.searchOptions));
  searchoptions.path = '/' + pouchname + '/datums/_search';
  searchoptions.headers =  {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(elasticsearchTemplateString, 'utf8')
  };

  makeJSONRequest(searchoptions, elasticsearchTemplateString, function(statusCode, results) {
    console.log(elasticsearchTemplateString);
    res.send(statusCode, results);
  });

});

function makeJSONRequest(options, data, onResult) {

  var httpOrHttps = http;
  if(options.protocol == "https://"){
    httpOrHttps = https;
  }
  delete options.protocol;
  var req = httpOrHttps.request(options, function(res) {
    var output = '';
    res.setEncoding('utf8');

    res.on('data', function(chunk) {
      output += chunk;
    });

    res.on('end', function() {
      var obj = JSON.parse(output);
      onResult(res.statusCode, obj);
    });
  });

  req.on('error', function(err) {
    console.log('Error searching for ' + JSON.stringify(data));
    console.log(options);
    console.log(err);
    
  });

  if (data) {
    req.write(data, 'utf8');
    req.end();
  } else {
    req.end();
  }

}

//https.createServer(node_config.httpsOptions, app).listen(node_config.httpsOptions.port);
app.listen(node_config.httpsOptions.port);
console.log(new Date() + 'Node+Express server listening on port %d', node_config.httpsOptions.port);
