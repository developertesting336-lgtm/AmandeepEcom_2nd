import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

const uploadBufferToCloudinary = (buffer, folder) => {

    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image"
            },

            (error, result) => {

                if (error) return reject(error);

                resolve({
                    public_id: result.public_id,
                    url: result.secure_url
                });
            }
        );

        Readable.from(buffer).pipe(stream);
    });
};


export default uploadBufferToCloudinary;

