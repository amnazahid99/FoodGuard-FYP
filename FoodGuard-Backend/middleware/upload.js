const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// Only accept image uploads (receipt scans / avatars). Reject everything else
// with a clean 400 instead of forwarding a non-image to the OCR service.
function imageOnly(_req, file, cb) {
  if (/^image\/(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(file.mimetype)) {
    return cb(null, true);
  }
  const err = new Error('Only image files are allowed (jpg, png, webp, heic).');
  err.statusCode = 400;
  cb(err, false);
}

module.exports = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageOnly,
});
