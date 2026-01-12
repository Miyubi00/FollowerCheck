import express from "express";
import multer from "multer";
import AdmZip from "adm-zip";
import cors from "cors";

const app = express();

// ================================
// MULTER (MEMORY, SIZE LIMIT)
// ================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB aman untuk Vercel
});

// ================================
// CORS
// ================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json());

// ================================
// PARSE FOLLOWERS
// ================================
const parseFollowers = (jsonData) => {
  const usernames = new Set();
  let list = [];

  if (Array.isArray(jsonData)) {
    list = jsonData;
  } else if (jsonData.relationships_followers?.data) {
    list = jsonData.relationships_followers.data;
  } else if (jsonData.relationships_followers) {
    list = jsonData.relationships_followers;
  }

  list.forEach((item) => {
    const value = item.string_list_data?.[0]?.value;
    if (value) usernames.add(value);
  });

  return usernames;
};

// ================================
// PARSE FOLLOWING (DEFENSIVE)
// ================================
const parseFollowing = (jsonData) => {
  const usernames = new Set();
  let list = [];

  if (Array.isArray(jsonData)) {
    list = jsonData;
  } else if (jsonData.relationships_following?.data) {
    list = jsonData.relationships_following.data;
  } else if (jsonData.relationships_following) {
    list = jsonData.relationships_following;
  }

  list.forEach((item) => {
    // 1️⃣ PRIORITAS: title
    if (item.title && item.title.trim() !== "") {
      usernames.add(item.title);
      return;
    }

    // 2️⃣ fallback: value
    const value = item.string_list_data?.[0]?.value;
    if (value) {
      usernames.add(value);
      return;
    }

    // 3️⃣ fallback terakhir: ambil dari href
    const href = item.string_list_data?.[0]?.href;
    if (href) {
      const username = href.split("/").filter(Boolean).pop();
      if (username) usernames.add(username);
    }
  });

  return usernames;
};

// ================================
// MAIN ROUTE
// ================================
app.post("/api/analyze", upload.single("zip"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ detail: "File ZIP wajib diupload." });
  }

  try {
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();

    const followersSet = new Set();
    const followingSet = new Set();

    let foundFollowersJSON = false;
    let foundFollowingJSON = false;
    let foundHTML = false;

    entries.forEach((entry) => {
      const name = entry.entryName.toLowerCase();

      // Deteksi HTML
      if (
        (name.includes("followers") || name.includes("following")) &&
        name.endsWith(".html")
      ) {
        foundHTML = true;
      }

      if (!name.endsWith(".json")) return;

      // FOLLOWERS (HINDARI DOUBLE MATCH)
      if (
        name.includes("followers") &&
        !name.includes("following") &&
        !name.includes("pending")
      ) {
        try {
          const json = JSON.parse(entry.getData().toString("utf8"));
          const users = parseFollowers(json);
          users.forEach((u) => followersSet.add(u));
          foundFollowersJSON = true;
        } catch (e) {
          console.error("Followers parse error:", e.message);
        }
      }

      // FOLLOWING
      else if (
        name.includes("following") &&
        !name.includes("followers") &&
        !name.includes("pending")
      ) {
        try {
          const json = JSON.parse(entry.getData().toString("utf8"));
          const users = parseFollowing(json);
          users.forEach((u) => followingSet.add(u));
          foundFollowingJSON = true;
        } catch (e) {
          console.error("Following parse error:", e.message);
        }
      }
    });

    // ================================
    // ERROR HANDLING
    // ================================
    if (!foundFollowersJSON || !foundFollowingJSON) {
      if (foundHTML) {
        return res.status(400).json({
          detail:
            "Format Salah: Data Instagram yang diupload adalah HTML. Mohon request data dalam format JSON."
        });
      }

      return res.status(400).json({
        detail:
          "File ZIP tidak valid. Pastikan berisi followers dan following dalam format JSON."
      });
    }

    // ================================
    // COMPARE
    // ================================
    const notFollowingBack = [...followingSet].filter(
      (u) => !followersSet.has(u)
    );

    const notFollowedBackByMe = [...followersSet].filter(
      (u) => !followingSet.has(u)
    );

    res.json({
      followers_count: followersSet.size,
      following_count: followingSet.size,
      not_following_back: notFollowingBack,
      not_followed_back_by_me: notFollowedBackByMe
    });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ detail: "Gagal memproses file ZIP." });
  }
});

// ================================
// TEST ROUTE
// ================================
app.get("/api", (req, res) => {
  res.status(200).send("Server Backend Vercel Berjalan Normal! 🚀");
});

// ================================
// EXPORT UNTUK VERCEL
// ================================
export default app;
