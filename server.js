// const { Socket } = require('dgram')
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from './config/mongodb.js';
import connectCloudinary from "./config/cloudinay.js";
import dotenv from 'dotenv';
import userRouter from "./routes/userRoute.js";
dotenv.config();

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

connectDB()
connectCloudinary()

io.on('connection', (socket) => {

    socket.on('send_msg', (msg) => {
        socket.broadcast.emit('receive_msg', msg)
    })

    socket.on('disconnect', () => {
        console.log('user left')
    });

})

app.use(cors());
app.use(express.json());
app.use('/api/user', userRouter)

server.listen(3001, () => {
    console.log('server is running on port: 3001')
})


