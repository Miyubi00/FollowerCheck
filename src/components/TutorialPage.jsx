import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeftIcon, 
  PhotoIcon, 
  ChevronDownIcon, 
  ChevronUpIcon 
} from "@heroicons/react/24/outline";

// --- KOMPONEN KECIL UNTUK SATU LANGKAH ---
function TutorialStep({ step, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex gap-4">
      {/* Nomor Langkah */}
      <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center font-bold border border-blue-500/30">
        {index + 1}
      </div>

      <div className="flex-1">
        {/* Teks Instruksi */}
        <p className="text-gray-200 mb-2 leading-relaxed">{step.text}</p>

        {/* Tombol Toggle Gambar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
            isOpen 
              ? "bg-blue-500/20 text-blue-300" 
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          <PhotoIcon className="w-4 h-4" />
          {isOpen ? "Tutup Gambar" : "Lihat Gambar"}
          {isOpen ? (
            <ChevronUpIcon className="w-3 h-3 ml-1" />
          ) : (
            <ChevronDownIcon className="w-3 h-3 ml-1" />
          )}
        </button>

        {/* Area Gambar dengan Animasi Slide */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="w-full bg-black/30 rounded-lg border border-white/5 overflow-hidden">
                {step.img ? (
                  <img 
                    src={step.img} 
                    alt={`Tutorial langkah ${index + 1}`} 
                    className="w-full h-auto object-contain max-h-[400px]"
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-500 text-sm italic">
                    [Gambar tidak ditemukan: {step.img}]
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- KOMPONEN UTAMA HALAMAN TUTORIAL ---
export default function TutorialPage({ onBack }) {
  // Data langkah-langkah (Sudah digabung jadi satu)
  const steps = [
    { text: "Buka Instagram di Browser PC atau HP, klik 'Lainnya' (garis tiga) -> 'Pengaturan'.", img: "/Group 2.png" },
    { text: "Pilih menu 'Pusat Akun' (Meta Accounts Center).", img: "/Group 2 (1).png" },
    { text: "Pilih menu 'Informasi dan izin Anda'.", img: "/Group 2 (2).png" },
    { text: "Klik 'create export'.", img: "/Group 4.png" },
    { text: "Pilih 'Export to device'.", img: "/Group 3.png" },
    { text: "Pilih 'Customize Information'.", img: "/Group 8 (2).png" },
    { text: "Cari dan centang 'Pengikut dan yang diikuti' (Followers and following). Selain itu hapus centang nya. Klik Save.", img: "/Group 6 (6).png" },
    { text: "PENTING: Pilih 'Unduh ke perangkat'. Pada Date Range pilih 'All time'. Format HARUS 'JSON'. Media quality 'Low'. Lalu klik 'Start Export'.", img: "/Group 8 (3).png" },
    { text: "Tunggu email dari Instagram masuk, download ZIP-nya, lalu upload di halaman Home web ini.", img: "/Group 7 (8).png" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto pt-10 pb-20 px-4">
      {/* Tombol Kembali */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Kembali ke Home
      </button>

      <h1 className="text-3xl font-bold text-[#FFE3A9] mb-8 text-center drop-shadow-md">
        Panduan Download Data
      </h1>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-8">
        {steps.map((step, idx) => (
          <TutorialStep key={idx} step={step} index={idx} />
        ))}
      </div>
    </div>
  );
}