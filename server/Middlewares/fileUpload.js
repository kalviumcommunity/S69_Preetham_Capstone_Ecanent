import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|pdf|doc|txt|docx|mp4|mov|pptx/;
        const extname = fileTypes.test(file.originalname.toLowerCase().split(".").pop());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error("Only JPEG, JPG, PNG, PDF, DOC, TXT, DOCX, MP4, MOV, and PPTX files are allowed!"));
        }
    },
    limits: { fileSize: 100 * 1024 * 1024 }, 
});

export default upload;