const userSignUp = async (req, res) => {
    try {
        // 使用 Cloudinary 的 upload_stream 方法將檔案直接上傳到 Cloudinary
        cloudinaryV2.uploader.upload_stream(
          { resource_type: 'auto' },  // 自動判斷檔案類型
          (error, result) => {
            if (error) {
              return res.status(500).send('Cloudinary 上傳失敗');
            }
    
            // 返回 Cloudinary 上傳後的檔案資訊（如檔案 URL）
            res.json(result);
          }
        ).end(req.file.buffer);  // 將檔案的 buffer 資料傳送給 Cloudinary
    } catch (err) {
        console.error(err);
        res.status(500).send('上傳過程中出現錯誤');
    }
}

export {userSignUp}