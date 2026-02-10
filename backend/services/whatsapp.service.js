import twilio from "twilio";
import { uploadBase64ToCloudinary } from "../utils/upload.js";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendWhatsApp = async (to, title, content, images = []) => {
  console.log("➡️ sendWhatsApp() called");

  // 1️⃣ Send TEXT first
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to}`,
    body: `${title ? `📄 ${title}\n\n` : ""}${content}`,
  });

  console.log("✅ Text sent");

  // 2️⃣ Send EACH image separately
  if (Array.isArray(images) && images.length > 0) {
    console.log(`🖼 Sending ${images.length} image(s)`);

    for (let i = 0; i < images.length; i++) {
      const imageUrl = await uploadBase64ToCloudinary(images[i]);

      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${to}`,
        mediaUrl: [imageUrl], // ⚠️ ONE IMAGE ONLY
      });

      console.log(`✅ Image ${i + 1} sent`);
    }
  }
};
