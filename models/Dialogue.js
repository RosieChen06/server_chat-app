import mongoose from "mongoose";

const dialogueSchema  = new mongoose.Schema({
    sender: {type: String, required: true},
    receiver: {type: String, required: true},
    content: {type: String, required: true},
    emoji: {type: String, default: ''},
    isRead: {type: Boolean, default: false}
})

const dialogueModel = mongoose.models.dialogue || mongoose.model('dialoque', dialogueSchema)

export default dialogueModel