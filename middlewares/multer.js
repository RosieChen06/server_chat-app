import multer from 'multer';
import { v2 as cloudinaryV2 } from 'cloudinary';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export default upload