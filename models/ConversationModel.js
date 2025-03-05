import mongoose from "mongoose";

const conversationSchema  = new mongoose.Schema({
    sender: {type: String, required: true},
    receiver: {type: String, required: true},
    msg: {type: Array, required: true},
})

const ConversationModel = mongoose.models.conversation || mongoose.model('conversation', conversationSchema)

export default ConversationModel