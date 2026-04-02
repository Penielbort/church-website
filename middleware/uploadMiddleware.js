const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

function makeStorage(dest) {
  return multer.diskStorage({
    destination: (req, file, cb) => { fs.mkdirSync(dest, { recursive: true }); cb(null, dest); },
    filename:    (req, file, cb) => { cb(null, Date.now() + '-' + Math.round(Math.random()*1e6) + path.extname(file.originalname).toLowerCase()); }
  });
}
const imgFilter = (req, file, cb) => cb(null, file.mimetype.startsWith('image/'));
const audioFilter = (req, file, cb) => cb(null, true); // allow all audio

const B = __dirname + '/../uploads/';
require('fs').mkdirSync(B+'hero', { recursive: true });
const uploadMember  = multer({ storage: makeStorage(B+'members'),  fileFilter: imgFilter,   limits:{fileSize:5*1024*1024} });
const uploadGallery = multer({ storage: makeStorage(B+'gallery'),  fileFilter: imgFilter,   limits:{fileSize:8*1024*1024} });
const uploadEvent   = multer({ storage: makeStorage(B+'events'),   fileFilter: imgFilter,   limits:{fileSize:8*1024*1024} });
const uploadPost    = multer({ storage: makeStorage(B+'gallery'),  fileFilter: imgFilter,   limits:{fileSize:8*1024*1024} });
const uploadSermon  = multer({ storage: makeStorage(B+'sermons'),  fileFilter: audioFilter, limits:{fileSize:50*1024*1024} });
const uploadHero    = multer({ storage: makeStorage(B+'hero'),    fileFilter: imgFilter,   limits:{fileSize:8*1024*1024} });

module.exports = { uploadMember, uploadGallery, uploadEvent, uploadPost, uploadSermon, uploadHero };
