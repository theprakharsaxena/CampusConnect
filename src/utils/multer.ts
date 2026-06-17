import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Client compresses images to ≤5 MB before sending.
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});
