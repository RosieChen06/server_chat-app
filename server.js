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
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs';
import path from 'path';
import { uploader } from 'cloudinary';
import { fileURLToPath } from 'url'; // 引入 fileURLToPath 函式
import { dirname } from 'path'; 
import ConversationModel from "./models/ConversationModel.js";

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

    const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // 取得當前檔案所在的目錄

socket.on('send_msg', async (data) => {
    const { sender, receiver, message, files } = data;

    try {
        // 確認有檔案
        if (files && files.length > 0) {
            let imageUrl = await Promise.all(
                files.map(async (fileBuffer) => {
                    // 生成一個檔案名稱
                    const filename = `${Date.now()}.jpg`;  // 根據需求設置檔名和副檔名

                    // 儲存 Buffer 為檔案
                    const filePath = path.join(__dirname, 'uploads', filename);
                    fs.writeFileSync(filePath, fileBuffer);  // 儲存檔案

                    // 上傳到 Cloudinary
                    let result = await uploader.upload(filePath, { resource_type: 'image' });

                    // 刪除上傳後的檔案
                    fs.unlinkSync(filePath);  // 刪除本地檔案

                    return result.secure_url;  // 返回圖片的 URL
                })
            );

            message.image = imageUrl
        }

        const isConversationExist = await ConversationModel.findOne({sender, receiver})
            if(isConversationExist){
                await ConversationModel.updateOne(
                    { sender, receiver }, 
                    { $push: { msg:  message } }
                  );
                io.emit('receive_msg', { msgData:{
                    sender,
                    msg: message.message,
                    datetime: message.datetime,
                    receiver,
                    image: message.image
                } });
            }else{
                const msgData = {
                    sender,
                    receiver,
                    msg: message
                }

                const newRecord = new ConversationModel(msgData)
                await newRecord.save()
                io.emit('receive_msg', { msgData:
                    {
                        sender,
                        msg: message.message,
                        datetime: message.datetime,
                        receiver,
                        image: message.image
                    }
                 });
            }
        }catch (error) {
        console.error('Error while uploading files:', error);
      }
    });

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


