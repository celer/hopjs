Okapi = require('okapi');
sqlite = require('sqlite3');

var dialect = new Okapi.SQLiteDialect(new sqlite.Database(":memory:"));


module.exports=dialect;
