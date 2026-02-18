import cloudinary from "../config/cloudinary.js";

export const uploadBase64ToCloudinary = async (file) => {
  if (!file?.data) {
    throw new Error("Invalid file format");
  }

  const res = await cloudinary.uploader.upload(file.data, {
    folder: "codesender",
    resource_type: "auto",   // 🔥 VERY IMPORTANT
  });

  return res.secure_url;
};
