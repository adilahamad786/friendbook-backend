const multer = require('multer');

// CREATE A MULTER MIDDLEWARE FOR FILES HANDLING
const uploadFile = multer({
    limits : {
      fileSize : 3000000
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
        cb(new Error("Please upload an image file only (png/jpg/jpeg)!"));
      }
  
      cb(undefined, true);
    }
});

module.exports = uploadFile;