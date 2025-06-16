const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;
app.use(express.static(__dirname));
// Ensure CORS and body parser are at the very top
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up PostgreSQL database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL // Set this in your deployment environment
});

// Create votes table if not exists (PostgreSQL)
pool.query(`CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    rollNo TEXT NOT NULL,
    candidate TEXT NOT NULL,
    imagePath TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) console.error('Error creating votes table:', err);
});

// Create admins table if not exists (PostgreSQL)
pool.query(`CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
)`, (err) => {
    if (err) console.error('Error creating admins table:', err);
});

// Insert a default admin if not exists
(async () => {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', ['admin@example.com']);
    if (result.rows.length === 0) {
        await pool.query('INSERT INTO admins (email, password) VALUES ($1, $2)', ['admin@example.com', 'admin123']);
    }
})();

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/student_card/'); // Save images in student_card folder
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API endpoint to submit a vote
app.post('/api/vote', upload.single('studentCard'), async (req, res) => {
    const { rollNo, candidate } = req.body;
    const imagePath = req.file ? req.file.path : null;
    if (!rollNo || !candidate || !imagePath) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    try {
        await pool.query('INSERT INTO votes (rollNo, candidate, imagePath, status) VALUES ($1, $2, $3, $4)', [rollNo, candidate, imagePath, 'pending']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// API endpoint to verify or reject a vote
app.post('/api/votes/:id/verify', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
    }
    try {
        const result = await pool.query('UPDATE votes SET status = $1 WHERE id = $2', [status, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Vote not found.' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// API endpoint to get voting results (only verified votes)
app.get('/api/results', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT candidate, COUNT(*) as votes FROM votes WHERE status = 'verified' GROUP BY candidate");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// API endpoint to get all votes (with optional status filter)
app.get('/api/votes', async (req, res) => {
    const status = req.query.status;
    let query = 'SELECT * FROM votes';
    let params = [];
    if (status) {
        query += ' WHERE status = $1';
        params.push(status);
    }
    try {
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// TEMPORARY: Endpoint to delete all votes
app.post('/api/clear-votes', async (req, res) => {
    try {
        await pool.query('DELETE FROM votes');
        res.json({ success: true, message: 'All votes deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// Test POST route to verify backend POST and body parsing
app.post('/api/test', (req, res) => {
    res.json({ received: true, body: req.body });
});

// Admin login endpoint
app.post('/api/admin-login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
    }
    try {
        const result = await pool.query('SELECT * FROM admins WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length > 0) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

app.listen(PORT, () => {
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    if (!fs.existsSync('uploads/student_card')) fs.mkdirSync('uploads/student_card');
    console.log(`Server running on http://localhost:${PORT}`);
});
