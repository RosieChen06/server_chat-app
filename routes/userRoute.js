import express from 'express'
import { friendListManagement, updateGroupList, googleLogin, userLogin, userSignUp, getGroupMember, existGroup } from '../controllers/userController.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router()
userRouter.post('/sign-up', upload.single('image'), userSignUp)
userRouter.post('/log-in', upload.single('image'), userLogin)
userRouter.post('/google-log-in', upload.single('image'), googleLogin)
userRouter.post('/edit-friendList', upload.single('image'), friendListManagement)
userRouter.post('/edit-groupList', upload.single('image'), updateGroupList)
userRouter.post('/get-member', upload.single('image'), getGroupMember)
userRouter.post('/exist-group', upload.single('image'), existGroup)

export default userRouter