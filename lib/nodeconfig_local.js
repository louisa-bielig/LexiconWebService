exports.httpsOptions = {
  key: 'fielddb_debug.key',
  cert: 'fielddb_debug.crt',
  port: "3185",
  host: "localhost",
  method: 'GET'
};
exports.corpusOptions = {
  protocol : 'http://',
  host: 'localhost',
  defaultPort: '5984',
  mehod: 'GET',
  path : '',
  headers: {
      'Content-Type': 'application/json'
  }
};
exports.searchOptions = {
    protocol: 'http://',
    defaultPort: '3195',
    host: 'localhost',
    path: '/default/datums/_search',
    method: 'POST',
    headers: ''
};
