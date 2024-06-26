const getDBConn = require('../db/dbconn')
const express = require('express')
const nodemailer = require('nodemailer');
const crypto = require('crypto')
require('dotenv').config()

const router = express.Router()

// need this to access params of incoming post requests. only does stuff when the content-type header matches function
router.use(express.json());


router.post('/checkCredentials', async (req, res) => {
    const dbconn = await getDBConn()
    
    try{
        const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
        const values = [req.body.username, crypto.createHash('md5').update(req.body.password).digest("hex")];
        const [result] = await dbconn.execute(sql, values)

        if(result.length >= 1){
            res.status(200).json({response:"good"});
        }
        else{
            res.status(200).json({response:"bad"});
        }
    }
    catch (e){
        console.log(e)
        res.status(500).json({response:"bad"});
    }

})

router.post('/register', async (req, res) => {
    /*
    var transporter = nodemailer.createTransport({
        service: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.COMPANY_EMAIL,
          pass: 'yoju pmoi jzmt njvu'
        }
    });
    */

    // still doesnt work, need to allow for less secure apps on google
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true,
        logger: true,
        debug: true,
        secureConnection: false,
        auth: {
          user: process.env.COMPANY_EMAIL,
          pass: process.env.NODEMAILER_PASS
        },
        tls:{
            rejectUnauthorized: true
        }
    });

    const info = await transporter.sendMail({
        from: process.env.COMPANY_EMAIL,
        to: req.body.email, // list of receivers
        subject: "Confirmation Code for Registration", // Subject line
        text: "Dummy conf code", // plain text body
      });

      console.log("email sent")
      res.status(200).json({response:"good"});
      
})

module.exports = router



