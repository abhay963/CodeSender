import express from "express";
import { sendWhatsApp } from "../services/whatsapp.service.js";
import { sendEmail } from "../services/email.service.js";
import { validateRequest } from "../utils/validate.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { channel, content, email, phone, title, images } = req.body;

    // EMAIL
    if (channel === "email") {
      const error = validateRequest({ content, email });
      if (error) return res.status(400).json({ message: error });

      await sendEmail(email, content, images || [], title);
      return res.json({ message: "Email sent successfully!" });
    }

    // WHATSAPP
    if (channel === "whatsapp") {
      if (!phone)
        return res.status(400).json({ message: "WhatsApp number required" });

      await sendWhatsApp(phone, title, content, images || []);
      return res.json({ message: "WhatsApp sent successfully!" });
    }

    res.status(400).json({ message: "Invalid channel" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
