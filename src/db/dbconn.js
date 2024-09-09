const mysql = require('mysql2/promise');
require('dotenv').config()


// Create the db connection pool.
// The pool does not create all connections upfront but creates them on demand until the connection limit is reached
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    connectionLimit: 10,
    // max idle connections, the default value is the same as `connectionLimit`
    // idle connections timeout, in milliseconds, the default value 60000
    // by default wait for connection and unlimited queue
  });

module.exports= {pool}