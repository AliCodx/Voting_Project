const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('admin.db', (err) => {
    if (err) throw err;
    console.log('Connected to admin database.');
});

db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
)`);

// Insert a default admin if not exists (email: admin@example.com, password: admin123)
db.get('SELECT * FROM admins WHERE email = ?', ['admin@example.com'], (err, row) => {
    if (!row) {
        db.run('INSERT INTO admins (email, password) VALUES (?, ?)', ['admin@example.com', 'admin123']);
    }
});

module.exports = db;
