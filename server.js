import express from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import cors from 'cors';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// --- PARSE FOLLOWERS ---
const parseFollowers = (jsonData) => {
    const usernames = new Set();
    let list = [];

    if (Array.isArray(jsonData)) {
        list = jsonData;
    } else if (jsonData.relationships_followers) {
        list = jsonData.relationships_followers;
    }

    list.forEach(item => {
        if (item.string_list_data && item.string_list_data[0] && item.string_list_data[0].value) {
            usernames.add(item.string_list_data[0].value);
        }
    });

    return usernames;
};

// --- PARSE FOLLOWING ---
const parseFollowing = (jsonData) => {
    const usernames = new Set();
    let list = [];

    if (jsonData.relationships_following) {
        list = jsonData.relationships_following;
    } else if (Array.isArray(jsonData)) {
        list = jsonData;
    }

    list.forEach(item => {
        if (item.string_list_data && item.string_list_data[0] && item.string_list_data[0].value) {
            usernames.add(item.string_list_data[0].value);
        } else if (item.title) {
            usernames.add(item.title);
        }
    });

    return usernames;
};

app.post('/api/analyze', upload.single('zip'), (req, res) => {
    if (!req.file) return res.status(400).json({ detail: "File ZIP wajib diupload." });

    try {
        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();

        let followersSet = new Set();
        let followingSet = new Set();
        
        // Flags untuk deteksi
        let foundFollowersJSON = false;
        let foundFollowingJSON = false;
        let foundHTML = false; // Flag baru untuk deteksi salah format

        zipEntries.forEach((entry) => {
            const name = entry.entryName.toLowerCase();
            
            // 1. Cek apakah user salah upload format HTML
            if ((name.includes('followers') || name.includes('following')) && name.endsWith('.html')) {
                foundHTML = true;
            }

            // Skip jika bukan JSON (Lanjut cari JSON)
            if (!name.endsWith('.json')) return;

            // 2. PROSES FILE FOLLOWERS (JSON)
            if (name.includes('followers') && !name.includes('pending')) {
                try {
                    const content = JSON.parse(entry.getData().toString('utf8'));
                    const users = parseFollowers(content);
                    users.forEach(u => followersSet.add(u));
                    if (users.size > 0) foundFollowersJSON = true;
                    console.log(`Followers found: ${name} (${users.size})`);
                } catch (e) {
                    console.error(`Error parsing followers:`, e.message);
                }
            }

            // 3. PROSES FILE FOLLOWING (JSON)
            if (name.includes('following') && !name.includes('pending')) {
                try {
                    const content = JSON.parse(entry.getData().toString('utf8'));
                    const users = parseFollowing(content);
                    users.forEach(u => followingSet.add(u));
                    if (users.size > 0) foundFollowingJSON = true;
                    console.log(`Following found: ${name} (${users.size})`);
                } catch (e) {
                    console.error(`Error parsing following:`, e.message);
                }
            }
        });

        // --- LOGIC ERROR HANDLING ---
        
        // Jika salah satu file JSON tidak ketemu
        if (!foundFollowersJSON || !foundFollowingJSON) {
            
            // KASUS 1: JSON gak ada, tapi HTML ada -> Salah Format
            if (foundHTML) {
                return res.status(400).json({ 
                    detail: "Format Salah: Terdeteksi file HTML. Mohon request data Instagram dalam format JSON, bukan HTML." 
                });
            }

            // KASUS 2: JSON gak ada, HTML juga gak ada -> File Hilang/Salah ZIP
            return res.status(400).json({ 
                detail: `File ZIP Salah: Tidak ditemukan file followers atau following. Pastikan kamu mengunduh 'Followers and following' di Instagram.` 
            });
        }

        // Hitung Logika
        const notFollowingBack = [...followingSet].filter(x => !followersSet.has(x));
        const notFollowedBackByMe = [...followersSet].filter(x => !followingSet.has(x));

        console.log(`Sukses! ${notFollowingBack.length} orang tidak follback.`);

        res.json({
            not_following_back: notFollowingBack,
            not_followed_back_by_me: notFollowedBackByMe
        });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ detail: "Gagal memproses file ZIP (Corrupt atau Password protected)." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server siap di http://localhost:${PORT}`);
});