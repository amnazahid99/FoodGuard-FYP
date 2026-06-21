const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

function imageOnly(_req, file, cb) {
  if (/^image\/(jpe?g|png|webp)$/i.test(file.mimetype)) {
    return cb(null, true);
  }
  const err = new Error('Only jpg, jpeg, png, and webp images are allowed.');
  err.statusCode = 400;
  cb(err, false);
}

module.exports = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageOnly,
});
