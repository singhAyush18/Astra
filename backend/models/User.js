const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    currentStreak:{
        type:Number,
        default:0
    },
    longestStreak:{
        type:Number,
        default:0
    },
    profilePicture: {
        type: String, // Store as Base64 string or URL
        default: null
    },
      lastRunDate: {
        type: Date,
        default: null
    },
    level:{
        type:Number,
        default:1
    },
    xp:{
        type:Number,
        default:0
    }
})
module.exports = mongoose.model("User",userSchema);