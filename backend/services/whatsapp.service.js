import twilio from "twilio";
import { uploadBase64ToCloudinary } from "../utils/upload.js";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const splitText = (text, size = 1600) => {
  const parts = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.substring(i, i + size));
  }
  return parts;
};

export const sendWhatsApp = async (to, title, content, images = []) => {
  const fullText = `${title ? `📄 ${title}\n\n` : ""}${content}`;
  const textParts = splitText(fullText, 1600);

  console.log(`📤 Sending WhatsApp text in ${textParts.length} chunk(s)`);

  // 1️⃣ Send text chunks
  for (const part of textParts) {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: part,
    });
  }

  // 2️⃣ Send images only
  for (const file of images) {
    if (!file?.data) continue;

    const imageUrl = await uploadBase64ToCloudinary(file);

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: "📎 Image",
      mediaUrl: [imageUrl],
    });
  }

  console.log("✅ WhatsApp sending completed");
};

