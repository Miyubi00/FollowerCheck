import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DocumentIcon,
  DocumentPlusIcon,
  XMarkIcon,
  ClipboardIcon,
  CheckIcon,
  BookOpenIcon,
  FaceFrownIcon,
  ShieldCheckIcon, // <--- 1. Import Icon Perisai
} from "@heroicons/react/24/outline";

// Import Komponen yang sudah dipecah
import MeteorParticles from "./components/MeteorParticles";
import Button from "./components/Button";
import Avatar from "./components/Avatar";
import TutorialPage from "./components/TutorialPage";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [selectedFile, setSelectedFile] = useState(null);
  const [notFollowingBack, setNotFollowingBack] = useState([]);
  const [notFollowedBackByMe, setNotFollowedBackByMe] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [displayMode, setDisplayMode] = useState("notFollowingBack");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleCopy = () => {
    const usernamesText =
      displayMode === "notFollowingBack"
        ? notFollowingBack.join("\n")
        : notFollowedBackByMe.join("\n");
        
    if (!usernamesText) return;

    navigator.clipboard.writeText(usernamesText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setErrorMsg(null);
    setHasSearched(false);

    const formData = new FormData();
    formData.append("zip", selectedFile);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Terjadi kesalahan.");
      }

      const data = await res.json();
      setNotFollowingBack(data.not_following_back || []);
      setNotFollowedBackByMe(data.not_followed_back_by_me || []);
      
      setHasSearched(true);
      setSelectedFile(null); 
      const input = document.getElementById("file-upload");
      if (input) input.value = ""; 

    } catch (error) {
      setErrorMsg(error.message || "Gagal menghubungi server lokal.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    const input = document.getElementById("file-upload");
    if (input) input.value = "";
  };

  const displayedList =
    displayMode === "notFollowingBack"
      ? notFollowingBack
      : notFollowedBackByMe;

  return (
    <div className="relative min-h-screen bg-slate-900 font-sans text-white overflow-y-auto overflow-x-hidden">
      <MeteorParticles />
      
      {currentView === "tutorial" ? (
        <TutorialPage onBack={() => setCurrentView("home")} />
      ) : (
        <div className="relative z-10 min-h-screen p-6 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold my-8 text-center text-[#FFE3A9] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
            Instagram Follback Checker
          </h1>

          <form onSubmit={handleUpload} className="w-full max-w-md flex flex-col gap-4">
            <div className="relative w-full">
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center w-full h-40 p-4 text-center border-2 border-dashed rounded-xl cursor-pointer transition ${
                  selectedFile
                    ? "bg-white text-black border-white"
                    : "hover:bg-white/10 text-white border-white/50"
                }`}
              >
                {selectedFile ? (
                  <>
                    <DocumentIcon className="w-10 h-10 text-blue-600" />
                    <p className="text-sm mt-2 font-medium">{selectedFile.name}</p>
                  </>
                ) : (
                  <>
                    <DocumentPlusIcon className="w-10 h-10 text-gray-400" />
                    <p className="text-sm mt-2 text-gray-300">
                      Pilih file Zip Instagram
                    </p>
                  </>
                )}
              </label>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handleCancelFile}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white rounded-full p-1"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}

              <input
                id="file-upload"
                type="file"
                name="zip"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setCurrentView("tutorial")}
              className="flex items-center justify-center gap-1 text-sm text-blue-300 hover:text-blue-100 transition-colors"
            >
              <BookOpenIcon className="w-4 h-4" />
              Panduan / Tutorial Cara Download Data
            </button>

            <Button
              type="submit"
              disabled={!selectedFile || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3"
            >
              {loading ? "Menganalisis..." : "Cek Sekarang"}
            </Button>

            {/* --- 2. BAGIAN PESAN KEAMANAN DATA --- */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 mt-2">
              <ShieldCheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-green-100/80 leading-relaxed text-left">
                <strong className="text-green-300 block mb-0.5">Privasi Terjamin</strong>
                Data ZIP diproses di memori sementara dan langsung dihapus otomatis. Tidak ada data yang kami simpan di server.
              </div>
            </div>

          </form>

          <AnimatePresence>
            {errorMsg && (
              <motion.div
                className="mt-6 w-full max-w-md bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {hasSearched && (
            <div className="mt-8 w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 mb-10">
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10">
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      displayMode === "notFollowingBack" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setDisplayMode("notFollowingBack")}
                  >
                    Gak Follback ({notFollowingBack.length})
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      displayMode === "notFollowedBackByMe"
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setDisplayMode("notFollowedBackByMe")}
                  >
                    Belum Kamu Follback ({notFollowedBackByMe.length})
                  </button>
                </div>
                
                {displayedList.length > 0 && (
                  <button onClick={handleCopy} className="text-blue-300 hover:text-blue-200 flex items-center gap-1 text-sm">
                    {copied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                    {copied ? "Disalin" : "Salin"}
                  </button>
                )}
              </div>

              <div className="p-4 max-h-[500px] overflow-auto">
                {displayedList.length > 0 ? (
                  <ul className="space-y-2">
                    {displayedList.map((username, i) => (
                      <li key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                        <Avatar username={username} />
                        <div className="flex flex-col">
                          <a
                            href={`https://instagram.com/${username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white font-medium hover:text-blue-300 hover:underline text-base"
                          >
                            {username}
                          </a>
                          <span className="text-xs text-gray-400 group-hover:text-gray-300">
                            Klik untuk buka profil
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                      <FaceFrownIcon className="w-10 h-10 opacity-50"/>
                      <p>Tidak ada data di kategori ini.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}