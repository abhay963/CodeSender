import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

import {
  FaEnvelope,
  FaInfoCircle,
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

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

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
  const CORRECT_PASSKEY = "4176";

  const unlockingRef = useRef(false);

  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passkey, setPasskey] = useState("");

  const [channel, setChannel] = useState("email");
  const [content, setContent] = useState("");
  const [emailUser, setEmailUser] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const removeImage = (i) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  /* ================= PASSKEY LOGIC ================= */
  const handleUnlock = (val) => {
    if (unlockingRef.current) return;

    if (val === CORRECT_PASSKEY) {
      unlockingRef.current = true;
      setIsSuccess(true);

      setTimeout(() => {
        setIsUnlocked(true);
      }, 1400);
    } else {
      toast.error("❌ Wrong passkey");
      setShake(true);

      setTimeout(() => {
        setShake(false);
        setPasskey("");
      }, 400);
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




const showWhatsAppInfo = () => {
  toast(
    <div className="relative overflow-hidden rounded-2xl">

      {/* Soft Premium Gradient Border */}
      <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-emerald-400/40 via-green-500/30 to-teal-400/40">
        <div className="h-full w-full rounded-2xl bg-black/80 backdrop-blur-xl" />
      </div>

      {/* Subtle Moving Glow */}
      <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent rotate-12 animate-[pulse_4s_ease-in-out_infinite]" />

      {/* Content */}
      <div className="relative z-10 p-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
          <p className="text-sm font-semibold tracking-wide text-white">
            WhatsApp Activation Required
          </p>
        </div>

        {/* Instruction */}
        <p className="text-xs text-gray-400 leading-relaxed">
          To enable WhatsApp delivery, send the following message from your WhatsApp:
        </p>

        {/* Premium Command Box */}
        <div className="mt-4 rounded-xl border border-green-400/30 bg-black/60 backdrop-blur-md px-4 py-3">
          <p className="text-green-400 font-mono text-sm tracking-widest">
            join note-rather
          </p>
        </div>

        {/* Number */}
        <p className="mt-3 text-xs text-gray-500">
          Send to
          <span className="ml-2 text-green-300 font-medium tracking-wide">
            +1 415 523 8886
          </span>
        </p>

      </div>
    </div>,
    {
      autoClose: 8000,
      position: "top-center",
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
      style: {
        background: "transparent",
        boxShadow: "none",
      },
    }
  );
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
  "http://localhost:5000/api/send",
  payload
);


      toast.success(res.data.message || "Sent 🚀");
      setContent("");
      setEmailUser("");
      setPhone("");
      setTitle("");
      setImages([]);
    } catch {
      toast.error("Today’s WhatsApp limit exhausted. Try Email.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOCK SCREEN ================= */
/* ================= LOCK SCREEN ================= */
if (!isUnlocked) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-white relative overflow-hidden">
      {/* STAR BACKGROUND ALWAYS VISIBLE */}
      <StarBackground />
      <ToastContainer theme="dark" />

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="lock"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={
              shake
                ? { x: [-12, 12, -8, 8, 0] }
                : { opacity: 1, scale: 1, y: 0 }
            }
            transition={{ duration: 0.4 }}
            className="relative w-full max-w-sm"
          >
            {/* GLOW BORDER */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 blur-xl opacity-30" />

            {/* CARD */}
            <div className="relative bg-gray-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-center mb-2 tracking-wide">
                Secure Access
              </h2>
              <p className="text-sm text-gray-400 text-center mb-8">
                Enter your 4-digit passkey
              </p>

              {/* PASSKEY DOTS */}
              <div className="flex justify-center gap-4 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: passkey.length > i ? 1.15 : 1,
                      backgroundColor:
                        passkey.length > i
                          ? "rgba(34,211,238,0.25)"
                          : "rgba(255,255,255,0.06)",
                      borderColor:
                        passkey.length > i
                          ? "#22d3ee"
                          : "rgba(255,255,255,0.15)",
                    }}
                    transition={{ type: "spring", stiffness: 260 }}
                    className="h-14 w-14 rounded-2xl border flex items-center justify-center"
                  >
                    {passkey.length > i && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]"
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* INVISIBLE INPUT */}
              <input
                type="tel"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={passkey}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPasskey(val);
                  if (val.length === 4) handleUnlock(val);
                }}
                className="absolute inset-0 opacity-0"
              />

              {/* PULSE TEXT */}
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs text-center text-gray-500 tracking-widest"
              >
                🔐 ENCRYPTED INPUT
              </motion.p>
            </div>
          </motion.div>
        ) : (
          /* SUCCESS STATE (NO FULLSCREEN BG – STARS STILL SHOW) */
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220 }}
              className="w-28 h-28 rounded-full bg-green-500/20 border border-green-400 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.6)]"
            >
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
                viewBox="0 0 24 24"
                className="w-14 h-14 text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M5 13l4 4L19 7" />
              </motion.svg>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-green-300 tracking-widest text-sm"
            >
              ACCESS GRANTED
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
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
    onClick={() => {
    setChannel("whatsapp");
    showWhatsAppInfo();
  }}
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
