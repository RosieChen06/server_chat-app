import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema({
    name:{type: String, required: true},
    mail:{type: String, required: true},
    password:{type: String, required: false},
    image:{type: String, default: 'https://i.postimg.cc/rzBzgkQL/360-F-65772719-A1-UV5k-Li5n-CEWI0-BNLLi-Fa-BPEk-Ubv5-Fv.jpg'},
    lastLoggin:{type: Date, default: Date.now()},
    status: {type: String, default: 'available'},
    friendList: {type: Array, default: []},
    groupList: {type: Array, default: []},
    type: {type: String, required: true}
})

const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel