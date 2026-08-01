const mongoose = require("mongoose");

const runSchema = new mongoose.Schema({
   userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime:{
    type:Date
  },
  status:{
    type:String,
    enum:["active","completed","discarded"],
    default:"active"
  },
  duration:{
    type:Number,
    default:0
  },
  pace:{
    type:String,
    default:"0:00 min/km"
  },
  distance: {
    type: Number,
    default: 0
  },
  path: [{
    _id:false,
     lat:{
          type:Number,
          required:true
      },

      lng:{
          type:Number,
          required:true
      }
  }]
});

module.exports = mongoose.model("Run", runSchema);