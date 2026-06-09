const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resource_type = 'auto';
    let folder = 'lms-portal';

    if (file.fieldname === 'video') {
      resource_type = 'video';
      folder = 'lms-portal/videos';
    } else if (file.fieldname === 'coverImage') {
      resource_type = 'image';
      folder = 'lms-portal/covers';
    } else if (file.fieldname === 'attachment') {
      resource_type = 'raw';
      folder = 'lms-portal/attachments';
    } else if (file.fieldname === 'document') {
      resource_type = 'raw';
      folder = 'lms-portal/documents';
    }

    return {
      folder,
      resource_type,
      public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'text/plain',
    ],
    coverImage: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    attachment: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'text/plain',
      'application/zip',
    ],
  };

  if (file.fieldname === 'video' && allowedTypes.video.includes(file.mimetype)) {
    return cb(null, true);
  }
  if (file.fieldname === 'document' && allowedTypes.document.includes(file.mimetype)) {
    return cb(null, true);
  }
  if (file.fieldname === 'coverImage' && allowedTypes.coverImage.includes(file.mimetype)) {
    return cb(null, true);
  }
  if (file.fieldname === 'attachment' && allowedTypes.attachment.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error(`Invalid file type for ${file.fieldname}: ${file.mimetype}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = upload;
