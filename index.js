require("dotenv").config(); // making sure dotenv is loaded.
const express = require("express");
const app = express();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require('streamifier');

// cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

// create a home route
app.get("/", (req, res) => {
    res.json({"message": "you have reached the home route!!!"});
});

// single image upload endpoint
app.post('/upload-single', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({error: 'No image provided'});
        }

        // Create a readable stream from the buffer
        const stream = cloudinary.uploader.upload_stream({folder: "powerline_incident_images"}, (error, result) => {
            if (error) {
                console.error('Error uploading image:', error);
                res.status(500).json({error: 'Internal Server Error'});
            } else {
                const imageUrl = result.secure_url;
                res.json({url: imageUrl});
            }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// multiple image upload endpoint
app.post('/upload-multiple', upload.array('images', 3), async (req, res) => {
    try {
        const uploadedPromises = req.files.map(async (file) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({folder: "powerline_images"}, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result.secure_url);
                    }
                });

                // Pipe the file buffer to Cloudinary upload stream
                uploadStream.end(file.buffer);
            });
        });

        const uploadedUrls = await Promise.all(uploadedPromises);

        res.json({urls: uploadedUrls});
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});
// run server
let port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on ${"http://localhost:" + port}`));