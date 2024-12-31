import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadoncloudinary = async (filepath) => {
    try {
        if (!filepath) return null

        const response = await cloudinary.uploader.upload(filepath, {
            resource_type: "auto"
        })
        //file uploaded successfully

        // console.log("file is uploaded successfully on cloudinary", response)
        fs.unlinkSync(filepath)
        return response;
    } catch (error) {
        fs.unlinkSync(filepath) // removes the locally saved temporary file as the upload operation got failed

        return null;
    }
}

export { uploadoncloudinary }