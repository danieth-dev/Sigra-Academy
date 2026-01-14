import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Ensure upload directory exists for submissions
const UPLOAD_ROOT = path.resolve('uploads', 'submissions');
if(!fs.existsSync(UPLOAD_ROOT)){
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

// Ensure upload directory exists for course resources
const UPLOAD_ROOT_RESOURCES = path.resolve('uploads', 'resources');
if(!fs.existsSync(UPLOAD_ROOT_RESOURCES)){
    fs.mkdirSync(UPLOAD_ROOT_RESOURCES, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Allow routes to override destination via req.uploadDestination
        const dest = req.uploadDestination || UPLOAD_ROOT;
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}_${safeName}`);
    }
});

// Limit to 20 MB and accept common document/image types
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|doc|docx|txt|ppt|pptx|jpg|jpeg|png|gif|zip/;
        const ext = file.originalname.split('.').pop().toLowerCase();
        if(allowed.test(ext)) return cb(null, true);
        cb(new Error('Tipo de archivo no permitido'));
    }
});

export const uploadSingle = (fieldName) => upload.single(fieldName);
export const UPLOAD_ROOT_PATH = UPLOAD_ROOT;
export const UPLOAD_ROOT_RESOURCES_PATH = UPLOAD_ROOT_RESOURCES;

// Helper middleware to set upload destination to resources folder
export const useResourcesUpload = (req, res, next) => {
    req.uploadDestination = UPLOAD_ROOT_RESOURCES;
    next();
};
