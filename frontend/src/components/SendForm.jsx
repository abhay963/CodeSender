import { useState, useEffect, useRef } from "react";
import { FaCopy, FaGem, FaTrash, FaCloudUploadAlt, FaHammer, FaTools } from "react-icons/fa";
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
  updateDoc,
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
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const count = 800;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 12;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xa855f7,
      size: 0.025,
      transparent: true,
      opacity: 0.7,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const animate = () => {
      points.rotation.y += 0.0004;
      points.rotation.x += 0.0002;
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
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 -z-10 bg-[#0a071f]" />;
};

/* ================= HELPER ================= */
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result });
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

  // Cloud Vault States
  const [savedCodes, setSavedCodes] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [newSavedTitle, setNewSavedTitle] = useState("");
  const [newSavedContent, setNewSavedContent] = useState("");
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

  const saveNewCodeDirectly = async () => {
    if (!newSavedContent.trim()) {
      toast.error("Code cannot be empty");
      return;
    }

    const loadingToast = toast.loading("💾 Saving to Cloud Vault...", { theme: "dark" });

    try {
      await addDoc(collection(db, "codes"), {
        title: newSavedTitle || "Untitled",
        content: newSavedContent,
        createdAt: serverTimestamp(),
      });
      setNewSavedTitle("");
      setNewSavedContent("");
      await fetchCodes();
      toast.update(loadingToast, {
        render: "✅ Code saved successfully in Cloud!",
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

  const updateCode = async () => {
    if (!editingContent.trim()) return toast.error("Code cannot be empty");

    await updateDoc(doc(db, "codes", editingId), {
      title: editingTitle,
      content: editingContent,
      updatedAt: serverTimestamp(),
    });

    toast.success("Code updated successfully ✨");
    setEditingId(null);
    setEditingTitle("");
    setEditingContent("");
    fetchCodes();
  };

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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={shake ? { x: [-12, 12, -8, 8, 0] } : { opacity: 1, scale: 1 }}
              className="relative w-full max-w-sm"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 blur-xl opacity-30" />
              <div className="relative bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-10">
                <h2 className="text-4xl font-bold text-center mb-2">Secure Access</h2>
                <p className="text-gray-400 text-center mb-8">Enter 4-digit passkey</p>

                <div className="flex justify-center gap-5 mb-10">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: passkey.length > i ? 1.2 : 1,
                        backgroundColor: passkey.length > i ? "#22d3ee20" : "#ffffff10",
                        borderColor: passkey.length > i ? "#22d3ee" : "#ffffff30",
                      }}
                      className="h-16 w-16 rounded-2xl border-2 flex items-center justify-center"
                    >
                      {passkey.length > i && (
                        <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />
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
                  className="absolute inset-0 opacity-0 cursor-default"
                />

                <p className="text-center text-xs tracking-[4px] text-gray-500">ENCRYPTED ZONE</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 rounded-full border-4 border-green-400/30 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <FaGem className="text-6xl text-green-400" />
                </motion.div>
              </div>
              <p className="mt-8 text-2xl font-bold text-green-400 tracking-widest">ACCESS GRANTED</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ================= MAIN UNDER CONSTRUCTION UI ================= */
  return (
    <div className="min-h-screen bg-[#0a071f] text-white relative overflow-hidden flex items-center justify-center px-4">
      <StarBackground />
      <ToastContainer theme="dark" />

      <div className="max-w-3xl w-full text-center z-10">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-7xl"
            >
              🚧
            </motion.div>
          </div>

          <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4">
            UNDER
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}CONSTRUCTION
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-md mx-auto">
            We're building something awesome.<br />
            Only the Cloud Vault is active right now.
          </p>
        </motion.div>

        {/* Construction Animation Elements */}
        <div className="flex justify-center gap-8 mb-16">
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <FaHammer className="text-6xl text-amber-400" />
          </motion.div>
          <motion.div
            animate={{ rotate: [0, 20, -20, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <FaTools className="text-6xl text-purple-400" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          >
            <FaGem className="text-6xl text-pink-400" />
          </motion.div>
        </div>

        {/* Only Working Feature: Save Your Code */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            const loadingToast = toast.loading("Loading Cloud Vault...");
            await fetchCodes();
            setShowSaved(true);
            toast.update(loadingToast, {
              render: "☁️ Cloud Vault Opened",
              type: "success",
              isLoading: false,
              autoClose: 1500,
            });
          }}
          className="group relative px-12 py-6 text-xl font-semibold rounded-3xl overflow-hidden
                     bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600
                     hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-500
                     shadow-2xl shadow-purple-500/50 transition-all duration-300 flex items-center gap-4 mx-auto"
        >
          <FaCloudUploadAlt className="text-3xl group-hover:rotate-12 transition" />
          OPEN CLOUD VAULT
          <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
        </motion.button>

        <p className="mt-8 text-sm text-gray-500 tracking-widest">
          Other features are coming soon • Stay tuned ✨
        </p>
      </div>

      {/* ================= CLOUD VAULT MODAL (Fully Working) ================= */}
      {showSaved && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-50 p-4"
          onClick={() => setShowSaved(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl max-h-[92vh] overflow-hidden bg-gradient-to-br from-gray-950 to-black border border-purple-500/30 rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 p-8 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between z-10">
              <h2 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ☁️ Cloud Vault
              </h2>
              <button onClick={() => setShowSaved(false)} className="text-3xl hover:text-red-400 transition">
                ✕
              </button>
            </div>

            {/* Quick Save */}
            <div className="p-8 border-b border-white/10">
              <h3 className="text-2xl font-bold mb-6 text-purple-300">Quick Save</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <input
                  value={newSavedTitle}
                  onChange={(e) => setNewSavedTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="p-5 rounded-2xl bg-zinc-900 border border-white/10 focus:border-purple-500 outline-none"
                />
                <textarea
                  rows="4"
                  value={newSavedContent}
                  onChange={(e) => setNewSavedContent(e.target.value)}
                  placeholder="Paste your code here..."
                  className="lg:col-span-2 p-5 rounded-2xl bg-zinc-900 border border-white/10 focus:border-purple-500 outline-none font-mono resize-none"
                />
                <button
                  onClick={saveNewCodeDirectly}
                  className="lg:col-span-3 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-lg hover:scale-105 transition-all"
                >
                  Save to Cloud ✨
                </button>
              </div>
            </div>

            {/* Saved Codes */}
            <div className="p-8 overflow-y-auto max-h-[calc(92vh-280px)] space-y-8">
              {savedCodes.length === 0 ? (
                <div className="text-center py-20">
                  <FaCloudUploadAlt className="w-24 h-24 text-gray-700 mx-auto mb-6" />
                  <p className="text-3xl text-gray-600">No codes saved yet</p>
                </div>
              ) : (
                savedCodes.map((item) => (
                  <motion.div
                    key={item.id}
                    className="group p-8 rounded-3xl bg-zinc-900/70 border border-white/10 hover:border-purple-500/50 transition-all"
                  >
                    {/* ... (same code list UI as before - I kept it clean) */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-2xl font-bold">{item.title || "Untitled"}</h4>
                        {item.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.createdAt.toDate().toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100">
                        <button onClick={() => { navigator.clipboard.writeText(item.content); toast.success("Copied!"); }} className="p-4 hover:bg-green-500/20 rounded-2xl">
                          <FaCopy className="text-green-400" />
                        </button>
                        <button onClick={() => {
                          setEditingId(item.id);
                          setEditingTitle(item.title || "");
                          setEditingContent(item.content);
                        }} className="p-4 hover:bg-blue-500/20 rounded-2xl">
                          ✏
                        </button>
                        <button onClick={async () => {
                          await deleteDoc(doc(db, "codes", item.id));
                          fetchCodes();
                          toast.success("Deleted");
                        }} className="p-4 hover:bg-red-500/20 rounded-2xl">
                          <FaTrash className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    {editingId === item.id ? (
                      <div className="space-y-4">
                        <input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="w-full p-4 rounded-xl bg-black/50" />
                        <textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} rows={8} className="w-full p-4 rounded-xl bg-black/50 font-mono" />
                        <div className="flex gap-4">
                          <button onClick={updateCode} className="px-8 py-3 bg-green-600 rounded-xl">Save Changes</button>
                          <button onClick={() => setEditingId(null)} className="px-8 py-3 bg-gray-700 rounded-xl">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <pre className="font-mono text-sm bg-black/60 p-6 rounded-2xl overflow-auto max-h-80 border border-white/5">
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