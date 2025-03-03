import mongoose from "mongoose";

const connectDB = async() => {
    mongoose.connection.on('connected', () => console.log('Database connted'))
    await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)
}

export default connectDB