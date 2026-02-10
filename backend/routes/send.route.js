import express from "express";
import { sendWhatsApp } from "../services/whatsapp.service.js";
import { sendEmail } from "../services/email.service.js";
import { validateRequest } from "../utils/validate.js";
import { uploadBase64Images } from "../utils/upload.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("📥 /api/send hit");

  try {
    // ✅ IMPORTANT: include images
    const { channel, content, email, phone, title, images } = req.body;

    console.log("📦 Payload received:", {
      channel,
      email,
      phone,
      hasContent: !!content,
      contentLength: content?.length,
      imagesExists: !!images,
      imagesIsArray: Array.isArray(images),
      imagesCount: images?.length,
      imageSample: images?.[0]?.slice?.(0, 30), // base64 preview
    });

    // ================= EMAIL =================
    if (channel === "email") {
      console.log("✉️ Email flow started");

      const error = validateRequest({ content, email });
      if (error) {
        console.log("❌ Email validation failed:", error);
        return res.status(400).json({ message: error });
      }

      // 🛑 STRONG IMAGE CHECKS
      if (images && !Array.isArray(images)) {
        console.log("❌ Images is not an array");
        return res.status(400).json({ message: "Invalid images format" });
      }

      if (Array.isArray(images)) {
        console.log(`🖼 Sending ${images.length} image(s) via email`);
      }

      // ✅ PASS IMAGES (THIS WAS THE MAIN BUG)
      await sendEmail(email, content, images || [], title);

      console.log("✅ Email sent successfully with attachments");

      return res.json({
        message: "Email sent successfully!",
      });
    }

    // ================= WHATSAPP =================
   // ================= WHATSAPP =================
if (channel === "whatsapp") {
  if (!phone) {
    return res.status(400).json({ message: "WhatsApp number required" });
  }

  let mediaUrls = [];

  if (Array.isArray(images) && images.length > 0) {
    mediaUrls = await uploadBase64Images(images);
  }

  await sendWhatsApp(phone, title, content, mediaUrls);

  return res.json({
    message: "WhatsApp message sent successfully!",
  });
}

    console.log("❌ Invalid channel:", channel);
    return res.status(400).json({ message: "Invalid channel" });
  } catch (err) {
    console.error("🔥 ERROR inside /api/send 🔥");
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

export default router;
