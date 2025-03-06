import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import userModel from '../models/userModel.js'
import ConversationModel from '../models/ConversationModel.js'

const userSignUp = async (req, res) => {

  try {
    const {name, email, password } = req.body
    // const image = req.file
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // const imageUpload = await cloudinary.uploader.upload(image.path, {resource_type:'image'})
    // const imageUrl = imageUpload.secure_url

    const mail = email.toLowerCase()

    const userData = {
      name,
      mail,
      password: hashedPassword,
      type: 'sign-up'
    }

    const isExist = await userModel.find({mail:mail})
    if(isExist.length===0){
      const newRecord = new userModel(userData)
      await newRecord.save()
      res.json({success:true, message:'Sign up success!'})
    }else{
      res.json({success:false, message:'User already exist'})
    }


  } catch (err) {
    console.log(err)
  }
}

const userLogin = async (req, res) => {

  try {
    const {email, password } = req.body
    const mail = email.toLowerCase()
    
    const isAccountExist = await userModel.findOne({mail: mail, type: 'sign-up'})

    if(isAccountExist){
      const hashedPasswordFromDB = isAccountExist.password;
      const isMatch = await bcrypt.compare(password, hashedPasswordFromDB);
      if(isMatch){
        let friendArr = []
        for(let i = 0; i<isAccountExist.friendList.length; i++) {
          const friend = await userModel.findOne({mail: isAccountExist.friendList[i]})
          friendArr.push(friend)
        }
        const histConversation = await ConversationModel.find({
          $or: [{ sender: mail }, { receiver: mail }]
        });

        res.json({success:true, message:isAccountExist, friendInfo:friendArr, historyConversation: histConversation})
      }else{
        res.json({success:false, message:'Password Incorrect'})
      }
    }else{
      res.json({success:false, message:'User does not exist'})
    }
  } catch (err) {
    console.log(err)
    res.json({success:false, message:'Fail with login'})
  }
}

const googleLogin = async (req, res) => {

  try {
    const {email, name, picture} = req.body
    const mail = email.toLowerCase()

    const isAccountExist = await userModel.findOne({mail:mail, type: 'google'})
    if(isAccountExist){
      let friendArr = []
      for(let i = 0; i<isAccountExist.friendList.length; i++) {
        const friend = await userModel.findOne({mail: isAccountExist.friendList[i]})
        friendArr.push(friend)
      }

      const histConversation = await ConversationModel.find({
        $or: [{ sender: mail }, { receiver: mail }]
      });

      res.json({success:true, message:isAccountExist, friendInfo:friendArr, historyConversation: histConversation})
    }else{
      const userData = {
        name,
        mail,
        image: picture,
        type: 'google'
      }
      const newRecord = new userModel(userData)
      await newRecord.save()
      res.json({success:true, message: userData, friendInfo:[], historyConversation: []})
    }
  } catch (err) {
    console.log(err)
    res.json({success:false})
  }
}

const friendListManagement = async (req, res) => {

  try {
    const {email, type, friendList, TAmail} = req.body
    const mail = email.toLowerCase()

    const isAccountExist = await userModel.findOne({mail:TAmail})
    if(isAccountExist){

      const updatedUser = await userModel.findOneAndUpdate(
        { mail, type }, 
        { $addToSet: { friendList: TAmail } },
        { new: true }
      );

      const syncFriendList = await userModel.findOneAndUpdate(
        { mail: TAmail }, 
        { $addToSet: { friendList: mail } },
      );

      let friendArr = []
      
      for (let i = 0; i < updatedUser.friendList.length; i++) {
        const friend = await userModel.findOne({ mail: updatedUser.friendList[i] });
        friendArr.push(friend);
      }
      
      res.json({success:true, message: friendArr})
    }else{
      res.json({success:false, message: 'Can not find the user'})
    }

  } catch (err) {
    console.log(err)
    res.json({success:false})
  }
}

const saveConversationRecord = async (req, res) => {

  try {
    const {sender, receiver, msgDetail} = req.body

    const isConversationExist = await ConversationModel.findOne({sender, receiver})
    if(isConversationExist){
      await ConversationModel.updateOne(
        { sender, receiver }, 
        { $push: { msg:  JSON.parse(JSON.stringify(msgDetail))} }
      );
  
      res.json({success:true})
      console.log(sender, receiver)
    }else{
      console.log(sender, receiver)

      const msgData = {
        sender,
        receiver,
        msg: [JSON.parse(JSON.stringify(msgDetail))]
      }

      const newRecord = new ConversationModel(msgData)
      await newRecord.save()

      res.json({success:true})
    }

  } catch (err) {
    console.log(err)
    res.json({success:false})
  }
}

export {userSignUp, userLogin, googleLogin, friendListManagement, saveConversationRecord}