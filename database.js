const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./դպրոց.db');

db.serialize(() => {
    // Աղյուսակ ուսանողների համար
    db.run("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
    // Աղյուսակ հաճախումների համար
    db.run("CREATE TABLE IF NOT EXISTS attendance (student_id INTEGER, status TEXT, date TEXT)");
    // Աղյուսակ մուտքի համար (Login)
    db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)");
    
    // Ստեղծում ենք քո մուտքի տվյալները (admin և 123)
    db.run("INSERT OR IGNORE INTO users (username, password) VALUES ('admin', '123')");
});

module.exports = db;