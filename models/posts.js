const mongoose = require("mongoose")




const postSchema = mongoose.Schema({
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"accounts"
    },
    userid:{
        type:String
    },
    title:{
        type:String
    },
    description:{
        type:String
    },
    media:{
        type:String,
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})


module.exports = mongoose.model("posts",postSchema)