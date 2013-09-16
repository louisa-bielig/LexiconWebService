/**
 * Process the given string into an array of tokens where each token is
 * either a search criteria or an operator (AND or OR). Also makes each
 * search criteria token lowercase, so that searches will be case-
 * insensitive.
 *
 * @param {String} queryString The string to tokenize.
 *
 * @return {String} The tokenized string.
 */
var processQueryString = function(queryString) {
  // Split on spaces
  var queryArray = queryString.split(' ');

  // Create an array of tokens out of the query string where each token is
  // either a search criteria or an operator (AND or OR).
  var queryTokens = [];
  var currentString = '';
  for (var i in queryArray) {
    var currentItem = queryArray[i].trim();
    if (currentItem.length <= 0) {
      break;
    } else if ((currentItem == 'AND') || (currentItem == 'OR')) {
      queryTokens.push(currentString);
      queryTokens.push(currentItem);
      currentString = '';
    } else if (currentString) {
      /* toLowerCase introduces a bug in search where camel case fields lose their capitals, then can't be matched with fields in the map reduce results */
      currentString = currentString + ' ' + currentItem; //.toLowerCase();
    } else {
      currentString = currentItem; //.toLowerCase();
    }
  }
  queryTokens.push(currentString);

  return queryTokens;
};

var addQueryTokens = function(queryTokens, fuzzy) {

  // hard-coded to fuzzy = true for Claire
  var fuzzy = true;

  if (!fuzzy) {
    var elasticsearchTemplate = {
      'query': {
        'bool': {
          'must': [],
          'must_not': [],
          'should': []
        }
      },
      'from': 0,
      'size': 50,
      'sort': [],
      'facets': {}
    };

    for (var token in queryTokens) {
      var pieces = queryTokens[token].split(':');
      if (pieces.length < 2)
        continue;

      var field = 'datums.' + pieces[0];
      var term = {};
      term[field] = pieces[1];

      elasticsearchTemplate.query.bool.must.push({
        term: term
      });
    }

    return JSON.stringify(elasticsearchTemplate);

  }

  if (fuzzy) {
    var elasticsearchFuzzyTemplate = {
      'query': {
        'fuzzy': {
          // 'morphemes': {
            // 'value': 'chi'
            // 'boost': 1.0,
            // 'min_similarity': 0.5,
            // 'prefix_length': 0
          // }
        }
      },
      'from': 0,
      'size': 50,
      'sort': [],
      'facets': {}
    };

    for (var token in queryTokens) {
      var pieces = queryTokens[token].split(':');
      if (pieces.length < 2)
        continue;

      var field = pieces[0];
      var term = pieces[1];

      elasticsearchFuzzyTemplate.query.fuzzy[field] = {'value': term};
    }

    console.log(JSON.stringify(elasticsearchFuzzyTemplate));
    return JSON.stringify(elasticsearchFuzzyTemplate);
  }


};

module.exports.processQueryString = processQueryString;
module.exports.addQueryTokens = addQueryTokens;
