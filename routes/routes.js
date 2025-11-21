const express = require("express")
const router = express.Router()




const accounts = require("../models/accounts")
const posts = require("../models/posts")
const Comments = require("../models/comments")
const cookieParser = require("cookie-parser")
const {checkForCookie,redirectAuthentication} = require('../middlewares/authentications')
const multer = require('multer')
const {nanoid} = require("nanoid")
const nodemailer = require("nodemailer");

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require("dotenv").config();




router.use(cookieParser())
router.use(checkForCookie("token"))

















////////////////////  Sign Up  ///////////////////////////////



///////  GET  /////

router.get("/signup",(req,res)=>{
    if(req.user){
        return res.redirect("home")
    }
    else{
        res.render("signup",{error:null})
    }
})





////////  POST  /////////

router.post("/signup", async (req, res) => {
    try {
        const { userid, email } = req.body;
        const password = nanoid(9);

        // Check if user already exists
        const exists = await accounts.findOne({ email });
        if (exists) {
            return res.render("signup", { error: "Email already exists" });
        }

        // Setup transporter
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Define mail info
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "postify",
            text: `Your temporary password is: ${password}. Please change it after Sign in.`,
        };

        // Try sending email
        try {
            await transporter.sendMail(mailOptions);
             
            const data = new accounts({ userid, email, password });
            await data.save();

            return res.redirect("/signin");
        } catch (mailErr) {
            return res.render("signup", { error: "Email address not found" });
        }

       
    } catch (err) {
        return res.render("signup", { error: "Something went wrong" });
    }
});


///////////////////////////////////////////////////////////////////////////








































/////////////////////////  Sign In  ///////////////////////////////



//////////  GET  /////////

router.get("/signin",(req,res)=>{
    if(req.user){
        return res.redirect("home")
    }
    else{
        res.render("signin",{error:null})
    }
})





///////// POST ////////////

router.post("/signin",async (req,res)=>{
    const {email,password} = req.body;
    try{
        const token = await accounts.matchingPassword(email,password)
        res.cookie("token",token)
        res.redirect("home")
    }
    catch{
        res.render("signin",{error:"Invalid email or password"})
    }
})

/////////////////////////////////////////////////////////////////////////////








































///////////////////////  Home Page  //////////////////////////

router.get("/",redirectAuthentication,(req,res)=>{
    res.redirect("home")
})





router.get("/home",redirectAuthentication,async(req,res)=>{
    try{
        const allPosts = await posts.find().sort({createdAt:-1}).populate('createdBy')
        res.render("home",{posts:allPosts})
    }
    catch(err){
        res.send(`<h1>500 -- Server error</h1>`)
    }
})


//////////////////////////////////////////////////////////////


































////////////////////////////  Trendings  /////////////////////////////

router.get("/trendings", redirectAuthentication, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0); // today at 00:00:00

    const end = new Date();
    end.setHours(23, 59, 59, 999); // today at 23:59:59

    const latestPosts = await posts
      .find({
        createdAt: { $gte: start, $lte: end },
      })
      .sort({ createdAt: -1 })
      .populate("createdBy");

    res.render("trendings", { posts: latestPosts });
  } catch (err) {
    console.error(err);
    res.send(`<h1>500 -- Server error</h1>`);
  }
});

///////////////////////////////////////////////////////////////////








































//////////////////////  Profile Page  //////////////////////////////

router.get("/profile",redirectAuthentication, async(req,res)=>{
    try{
        const user = await accounts.findById(req.user)
        
        
        if(!user){
            return res.redirect('signin')
        }
        else{
            const allPosts = await posts.find({userid:user.userid}).sort({createdAt:-1}).populate('createdBy')
            res.render("profile",{userid: user.userid,profile: user.profile, bio: user.bio,posts:allPosts})
        }
    }
    catch(err){console.log("Error")}
})

//////////////////////////////////////////////////////////////////////








































/////////////////////////  Edit Bio  ///////////////////////////////////


////////  GET  ///////////

router.get("/edit-bio",redirectAuthentication,async (req,res)=>{
    try{
        const user = await accounts.findById(req.user._id)

        if(!user){
            return res.redirect('signin')
        }
        else{
            res.render("edit-bio",{profile: user.profile, bio: user.bio})
        }
    }
    catch(err){}
       
})










/////////  POST  ///////////////

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "postify", // cloud folder name
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });





router.post("/edit-bio",upload.single('profile'),async (req,res)=>{
    try{
        
        let {bio} = req.body;
        if(bio == ""){
            bio = req.user.bio
        }

        let profile = ""
        if(!req.file){
            profile = req.user.profile
        }
        else{
            profile = req.file.path; 
        }


        await accounts.findOneAndUpdate(
            {userid: req.user.userid},
            {$set:{
                profile: profile,
                bio : bio
            }}
        )
        
    }
    catch(err){res.send(`<h1>Error Occured</h1>`)}

    res.redirect("profile")
})

/////////////////////////////////////////////////////////////////////////////////








































