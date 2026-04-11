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
      <AnimatePresence>
        {showSaved && (
          <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-30 px-10 py-7 border-b border-white/10 bg-zinc-950/95 backdrop-blur-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-2xl shadow-inner">
                  <FaCloudUploadAlt className="text-4xl text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-[-1px] bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                    Quantum Vault
                  </h2>
                  <div className="flex items-center gap-x-6 text-xs text-white/60">
                    <span className="flex items-center gap-x-1"><FaStar className="text-amber-400" /> {vaultStats.favorites} favorites</span>
                    <span>{vaultStats.total} snippets • {vaultStats.totalLines} lines</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-x-6">
                <motion.div className="px-5 py-2 bg-white/10 backdrop-blur rounded-3xl text-sm font-medium flex items-center gap-x-2 border border-white/10">
                  <FaChartBar /> {vaultStats.total} total
                </motion.div>

                <div className="flex bg-white/10 rounded-3xl p-1">
                  {["all", "favorites", "recent"].map((tab) => (
                    <motion.button
                      key={tab}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(tab)}
                      className={`px-7 py-2 rounded-3xl text-sm font-medium transition-all ${activeTab === tab ? "bg-white text-black shadow-lg" : "hover:bg-white/10"}`}
                    >
                      {tab === "all" && "All"}
                      {tab === "favorites" && "❤️ Favorites"}
                      {tab === "recent" && "Recent"}
                    </motion.button>
                  ))}
                </div>

                <div className="flex border border-white/20 rounded-3xl overflow-hidden">
                  <button onClick={() => setViewMode("grid")} className={`px-5 py-3 transition-all ${viewMode === "grid" ? "bg-cyan-400 text-black" : "hover:bg-white/10"}`}>
                    <FaThLarge />
                  </button>
                  <button onClick={() => setViewMode("list")} className={`px-5 py-3 transition-all ${viewMode === "list" ? "bg-cyan-400 text-black" : "hover:bg-white/10"}`}>
                    <FaListUl />
                  </button>
                </div>

                <button onClick={() => setShowSaved(false)} className="w-10 h-10 flex items-center justify-center text-3xl hover:bg-red-500/20 rounded-2xl transition">
                  ✕
                </button>
              </div>
            </div>

            {/* Search + Quick Save */}
            <div className="px-10 py-6 border-b border-white/10 bg-black/40 flex flex-wrap gap-4 items-end">
              <div className="relative flex-1 min-w-[300px]">
                <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search the cosmos..."
                  className="w-full pl-14 pr-8 py-6 bg-zinc-900/80 border border-white/10 rounded-3xl text-lg focus:border-cyan-400 outline-none placeholder:text-gray-400"
                />
              </div>

              <div className="flex items-center gap-x-3">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white/10 border border-white/10 rounded-3xl px-6 py-6 text-sm focus:outline-none">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">A → Z</option>
                </select>

                <button
                  onClick={() => {
                    setNewSavedTitle("");
                    setNewSavedContent("");
                  }}
                  className="flex items-center gap-x-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-black px-8 py-6 rounded-3xl font-semibold hover:scale-105 transition"
                >
                  <FaCode /> New Snippet
                </button>
              </div>

              <div className="flex-1 min-w-[420px] grid grid-cols-12 gap-4 bg-white/5 border border-white/10 rounded-3xl p-5">
                <input
                  value={newSavedTitle}
                  onChange={(e) => setNewSavedTitle(e.target.value)}
                  placeholder="Snippet title"
                  className="col-span-4 p-5 bg-black/60 rounded-2xl border border-white/10 focus:border-purple-400 outline-none text-base"
                />
                <textarea
                  rows="2"
                  value={newSavedContent}
                  onChange={(e) => setNewSavedContent(e.target.value)}
                  placeholder="Paste your masterpiece here..."
                  className="col-span-6 p-5 font-mono bg-black/60 rounded-2xl border border-white/10 focus:border-purple-400 outline-none resize-none"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={saveNewCodeDirectly}
                  className="col-span-2 bg-gradient-to-r from-cyan-400 to-purple-500 font-bold rounded-2xl text-lg active:scale-95 transition-all"
                >
                  SAVE
                </motion.button>
              </div>
            </div>

            {/* Vault Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll">
              {filteredCodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="text-8xl mb-8 opacity-30">☁️</div>
                  <h3 className="text-3xl font-light text-gray-400">The vault is empty here...</h3>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCodes.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={{ scale: 1.04 }}
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDetail(true);
                      }}
                      className="group relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 hover:border-cyan-400/60 rounded-3xl p-7 cursor-pointer overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-xl font-semibold line-clamp-2 pr-4 flex-1">{item.title || "Untitled"}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id, item.isFavorite);
                          }}
                          className="text-2xl"
                        >
                          {item.isFavorite ? <FaHeart className="text-red-400" /> : <FaHeart className="text-white/30 group-hover:text-white/60" />}
                        </button>
                      </div>

                      <pre className="font-mono text-xs bg-black/70 p-5 rounded-2xl h-40 overflow-hidden text-gray-300 line-clamp-6">
                        {item.content.substring(0, 240)}...
                      </pre>

                      <div className="absolute bottom-7 right-7 flex gap-x-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(item.content); }} className="p-3 bg-green-500/10 hover:bg-green-500/30 rounded-2xl">
                          <FaCopy />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteCode(item.id); }} className="p-3 bg-red-500/10 hover:bg-red-500/30 rounded-2xl">
                          <FaTrash />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCodes.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex items-start gap-6 bg-zinc-900/80 border border-white/10 hover:border-purple-400/40 rounded-3xl p-8 transition-all"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDetail(true);
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-2xl font-semibold">{item.title || "Untitled"}</h4>
                          <div className="flex items-center gap-x-4">
                            {item.isFavorite && <FaHeart className="text-red-400" />}
                            <span className="text-xs px-4 py-1 bg-white/10 rounded-3xl text-gray-400">
                              {item.createdAt?.toDate?.().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <pre className="font-mono mt-4 text-sm text-gray-400 line-clamp-3 bg-black/50 p-5 rounded-2xl">
                          {item.content}
                        </pre>
                      </div>

                      <div className="flex flex-col gap-y-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(item.content); }} className="p-4 hover:bg-green-400/20 rounded-2xl">
                          <FaCopy className="text-green-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(item.id);
                            setEditingTitle(item.title || "");
                            setEditingContent(item.content);
                          }}
                          className="p-4 hover:bg-blue-400/20 rounded-2xl"
                        >
                          <FaEdit className="text-blue-400" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteCode(item.id); }} className="p-4 hover:bg-red-400/20 rounded-2xl">
                          <FaTrash className="text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[110] flex items-center justify-center p-6"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full bg-zinc-950 border border-cyan-400/30 rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="px-10 py-6 border-b flex items-center justify-between bg-gradient-to-r from-zinc-900 to-black">
                <div className="flex items-center gap-x-4">
                  <FaGem className="text-4xl text-cyan-400" />
                  <div>
                    <h2 className="text-3xl font-semibold">{selectedItem.title || "Untitled"}</h2>
                    <div className="flex gap-x-4 text-xs text-gray-400">
                      <span>Created {selectedItem.createdAt?.toDate?.().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-x-4">
                  <button
                    onClick={() => toggleFavorite(selectedItem.id, selectedItem.isFavorite)}
                    className="flex items-center gap-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-3xl text-sm"
                  >
                    <FaHeart className={selectedItem.isFavorite ? "text-red-400" : ""} /> Favorite
                  </button>
                  <button
                    onClick={() => copyToClipboard(selectedItem.content)}
                    className="flex items-center gap-x-2 px-6 py-3 bg-green-500/10 hover:bg-green-500/30 rounded-3xl text-sm"
                  >
                    <FaCopy /> Copy
                  </button>
                  <button
                    onClick={() => downloadSnippet(selectedItem)}
                    className="flex items-center gap-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-3xl text-sm"
                  >
                    <FaDownload /> Download
                  </button>
                  <button onClick={() => setShowDetail(false)} className="px-6 text-4xl leading-none text-gray-400 hover:text-white">✕</button>
                </div>
              </div>

              <div className="flex-1 p-10 overflow-auto font-mono text-base bg-black/70 leading-relaxed whitespace-pre-wrap border-b border-white/10">
                {editingId === selectedItem.id ? (
                  <div>
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full mb-6 p-6 bg-zinc-900 rounded-3xl border border-white/20 text-2xl font-semibold outline-none"
                    />
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={20}
                      className="w-full p-8 font-mono bg-zinc-900 rounded-3xl border border-white/20 outline-none resize-none"
                    />
                  </div>
                ) : (
                  <pre className="text-cyan-100 text-lg leading-relaxed tracking-[-0.5px]">{selectedItem.content}</pre>
                )}
              </div>

              <div className="p-8 flex gap-x-4 bg-zinc-900">
                {editingId === selectedItem.id ? (
                  <>
                    <button onClick={updateCode} className="flex-1 py-6 bg-green-500 text-black font-bold rounded-3xl text-xl hover:bg-green-400 transition">
                      SAVE CHANGES
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex-1 py-6 bg-white/10 rounded-3xl text-xl hover:bg-white/20 transition">
                      CANCEL
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(selectedItem.id);
                        setEditingTitle(selectedItem.title || "");
                        setEditingContent(selectedItem.content);
                      }}
                      className="flex-1 flex items-center justify-center gap-x-3 py-6 bg-white/10 hover:bg-white/20 rounded-3xl text-xl transition"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => deleteCode(selectedItem.id)}
                      className="flex-1 flex items-center justify-center gap-x-3 py-6 bg-red-500/10 hover:bg-red-500/30 rounded-3xl text-xl text-red-400 transition"
                    >
                      <FaTrash /> Delete
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SendForm;