import express from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import cors from 'cors';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Konfigurasi CORS agar bisa diakses dari Frontend
app.use(cors({
    origin: '*', // Atau ganti dengan domain frontend kamu misal: 'https://follower-check.vercel.app'
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

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

// --- ROUTE UTAMA (POST) ---
app.post('/api/analyze', upload.single('zip'), (req, res) => {
    if (!req.file) return res.status(400).json({ detail: "File ZIP wajib diupload." });

    try {
        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();

        let followersSet = new Set();
        let followingSet = new Set();
        
        let foundFollowersJSON = false;
        let foundFollowingJSON = false;
        let foundHTML = false;

        zipEntries.forEach((entry) => {
            const name = entry.entryName.toLowerCase();
            
            // Cek HTML
            if ((name.includes('followers') || name.includes('following')) && name.endsWith('.html')) {
                foundHTML = true;
            }

            // Skip jika bukan JSON
            if (!name.endsWith('.json')) return;

            // Proses Followers
            if (name.includes('followers') && !name.includes('pending')) {
                try {
                    const content = JSON.parse(entry.getData().toString('utf8'));
                    const users = parseFollowers(content);
                    users.forEach(u => followersSet.add(u));
                    if (users.size > 0) foundFollowersJSON = true;
                } catch (e) {
                    console.error(`Error parsing followers:`, e.message);
                }
            }

            // Proses Following
            if (name.includes('following') && !name.includes('pending')) {
                try {
                    const content = JSON.parse(entry.getData().toString('utf8'));
                    const users = parseFollowing(content);
                    users.forEach(u => followingSet.add(u));
                    if (users.size > 0) foundFollowingJSON = true;
                } catch (e) {
                    console.error(`Error parsing following:`, e.message);
                }
            }
        });

        // Error Handling
        if (!foundFollowersJSON || !foundFollowingJSON) {
            if (foundHTML) {
                return res.status(400).json({ 
                    detail: "Format Salah: Terdeteksi file HTML. Mohon request data Instagram dalam format JSON, bukan HTML." 
                });
            }
            return res.status(400).json({ 
                detail: `File ZIP Salah: Tidak ditemukan file followers atau following JSON.` 
            });
        }

        const notFollowingBack = [...followingSet].filter(x => !followersSet.has(x));
        const notFollowedBackByMe = [...followersSet].filter(x => !followingSet.has(x));

        res.json({
            not_following_back: notFollowingBack,
            not_followed_back_by_me: notFollowedBackByMe
        });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ detail: "Gagal memproses file ZIP." });
    }
});

// --- ROUTE TEST (GET) ---
// Akses ini di browser: https://follower-check.vercel.app/api
app.get('/api', (req, res) => {
    res.status(200).send("Server Backend Vercel Berjalan Normal! 🚀");
});

// --- PENTING UNTUK VERCEL ---
// Jangan gunakan app.listen()
export default app;