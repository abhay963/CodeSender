# 🚀 CodeSender

✨ **Instantly send code snippets via Email or WhatsApp with screenshots**  
Built for developers who want to share code **fast, clean, and securely**.

🌐 Live Demo: **https://code-sender.vercel.app/**

---

## 🎥 Preview

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdXF2Y2RkOWM3cHVlMXl2eDV6ZHN1eGZ0b2RrMWZyY3Y0b3ZqY3Y0YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0HlNQ03J5JxX6lva/giphy.gif" width="700"/>
</p>

---

## ✨ Features

✅ Send **large code snippets** safely  
✅ Supports **Email & WhatsApp**  
✅ Upload or paste **multiple screenshots**  
✅ **Secure passkey access**  
✅ Animated **Three.js star background** 🌌  
✅ Smooth UI using **Framer Motion**  
✅ Automatic WhatsApp **text chunking** (handles long code)  
✅ Cloudinary image hosting  

---

## 🧠 Why CodeSender?

WhatsApp has strict limits for long text and media.  
**CodeSender intelligently splits large code** and sends it reliably, while images are delivered separately.

📌 **Best use case**:
- 📧 Email → full code + attachments  
- 💬 WhatsApp → quick delivery + screenshots  

---

## 🛠 Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,nodejs,express,twilio,threejs,tailwind,cloudinary,vercel" />
</p>

---

## 🔐 Security

- App is protected using a **4-digit passkey**
- Prevents unauthorized usage
- Passkey logic handled on frontend UI

---

## 📦 How It Works

### 1️⃣ Unlock App
Enter the secure passkey to access the dashboard.

### 2️⃣ Choose Channel
- 📧 Email  
- 💬 WhatsApp

### 3️⃣ Paste Code
Supports **very large code blocks**.

### 4️⃣ Add Screenshots
Upload or paste screenshots directly.

### 5️⃣ Send 🚀
CodeSender handles WhatsApp limits automatically.

---

## 🧩 WhatsApp Handling (Important)

✔️ Long code is **split into chunks**  
✔️ Images are sent **one by one**  
✔️ Rate-limited to avoid failures  

This ensures **100% reliable delivery**.

---

## ⚙️ Environment Variables

Create a `.env` file in backend:

```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14**********6

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
🚀 Local Setup
# Frontend
npm install
npm run dev

# Backend
npm install
node index.js

```

🤝 Contributing
Contributions are welcome!
Fork the repo → Create a branch → Make changes → Submit PR 🚀

⭐ Support
If you like this project, give it a star ⭐
It motivates further development!

👨‍💻 Author
Abhay Kumar Yadav
💼 B.Tech IT | Full Stack Developer
🌱 Building developer-focused tools

“Built by a developer, for developers.”


