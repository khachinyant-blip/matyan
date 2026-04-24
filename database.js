const Database = require('better-sqlite3');
const db = new Database('school.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);
  CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY, name TEXT);
`);

const admin = db.prepare("SELECT * FROM users WHERE username = ?").get('admin');
if (!admin) {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', '123');
}

module.exports = db;
