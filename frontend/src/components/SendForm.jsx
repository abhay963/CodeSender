import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaCopy,   FaGem,FaTrash, FaCloudUploadAlt } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  updateDoc        // ✅ ADD THIS
} from "firebase/firestore";
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
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type,
        data: reader.result,
      });
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
  const [savedCodes, setSavedCodes] = useState([]);
const [showSaved, setShowSaved] = useState(false);
const [newSavedTitle, setNewSavedTitle] = useState("");
const [newSavedContent, setNewSavedContent] = useState("");
const textareaRef = useRef(null);
const [editingId, setEditingId] = useState(null);
const [editingTitle, setEditingTitle] = useState("");
const [editingContent, setEditingContent] = useState("");

const fetchCodes = async () => {
  const q = query(collection(db, "codes"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const allCodes = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  setSavedCodes(allCodes);
};






const updateCode = async () => {
  if (!editingContent.trim()) {
    toast.error("Code cannot be empty");
    return;
  }

  await updateDoc(doc(db, "codes", editingId), {
    title: editingTitle,
    content: editingContent,
    updatedAt: serverTimestamp(),   // Track update time
  });

  toast.success("Code updated ✨");

  setEditingId(null);
  setEditingTitle("");
  setEditingContent("");

  fetchCodes();
};






const saveNewCodeDirectly = async () => {
  if (!newSavedContent.trim()) {
    showError("⚠ Code cannot be empty");
    return;
  }

  const loadingToast = toast.loading("💾 Saving to Cloud Vault...", {
    position: "top-center",
    theme: "dark",
  });

  try {
    await addDoc(collection(db, "codes"), {
      title: newSavedTitle,
      content: newSavedContent,
      createdAt: serverTimestamp(),
    });

    setNewSavedTitle("");
    setNewSavedContent("");

    await fetchCodes();

    toast.update(loadingToast, {
      render: "☁️ Code saved successfully!",
      type: "success",
      isLoading: false,
      autoClose: 2000,
    });

  } catch (err) {
    toast.update(loadingToast, {
      render: "❌ Failed to save code",
      type: "error",
      isLoading: false,
      autoClose: 2500,
    });
  }
};

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



  const loadingToast = toast.loading(
    channel === "email"
      ? "📧 Sending Email..."
      : "📲 Sending WhatsApp...",
    {
      position: "top-center",
      theme: "dark",
    }
  );

  try {
    setLoading(true);

    const base64Files = await Promise.all(images.map(toBase64));

    // 🚫 If WhatsApp and non-image selected → block
    if (channel === "whatsapp") {
      const nonImages = base64Files.filter(
        (file) => !file.type.startsWith("image/")
      );

      if (nonImages.length > 0) {
        toast.error(
          "WhatsApp can only send text, code or images. Documents are not supported."
        );
        setLoading(false);
        return;
      }
    }

    const payload =
      channel === "email"
        ? {
            channel,
            content,
            title,
            files: base64Files,
            email: `${emailUser}@gmail.com`,
          }
        : {
            channel,
            content,
            title,
            images: base64Files, // Only images
            phone: `+91${phone}`,
          };

   const res = await axios.post(
  `${import.meta.env.VITE_BACKEND_URL}/api/send`,
  payload
);




    toast.update(loadingToast, {
  render:
    channel === "email"
      ? "✅ Email sent successfully!"
      : "✅ WhatsApp sent successfully!",
  type: "success",
  isLoading: false,
  autoClose: 2000,
});


    setContent("");
    setEmailUser("");
    setPhone("");
    setTitle("");
    setImages([]);
} catch (err) {
  toast.update(loadingToast, {
    render: "❌ Failed to send. Try again.",
    type: "error",
    isLoading: false,
    autoClose: 2500,
  });
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
      {/* 🔥 Premium Animated Header */}
<div className="text-center mb-10">
  <motion.div
    initial={{ scale: 0, rotate: 180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 200 }}
    className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 
               rounded-3xl flex items-center justify-center 
               mx-auto mb-5 shadow-2xl shadow-purple-500/50"
  >
    <FaGem className="text-2xl text-white drop-shadow-lg" />
  </motion.div>

  <motion.h1
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="text-4xl md:text-5xl font-black 
               bg-gradient-to-r from-white via-purple-100 to-pink-100 
               bg-clip-text text-transparent tracking-tight"
  >
    Code
    <span className="text-transparent bg-gradient-to-r 
                     from-purple-400 to-pink-400 bg-clip-text">
      Sender
    </span>
    <span className="text-sm font-light block text-gray-400 mt-2 tracking-widest">
      PRO
    </span>
  </motion.h1>
</div>

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
         <div className="mb-3">
  <div className="flex">
    <input
      value={emailUser}
      onChange={(e) =>
        setEmailUser(
          e.target.value
            .replace(/\s/g, "")
            .replace(/@.*/, "") // remove anything after @
        )
      }
      onFocus={() =>
        toast.info(
          "Only enter your Gmail username. @gmail.com is added automatically.",
          {
            position: "top-center",
            autoClose: 3000,
            theme: "dark",
          }
        )
      }
      placeholder="Enter Gmail username"
      className="flex-1 p-3 rounded-l-xl bg-black/30 outline-none"
    />
    <span className="px-4 py-3 bg-black/50 border border-white/10 rounded-r-xl text-gray-300 select-none">
      @gmail.com
    </span>
  </div>


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
           accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"

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

    
<button
  onClick={async () => {
    const loadingToast = toast.loading("⏳ Have patience, loading codes...");

    await fetchCodes();
    setShowSaved(true);

    toast.update(loadingToast, {
      render: "☁️ Cloud Vault Loaded!",
      type: "success",
      isLoading: false,
      autoClose: 2000,
    });
  }}
  className="mt-7 w-full flex items-center justify-center gap-2 py-3 rounded-xl
             bg-gradient-to-r from-indigo-600 to-purple-600
             text-white font-medium shadow-md
             hover:from-indigo-500 hover:to-purple-500
             hover:shadow-lg hover:scale-105
             transition-all duration-200 cursor-pointer"
>
  <FaCloudUploadAlt className="text-lg" />
  Save Your Code
</button>


      </motion.div>

{showSaved && (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-2xl flex items-center justify-center z-50 p-4"
    onClick={() => setShowSaved(false)}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120 }}
      className="w-full max-w-4xl max-h-[90vh] overflow-y-auto 
                 bg-gradient-to-br from-gray-900/95 via-black/50 to-gray-900/95 
                 border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/20"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="sticky top-0 p-8 border-b border-white/10 bg-black/50 backdrop-blur-xl rounded-t-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
            ☁️ Cloud Vault
          </h2>

          <button
            onClick={() => setShowSaved(false)}
            className="p-3 hover:bg-white/10 rounded-2xl transition"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Quick Save */}
      <div className="p-8 border-b border-white/5">
        <h3 className="text-xl font-bold mb-6 text-purple-300">
          ⚡ Quick Save
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <input
            value={newSavedTitle}
            onChange={(e) => setNewSavedTitle(e.target.value)}
            placeholder="Title (optional)"
            className="p-4 rounded-2xl bg-black/30 border border-white/20 outline-none"
          />

          <textarea
            rows="3"
            value={newSavedContent}
            onChange={(e) => setNewSavedContent(e.target.value)}
            placeholder="Your code..."
            className="lg:col-span-2 p-4 rounded-2xl bg-black/30 border border-white/20 outline-none font-mono resize-none"
          />

          <button
            onClick={saveNewCodeDirectly}
            className="lg:col-span-3 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold hover:scale-105 transition"
          >
            Save Code ✨
          </button>
        </div>
      </div>

      {/* Codes List */}
      <div className="p-8 space-y-6">
        {savedCodes.length === 0 ? (
          <div className="text-center py-20">
            <FaCloudUploadAlt className="w-20 h-20 text-gray-600 mx-auto mb-6 opacity-50" />
            <p className="text-2xl text-gray-500 font-light">
              No codes in cloud yet
            </p>
          </div>
        ) : (
          savedCodes.map((item) => (
            <motion.div
              key={item.id}
              className="group relative p-8 rounded-3xl bg-gradient-to-r from-white/5 to-black/30 
                         border border-white/10 hover:border-purple-400 
                         hover:shadow-2xl hover:shadow-purple-500/30 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-bold text-white">
                    {item.title || "Untitled Code"}
                  </h4>

                  {item.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      🕒 {item.createdAt.toDate().toLocaleString()}
                    </p>
                  )}

                  {item.updatedAt && (
                    <p className="text-xs text-yellow-400 mt-1">
                      ✏ Updated: {item.updatedAt.toDate().toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.content);
                      toast.success("Copied! ✅");
                    }}
                    className="p-3 hover:bg-green-500/20 rounded-2xl transition"
                  >
                    <FaCopy className="text-green-400" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingTitle(item.title || "");
                      setEditingContent(item.content);
                    }}
                    className="p-3 hover:bg-blue-500/20 rounded-2xl transition"
                  >
                    ✏
                  </button>

                  <button
                    onClick={async () => {
                      await deleteDoc(doc(db, "codes", item.id));
                      fetchCodes();
                      toast.success("Deleted from cloud");
                    }}
                    className="p-3 hover:bg-red-500/20 rounded-2xl transition"
                  >
                    <FaTrash className="text-red-400" />
                  </button>
                </div>
              </div>

              {/* Edit Mode */}
              {editingId === item.id ? (
                <div className="space-y-3">
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/30 border border-white/20 outline-none"
                  />

                  <textarea
                    rows="6"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/30 border border-white/20 outline-none font-mono"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={updateCode}
                      className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-xl bg-gray-600 hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="font-mono text-sm leading-relaxed bg-black/40 p-6 rounded-2xl border border-white/10 overflow-x-auto max-h-64 overflow-y-auto">
                  {item.content}
                </pre>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  </div>
)}


    </div>
    
  );
};

export default SendForm;
