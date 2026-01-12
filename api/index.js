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
// PARSER
// ================================
const parseUsers = (json) => {
  const set = new Set();
  if (!Array.isArray(json)) return set;

  json.forEach(item => {
    if (item.string_list_data?.[0]?.value) {
      set.add(item.string_list_data[0].value);
    } else if (item.title) {
      set.add(item.title);
    } else if (item.string_list_data?.[0]?.href) {
      const u = item.string_list_data[0].href
        .split("/")
        .filter(Boolean)
        .pop();
      if (u) set.add(u);
    }
  });

  return set;
};

// ================================
// MAIN ROUTE
// ================================
app.post("/api/analyze", upload.single("zip"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ detail: "ZIP wajib diupload" });
  }

  try {
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();

    let followersSet = new Set();
    let followingSet = new Set();

    let foundFollowers = false;
    let foundFollowing = false;

    entries.forEach(entry => {
      const filename = entry.entryName.split("/").pop().toLowerCase();

      // 🔒 LOCK FILE NAME
      if (filename === "followers_1.json") {
        const json = JSON.parse(entry.getData().toString("utf8"));
        followersSet = parseUsers(json);
        foundFollowers = true;
      }

      if (filename === "following.json") {
        const json = JSON.parse(entry.getData().toString("utf8"));
        followingSet = parseUsers(json);
        foundFollowing = true;
      }
    });

    if (!foundFollowers || !foundFollowing) {
      return res.status(400).json({
        detail:
          "File tidak ditemukan. Pastikan ZIP berisi followers_1.json dan following.json"
      });
    }

    const notFollowingBack = [...followingSet].filter(
      u => !followersSet.has(u)
    );

    const notFollowedBackByMe = [...followersSet].filter(
      u => !followingSet.has(u)
    );

    res.json({
      followers_count: followersSet.size,
      following_count: followingSet.size,
      not_following_back: notFollowingBack,
      not_followed_back_by_me: notFollowedBackByMe
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
