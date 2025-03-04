import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import userModel from '../models/userModel.js'
import googleUserModel from '../models/googleLogin.js'

const userSignUp = async (req, res) => {

  try {
    const {name, email, password } = req.body
    // const image = req.file
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // const imageUpload = await cloudinary.uploader.upload(image.path, {resource_type:'image'})
    // const imageUrl = imageUpload.secure_url

    const mail_start = email.split('@')[0].toLowerCase()
    const mail = mail_start + '@' + email.split('@')[1]

    const userData = {
      name,
      mail,
      password: hashedPassword
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
    const mail_start = email.split('@')[0].toLowerCase()
    const mail = mail_start + '@'  + email.split('@')[1]
    
    const isAccountExist = await userModel.findOne({mail})
    if(isAccountExist){
      const hashedPasswordFromDB = isAccountExist.password;
      const isMatch = await bcrypt.compare(password, hashedPasswordFromDB);
      if(isMatch){
        res.json({success:true, message:isAccountExist})
      }else{
        res.json({success:false, message:'Password Incorrect '})
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
    const mail_start = email.split('@')[0].toLowerCase()
    const mail = mail_start + '@' + email.split('@')[1]
    
    const isAccountExist = await googleUserModel.findOne({mail})
    if(isAccountExist){
      res.json({success:true})
    }else{
      const userData = {
        name,
        mail,
        image: picture
      }
      const newRecord = new googleUserModel(userData)
      await newRecord.save()
      res.json({success:false})
    }
  } catch (err) {
    console.log(err)
    res.json({success:false})
  }
}

export {userSignUp, userLogin, googleLogin}