import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF, MP4 and WEBM are allowed.'));
    }
};

export const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB limit
    }
});

