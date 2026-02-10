import twilio from "twilio";
import { uploadBase64ToCloudinary } from "../utils/upload.js";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const splitText = (text, size = 3000) => {
  const parts = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.substring(i, i + size));
  }
  return parts;
};

export const sendWhatsApp = async (to, title, content, images = []) => {
  const textParts = splitText(
    `${title ? `📄 ${title}\n\n` : ""}${content}`
  );

  // 1️⃣ Send text in parts
  for (const part of textParts) {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: part,
    });
  }

  // 2️⃣ Send images one by one
  for (let i = 0; i < images.length; i++) {
    const imageUrl = await uploadBase64ToCloudinary(images[i]);

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      mediaUrl: [imageUrl],
    });
  }
};
