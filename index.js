require("dotenv").config(); // making sure dotenv is loaded.
const express = require("express");
const app = express();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

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

// api route for uploading the images
app.post('/upload', upload.array('images', 3), async (req, res) => {
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