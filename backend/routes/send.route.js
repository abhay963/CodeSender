import express from "express";
import cloudinary from "../config/cloudinary.js";
import { sendWhatsApp } from "../services/whatsapp.service.js";
import { sendEmail } from "../services/email.service.js";
import { validateRequest } from "../utils/validate.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("📥 /api/send hit");

  try {
    const { channel, content, email, phone, title } = req.body;

    console.log("📦 Payload received:", {
      channel,
      email,
      phone,
      hasContent: !!content,
      contentLength: content?.length,
    });

    // ================= EMAIL =================
    if (channel === "email") {
      console.log("✉️ Email flow started");

      const error = validateRequest({ content, email });
      if (error) {
        console.log("❌ Email validation failed:", error);
        return res.status(400).json({ message: error });
      }

      await sendEmail(email, content, [], title);
      console.log("✅ Email sent successfully");

      return res.json({ message: "Email sent successfully!" });
    }

    // ================= WHATSAPP =================
    if (channel === "whatsapp") {
      console.log("📲 WhatsApp flow started");

      if (!phone) {
        console.log("❌ WhatsApp phone missing");
        return res.status(400).json({ message: "WhatsApp number required" });
      }

      console.log("📞 WhatsApp target:", phone);
      console.log("🧪 About to call sendWhatsApp");

      await sendWhatsApp(phone, title, content);

      console.log("✅ WhatsApp sent successfully");

      return res.json({
        message: "WhatsApp code sent as text!",
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
