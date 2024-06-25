const express = require('express');
const app = express();
const login = require('../src/login/login');


app.use('/login', login);

app.listen(8080, () => {
    console.log('server listening on port 8080')
})