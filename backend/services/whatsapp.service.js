import twilio from "twilio";

console.log("🔑 Twilio ENV CHECK:", {
  hasSID: !!process.env.TWILIO_ACCOUNT_SID,
  hasToken: !!process.env.TWILIO_AUTH_TOKEN,
  from: process.env.TWILIO_WHATSAPP_FROM,
});

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MAX_CHARS = 1500;

export const sendWhatsApp = async (to, title, content) => {
  console.log("➡️ sendWhatsApp() called");
  console.log("📞 to:", to);
  console.log("📝 title:", title);
  console.log("📄 content length:", content?.length);

  if (!content) {
    console.log("❌ Content is empty");
    throw new Error("WhatsApp content is empty");
  }

  const chunks = [];
  for (let i = 0; i < content.length; i += MAX_CHARS) {
    chunks.push(content.slice(i, i + MAX_CHARS));
  }

  console.log("🧩 Total WhatsApp chunks:", chunks.length);

  const MAX_PARTS = 2;

  // ================= TITLE =================
  if (title) {
    console.log("📝 Sending title message...");

    try {
      const res = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${to}`,
        body: `📄 ${title}`,
      });

      console.log("✅ Title message SID:", res.sid);
    } catch (err) {
      console.error("❌ ERROR sending title message");
      console.error(err);

      // 🔥 ONLY CHANGE
      throw new Error("Today’s WhatsApp message limit is exhausted");
    }
  }

  // ================= CHUNKS =================
  for (let i = 0; i < Math.min(chunks.length, MAX_PARTS); i++) {
    console.log(`📤 Sending chunk ${i + 1}/${chunks.length}`);

    try {
      const res = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${to}`,
        body: `📄 Code (${i + 1}/${chunks.length})\n\n${chunks[i]}`,
      });

      console.log("✅ Chunk sent SID:", res.sid);
    } catch (err) {
      console.error(`❌ ERROR sending chunk ${i + 1}`);
      console.error(err);

      // 🔥 ONLY CHANGE
      throw new Error("Today’s WhatsApp message limit is exhausted");
    }
  }

  console.log("🎉 sendWhatsApp completed successfully");
};
