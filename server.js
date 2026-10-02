const express = require('express');
const RosApi = require('node-routeros').RouterOSAPI;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// মিডলওয়্যার
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MikroTik এনভায়রনমেন্ট ভ্যারিয়েবল
const MIKROTIK_HOST = process.env.MIKROTIK_HOST;
const MIKROTIK_USER = process.env.MIKROTIK_USER;
const MIKROTIK_PASSWORD = process.env.MIKROTIK_PASSWORD;
const MIKROTIK_PORT = parseInt(process.env.MIKROTIK_PORT, 10) || 8728;

// টেস্ট রুট
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running perfectly' });
});

// সাইন-আপ API রুট (User Manager এর জন্য)
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;

    console.log(`Received signup request for user: ${username}`);

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'ইউজারনেম এবং পাসওয়ার্ড দিন।' });
    }

    const conn = new RosApi({
        host: MIKROTIK_HOST,
        user: MIKROTIK_USER,
        password: MIKROTIK_PASSWORD,
        port: MIKROTIK_PORT,
        timeout: 10
    });

    try {
        console.log(`Connecting to MikroTik at ${MIKROTIK_HOST}:${MIKROTIK_PORT}...`);
        await conn.connect();
        console.log('Connected to MikroTik successfully!');

        // RouterOS v7 User Manager-এ ইউজার তৈরি করার কমান্ড
        await conn.write('/user-manager/user/add', [
            `=name=${username}`,
            `=password=${password}`
        ]);

        await conn.close();
        console.log(`User ${username} added to User Manager!`);
        return res.json({ success: true, message: 'ইউজার সফলভাবে তৈরি হয়েছে!' });
    } catch (error) {
        console.error('MikroTik Error Details:', error);
        try {
            await conn.close();
        } catch (e) {}
        return res.status(500).json({ 
            success: false, 
            message: 'User Manager-এ ইউজার তৈরি ব্যর্থ হয়েছে।',
            error: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
