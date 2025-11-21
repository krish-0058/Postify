const mongoose = require("mongoose")


const commentSchema = mongoose.Schema({
    commentedOn:{
        type:String
    },
    commentedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"accounts"
    },
    comments:{
        type:String
    },
    commentedDate:{
        type:Date,
        default:Date.now
    }
})


module.exports = mongoose.model("comments",commentSchema)