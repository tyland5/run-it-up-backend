const express = require('express');
const app = express();
const login = require('../src/login/login');
const post = require('./post/post')

app.use('/login', login);
app.use('/post', post);

app.use(express.static('public'));
app.use("/images", express.static('images'))

app.listen(8080, () => {
    console.log('server listening on port 8080')
})