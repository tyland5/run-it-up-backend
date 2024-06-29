const mysql = require('mysql2/promise');
require('dotenv').config()

async function getDBConn (){
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD
    });
    return conn
};

module.exports= getDBConn