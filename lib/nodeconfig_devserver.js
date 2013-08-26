exports.httpsOptions = {
  key: 'fielddb_debug.key',
  cert: 'fielddb_debug.crt',
  port: "3185",
  host: "lexicondev.lingsync.org",
  method: 'GET'
};
exports.corpusOptions = {
  protocol : 'https://',
  host: 'corpusdev.lingsync.org',
  defaultPort: '443',
  mehod: 'GET',
  path : '',
  headers: {
      'Content-Type': 'application/json'
  }
};
exports.searchOptions = {
    protocol: 'http://',
    defaultPort: '80',
    host: 'searchdev.lingsync.org',
    path: '/default/datums/_search',
    method: 'POST',
    headers: ''
};
