const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        min : 3,
        max : 20,
    },
    email : {
        type : String,
        required : true,
        unique : true,
        max : 50,
        lowercase : true
    },
    password : {
        type : String,
        required : true,
        min : 6
    },
    profilePic : {
        type : String,
        default : ''
    },
    coverPic : {
        type : String,
        default : ''
    },
    followings : {
        type : Array,
        default : []
    },
    followers : {
        type : Array,
        default : []
    },
    isAdmin : {
        type : Boolean,
        default : false
    },
    description : {
        type : String,
        max : 50
    },
    city : {
        type : String,
        max : 50
    },
    from : {
        type : String,
        max : 50
    },
    relationship : {
        type : Number,
        enum : [1, 2, 3]
    },
}, {
    timestamps : true
});

module.exports = mongoose.model('User', userSchema);