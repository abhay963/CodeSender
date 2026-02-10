import cloudinary from "../config/cloudinary.js";

export const uploadBase64Images = async (base64Images = []) => {
  if (!Array.isArray(base64Images) || base64Images.length === 0) return [];

  const urls = [];

  for (const base64 of base64Images) {
    if (!base64) continue;

    const res = await cloudinary.uploader.upload(base64, {
      folder: "codesender/whatsapp",
      resource_type: "image",
    });

    urls.push(res.secure_url);
  }

  return urls;
};
