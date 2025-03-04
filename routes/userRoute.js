import express from 'express'
import { googleLogin, userLogin, userSignUp } from '../controllers/userController.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router()
userRouter.post('/sign-up', upload.single('image'), userSignUp)
userRouter.post('/log-in', upload.single('image'), userLogin)
userRouter.post('/google-log-in', upload.single('image'), googleLogin)

export default userRouter