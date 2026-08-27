import dotenv from "dotenv";
dotenv.config();

import cloudinary from "./config/cloudinary.js";

const run = async () => {
  try {
    console.log(cloudinary.config());

    const result = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    );

    console.log(result.secure_url);
  } catch (err) {
    console.error(err);
  }
};

run();