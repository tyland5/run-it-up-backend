const express = require('express');
const app = express();
const login = require('../src/login/login');
const post = require('./post/post')
const user = require('./user/user')
var session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config()

const options = {
	host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    createDatabaseTable: true,
	checkExpirationInterval: 3600000, // How frequently expired sessions will be cleared; milliseconds. every hour
};

const sessionStore = new MySQLStore(options); 

// The order of middleware loading is important: middleware functions that are loaded first are also executed first.
app.use(session({
    secret: 'luqkay', // obv will hide this in future. just a troll secret
    resave: false,
    saveUninitialized: false, // we don't store anything about the user, or we don't create a cookie for the user until we actually store some data on them
    store: sessionStore, // prevents losing login when restarting backend, and helps with storage
    cookie: { secure: false, maxAge:604800000  } // doesnt require https connection, expires 1 week
}))

app.use(express.static('public'));
app.use("/images", express.static('images'))

app.use('/login', login);
app.use('/post', post);
app.use('/user', user)


app.listen(8080, () => {
    console.log('server listening on port 8080')
})