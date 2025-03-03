import express from 'express'
import { userSignUp } from '../controllers/userController.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router()
userRouter.post('sign-up', upload.single('image'), userSignUp)

export default userRouter