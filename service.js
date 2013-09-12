var http = require('http'),
  https = require('https'),
  express = require('express'),
  app = express(),
  fs = require('fs'),
  exec = require('child_process').exec,
  search = require('./lib/search'),
  param = require('./node_modules/swagger-node-express/Common/node/paramTypes.js'),

  node_config = require("./lib/nodeconfig_devserver"),
  couch_keys = require("./lib/couchkeys_devserver");

//read in the specified filenames as the security key and certificate
node_config.httpsOptions.key = fs.readFileSync(node_config.httpsOptions.key);
node_config.httpsOptions.cert = fs.readFileSync(node_config.httpsOptions.cert);

// configure Express
app.configure(function() {
  app.use(express.favicon());
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
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

app.post('/farley/inuktitut/:word', function(req, res) {

  var searchTerm = encodeURIComponent(req.params.word);

  var command = './lib/uqailaut.sh ' + searchTerm;
  var child = exec(command, function(err, stdout, stderr) {
    if (err) {
      throw err;
    } else {
      console.log('Analyzed: ' + searchTerm);
      console.log('sent results: ' + stdout);

      var results = stdout.split('\n');
      results.pop();

      res.send({
        'output': results
      });
    }
  });

});

app.all('/segment/inuktitut/:word', function(req, res) {

  var searchTerm = encodeURIComponent(req.params.word);
  var allomorphs = [], morphemes = [], glosses = [];

  var command = './lib/uqailaut.sh ' + searchTerm;
  var child = exec(command, function(err, stdout, stderr) {
    if (err) {
      throw err;
    } else {
      console.log('Analyzed: ' + searchTerm);

      var results = stdout.split('\n');
      results.pop();

      if (results.length === 0) {

        allomorphs.push(searchTerm);
        morphemes.push(searchTerm);
        glosses.push(searchTerm);

      } else {

        var aReg = new RegExp(/([^{:\/}]+)(?=\:)/g),
            mReg = new RegExp(/([^{:\/}]+)(?=\/)/g),
            gReg = new RegExp(/([^{:\/}]+)(?=\})/g);

        for (var line in results) {
          var aMatch = results[line].match(aReg).join('-'),
              mMatch = results[line].match(mReg).join('-'),
              gMatch = results[line].replace(/-/g, '.').match(gReg).join('-');

          if (allomorphs.indexOf(aMatch) === -1) allomorphs.push(aMatch);
          if (morphemes.indexOf(mMatch) === -1) morphemes.push(mMatch);
          if (glosses.indexOf(gMatch) === -1) glosses.push(gMatch);
        }
        var output = {allomorphs: allomorphs, morphemes: morphemes, glosses: glosses};
        console.log('Sent results: \n' + JSON.stringify(output));
        res.send(output);
      }
    }
  });
});

app.post('/train/lexicon/:pouchname', function(req, res) {

  var pouchname = req.params.pouchname;
  var couchoptions = JSON.parse(JSON.stringify(node_config.corpusOptions));
  couchoptions.path = '/' + pouchname + '/_design/pages/_view/get_datum_fields';
  couchoptions.auth = 'public:none'; // Not indexing non-public data couch_keys.username + ':' + couch_keys.password;

  makeJSONRequest(couchoptions, undefined, function(statusCode, result) {
    res.send(result);
  });

});

app.post('/search/:pouchname', function(req, res) {

  var pouchname = req.params.pouchname;
  var queryString = req.body.value;
  var queryTokens = search.processQueryString(queryString);
  var elasticsearchTemplateString = search.addQueryTokens(queryTokens);

  var searchoptions = JSON.parse(JSON.stringify(node_config.searchOptions));
  searchoptions.path = '/' + pouchname + '/datums/_search';
  searchoptions.headers = {
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
  if (options.protocol == 'https://') {
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
