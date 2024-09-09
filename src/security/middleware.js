// potential security middlewares intercepting incoming requests


function verifyCSRF(req, res, next){
    if(req.headers['x-csrf-token'] === req.session.csrf){
        next()
        return
    }

    res.status(401).send();
}

// middleware for get requests
function checkIfLoggedIn(req, res, next){
    if(req.session.uid){
       next()
    }
    else{
        res.status(401).send()
    }
}

module.exports = {verifyCSRF, checkIfLoggedIn}