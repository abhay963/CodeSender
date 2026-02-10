import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MAX_CHARS = 1500;

export const sendWhatsApp = async (to, title, content, mediaUrls = []) => {
  if (!content) throw new Error("WhatsApp content is empty");

  const chunks = [];
  for (let i = 0; i < content.length; i += MAX_CHARS) {
    chunks.push(content.slice(i, i + MAX_CHARS));
  }

  // ---------- TITLE ----------
  if (title) {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: `📄 ${title}`,
    });
  }

  // ---------- CONTENT ----------
  for (let i = 0; i < Math.min(chunks.length, 2); i++) {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: `📄 Code (${i + 1}/${chunks.length})\n\n${chunks[i]}`,
      ...(mediaUrls.length > 0 && i === 0
        ? { mediaUrl: mediaUrls }
        : {}),
    });
  }
};
