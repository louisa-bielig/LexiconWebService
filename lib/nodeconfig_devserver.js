exports.port = "3185";
exports.httpsOptions = {
  key: 'fielddb_debug.key',
  cert: 'fielddb_debug.crt',
  port: "3185",
  host: "lexicondev.lingsync.org",
  method: 'GET'
};
exports.usersDbConnection = {
  protocol: 'https://',
  domain: 'corpusdev.lingsync.org',
  port: '443',
  dbname: 'zfielddbuserscouch',
  path: ''
};
exports.usersDBExternalDomainName = 'corpusdev.lingsync.org';
