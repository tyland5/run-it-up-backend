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



router.post('/checkUsernameEmail', async(req, res)=>{
    const valid = {username: true, email: true};
    const dbconn = await getDBConn();

    try{
        const sql = 'SELECT * FROM users WHERE username = ?';
        const values = [req.body.username];
        const [result] = await dbconn.execute(sql, values)

        if(result.length > 0){
            valid.username = false
        }
    }
    catch (e){
        console.log(e)
        res.status(500).json({response:"bad"});
        return
    }

    try{
        const sql = 'SELECT * FROM users WHERE email = ?';
        const values = [req.body.email];
        const [result] = await dbconn.execute(sql, values)

        if(result.length > 0){
            valid.email = false
        }
    }
    catch (e){
        console.log(e)
        res.status(500).json({response:"bad"});
        return
    }
    
    res.status(200).json({response:'good', validUser: valid.username, validEmail: valid.email})
      
})



router.post('/confirmEmail', async (req, res) => {   

    const confirmationCode = crypto.randomBytes(3).toString('hex');
    
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
        text: confirmationCode, // plain text body
    });
    
    console.log("email sent")
    res.status(200).json({response:"good", confCode: confirmationCode});
})



router.post('/register', async (req, res)=>{
    const account = req.body.accountDetails
    const dbconn = await getDBConn()

    try{
        const sql = 'INSERT INTO users (username, fname, lname, email, password) VALUES (?, ?, ?, ?, ?);';
        const values = [account.username, account.fname, account.lname, account.email, crypto.createHash('md5').update(account.password).digest("hex")];
        const [result] = await dbconn.execute(sql, values)

        res.status(200).json({response:"good"}); // should generate token here too
    }
    catch (e){
        console.log(e)
        res.status(500).json({response:"bad"});
    }
})

module.exports = router



