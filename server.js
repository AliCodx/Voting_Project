app.use(express.static(__dirname));
const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const adminDb = require('./admin-db');

const app = express();
const PORT = 3000;

// Ensure CORS and body parser are at the very top
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up SQLite database
const db = new sqlite3.Database('votes.db', (err) => {
    if (err) throw err;
    console.log('Connected to SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rollNo TEXT NOT NULL,
    candidate TEXT NOT NULL,
    imagePath TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Ensure 'status' column exists in votes table
// (SQLite doesn't support IF NOT EXISTS for columns, so check manually)
db.all("PRAGMA table_info(votes)", (err, columns) => {
    if (!columns.some(col => col.name === 'status')) {
        db.run("ALTER TABLE votes ADD COLUMN status TEXT DEFAULT 'pending'");
    }
});

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
app.post('/api/vote', upload.single('studentCard'), (req, res) => {
    const { rollNo, candidate } = req.body;
    const imagePath = req.file ? req.file.path : null;
    if (!rollNo || !candidate || !imagePath) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    db.run('INSERT INTO votes (rollNo, candidate, imagePath, status) VALUES (?, ?, ?, ?)', [rollNo, candidate, imagePath, 'pending'], function(err) {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.json({ success: true });
    });
});

// API endpoint to verify or reject a vote
app.post('/api/votes/:id/verify', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log('Attempting to update vote:', { id, status });
    if (!['verified', 'rejected'].includes(status)) {
        console.log('Invalid status:', status);
        return res.status(400).json({ error: 'Invalid status.' });
    }
    db.run('UPDATE votes SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
            console.log('Database error:', err);
            return res.status(500).json({ error: 'Database error.' });
        }
        if (this.changes === 0) {
            console.log('No vote found with id:', id);
            return res.status(404).json({ error: 'Vote not found.' });
        }
        console.log('Vote updated successfully:', { id, status });
        res.json({ success: true });
    });
});

// API endpoint to get voting results (only verified votes)
app.get('/api/results', (req, res) => {
    db.all("SELECT candidate, COUNT(*) as votes FROM votes WHERE status = 'verified' GROUP BY candidate", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.json(rows);
    });
});

// API endpoint to get all votes (with optional status filter)
app.get('/api/votes', (req, res) => {
    const status = req.query.status;
    let query = 'SELECT * FROM votes';
    let params = [];
    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.json(rows);
    });
});

// TEMPORARY: Endpoint to delete all votes
app.post('/api/clear-votes', (req, res) => {
    db.run('DELETE FROM votes', function(err) {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.json({ success: true, message: 'All votes deleted.' });
    });
});

// Test POST route to verify backend POST and body parsing
app.post('/api/test', (req, res) => {
    res.json({ received: true, body: req.body });
});

// Admin login endpoint
app.post('/api/admin-login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
    }
    adminDb.get('SELECT * FROM admins WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (row) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    });
});

app.listen(PORT, () => {
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    if (!fs.existsSync('uploads/student_card')) fs.mkdirSync('uploads/student_card');
    console.log(`Server running on http://localhost:${PORT}`);
});
