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
        dbconn.destroy()

        if(result.length >= 1){
            // refresh the session
            req.session.touch()
            
            // this adds additional information to the session. not the browser cookie, which only holds the encrypted session id
            req.session.uid = result[0].uid
            const csrf = crypto.randomBytes(8).toString('hex'); // 16 character csrf string
            req.session.csrf = csrf

            res.status(200).json({response:"good", csrfToken: csrf, uid: result[0].uid});
        }
        else{
            res.status(200).json({response:"bad"});
        }
    }
    catch (e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
    }

})

router.get('/checkIfLoggedIn', (req, res) =>{
    if(req.session.uid){
        res.status(200).send()
    }
    else{
        res.status(401).send()
    }
})

router.get('/checkUsernameEmail', async(req, res)=>{
    const valid = {username: true, email: true};
    const dbconn = await getDBConn();
   
    try{
        const sql = 'SELECT * FROM users WHERE username = ?';
        const values = [req.query.username];
        const [result] = await dbconn.execute(sql, values)
    
        if(result.length > 0){
            valid.username = false
        }
    }
    catch (e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
        return
    }

    try{
        const sql = 'SELECT * FROM users WHERE email = ?';
        const values = [req.query.email];
        const [result] = await dbconn.execute(sql, values)
       
        dbconn.destroy()
        if(result.length > 0){
            valid.email = false
        }
    }
    catch (e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
        return
    }
    
    res.status(200).json({response:'good', validUser: valid.username, validEmail: valid.email})
      
})

router.get('/checkEmail', async(req, res)=>{
    const dbconn = await getDBConn();
    let validEmail = false

    try{
        const sql = 'SELECT * FROM users WHERE email = ?';
        const values = [req.query.email];
        const [result] = await dbconn.execute(sql, values)

        if(result.length > 0){
            validEmail = true
        }
    }
    catch (e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
        return
    }

    dbconn.destroy()
    res.status(200).json({response:'good', validEmail: validEmail})
})

router.get('/confirmEmail', async (req, res) => {   

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
        to: req.query.email, // list of receivers
        subject: "Confirmation Code for Run It Up", // Subject line
        text: confirmationCode, // plain text body
    });
    
    res.status(200).json({response:"good", confCode: confirmationCode});
})



router.post('/register', async (req, res)=>{
    const account = req.body.accountDetails
    const dbconn = await getDBConn()

    try{
        const sql = 'INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?);';
        const values = [account.username, account.name, account.email, crypto.createHash('md5').update(account.password).digest("hex")];
        const [result] = await dbconn.execute(sql, values)
        dbconn.destroy()
        res.status(200).json({response:"good"}); // should generate token here too
    }
    catch (e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
    }
})

router.put('/changePassword', async(req, res)=>{
    const dbconn = await getDBConn()
    const newPassword = crypto.createHash('md5').update(req.body.password).digest("hex")

    try{
        const sql = 'UPDATE users SET password = ? WHERE email = ?';
        const values = [newPassword, req.body.email];
        const [result] = await dbconn.execute(sql, values)
        dbconn.destroy()
        res.status(200).json({response:"good"}); // should generate token here too
    }
    catch (e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
    }
})

module.exports = router



