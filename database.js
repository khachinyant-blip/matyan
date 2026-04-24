const Database = require('better-sqlite3');
const db = new Database('school.db');

// Աղյուսակների ստեղծում
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);
  CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY, name TEXT);
  CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY, name TEXT);
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY, 
    name TEXT, 
    surname TEXT, 
    patronymic TEXT, 
    class_id INTEGER,
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    student_id INTEGER, 
    subject_id INTEGER, 
    status TEXT, 
    date TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );
`);

// Ստուգում ենք՝ արդյոք տվյալները արդեն կան, թե ոչ
const userCheck = db.prepare("SELECT count(*) as count FROM users").get();

if (userCheck.count === 0) {
    // 1. Ադմին
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', '123');

    // 2. Դասարաններ
    const insertClass = db.prepare("INSERT INTO classes (name) VALUES (?)");
    const classIds = [];
    for (let i = 1; i <= 12; i++) {
        classIds.push(insertClass.run(`${i}Ա`).lastInsertRowid);
        classIds.push(insertClass.run(`${i}Բ`).lastInsertRowid);
    }

    // 3. Առարկաներ
    const subjectsList = ['Մայրենի', 'Մաթեմատիկա', 'Հայոց պատմություն', 'Անգլերեն', 'Ֆիզկուլտուրա', 'Ինֆորմատիկա'];
    const insertSubj = db.prepare("INSERT INTO subjects (name) VALUES (?)");
    subjectsList.forEach(s => insertSubj.run(s));

    // 4. Աշակերտներ (Այբբենական)
    const surnames = ['Ադամյան', 'Բարսեղյան', 'Գալստյան', 'Դանիելյան', 'Եղիազարյան', 'Զաքարյան', 'Թադևոսյան', 'Իսահակյան', 'Լալայան', 'Խաչատրյան'];
    const names = ['Արամ', 'Բելլա', 'Գագիկ', 'Դավիթ', 'Ելենա', 'Զավեն', 'Էդգար', 'Թամարա', 'Ինեսա', 'Լիլիթ'];

    let tempStudents = [];
    for (let i = 0; i < 475; i++) {
        tempStudents.push({
            n: names[Math.floor(Math.random() * names.length)],
            s: surnames[Math.floor(Math.random() * surnames.length)]
        });
    }
    tempStudents.sort((a, b) => a.s.localeCompare(b.s, 'hy'));

    const insertStudent = db.prepare("INSERT INTO students (name, surname, class_id) VALUES (?, ?, ?)");
    let cIdx = 0, count = 0;
    tempStudents.forEach(st => {
        if (count >= 20 && cIdx < classIds.length - 1) { cIdx++; count = 0; }
        insertStudent.run(st.n, st.s, classIds[cIdx]);
        count++;
    });
}

module.exports = db;
