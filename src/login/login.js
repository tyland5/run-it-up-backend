const {pool} = require('../db/dbconn')
const {checkIfLoggedIn} = require('../security/middleware')
const express = require('express')
const nodemailer = require('nodemailer');
const crypto = require('crypto')
require('dotenv').config()

const router = express.Router()

// need this to access params of incoming post requests. only does stuff when the content-type header matches function
router.use(express.json());


router.post('/checkCredentials', async (req, res) => {
    
    try{
        const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
        const values = [req.body.username, crypto.createHash('md5').update(req.body.password).digest("hex")];
        const [result] = await pool.execute(sql, values)

        if(result.length >= 1){
            // refresh the session
            req.session.touch()
            
            // this adds additional information to the session. not the browser cookie, which only holds the encrypted session id
            req.session.uid = result[0].uid
            const csrf = crypto.randomBytes(8).toString('hex'); // 16 character csrf string
            req.session.csrf = csrf

            res.status(200).json({csrfToken: csrf, uid: result[0].uid});
        }
        else{
            res.status(401).send();
        }
    }
    catch (e){
        console.log(e)
        res.status(500).send();
    }

})

router.get('/checkIfLoggedIn', checkIfLoggedIn, (req, res) =>{
    // if middleware is successful reaches here, else personally sends a 401
    res.status(200).json({res:{csrfToken: req.session.csrf, uid:req.session.uid}})
})

router.get('/checkUsernameEmail', async(req, res)=>{
    const valid = {username: true, email: true};
   
    try{
        const sql = 'SELECT * FROM users WHERE username = ?';
        const values = [req.query.username];
        const [result] = await pool.execute(sql, values)
    
        if(result.length > 0){
            valid.username = false
        }

        const sql2 = 'SELECT * FROM users WHERE email = ?';
        const values2 = [req.query.email];
        const [result2] = await pool.execute(sql2, values2)
       
        if(result2.length > 0){
            valid.email = false
        }
    }
    catch (e){
        console.log(e)
        res.status(500).send();
        return
    }
    
    res.status(200).json({validUser: valid.username, validEmail: valid.email})
    
})

router.get('/checkEmail', async(req, res)=>{
    let validEmail = false

    try{
        const sql = 'SELECT * FROM users WHERE email = ?';
        const values = [req.query.email];
        const [result] = await pool.execute(sql, values)

        if(result.length > 0){
            validEmail = true
        }
    }
    catch (e){
        console.log(e)
        res.status(500).send();
        return
    }

    res.status(200).json({validEmail: validEmail})
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

    try{
        const info = await transporter.sendMail({
            from: process.env.COMPANY_EMAIL,
            to: req.query.email, // list of receivers
            subject: "Confirmation Code for Run It Up", // Subject line
            text: confirmationCode, // plain text body
        });
        
        res.status(200).json({confCode: confirmationCode});
    }
    catch(e){
        console.log(e)
        res.status(500).send()
    }
})



router.post('/register', async (req, res)=>{
    const account = req.body.accountDetails

    try{
        const sql = 'INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?);';
        const values = [account.username, account.name, account.email, crypto.createHash('md5').update(account.password).digest("hex")];
        await pool.execute(sql, values)

        res.status(200).send();
    }
    catch (e){
        console.log(e)
        res.status(500).send();
    }
})

router.put('/changePassword', async(req, res)=>{
    const newPassword = crypto.createHash('md5').update(req.body.password).digest("hex")

    try{
        const sql = 'UPDATE users SET password = ? WHERE email = ?';
        const values = [newPassword, req.body.email];
        const [result] = await pool.execute(sql, values)
        res.status(200).send(); 
    }
    catch (e){
        console.log(e)
        res.status(500).send();
    }
})

module.exports = router



