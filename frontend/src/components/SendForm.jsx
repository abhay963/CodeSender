import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  FaCopy, FaGem, FaTrash, FaCloudUploadAlt, FaEnvelope, 
  FaInfoCircle, FaWhatsapp, FaPaperPlane, FaTimes, FaImage,
  FaStar, FaSearch, FaCode, FaThLarge, FaListUl, FaEdit, 
  FaHeart, FaDownload, FaChartBar 
} from "react-icons/fa";
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
  updateDoc 
} from "firebase/firestore";
import "react-toastify/dist/ReactToastify.css";

/* ================= THREE.JS BACKGROUND ================= */
const StarBackground = () => {
  const mountRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
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
  const CORRECT_PASSKEY = "1234";
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

  // Vault States
  const [savedCodes, setSavedCodes] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [newSavedTitle, setNewSavedTitle] = useState("");
  const [newSavedContent, setNewSavedContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");

  // Vault Extra States (to fix undefined errors)
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Simple stats (you can enhance later)
  const vaultStats = {
    total: savedCodes.length,
    favorites: savedCodes.filter(c => c.isFavorite).length,
    totalLines: savedCodes.reduce((acc, c) => acc + (c.content?.split("\n").length || 0), 0),
  };

  const fetchCodes = async () => {
    try {
      const q = query(collection(db, "codes"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const allCodes = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        isFavorite: docSnap.data().isFavorite || false,
      }));
      setSavedCodes(allCodes);
    } catch (err) {
      toast.error("Failed to load vault");
    }
  };

  const updateCode = async () => {
    if (!editingContent.trim()) {
      toast.error("Code cannot be empty");
      return;
    }
    try {
      await updateDoc(doc(db, "codes", editingId), {
        title: editingTitle,
        content: editingContent,
        updatedAt: serverTimestamp(),
      });
      toast.success("Code updated ✨");
      setEditingId(null);
      setEditingTitle("");
      setEditingContent("");
      fetchCodes();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const saveNewCodeDirectly = async () => {
    if (!newSavedContent.trim()) {
      toast.error("Code cannot be empty");
      return;
    }
    const loadingToast = toast.loading("💾 Saving to Cloud Vault...");
    try {
      await addDoc(collection(db, "codes"), {
        title: newSavedTitle || "Untitled",
        content: newSavedContent,
        createdAt: serverTimestamp(),
        isFavorite: false,
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
        render: "❌ Failed to save",
        type: "error",
        isLoading: false,
      });
    }
  };

  const deleteCode = async (id) => {
    if (!window.confirm("Delete this snippet permanently?")) return;
    try {
      await deleteDoc(doc(db, "codes", id));
      toast.success("Snippet deleted");
      fetchCodes();
      if (selectedItem?.id === id) setShowDetail(false);
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const toggleFavorite = async (id, currentFavorite) => {
    try {
      await updateDoc(doc(db, "codes", id), {
        isFavorite: !currentFavorite,
      });
      fetchCodes();
    } catch (err) {
      toast.error("Failed to update favorite");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard 📋");
  };

  const downloadSnippet = (item) => {
    const element = document.createElement("a");
    const fileContent = item.title ? `// ${item.title}\n\n${item.content}` : item.content;
    const file = new Blob([fileContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${item.title || "snippet"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Downloaded");
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  /* ================= PASSKEY LOGIC ================= */
  const handleUnlock = (val) => {
    if (unlockingRef.current) return;
    if (val === CORRECT_PASSKEY) {
      unlockingRef.current = true;
      setIsSuccess(true);
      setTimeout(() => setIsUnlocked(true), 1400);
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
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-emerald-400/40 via-green-500/30 to-teal-400/40">
          <div className="h-full w-full rounded-2xl bg-black/80 backdrop-blur-xl" />
        </div>
        <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent rotate-12 animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
            <p className="text-sm font-semibold tracking-wide text-white">WhatsApp Activation Required</p>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            To enable WhatsApp delivery, send the following message from your WhatsApp:
          </p>
          <div className="mt-4 rounded-xl border border-green-400/30 bg-black/60 backdrop-blur-md px-4 py-3">
            <p className="text-green-400 font-mono text-sm tracking-widest">join note-rather</p>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Send to <span className="ml-2 text-green-300 font-medium tracking-wide">+1 415 523 8886</span>
          </p>
        </div>
      </div>,
      { autoClose: 8000, position: "top-center", theme: "dark" }
    );
  };

  const handleSend = async () => {
    if (!content.trim()) return toast.error("Code content required");
    if (channel === "email" && !emailUser.trim()) return toast.error("Email username required");
    if (channel === "whatsapp" && phone.length !== 10) return toast.error("Enter a valid 10-digit WhatsApp number");

    const loadingToast = toast.loading(
      channel === "email" ? "📧 Sending Email..." : "📲 Sending WhatsApp...",
      { position: "top-center", theme: "dark" }
    );

    try {
      setLoading(true);
      const base64Files = await Promise.all(images.map(toBase64));

      if (channel === "whatsapp") {
        const nonImages = base64Files.filter((file) => !file.type.startsWith("image/"));
        if (nonImages.length > 0) {
          toast.error("WhatsApp supports only text, code or images.");
          setLoading(false);
          return;
        }
      }

      const payload = channel === "email"
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
            images: base64Files,
            phone: `+91${phone}`,
          };

      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/send`, payload);

      toast.update(loadingToast, {
        render: channel === "email" ? "✅ Email sent!" : "✅ WhatsApp sent!",
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
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch codes when vault is opened
  useEffect(() => {
    if (showSaved) {
      fetchCodes();
    }
  }, [showSaved]);

  /* ================= LOCK SCREEN ================= */
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-white relative overflow-hidden">
        <StarBackground />
        <ToastContainer theme="dark" />

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="lock"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={shake ? { x: [-12, 12, -8, 8, 0] } : { opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative w-full max-w-sm"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 blur-xl opacity-30" />
              <div className="relative bg-gray-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-center mb-2 tracking-wide">Secure Access</h2>
                <p className="text-sm text-gray-400 text-center mb-8">Enter your 4-digit passkey</p>

                <div className="flex justify-center gap-4 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: passkey.length > i ? 1.15 : 1,
                        backgroundColor: passkey.length > i ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.06)",
                        borderColor: passkey.length > i ? "#22d3ee" : "rgba(255,255,255,0.15)",
                      }}
                      className="h-14 w-14 rounded-2xl border flex items-center justify-center"
                    >
                      {passkey.length > i && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

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
            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220 }}
                className="w-28 h-28 rounded-full bg-green-500/20 border border-green-400 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.6)]"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  viewBox="0 0 24 24"
                  className="w-14 h-14 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M5 13l4 4L19 7" />
                </motion.svg>
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-green-300 tracking-widest text-sm">
                ACCESS GRANTED
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ================= MAIN APP ================= */
  const filteredCodes = savedCodes
    .filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        (item.title?.toLowerCase().includes(term) || item.content?.toLowerCase().includes(term)) &&
        (activeTab === "all" || (activeTab === "favorites" && item.isFavorite) || activeTab === "recent")
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest") return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      if (sortBy === "oldest") return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
      if (sortBy === "name") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-white" onPaste={handlePaste} tabIndex={0}>
      <StarBackground />
      <ToastContainer theme="dark" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-purple-500/50"
          >
            <FaGem className="text-2xl text-white drop-shadow-lg" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent tracking-tight"
          >
            Code<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">Sender</span>
            <span className="text-sm font-light block text-gray-400 mt-2 tracking-widest">PRO</span>
          </motion.h1>
        </div>

        {/* Channel Selector */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setChannel("email")}
            className={`flex-1 py-3 rounded-xl ${channel === "email" ? "bg-purple-600" : "bg-black/30 text-gray-400"}`}
          >
            <FaEnvelope className="inline mr-2" /> Email
          </button>

          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={() => {
                setChannel("whatsapp");
                showWhatsAppInfo();
              }}
              className={`flex-1 py-3 rounded-xl ${channel === "whatsapp" ? "bg-green-600" : "bg-black/30 text-gray-400"}`}
            >
              <FaWhatsapp className="inline mr-2" /> WhatsApp
            </button>
            <div className="relative group">
              <motion.div animate={{ scale: [1, 1.2, 1], textShadow: ["0 0 0", "0 0 20px rgba(74,222,128,0.8)", "0 0 0"] }} transition={{ duration: 2, repeat: Infinity }}>
                <FaInfoCircle className="text-green-400 cursor-pointer" />
              </motion.div>
              <div className="absolute right-0 top-8 w-72 text-sm bg-black/90 text-white p-3 rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none z-20">
                Send <span className="text-green-400 font-mono">join note-rather</span> to <b>+1 415 523 8886</b>
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

        {/* Email / WhatsApp Input */}
        {channel === "email" ? (
          <div className="mb-3">
            <div className="flex">
              <input
                value={emailUser}
                onChange={(e) => setEmailUser(e.target.value.replace(/\s/g, "").replace(/@.*/, ""))}
                placeholder="Enter Gmail username"
                className="flex-1 p-3 rounded-l-xl bg-black/30 outline-none"
              />
              <span className="px-4 py-3 bg-black/50 border border-white/10 rounded-r-xl text-gray-300">@gmail.com</span>
            </div>
          </div>
        ) : (
          <div className="flex mb-3">
            <span className="px-4 py-3 bg-black/50 border border-white/10 rounded-l-xl text-gray-300">+91</span>
            <input
              type="text"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="WhatsApp number"
              className="flex-1 p-3 rounded-r-xl bg-black/30 outline-none"
            />
          </div>
        )}

        {/* Image Upload */}
        <label className="block cursor-pointer mb-4">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => setImages((p) => [...p, ...Array.from(e.target.files)])}
          />
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-purple-400 transition">
            <FaImage className="mx-auto mb-2 text-purple-400" />
            <p className="text-sm">Click to upload or paste screenshots</p>
          </div>
        </label>

        {images.length > 0 && (
          <div className="space-y-2 mb-4">
            {images.map((img, i) => (
              <div key={i} className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg">
                <span className="text-sm truncate">{img.name || `Screenshot ${i + 1}`}</span>
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
            const loadingToast = toast.loading("⏳ Loading codes...");
            await fetchCodes();
            setShowSaved(true);
            toast.update(loadingToast, { render: "☁️ Cloud Vault Loaded!", type: "success", isLoading: false, autoClose: 2000 });
          }}
          className="mt-7 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all"
        >
          <FaCloudUploadAlt className="text-lg" />
          Open Quantum Vault
        </button>
      </motion.div>

      {/* ================= QUANTUM VAULT ================= */}
     {/* ================= CLEAN MODERN QUANTUM VAULT ================= */}
<AnimatePresence>
  {showSaved && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#070b14] overflow-hidden"
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-250px] left-[-200px] w-[600px] h-[600px] bg-fuchsia-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-250px] right-[-200px] w-[600px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full" />
      </div>

      {/* ================= NAVBAR ================= */}
      <div className="relative z-20 px-4 sm:px-6 lg:px-8 py-5 border-b border-white/10 backdrop-blur-3xl bg-black/20">

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

          {/* LEFT */}
          <div className="flex items-center gap-4 sm:gap-5">

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-2xl shrink-0">
              <FaCloudUploadAlt className="text-white text-xl sm:text-2xl" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-[-2px] bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Quantum Vault
              </h1>

              <p className="text-white/40 text-xs sm:text-sm mt-1">
                {vaultStats.total} snippets saved
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 w-full xl:w-auto">

            {/* SEARCH */}
            <div className="relative flex-1 min-w-0">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-fuchsia-300" />

              <input
                type="text"
                placeholder="Search snippets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[260px] lg:w-[300px] pl-12 pr-5 py-3 sm:py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-fuchsia-400"
              />
            </div>

            {/* SORT */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">A-Z</option>
            </select>

            {/* CLOSE */}
            <button
              onClick={() => setShowSaved(false)}
              className="w-full sm:w-14 h-12 sm:h-14 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-400 text-xl sm:text-2xl hover:bg-red-500/20 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CREATE BUTTON */}
        <div className="mt-5 sm:mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setNewSavedTitle("");
              setNewSavedContent("");
              setShowDetail(true);
            }}
            className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 text-white font-bold shadow-[0_0_40px_rgba(168,85,247,0.35)] flex items-center justify-center gap-3"
          >
            <FaCode />
            Create Snippet
          </motion.button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 h-[calc(100vh-190px)] overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {filteredCodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">

            <div className="text-[80px] sm:text-[130px] opacity-20">
              🌌
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white mt-5">
              No Snippets Yet
            </h2>

            <p className="text-white/40 text-base sm:text-lg mt-3">
              Create your first futuristic snippet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 sm:gap-7">

            {filteredCodes.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
                className="group rounded-[28px] sm:rounded-[34px] border border-white/10 bg-white/[0.05] backdrop-blur-3xl overflow-hidden"
              >

                {/* CARD */}
                <div
                  onClick={() => {
                    setSelectedItem(item);

                    setEditingId(item.id);
                    setEditingTitle(item.title || "");
                    setEditingContent(item.content);

                    setShowDetail(true);
                  }}
                  className="p-4 sm:p-6 cursor-pointer"
                >

                  {/* TOP */}
                  <div className="flex justify-between items-start gap-4 mb-5">

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl sm:text-2xl font-black text-white line-clamp-2 break-words">
                        {item.title || "Untitled"}
                      </h3>

                      <p className="text-xs sm:text-sm text-white/30 mt-2">
                        {item.createdAt?.toDate?.().toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id, item.isFavorite);
                      }}
                      className="text-xl sm:text-2xl shrink-0"
                    >
                      {item.isFavorite ? (
                        <FaHeart className="text-fuchsia-400" />
                      ) : (
                        <FaHeart className="text-white/20 group-hover:text-white/50" />
                      )}
                    </button>
                  </div>

                  {/* CODE PREVIEW */}
                  <div className="rounded-[22px] sm:rounded-[28px] border border-white/10 bg-[#0a0f1d] overflow-hidden">

                    <div className="flex gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 bg-white/[0.03]">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>

                    <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-cyan-100 overflow-hidden h-44 sm:h-56 leading-6 sm:leading-7 whitespace-pre-wrap break-words">
                      {item.content.substring(0, 350)}...
                    </pre>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

                  <button
                    onClick={() => copyToClipboard(item.content)}
                    className="flex-1 py-3 sm:py-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/10 text-cyan-300 font-semibold hover:bg-cyan-500/20 transition"
                  >
                    Copy
                  </button>

                  <button
                    onClick={() => {
                      setSelectedItem(item);

                      setEditingId(item.id);
                      setEditingTitle(item.title || "");
                      setEditingContent(item.content);

                      setShowDetail(true);
                    }}
                    className="flex-1 py-3 sm:py-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-400/10 text-fuchsia-300 font-semibold hover:bg-fuchsia-500/20 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteCode(item.id)}
                    className="w-full sm:w-16 h-12 sm:h-auto rounded-2xl bg-red-500/10 border border-red-400/10 text-red-300 hover:bg-red-500/20 transition flex items-center justify-center"
                  >
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
          >

            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="w-full max-w-[95%] sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl rounded-[24px] sm:rounded-[32px] border border-white/10 bg-[#0b1020] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] flex flex-col"
            >

              {/* HEADER */}
              <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">

                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                    {selectedItem ? "Edit Snippet" : "Create Snippet"}
                  </h2>

                  <p className="text-white/40 mt-2 text-sm sm:text-base">
                    Save and manage your futuristic code
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedItem(null);
                  }}
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-400/20 text-red-400 text-xl sm:text-2xl hover:bg-red-500/20 transition shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* BODY */}
              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto">

                {/* TITLE */}
                <input
                  value={editingId ? editingTitle : newSavedTitle}
                  onChange={(e) =>
                    editingId
                      ? setEditingTitle(e.target.value)
                      : setNewSavedTitle(e.target.value)
                  }
                  placeholder="Snippet title..."
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl bg-white/[0.05] border border-white/10 text-white text-lg sm:text-xl lg:text-2xl font-bold outline-none focus:border-fuchsia-400"
                />

                {/* CODE */}
                <textarea
                  rows="10"
                  value={editingId ? editingContent : newSavedContent}
                  onChange={(e) =>
                    editingId
                      ? setEditingContent(e.target.value)
                      : setNewSavedContent(e.target.value)
                  }
                  placeholder="// Paste your code here..."
                  className="w-full mt-5 p-4 sm:p-6 rounded-2xl sm:rounded-[32px] bg-[#070b14] border border-white/10 text-cyan-100 font-mono text-sm sm:text-base outline-none resize-none leading-6 sm:leading-7 focus:border-cyan-400 min-h-[220px] max-h-[45vh] overflow-y-auto"
                />

                {/* BUTTONS */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">

                  <button
                    onClick={async () => {
                      if (editingId) {
                        await updateCode();
                      } else {
                        await saveNewCodeDirectly();
                      }

                      setShowDetail(false);
                    }}
                    className="flex-1 py-4 sm:py-5 rounded-3xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 text-white font-black text-base sm:text-lg"
                  >
                    {editingId ? "Save Changes" : "Create Snippet"}
                  </button>

                  <button
                    onClick={() => {
                      setShowDetail(false);
                      setSelectedItem(null);
                    }}
                    className="px-8 sm:px-10 py-4 sm:py-5 rounded-3xl bg-white/[0.05] border border-white/10 text-white font-semibold hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};

export default SendForm;