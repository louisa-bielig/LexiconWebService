exports.port = "3185";
exports.httpsOptions = {
  key: 'fielddb_debug.key',
  cert: 'fielddb_debug.crt',
  port: "3185",
  host: "localhost",
  method: 'GET'
};
exports.usersDbConnection = {
  protocol: 'http://',
  domain: 'localhost',
  port: '5984',
  dbname: 'zfielddbuserscouch',
  path: ''
};
exports.searchOptions = {
    host: 'localhost:3195',
    path: '/default/datums/_search',
    method: 'POST',
    headers: ""
};
exports.usersDBExternalDomainName = 'localhost';
