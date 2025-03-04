import mongoose from "mongoose";

const googleLogin = new mongoose.Schema({
    name:{type: String, required: true},
    mail:{type: String, required: true},
    image:{type: String, required: false},
    lastLoggin:{type: Date, default: Date.now()},
    status: {type: String, default: 'available'},
    friendList: {type: Array, default: []},
})

const googleUserModel = mongoose.models.googleLogin || mongoose.model('googleLogin', googleLogin)

export default googleUserModel
