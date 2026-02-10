import cloudinary from "../config/cloudinary.js";

export const uploadBase64ToCloudinary = async (base64) => {
  const res = await cloudinary.uploader.upload(base64, {
    folder: "codesender",
    resource_type: "image",
  });

  return res.secure_url;
};
