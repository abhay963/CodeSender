import express from "express";
import cloudinary from "../config/cloudinary.js";
import { sendWhatsApp } from "../services/whatsapp.service.js";
import { sendEmail } from "../services/email.service.js";
import { validateRequest } from "../utils/validate.js";
import PDFDocument from "pdfkit";
import streamifier from "streamifier";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { channel, content, email, phone, title, images = [] } = req.body;

    // ================= EMAIL =================
    if (channel === "email") {
      const error = validateRequest({ content, email });
      if (error) {
        return res.status(400).json({ message: error });
      }

      await sendEmail(email, content, images, title);
      return res.json({ message: "Email sent successfully!" });
    }

   if (channel === "whatsapp") {
  if (!phone) {
    return res.status(400).json({ message: "WhatsApp number required" });
  }

  await sendWhatsApp(phone, title, content);

  return res.json({
    message: "WhatsApp code sent as text!",
  });
}


    return res.status(400).json({ message: "Invalid channel" });
  } catch (err) {
    console.error("SEND ROUTE ERROR 👉", err);
    return res.status(500).json({ message: "Failed to send" });
  }
});

export default router;
