import { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";

// Convert file to base64
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

const SendForm = () => {
  const [channel, setChannel] = useState("email");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // only digits
  const [title, setTitle] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ❌ Remove selected image
  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // 📋 Paste screenshots (Ctrl + V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith("image")) {
        const file = item.getAsFile();
        if (file) {
          setImages((prev) => [...prev, file]);
          toast.success("Screenshot pasted!");
        }
      }
    }
  };

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error("Code content is required");
      return;
    }

    if (channel === "email" && !email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (channel === "whatsapp" && phone.length !== 10) {
      toast.error("Enter a valid 10-digit WhatsApp number");
      return;
    }

    try {
      setLoading(true);
      toast.info("Sending...");

      const base64Images = await Promise.all(
        images.map((img) => toBase64(img))
      );

      const payload = {
        channel,
        content,
        title,
        images: base64Images,
        email,
        phone: channel === "whatsapp" ? `+91${phone}` : phone,
      };

    const res = await axios.post(
  `${import.meta.env.VITE_BACKEND_URL}/api/send`,
  payload
);



      toast.success(res.data.message || "Sent successfully!");
      setContent("");
      setEmail("");
      setPhone("");
      setTitle("");
      setImages([]);
    } catch {
      toast.error("Failed to send. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#0f0c29] via-[#302b63] to-[#24243e] px-4"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">

        <h1 className="text-3xl font-bold text-white text-center mb-6">
          Code<span className="text-purple-400">Sender</span>
        </h1>

        {/* 🔀 CHANNEL TOGGLE */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setChannel("email")}
            className={`flex-1 py-2 rounded-xl ${
              channel === "email"
                ? "bg-purple-600 text-white"
                : "bg-black/30 text-gray-400"
            }`}
          >
            Send Email
          </button>

          <button
            onClick={() => setChannel("whatsapp")}
            className={`flex-1 py-2 rounded-xl ${
              channel === "whatsapp"
                ? "bg-green-600 text-white"
                : "bg-black/30 text-gray-400"
            }`}
          >
            Send WhatsApp
          </button>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-gray-100 mb-3"
        />

        {/* Code */}
        <textarea
          rows="6"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="// Paste your code here..."
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-gray-100 font-mono mb-3"
        />

        {/* CONDITIONAL INPUT */}
        {channel === "email" ? (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Recipient email"
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-gray-100 mb-3"
          />
        ) : (
          <div className="flex mb-3">
            <span className="px-4 py-3 bg-black/40 border border-white/10 rounded-l-xl text-gray-300">
              +91
            </span>
            <input
              type="text"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, ""))
              }
              placeholder="WhatsApp number"
              className="flex-1 rounded-r-xl bg-black/30 border border-white/10 px-4 py-3 text-gray-100"
            />
          </div>
        )}

        {/* Images */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImages([...e.target.files])}
          className="w-full text-gray-300 mb-3"
        />

        {/* Selected images with CUT option */}
        {images.length > 0 && (
          <div className="space-y-2 mb-3">
            {images.map((img, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-black/40 border border-white/10 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-gray-200 truncate">
                  {img.name || `Screenshot ${index + 1}`}
                </span>
                <button
                  onClick={() => removeImage(index)}
                  className="text-red-400 hover:text-red-500 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default SendForm;
