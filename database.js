const Database = require('better-sqlite3');
const db = new Database('school.db');

// Ստեղծում ենք բոլոր անհրաժեշտ աղյուսակները
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);
  CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY, name TEXT);
  CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY, name TEXT);
  
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY, 
    name TEXT, 
    surname TEXT,
    class_id INTEGER,
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY, 
    student_id INTEGER, 
    subject_id INTEGER, 
    status TEXT, 
    date TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  );
`);

// Ադմինի ստեղծում
const admin = db.prepare("SELECT * FROM users WHERE username = ?").get('admin');
if (!admin) db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', '123');

module.exports = db;
