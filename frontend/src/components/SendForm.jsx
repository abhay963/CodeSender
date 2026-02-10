import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { motion } from "framer-motion";
import * as THREE from "three";


import {
  FaEnvelope,
  FaInfoCircle ,
  FaWhatsapp,
  FaPaperPlane,
  FaTimes,
  FaImage,
} from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

/* ================= THREE.JS BACKGROUND ================= */
const StarBackground = () => {
  const mountRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const count = 700;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 0.02,
      transparent: true,
      opacity: 0.8,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const animate = () => {
      points.rotation.y += 0.0006;
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 -z-10 bg-[#0f0c29]" />;
};

/* ================= HELPER ================= */
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

/* ================= MAIN COMPONENT ================= */
const SendForm = () => {
  const [channel, setChannel] = useState("email");
  const [content, setContent] = useState("");
  const [emailUser, setEmailUser] = useState(""); // ✅ username only
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passkey, setPasskey] = useState("");

  const removeImage = (i) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleUnlock = () => {
    if (passkey === "4176") {
      setIsUnlocked(true);
      toast.success("Access granted 🔓");
    } else {
      toast.error("Wrong passkey ❌");
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      if (item.type.startsWith("image")) {
        setImages((p) => [...p, item.getAsFile()]);
        toast.success("Screenshot pasted 📸");
      }
    }
  };

  const handleSend = async () => {
    if (!content.trim()) return toast.error("Code content required");
    if (channel === "email" && !emailUser.trim())
      return toast.error("Email username required");
    if (channel === "whatsapp" && phone.length !== 10)
      return toast.error("Enter a valid 10-digit WhatsApp number");

    try {
      setLoading(true);

      const base64Images = await Promise.all(images.map(toBase64));

      const payload = {
        channel,
        content,
        title,
        images: base64Images,
        email: channel === "email" ? `${emailUser}@gmail.com` : "",
        phone: channel === "whatsapp" ? `+91${phone}` : phone,
      };

   const res = await axios.post(
  `${import.meta.env.VITE_BACKEND_URL}/api/send`,
  payload
);



      toast.success(res.data.message || "Sent 🚀");
      setContent("");
      setEmailUser("");
      setPhone("");
      setTitle("");
      setImages([]);
    } catch (err) {
      toast.error("Today’s WhatsApp message limit is exhausted.Try Using Mail");
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-white">
        <StarBackground />
        <ToastContainer theme="dark" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl z-10"
        >
          <h2 className="text-2xl font-bold text-center mb-4">
            Enter Passkey 🔐
          </h2>

          <input
            type="password"
            maxLength={4}
            value={passkey}
            onChange={(e) =>
              setPasskey(e.target.value.replace(/\D/g, ""))
            }
            placeholder="4-digit passkey"
            className="w-full text-center tracking-widest text-xl p-3 rounded-xl bg-black/40 mb-4"
          />

          <button
            onClick={handleUnlock}
            className="w-full py-3 rounded-xl bg-purple-600 font-bold cursor-pointer"
          >
            Unlock
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 text-white"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <StarBackground />
      <ToastContainer theme="dark" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
      >
        <h1 className="text-4xl font-extrabold text-center mb-6">
          Code<span className="text-purple-400">Sender</span>
        </h1>

        {/* CHANNEL */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setChannel("email")}
            className={`flex-1 py-3 rounded-xl cursor-pointer ${
              channel === "email"
                ? "bg-purple-600"
                : "bg-black/30 text-gray-400"
            }`}
          >
            <FaEnvelope className="inline mr-2" /> Email
          </button>

         <div className="flex-1 flex items-center gap-2">
  <button
    onClick={() => setChannel("whatsapp")}
    className={`flex-1 py-3 rounded-xl cursor-pointer ${
      channel === "whatsapp"
        ? "bg-green-600"
        : "bg-black/30 text-gray-400"
    }`}
  >
    <FaWhatsapp className="inline mr-2" /> WhatsApp
  </button>

  {/* INFO ICON */}
  <div className="relative group">
  
<motion.div
  animate={{
    scale: [1, 1.2, 1],
    textShadow: [
      "0px 0px 0px rgba(74, 222, 128, 0)",
      "0px 0px 20px rgba(74, 222, 128, 0.8)",
      "0px 0px 0px rgba(74, 222, 128, 0)",
    ],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  }}
>
  <FaInfoCircle className="text-green-400 cursor-pointer" />
</motion.div>

    {/* TOOLTIP */}
    <div className="absolute right-0 top-8 w-72 text-sm bg-black/90 text-white p-3 rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none z-20">
      To receive WhatsApp messages, first send this message from your WhatsApp:
      <br />
      <span className="block mt-2 text-green-400 font-mono">
        join note-rather
      </span>
      <span className="block mt-1 text-gray-300">
        to <b>+1 415 523 8886</b>
      </span>
    </div>
  </div>
</div>

        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full mb-3 p-3 rounded-xl bg-black/30"
        />

        <textarea
          rows="6"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="// Paste your code here..."
          className="w-full mb-3 p-3 rounded-xl bg-black/30 font-mono"
        />

        {/* EMAIL / WHATSAPP */}
        {channel === "email" ? (
          <div className="flex mb-3">
            <input
              value={emailUser}
              onChange={(e) =>
                setEmailUser(e.target.value.replace(/\s/g, ""))
              }
              placeholder="Email username"
              className="flex-1 p-3 rounded-l-xl bg-black/30"
            />
            <span className="px-4 py-3 bg-black/50 border border-white/10 rounded-r-xl text-gray-300 select-none">
              @gmail.com
            </span>
          </div>
        ) : (
          <div className="flex mb-3">
            <span className="px-4 py-3 bg-black/50 border border-white/10 rounded-l-xl text-gray-300 select-none">
              +91
            </span>
            <input
              type="text"
              value={phone}
              maxLength={10}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, ""))
              }
              placeholder="WhatsApp number"
              className="flex-1 p-3 rounded-r-xl bg-black/30 outline-none"
            />
          </div>
        )}

        {/* IMAGE UPLOAD */}
        <label className="block cursor-pointer mb-4">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              setImages((p) => [...p, ...Array.from(e.target.files)])
            }
          />
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-purple-400 transition">
            <FaImage className="mx-auto mb-2 text-purple-400" />
            <p className="text-sm">Click to upload or paste screenshots</p>
          </div>
        </label>

        {images.length > 0 && (
          <div className="space-y-2 mb-4">
            {images.map((img, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg"
              >
                <span className="text-sm truncate">
                  {img.name || `Screenshot ${i + 1}`}
                </span>
                <button onClick={() => removeImage(i)}>
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSend}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold cursor-pointer"
        >
          <FaPaperPlane className="inline mr-2" />
          {loading ? "Sending..." : "Send"}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SendForm;
