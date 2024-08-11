require("dotenv").config();
const mongoose=require('mongoose');
const { MONGO_URI } = require("../env");
const userSchema=new mongoose.Schema({
    username:String,
    name:String,
    age:Number,
    email:String,
    password:String,
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"post"
    }]
})
mongoose.connect(MONGO_URI)
const User=mongoose.model('user',userSchema)
module.exports=User