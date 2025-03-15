import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary'
import userModel from '../models/userModel.js'
import ConversationModel from '../models/ConversationModel.js'

const userSignUp = async (req, res) => {

  try {
    const {name, email, password } = req.body

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const mail = email.toLowerCase()

    const userData = {
      name,
      mail,
      password: hashedPassword,
      type: 'sign-up'
    }

    const user = await userModel.findOne({ mail: mail });

    if (!user) {
      // 新用戶註冊
      const newRecord = new userModel(userData);
      await newRecord.save();
      return res.json({ success: true, message: 'Sign up success!' });
    }

    else if (!user.password) {
      // 使用 Google 登入，並新增密碼
      user.password = hashedPassword;
      await user.save();
      return res.json({ success: true, message: 'Password set successfully!' });
    }

    else {
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
    
    const isAccountExist = await userModel.findOne({ mail: mail, password: { $exists: true } });

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
          $or: [
            { sender: mail }, // sender 和 mail 相等
            { receiver: mail }, // receiver 和 mail 相等
            {
              // 添加 groupList 中的匹配条件
              $or: isAccountExist.groupList.map((group) => {
                const groupSender = group.split('%')[0];  // 获取 '%' 前的部分
                
                return {
                  $or: [
                    { sender: groupSender }, // sender 和 groupSender 相等
                    { receiver: groupSender } // receiver 和 groupSender 相等
                  ]
                };
              })
            }
          ]
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
        $or: [
          { sender: mail }, // sender 和 mail 相等
          { receiver: mail }, // receiver 和 mail 相等
          {
            // 添加 groupList 中的匹配条件
            $or: isAccountExist.groupList.map((group) => {
              const groupSender = group.split('%')[0];  // 获取 '%' 前的部分
              
              return {
                $or: [
                  { sender: groupSender }, // sender 和 groupSender 相等
                  { receiver: groupSender } // receiver 和 groupSender 相等
                ]
              };
            })
          }
        ]
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

const getGroupMember = async (req, res) => {

  try {
    const { group_id } = req.body 

    console.log(group_id)

    const result = await userModel.find({
      'groupList': { $in: [group_id] }
    });

    res.json({success:true, message: result})

  } catch (err) {
    console.log(err)
    res.json({success:false, message:'Fail with login'})
  }
}

export {userSignUp, userLogin, googleLogin, getGroupMember}