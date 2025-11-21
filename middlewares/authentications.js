require("dotenv").config();
const jwt = require("jsonwebtoken")
const secret = process.env.SECRET




function checkForCookie(cookieName){
    return(req,res,next)=>{
        const token = req.cookies[cookieName]
        if(!token){
            return next()
        }
        else{
            try{
                const userPayload = jwt.verify(token,secret)
                req.user = userPayload
            }
            catch(error){}
            next()
        }
    }
}










function redirectAuthentication(req,res,next){
    if(!req.user){
        return res.redirect("signin")
    }
    next()
}


module.exports = {checkForCookie, redirectAuthentication}