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
import { fileURLToPath } from 'url';
import { dirname } from 'path'; 
import ConversationModel from "./models/ConversationModel.js";
import userModel from "./models/userModel.js";

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

app.get("/", (req, res) => {
  res.send("後端 API 正常運行！");
});

connectDB()
connectCloudinary()

// const uploadDir = path.join(process.cwd(), 'uploads');

io.on('connection', (socket) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    socket.on('send_msg', async (data) => {
        const { sender, receiver, message, files } = data;

        try {
            // 確認有檔案
            if (files && files.length > 0) {
                let imageUrl = await Promise.all(
                    files.map(async (fileBuffer) => {
                      return new Promise((resolve, reject) => {
                        // 使用 cloudinary.uploader.upload_stream 並將 buffer 上傳到 Cloudinary
                        cloudinary.uploader.upload_stream(
                          { resource_type: 'image' },
                          (error, result) => {
                            if (error) {
                              console.log('Upload failed:', error);
                              reject(error);  // 如果有錯誤，返回錯誤
                            } else {
                              resolve(result.secure_url);  // 如果成功，返回上傳後的 URL
                            }
                          }
                        )
                        .end(fileBuffer);  // 直接將文件 Buffer 傳遞給 Cloudinary
                      });
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
                        receiver: String(receiver),
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
                            receiver: String(receiver),
                            image: message.image
                        }
                    });
                }
            }catch (error) {
            console.error('Error while uploading files:', error);
        }
    });

    socket.on('exit_group', async (data) => {

        try {
            const { group_member, group_id, member_left } = data 
            await userModel.findOneAndUpdate(
              { mail: group_member },
              { $pull: { groupList: group_id } }, 
              { new: true }
            )
            const account = await userModel.findOne({mail: group_member})
        
            if(member_left==='1'){
              await ConversationModel.deleteMany({
                $or: [
                  { sender: group_id.split('%')[0] },
                  { receiver: group_id.split('%')[0] }
                ]
              });
            }

            io.emit('exit_done', { msgData:{
                account, member_left, group_id
            } });
        
          } catch (err) {
            console.log(err)
          }
    });

    socket.on('create_group', async (data) => {

        try {
            const { group_member, group_id } = data  
        
            for(let i = 0 ; i < JSON.parse(group_member).length; i++){
              await userModel.findOneAndUpdate(
                { mail: JSON.parse(group_member)[i] },
                { $push: { groupList: group_id } },
                { new: true } 
              );
            }
        
            const result = await userModel.find({
              'groupList': { $in: [group_id] }
            });
        
            io.emit('group_created', { msgData: result, group_name:  group_id});
        
          } catch (err) {
            console.log(err)
            res.json({success:false, message:'Fail with login'})
          }
    });

    socket.on('edit-groupName', async (data) => {

        try {
            const { member, groupname } = data  
            const member_parse = JSON.parse(member)
        
            const updateResults = [];

            for (let i = 0; i < member_parse.length; i++) {
            const updatedDoc = await userModel.findOneAndUpdate(
                { mail: member_parse[i].mail },
                { groupList: member_parse[i].groupList },
                { new: true }
            );
            updateResults.push(updatedDoc);  // 把每次更新後的結果存入陣列
            }
        
            io.emit('groupName_change', { msgData: updateResults, groupname});
        
          } catch (err) {
            console.log(err)
            res.json({success:false, message:'Fail with login'})
          }
    });

    socket.on('add_friend', async (data) => {

        try {
            const { friend, adder, deleteOrAdd } = data 
            const isExist = await userModel.findOne({mail: friend})
            if(isExist){
                if(deleteOrAdd==='add'){
                    await userModel.findOneAndUpdate(
                        { mail: friend.toLowerCase() },
                        { $push: { friendList: adder } }, 
                        { new: true }
                    )
                    await userModel.findOneAndUpdate(
                        { mail: adder.toLowerCase() },
                        { $push: { friendList: friend } }, 
                        { new: true }
                    )
                }
            }else{
                socket.emit('friend_added', { msgData :false });
                return
            }
            const msgData = await userModel.find({
                mail: { $in: [friend.toLowerCase(), adder.toLowerCase()] }
              });

            io.emit('friend_added', { msgData });
        
          } catch (err) {
            console.log(err)
          }
    });

    socket.on('delete_friend', async (data) => {

        try {
            const { friend, adder, deleteOrAdd } = data 

            if(deleteOrAdd==='remove'){
                await userModel.findOneAndUpdate(
                    { mail: friend },
                    { $pull: { friendList: adder } }, 
                    { new: true }
                )
                await userModel.findOneAndUpdate(
                    { mail: adder },
                    { $pull: { friendList: friend } }, 
                    { new: true }
                )
            }

            const msgData = await userModel.find({
                mail: { $in: [friend, adder] }
            });

            io.emit('friend_remove', { msgData });
        
          } catch (err) {
            console.log(err)
          }
    });

    socket.on('edit_profile', async (data) => {
        const { user_mail, user_name, file } = data;

        try {
            let imageUrl = null;

            if (file) {
                const filename = `${Date.now()}.jpg`;
                const filePath = path.join(__dirname, 'uploads', filename);
                fs.writeFileSync(filePath, file);

                let result = await uploader.upload(filePath, { resource_type: 'image' });

                fs.unlinkSync(filePath);

                imageUrl = result.secure_url; 
            }

            const updatedUser = await userModel.findOneAndUpdate(
                { mail: user_mail }, 
                { 
                    $set: { 
                        name: user_name, 
                        image: imageUrl 
                    } 
                },
                { new: true, returnDocument: 'after' }  
            );

            io.emit('profile_changed', { msgData: updatedUser });

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



