const express = require('express')
const router = express.Router()

// need this to access params of incoming post requests. only does stuff when the content-type header matches function
router.use(express.json());


router.post('/checkCredentials', (req, res) => {
    if(req.body.username === "tyler" && req.body.password == "tora"){
        res.status(200).json({response:"good"});
    }
    else{
        res.status(200).json({response:"bad"});
    }
})
  
module.exports = router



