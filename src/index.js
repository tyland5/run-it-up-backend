const express = require('express');
const app = express();
const login = require('../src/login/login');
const post = require('./post/post')
const user = require('./user/user')
var session = require('express-session')

// The order of middleware loading is important: middleware functions that are loaded first are also executed first.
app.use(session({
    secret: 'luqkay',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge:604800000  } // requires https connection, expires 1 week
}))

app.use(express.static('public'));
app.use("/images", express.static('images'))

app.use('/login', login);
app.use('/post', post);
app.use('/user', user)


app.listen(8080, () => {
    console.log('server listening on port 8080')
})