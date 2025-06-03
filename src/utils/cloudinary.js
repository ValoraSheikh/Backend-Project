import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_KEY_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath)
    return res;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove locally save file as the upload operation failed
  }
};

const deleteFromCloudinary = async (cloudUrl) => {
  try {
    // Extract the public ID from the URL
    const publicId = cloudUrl.split("/").pop().split(".")[0];

    // Delete the file using the public ID
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Deleted:", result);

    return result;
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

const deleteVideoFromCloudinary = async (cloudUrl) => {
  try {
    // Extract the public ID from the URL
    const urlParts = cloudUrl.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
    console.log("Deleted:", result);

    return result;
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary };
