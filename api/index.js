import express from "express";
import multer from "multer";
import AdmZip from "adm-zip";
import cors from "cors";

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

app.post("/api/analyze", upload.single("zip"), (req, res) => {
  // ================================
  // 1️⃣ VALIDASI FILE
  // ================================
  if (!req.file) {
    return res.status(400).json({
      error_code: "NO_FILE",
      detail: "Tidak ada file yang diupload. Silakan upload file ZIP Instagram."
    });
  }

  if (!req.file.originalname.toLowerCase().endsWith(".zip")) {
    return res.status(400).json({
      error_code: "NOT_ZIP",
      detail: "File yang diupload bukan ZIP."
    });
  }

  let zip;
  try {
    zip = new AdmZip(req.file.buffer);
  } catch (e) {
    return res.status(400).json({
      error_code: "ZIP_CORRUPT",
      detail: "File ZIP rusak atau tidak bisa dibaca."
    });
  }

  // ================================
  // 2️⃣ SCAN ZIP
  // ================================
  const entries = zip.getEntries();

  let followers = [];
  let following = [];

  let foundFollowersFile = false;
  let foundFollowingFile = false;
  let foundHTML = false;

  try {
    entries.forEach(entry => {
      const filename = entry.entryName.split("/").pop().toLowerCase();

      // Deteksi HTML export
      if (filename.endsWith(".html")) {
        foundHTML = true;
        return;
      }

      if (!filename.endsWith(".json")) return;

      const content = entry.getData().toString("utf8");
      const json = JSON.parse(content);

      // ================================
      // FOLLOWERS
      // ================================
      if (filename === "followers_1.json") {
        foundFollowersFile = true;

        const list = Array.isArray(json)
          ? json
          : json.relationships_followers || [];

        followers = list
          .map(item => item.string_list_data?.[0]?.value)
          .filter(Boolean);
      }

      // ================================
      // FOLLOWING
      // ================================
      if (filename === "following.json") {
        foundFollowingFile = true;

        const list = Array.isArray(json)
          ? json
          : json.relationships_following || [];

        following = list
          .map(item => item.title)
          .filter(Boolean);
      }
    });
  } catch (err) {
    return res.status(400).json({
      error_code: "INVALID_JSON",
      detail: "Terdapat file JSON yang tidak valid atau rusak."
    });
  }

  // ================================
  // 3️⃣ ERROR SPESIFIK
  // ================================
  if (foundHTML && (!foundFollowersFile || !foundFollowingFile)) {
    return res.status(400).json({
      error_code: "HTML_EXPORT",
      detail:
        "ZIP berisi file HTML. Silakan download data Instagram dalam format JSON, bukan HTML."
    });
  }

  if (!foundFollowersFile) {
    return res.status(400).json({
      error_code: "FOLLOWERS_FILE_MISSING",
      detail: "followers_1.json tidak ditemukan di dalam ZIP."
    });
  }

  if (!foundFollowingFile) {
    return res.status(400).json({
      error_code: "FOLLOWING_FILE_MISSING",
      detail: "following.json tidak ditemukan di dalam ZIP."
    });
  }

  if (!followers.length) {
    return res.status(400).json({
      error_code: "FOLLOWERS_EMPTY",
      detail: "followers_1.json ditemukan, tetapi tidak berisi data followers."
    });
  }

  if (!following.length) {
    return res.status(400).json({
      error_code: "FOLLOWING_EMPTY",
      detail: "following.json ditemukan, tetapi tidak berisi data following."
    });
  }

  // ================================
  // 4️⃣ PROSES DATA (SUDAH BENAR)
  // ================================
  const notFollowingBack = following.filter(
    u => !followers.includes(u)
  );

  const notFollowedBackByMe = followers.filter(
    u => !following.includes(u)
  );

  // ================================
  // 5️⃣ RESPONSE
  // ================================
  res.json({
    followers_count: followers.length,
    following_count: following.length,
    not_following_back: notFollowingBack,
    not_followed_back_by_me: notFollowedBackByMe
  });
});

app.get("/api", (_, res) => {
  res.send("Backend OK 🚀");
});

export default app;


// 2. App Listen (Hanya jalan di Local, kalau di Vercel dia akan diam)
// Kita cek: Jika TIDAK ADA environment variable 'VERCEL', berarti ini di local.
if (!process.env.VERCEL) {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server Local jalan di http://localhost:${PORT}`);
    });
}