const Database = require('better-sqlite3');
const db = new Database('school.db');

// Վերաստեղծում ենք աղյուսակները՝ թարմ տվյալների համար
db.exec(`
  DROP TABLE IF EXISTS attendance;
  DROP TABLE IF EXISTS students;
  DROP TABLE IF EXISTS subjects;
  DROP TABLE IF EXISTS classes;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);
  CREATE TABLE classes (id INTEGER PRIMARY KEY, name TEXT);
  CREATE TABLE subjects (id INTEGER PRIMARY KEY, name TEXT, level TEXT); -- level: 'all', 'elem', 'mid', 'high'
  CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, surname TEXT, patronymic TEXT, class_id INTEGER);
  CREATE TABLE attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, subject_id INTEGER, status TEXT, date TEXT);
`);

// 1. Ադմին
db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', '123');

// 2. Առարկաների ցանկ ըստ մակարդակների
const allSubjects = [
    { n: 'Մայրենի', l: 'elem' },
    { n: 'Հայոց լեզու', l: 'mid-high' },
    { n: 'Գրականություն', l: 'mid-high' },
    { n: 'Մաթեմատիկա', l: 'elem' },
    { n: 'Հանրահաշիվ', l: 'mid-high' },
    { n: 'Երկրաչափություն', l: 'mid-high' },
    { n: 'Ես և շրջակա աշխարհը', l: 'elem' },
    { n: 'Բնագիտություն', l: 'mid' },
    { n: 'Ֆիզիկա', l: 'mid-high' },
    { n: 'Քիմիա', l: 'mid-high' },
    { n: 'Կենսաբանություն', l: 'mid-high' },
    { n: 'Հայոց պատմություն', l: 'mid-high' },
    { n: 'Ինֆորմատիկա', l: 'mid-high' },
    { n: 'Օտար լեզու', l: 'all' },
    { n: 'Ֆիզկուլտուրա', l: 'all' },
    { n: 'Երաժշտություն', l: 'elem-mid' },
    { n: 'Կերպարվեստ', l: 'elem-mid' }
];

const insertSubj = db.prepare("INSERT INTO subjects (name, level) VALUES (?, ?)");
allSubjects.forEach(s => insertSubj.run(s.n, s.l));

// 3. Դասարաններ և Աշակերտներ
const insertClass = db.prepare("INSERT INTO classes (name) VALUES (?)");
const insertStudent = db.prepare("INSERT INTO students (name, surname, patronymic, class_id) VALUES (?, ?, ?, ?)");

const surnames = ['Ադամյան', 'Բարսեղյան', 'Գալստյան', 'Դանիելյան', 'Եղիազարյան', 'Զաքարյան', 'Թադևոսյան', 'Իսահակյան', 'Լալայան', 'Խաչատրյան'];
const names = ['Արամ', 'Անի', 'Դավիթ', 'Էլենա', 'Հայկ', 'Մարիամ', 'Նարեկ', 'Լուսինե', 'Գոռ', 'Մանե'];

for (let i = 1; i <= 12; i++) {
    const cId = insertClass.run(`${i}Ա`).lastInsertRowid;
    // Ամեն դասարանում 20 աշակերտ
    for (let j = 0; j < 20; j++) {
        insertStudent.run(
            names[Math.floor(Math.random() * names.length)],
            surnames[Math.floor(Math.random() * surnames.length)],
            names[Math.floor(Math.random() * names.length)] + "ի",
            cId
        );
    }
}

module.exports = db;
