import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema({
    name:{type: String, required: true},
    mail:{type: String, required: true},
    password:{type: String, required: true},
    image:{type: String, required: false},
    lastLoggin:{type: Date, default: Date.now()},
    status: {type: String, default: 'available'},
    friendList: {type: Array, default: []},
})

const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel