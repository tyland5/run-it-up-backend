const getDBConn = require('../db/dbconn')
const express = require('express')
const app = express();
require('dotenv').config()

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


router.post('/makePost', upload.array('media', 12), async (req, res)=>{

    const dbconn = await getDBConn();

    try{
        const sql = 'INSERT INTO post (uid, caption) VALUES (?, ?)';
        const values = [5, req.body.content]; // TODO: need to update to include logged in user id
        const [result] = await dbconn.execute(sql, values)
        const post_id = result.insertId
        
        for(let i =0; i < req.files.length; i ++){
            const sql2 = 'INSERT INTO post_media (post_id, media_type, uri) VALUES (?, ?, ?)';
            const values2 = [post_id, "image", process.env.FILE_SERVER + "/images/"+ req.files[i].filename];
            await dbconn.execute(sql2, values2)
        }
    }
    catch (e){
        console.log(e)
        res.status(500).json({response:"bad"});
        return
    }

    res.status(200).json({response:"good"});
})

router.get('/getPosts', async(req, res)=>{
    const dbconn = await getDBConn();

    try{
        const sql = "SELECT * FROM post NATURAL LEFT JOIN (select post_id, media_type, GROUP_CONCAT(uri) as uri FROM post_media GROUP BY post_id, media_type) as p NATURAL JOIN (select uid, fname, lname FROM users) as u";
        const [result] = await dbconn.execute(sql)
        res.status(200).json({res:result})
    }
    catch (e){
        console.log(e)
        res.status(500).json({response:"bad"});
    }
})

module.exports = router