////////////////////////////////  Create Post  /////////////////////////


////////////  GET  /////////////

router.get("/post",redirectAuthentication,(req,res)=>{
    res.render("post")    
})





////////////  POST  /////////////

router.post("/create-post",upload.single("media"), async (req,res)=>{

    try{
    
        // yo userid maile mathi banako JWT tokens bata aairako xa hai
        const user = await accounts.findOne({ userid: req.user.userid });
        
        const {title,description} = req.body
        const createdBy = user._id
        const userid = user.userid
        const media = req.file ? req.file.path : null

        
        const data = new posts({createdBy,userid,title,description,media})
        await data.save()
        res.redirect("profile")
    }
    catch(err){res.send(`<h1>Unable to create post</h1>`)}
})

//////////////////////////////////////////////////////////////////////////////////






































///////////////////////////  Edit Post  /////////////////////////////////////


///////////  GET //////////

router.get("/edit/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const Post = await posts.findById(postId);

    res.render("edit-post", { post: Post});
  } catch (err) {
    console.error(err);
    res.send(`<h1>500 -- Something Server error</h1>`);
  }
});










////////  POST  ///////////

router.post("/edit/:postId",upload.single("media"),async(req,res)=>{
    const {postId} = req.params

    try{

        let {title,description,removeImage} = req.body
        let media



        if(removeImage == "true"){
            media = null
        }
        else if(req.file){
            media = req.file ? req.file.path : null
        }
        else{
            const thePost = await posts.findById(postId)
            media = thePost.media
        }

        await posts.findOneAndUpdate(
            {_id: postId},
            {$set:{
                title,
                description,
                media
            }}
        )
        res.redirect("/profile")
    }
    catch(err){console.log("Not saved")}
})











////// Delete Post //////
router.post("/delete/:postId",async(req,res)=>{
    try{
        const {postId} = req.params

        await posts.findByIdAndDelete(postId)
        res.redirect("/profile")

    }catch(err){
        console.log(err)
    }
})



router.post("/change-password",async(req,res)=>{
  try{
    const email = req.user?.email
    const {password} = req.body

    const user = await accounts.findOne({email})
    if(!user){
      return res.redirect("/signin")
    }

    user.password = password
    await user.save()
    res.clearCookie("token")
    return res.redirect("/signin")
    }
    catch(err){
        console.log("Error ",err)
    }
})




/////////////////////////////////////////////////////////////////////////////



























//////////////////////////////////  Change Password ////////////////////////////////////

router.get("/change-password",redirectAuthentication,(req,res)=>{
    res.render("change-password",{error:""})
})

////////////////////////////////////////////////////////////////////////////////////////
























/////////////////////////  LogOut  ///////////////////////////

router.get("/logout",redirectAuthentication,(req,res)=>{
    res.clearCookie("token").redirect("/signin")
})

//////////////////////////////////////////////////////////////








































///////////////////////////  Commentry  /////////////////////////////////////


///////////  GET //////////

router.get("/comments/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const Post = await posts.findById(postId).populate("createdBy");

    const allComments = await Comments.find({ commentedOn: postId })
      .populate("commentedBy")
      .sort({ commentedDate: -1 });

    res.render("post-comment", { posts: Post, comments: allComments });
  } catch (err) {
    console.error(err);
    res.send(`<h1>500 -- Something Server error</h1>`);
  }
});










////////  POST  ///////////

router.post("/comments/:postId",async(req,res)=>{
    const {postId} = req.params

    try{
        const {comments} = req.body
        const commentedBy = req.user._id
        const commentedOn = postId

        const data = new Comments({commentedOn,commentedBy,comments})
        data.save()
        res.redirect(`/comments/${postId}`)
    }
    catch(err){console.log("Not saved")}
})

/////////////////////////////////////////////////////////////////////////////






























//////////////////////  Others Profile Page  //////////////////////////////


router.get("/gotoid",(req,res)=>{
    const {idname} = req.query

    if(req.user.userid == idname){
        res.redirect(`/profile`)
    }
    else{
        if(idname){
            res.redirect(`/profile/${idname}`)
        }
        else{
            return res.redirect("/home")
        }
    }
})




router.get("/profile/:othersId", async(req,res)=>{
    try{
        const {othersId} = req.params
        const user = await accounts.findOne({userid: othersId})
        
        if(req.user.userid == othersId){
            return res.redirect(`/profile`)
        }

        if(!user){
            res.render("nopage")
        }

        else{
            const accountInfo = await accounts.find({userid:user.userid})
            const allPosts = await posts.find({userid:user.userid}).sort({createdAt:-1}).populate('createdBy')
            return res.render("otherProfile",{userid: user.userid,profile: user.profile, bio: user.bio,posts:allPosts})
        }
    }
    catch(err){console.log("Error")}
})

//////////////////////////////////////////////////////////////////////


















router.use(function(req,res){
    res.type("text/html");
    res.status(404);
    res.redirect("/home")
})

module.exports = router