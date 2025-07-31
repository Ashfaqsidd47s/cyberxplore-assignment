import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import dotenv from "dotenv"
import File from '../models/File';
import queueFileForScanning from '../services/queueFileScan';
import ImageKit from 'imagekit';


const router = express.Router();
dotenv.config();

const IMAGEKIT_PUBLIC_URL = process.env.IMAGEKIT_URL_ENDPOINT

// Multer config — use memory storage instead of disk
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = /(.pdf|.doc|.docx|.jpg|.png)$/i;
        if (!allowedTypes.test(file.originalname)) {
            return cb(new Error('Only PDF, DOC, DOCX, JPG, and PNG files are allowed!'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

//  Custom error handling middleware for multer
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'File size exceeds the maximum limit of 5MB' 
            });
        }
        return res.status(400).json({ 
            message: 'File upload error', 
            error: err.message 
        });
    } else if (err.message === 'Only PDF, DOC, DOCX, JPG, and PNG files are allowed!') {
        return res.status(400).json({ 
            message: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed' 
        });
    }
    next(err); // Pass other errors to the default error handler
};

// ImageKit config
const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

// UPLOAD FILE to ImageKit
router.post('/upload', upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { originalname, buffer, mimetype } = req.file;
        const uniqueFilename = `${Date.now()}-${originalname}`;

        
        // Upload directly to ImageKit
        const response = await imageKit.upload({
            file: buffer,
            fileName: uniqueFilename,
            folder: "cyberx"
        });
        
        const filepath = IMAGEKIT_PUBLIC_URL +  response.filePath
        
        // Save metadata to DB
        const newFile = new File({
            filename: originalname,
            path: filepath, // from ImageKit
            status: 'pending',
            publicUrl: response.url,
        });
        
        await newFile.save();
        
        // Queue file for scanning
        queueFileForScanning(newFile._id.toString(), response.url).catch(async (err) => {
            console.error(`Failed to queue file for scanning: ${err.message}`);
            // Update file status to indicate failure
            await File.findByIdAndUpdate(newFile._id, { status: 'failed' });
        });
        
        res.json({ message: 'File uploaded successfully', file: newFile });

    } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error });
    }
});

// GET ALL FILES
router.get('/', async (req: Request, res: Response) => {
    try {
        const files = await File.find().sort({ updatedAt: -1 });
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching files', error });
    }
});

export default router;