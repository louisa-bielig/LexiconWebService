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
exports.usersDBExternalDomainName = 'localhost';
