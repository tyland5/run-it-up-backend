const express = require('express');
const app = express();
const login = require('../src/login/login');

app.use('/login', login);

app.use(express.static('public'));
app.use("/images", express.static('images'))

app.listen(8080, () => {
    console.log('server listening on port 8080')
})