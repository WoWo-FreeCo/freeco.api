import * as path from 'path';
import config from '../../config/index';
import multer from 'multer';
import mime from 'mime-types';

const storage = multer.diskStorage({
  destination: function (_req, _file, callback) {
    callback(null, path.join(config.STATIC_DIR,'images/upload'));
  },
  filename: function (_req, file, callback) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    callback(null, file.originalname + '-' + uniqueSuffix + '.' + mime.extension(file.mimetype))
  }
});

const upload = multer({ 
  storage: storage
});

export default upload;