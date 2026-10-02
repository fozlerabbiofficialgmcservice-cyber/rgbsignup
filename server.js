const express = require('express');
const RosApi = require('node-routeros').RouterOSAPI;
const path = require('path');

const app = express();

// ৭ নম্বর লাইনটি সংশোধন করা হয়েছে (|| যোগ করা হয়েছে)
const PORT = process.env.PORT || 3000;

// মিডলওয়্যার
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MikroTik কানেকশন ডিটেইলস (Render Environment Variables থেকে আসবে)
const MIKROTIK_HOST = process.env.MIKROTIK_HOST;
const MIKROTIK_USER = process.env.MIKROTIK_USER;
const MIKROTIK_PASSWORD = process.env.MIKROTIK_PASSWORD;
const MIKROTIK_PORT = parseInt(process.env.MIKROTIK_PORT, 10) || 8728;

// সাইন-আপ API এন্ডপয়েন্ট
app.post('/api/signup', async (req, res) => {
    const { username, password, profile } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'ইউজারনেম এবং পাসওয়ার্ড আবশ্যক!' });
    }

    const conn = new RosApi({
        host: MIKROTIK_HOST,
        user: MIKROTIK_USER,
        password: MIKROTIK_PASSWORD,
        port: MIKROTIK_PORT,
        timeout: 10
    });

    try {
        await conn.connect();

        // Hotspot ইউজার তৈরি করার কমান্ড
        await conn.write('/ip/hotspot/user/add', [
            `=name=${username}`,
            `=password=${password}`,
            `=profile=${profile || 'default'}`
        ]);

        await conn.close();
        return res.json({ success: true, message: 'ইউজার সফলভাবে তৈরি হয়েছে!' });
    } catch (error) {
        console.error('MikroTik Error:', error);
        try {
            await conn.close();
        } catch (e) {}
        return res.status(500).json({ success: false, message: 'রাউটারে কানেক্ট বা ইউজার তৈরি করতে ব্যর্থ হয়েছে।' });
    }
});

// সার্ভার চালু করা
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
