import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MAX_CHARS = 1500; // WhatsApp safe limit

export const sendWhatsApp = async (to, title, content) => {
  const chunks = [];

  for (let i = 0; i < content.length; i += MAX_CHARS) {
    chunks.push(content.slice(i, i + MAX_CHARS));
  }

  // Optional title message
  if (title) {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: `📄 ${title}\nTotal parts: ${chunks.length}`,
    });
  }

  // Send code chunks
  for (let i = 0; i < chunks.length; i++) {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: `📄 Code (${i + 1}/${chunks.length})\n\n${chunks[i]}`,
    });
  }
};
