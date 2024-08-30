const getDBConn = require('../db/dbconn')
const {verifyCSRF} = require('../security/middleware')
const express = require('express')
const app = express();
require('dotenv').config()

// used to delete local file, remove this and multer when done
const fs = require('fs')
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink)

const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './images')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
const upload = multer({ storage: storage })

const router = express.Router()
router.use(express.json());


router.post('/makePost', [verifyCSRF, upload.array('media', 12)], async (req, res)=>{

    const dbconn = await getDBConn();

    try{
        const sql = 'INSERT INTO post (uid, caption) VALUES (?, ?)';
        const values = [req.session.uid, req.body.content]; // TODO: need to update to include logged in user id
        const [result] = await dbconn.execute(sql, values)
        const post_id = result.insertId
        
        for(let i =0; i < req.files.length; i ++){
            const sql2 = 'INSERT INTO post_media (post_id, media_type, uri) VALUES (?, ?, ?)';
            const values2 = [post_id, "image", process.env.FILE_SERVER + "/images/"+ req.files[i].filename];
            await dbconn.execute(sql2, values2)
        }
    }
    catch (e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
        return
    }
    dbconn.destroy()
    res.status(200).json({response:"good"});
})

router.get('/getPosts', async(req, res)=>{
    const dbconn = await getDBConn();
   
    try{
        let sql = "SELECT * FROM post NATURAL LEFT JOIN (select post_id, media_type, GROUP_CONCAT(uri) as uri FROM post_media GROUP BY post_id, media_type) as p NATURAL JOIN (select uid, pfp, name FROM users) as u";
        const values = []
        if(req.query?.uid){
            sql += " WHERE uid=?";
            values.push(req.query.uid)
        }
        const [result] = await dbconn.execute(sql, values)
        dbconn.destroy()
        res.status(200).json({res:result})
    }
    catch (e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
    }
})

router.post('/deletePost', verifyCSRF, async(req, res)=>{
    const dbconn = await getDBConn();
    const post_id = req.body.postId

    // first get the names of the media attached to the post and delete the files
    try{
    const sql = 'SELECT uri FROM post_media WHERE post_id = ?'  
    const [result] = await dbconn.execute(sql, [post_id])

    if(result.length >0){
        for(let i = 0; i < result.length; i++){
            unlinkAsync("images/" + result[i].uri.substring(32))
        }
    }
    
    }
    catch(e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
    }

    // next delete the post itself from db
    try{
        const sql2 = 'DELETE FROM post WHERE post_id = ?' // also deletes from post_media thanks to delete cascade
        const [result2] = await dbconn.execute(sql2, [post_id])
    
        dbconn.destroy()
        res.status(200).json({res:result2})
    }
    catch(e){
        dbconn.destroy()
        console.log(e)
        res.status(500).json({response:"bad"});
    }
})


module.exports = router