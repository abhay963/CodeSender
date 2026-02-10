import "dotenv/config";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testWhatsApp() {
  try {
    const res = await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio sandbox
      to: "whatsapp:+91XXXXXXXXXX",  // YOUR number (joined to sandbox)
      body: "✅ Test message from Twilio 🚀",
    });

    console.log("✅ Message accepted by Twilio");
    console.log("SID:", res.sid);
    console.log("Status:", res.status);
  } catch (err) {
    console.error("❌ Twilio error");
    console.error(err.message);
  }
}

testWhatsApp();
