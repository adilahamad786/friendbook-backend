const multer = require('multer');
const ErrorHandler = require('../utils/errorHandler');

// CREATE A MULTER MIDDLEWARE FOR FILES HANDLING
const uploadFile = multer({
    limits : {
      fileSize : 3000000
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
        cb(new ErrorHandler("bad_request", "Please upload an image file only (png/jpg/jpeg)!", 400));
      }
  
      cb(undefined, true);
    }
});

module.exports = uploadFile;