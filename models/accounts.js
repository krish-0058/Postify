const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const secret = "krishdada1234//"





const accountSchema = new mongoose.Schema({
    userid:{
        type:String,
        required:true,
        unique:true      
    },
    email:{
        type:String,
        required:true,
        unique:true 
    },
    salt:{
        type:String
    },
    password:{
        type:String,
        required:true
    },
    profile:{
        type:String,
        default:"/images/profile.png"
    },
    bio:{
        type:String,
        default:"Hey there !"
    }
})















accountSchema.pre("save",async function (next){
    try{
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(this.password,salt)
        this.password = hashedPassword;
        this.salt = salt;
        next()
        console.log("Before Save")
    }catch(err){
        next(err)
    }
})















accountSchema.static("matchingPassword",async function(email,password){
    const user = await this.findOne({email})

    if(!user){
        throw new Error("No user found")
    }
    else{
       const salt = user.salt;
       const userGivenPassword = await bcrypt.hash(password,salt)
       if(userGivenPassword != user.password){
            throw new Error("Incorrect Password")
        }
        else{
            const token = jwt.sign({
                _id: user._id,
                userid: user.userid,
                email: user.email,
            },secret);
            
            return token
        }
    }
})


module.exports = mongoose.model('accounts',accountSchema)