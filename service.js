var https = require('https'),
  express = require('express'),
  app = express(),
  fs = require('fs'),
  node_config = require("./lib/nodeconfig_local"),
  couch_keys = require("./lib/couchkeys_local");

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
  app.use(app.router);
});

/*
 * Routes
 */

app.all('/train/*', function(req, res, next) {
  // console.log(req);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, Authorization, Content-Type, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  return next();
});

app.all('/train/*', function(req, res, next) {
  if (req.method.toLowerCase() !== 'options') {
    return next();
  }
  return res.send(204);
});

app.post('/train/lexicon/:pouchname', function(req, res) {

  var pouchname = req.params.pouchname;

  var couchoptions = {
    host: '',
    path: '/' + pouchname + '/_design/pages/_view/get_datum_fields',
    auth: couch_keys.username + ':' + couch_keys.password,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  makeJSONRequest(couchoptions, undefined, function(statusCode, result) {

    for (var i = 0; i < result.rows.length; i++) {
      (function(index) {

        var datumid = result.rows[index].id;
        var record = '' + JSON.stringify(result.rows[index].key);
        // var cleaned = record.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
        var esoptions = {
          host: '',
          path: '/' + pouchname + '/datums/' + datumid,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-16',
            'Content-Length': record.length,
            'Connection': 'Keep-Alive',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip,deflate,sdch',
            'Accept-Language': 'en-US,en;q=0.8'
          }
        };

        makeJSONRequest(esoptions, record, function(statusCode, results) {
          console.log(results);
          res.send(statusCode);
        });
      })(i);

    }

  });

});

function makeJSONRequest(options, data, onResult) {

  var req = https.request(options, function(res) {
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
    console.log(err);
  });

  if (data) {
    req.end(data, 'utf8');
  } else {
    req.end();
  }

}

https.createServer(node_config.httpsOptions, app).listen(node_config.port);
console.log(new Date() + 'Node+Express server listening on port %d', node_config.port);
