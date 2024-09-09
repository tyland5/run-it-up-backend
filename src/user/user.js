const {pool} = require('../db/dbconn')
const {verifyCSRF, checkIfLoggedIn} = require('../security/middleware')
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

router.get("/getBasicUserInfo", checkIfLoggedIn, async (req, res)=>{
  
  try{
    let uid = req.query.uid;

    const sql = 'SELECT username, name, email, bio, pfp FROM users WHERE uid = ?';
    const values = [uid];
    const [result] = await pool.execute(sql, values);

    res.status(200).json({res:result})
  }
  catch(e){
    console.log(e)
    res.status(500).send()
  }

})

router.get("/getUserInfo", async (req, res)=>{
    
    try{
      let uid = req.query.uid;

      const sql = 'SELECT * FROM users WHERE uid = ?';
      const values = [uid];
      const [result] = await pool.execute(sql, values);

      
      const sql2 = 'SELECT COUNT(uid) as following FROM followers GROUP BY uid HAVING uid = ?';
      const [result2] = await pool.execute(sql2, values);

      const sql3 = 'SELECT COUNT(following) as followers FROM followers GROUP BY following HAVING following = ?;';
      const [result3] = await pool.execute(sql3, values);
      
      result[0].followers = result3.length > 0 ? result3[0].followers : 0;
      result[0].following = result2.length > 0 ? result2[0].following : 0;

      // get if the user is following this profile
      if(uid !== req.session.uid){
        const sql4 = 'SELECT * FROM followers where uid =? AND following = ?';
        const [result4] = await pool.execute(sql4, [req.session.uid, uid]);
        result[0].isFollowing = result4.length > 0 ? true : false;
      }

      res.status(200).json({res:result})
    }
    catch(e){
      console.log(e)
      res.status(500).send()
    }
})

// used for /getUserPfp and /changeUserInfo
async function getUserPfpName(req){
  try{
    const uid = req.session.uid;

    const sql = 'SELECT pfp FROM users WHERE uid = ?';
    const values = [uid];
    const [result] = await pool.execute(sql, values);
    return result
  }
  catch(e){
    console.log(e)
    return "err"
  }
}

router.get("/getUserPfp", checkIfLoggedIn, async (req, res)=>{
    const result = await getUserPfpName(req)
    
    if(result !== "err"){
      res.status(200).json({res:result})
    }
    else{
      res.status(500).send()
    }
})

router.post("/changeUserInfo", [verifyCSRF, upload.array('media', 1)], async (req, res) => {
    const uid = req.session.uid;    
    
    let sql = 'UPDATE users SET name=?, username=?, bio=?';
    let values = [req.body.name, req.body.username, req.body.bio]; // TODO: need to update to include logged in user id
    
    if(req.files.length === 1){
        // first delete the old pic
        let pfpName = await getUserPfpName(req)
        if(pfpName === "err"){
          res.status(500).send()
          return
        }

        pfpName = "images/" + pfpName[0].pfp.substring(32)
        unlinkAsync(pfpName)

        const image = process.env.FILE_SERVER + "/images/"+ req.files[0].filename;
        sql += ", pfp=?";
        values.push(image)
    }

    sql += " WHERE uid=?";
    values.push(uid)

    try{
      await pool.execute(sql, values)
      res.status(200).send()
    }
    catch(e){
      console.log(e)
      res.status(500).send()
    }
    
})

router.post("/followUser", [verifyCSRF], async (req, res) =>{  
    let uid = req.session.uid 

    try{
      const sql = 'INSERT INTO followers VALUES(?, ?)';
      const values = [uid, req.body.followingId];
      await pool.execute(sql, values);

      res.status(200).send()
    }
    catch(e){
      console.log(e)
      res.status(500).send()
    }
})

router.post("/unfollowUser", [verifyCSRF], async (req, res) =>{
    let uid = req.session.uid 

    try{
      const sql = 'DELETE FROM followers WHERE uid=? AND following=?';
      const values = [uid, req.body.followingId];
      await pool.execute(sql, values);

      res.status(200).send()
    }
    catch(e){
      console.log(e)
      res.status(500).send()
    }
})


router.get('/getFollowersFollowing', checkIfLoggedIn, async (req, res) =>{ 
    let uid = req.query.uid 

    try{
      const sql = `select uid, mutual, username, name, pfp 
      FROM (SELECT f.uid as uid, f.following as following, f2.uid as mutual 
      from followers f 
      left join followers f2 ON f.following = f2.uid AND f.uid = f2.following 
      where f.following=?) followRel
      Natural JOIN users`;

      const values = [uid];
      const [followers] = await pool.execute(sql, values);

      const sql2 = `SELECT following as uid, username, name, pfp
      FROM followers f
      JOIN users u ON following = u.uid
      WHERE f.uid = ?`;

      const [following] = await pool.execute(sql2, values);

      res.status(200).json({res: [followers, following]})
    }
    catch(e){
      console.log(e)
      res.status(500).send()
    }
})

router.get("/logout", async (req, res)=>{
    delete req.session.uid
    delete req.session.csrf
    res.status(200).send();
})

module.exports = router