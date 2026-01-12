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

// ================================
// MAIN
// ================================
app.post("/api/analyze", upload.single("zip"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ detail: "ZIP wajib diupload" });
  }

  try {
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();

    let followers = [];
    let following = [];

    entries.forEach(entry => {
      const filename = entry.entryName.split("/").pop().toLowerCase();

      // === FOLLOWERS ===
      if (filename === "followers_1.json") {
        const json = JSON.parse(entry.getData().toString("utf8"));

        followers = json
          .map(item => item.string_list_data?.[0]?.value)
          .filter(Boolean);
      }

      // === FOLLOWING ===
      if (filename === "following.json") {
        const json = JSON.parse(entry.getData().toString("utf8"));

        following = json
          .map(item => item.title)
          .filter(Boolean);
      }
    });

    if (!followers.length || !following.length) {
      return res.status(400).json({
        detail:
          "followers_1.json atau following.json tidak ditemukan / kosong"
      });
    }

    // 🔥 LOGIKA PYTHON ASLI
    const notFollowingBack = following.filter(
      u => !followers.includes(u)
    );

    res.json({
      followers_count: followers.length,
      following_count: following.length,
      not_following_back: notFollowingBack
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Gagal memproses ZIP" });
  }
});

app.get("/api", (_, res) => {
  res.send("Backend OK 🚀");
});

export default app;
