var http = require('http'),
  https = require('https'),
  express = require('express'),
  app = express(),
  fs = require('fs'),
  exec = require('child_process').exec,
  search = require('./lib/search'),
  node_config = require("./lib/nodeconfig_devserver"),
  couch_keys = require("./lib/couchkeys_devserver");

//read in the specified filenames as the security key and certificate
node_config.httpsOptions.key = fs.readFileSync(node_config.httpsOptions.key);
node_config.httpsOptions.cert = fs.readFileSync(node_config.httpsOptions.cert);

// configure Express
app.configure(function() {
  app.use(express.favicon());
  app.use(express.logger());
  app.use(express.static(__dirname + '/../FieldDBGlosser/samples/vanilla'));
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

app.all('/farley/inuktitut/:word', function(req, res) {

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

app.all('/analysisbytierbyword/inuktitut/:word', function(req, res) {
  analyzeInuktitutByTierByWord(req, res, 'all');
});

app.all('/allomorphs/inuktitut/:word', function(req, res) {
  analyzeInuktitutByTierByWord(req, res, 'allomorphs');
});

app.all('/morphemes/inuktitut/:word', function(req, res) {
  analyzeInuktitutByTierByWord(req, res, 'morphemes');
});

app.all('/morphosyntacticcategories/inuktitut/:word', function(req, res) {
  analyzeInuktitutByTierByWord(req, res, 'morphosyntacticcategories');
});

app.all('/gloss/inuktitut/:word', function(req, res) {
  analyzeInuktitutByTierByWord(req, res, 'gloss');
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
  if(!queryString){
    res.send("400", []);
    return;
  }
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

function analyzeInuktitutByTierByWord(req, res, returnTier) {
  var searchTerm = encodeURIComponent(req.params.word).split('%20');
  var allomorphs = {}, morphemes = {}, glosses = {};
  farley = {};
  var submittedTerms = searchTerm.length;
  var processedTerms = 0;

  for (var word in searchTerm) {
    allomorphs[searchTerm[word]] = [];
    morphemes[searchTerm[word]] = [];
    glosses[searchTerm[word]] = [];
  }

  for (var i = 0; i < submittedTerms; i++) {

    (function(index) {
      var currentWord = searchTerm[index];
      var command = './lib/uqailaut.sh ' + currentWord;
      var child = exec(command, function(err, stdout, stderr) {
        if (err) {
          throw err;
        } else {
          console.log('Analyzed: ' + currentWord);

          var results = stdout.split('\n');
          results.pop();
          farley[currentWord] = results;

          if (results.length === 0) {

            allomorphs[currentWord].push(currentWord);
            morphemes[currentWord].push(currentWord);
            glosses[currentWord].push(currentWord);

            processedTerms++;
            if (processedTerms == submittedTerms) {
              var output = filterOutput({
                analysisByTierByWord: {
                  allomorphs: allomorphs,
                  morphemes: morphemes,
                  glosses: glosses
                },
                farley: farley
              }, returnTier);
              console.log('Sent results: \n' + JSON.stringify(output));
              res.send(output);
            }

          } else {

            var aReg = new RegExp(/([^{:\/}]+)(?=\:)/g),
              mReg = new RegExp(/([^{:\/}]+)(?=\/)/g),
              gReg = new RegExp(/([^{:\/}]+)(?=\})/g);

            for (var line in results) {
              var aMatch = results[line].match(aReg).join('-'),
                mMatch = results[line].match(mReg).join('-'),
                gMatch = results[line].replace(/-/g, '.').match(gReg).join('-');

              if (allomorphs[currentWord].indexOf(aMatch) === -1) allomorphs[currentWord].push(aMatch);
              if (morphemes[currentWord].indexOf(mMatch) === -1) morphemes[currentWord].push(mMatch);
              if (glosses[currentWord].indexOf(gMatch) === -1) glosses[currentWord].push(gMatch);

            }
            processedTerms++;
            if (processedTerms == submittedTerms) {
              var output = filterOutput({
                analysisByTierByWord: {
                  allomorphs: allomorphs,
                  morphemes: morphemes,
                  glosses: glosses
                },
                farley: farley
              }, returnTier);
              console.log('Sent results: \n' + JSON.stringify(output));
              res.send(output);
            }
          }
        }
      });
    })(i);
  }
}

function filterOutput(output, returnTier) {

  switch (returnTier) {
    case 'all':
      return output;
      break;
    case 'allomorphs':
      return output.analysisByTierByWord.allomorphs;
      break;
    case 'morphemes':
      return output.analysisByTierByWord.morphemes;
      break;
    case 'gloss':
      return output.analysisByTierByWord.glosses;
      break;
    case 'morphosyntacticcategories':
      return output.analysisByTierByWord.glosses;
      break;
  }

}

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
