Okapi = require('okapi');
sqlite = require('sqlite3');

sqlite.verbose();

var dialect = new Okapi.SQLiteDialect(new sqlite.Database(":memory:"));

Okapi.log=true;

module.exports=dialect;
