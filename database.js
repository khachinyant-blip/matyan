const Database = require('better-sqlite3');
const db = new Database('school.db');

// Աղյուսակների ստեղծում՝ հայրանունների դաշտով
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

const userCheck = db.prepare("SELECT count(*) as count FROM users").get();

if (userCheck.count === 0) {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', '123');

    const insertClass = db.prepare("INSERT INTO classes (name) VALUES (?)");
    const classIds = [];
    for (let i = 1; i <= 12; i++) {
        classIds.push(insertClass.run(`${i}Ա`).lastInsertRowid);
        classIds.push(insertClass.run(`${i}Բ`).lastInsertRowid);
    }

    const subjectsList = ['Մայրենի', 'Մաթեմատիկա', 'Հայոց պատմություն', 'Անգլերեն', 'Ֆիզկուլտուրա', 'Ինֆորմատիկա'];
    const insertSubj = db.prepare("INSERT INTO subjects (name) VALUES (?)");
    subjectsList.forEach(s => insertSubj.run(s));

    // Անունների և հայրանունների բազա
    const surnames = ['Ադամյան', 'Բարսեղյան', 'Գալստյան', 'Դանիելյան', 'Եղիազարյան', 'Զաքարյան', 'Թադևոսյան', 'Իսահակյան', 'Լալայան', 'Խաչատրյան', 'Կարապետյան', 'Հովհաննիսյան', 'Մանուկյան', 'Նալբանդյան', 'Սարգսյան'];
    const namesM = ['Արամ', 'Գագիկ', 'Դավիթ', 'Զավեն', 'Էդգար', 'Լևոն', 'Կարեն', 'Հայկ', 'Միքայել', 'Նարեկ'];
    const namesF = ['Անի', 'Բելլա', 'Գայանե', 'Դիանա', 'Ելենա', 'Թամարա', 'Ինեսա', 'Լիլիթ', 'Մարիամ', 'Նանե'];

    let tempStudents = [];
    for (let i = 0; i < 475; i++) {
        const isM = Math.random() > 0.5;
        const fatherName = namesM[Math.floor(Math.random() * namesM.length)];
        tempStudents.push({
            n: isM ? namesM[Math.floor(Math.random() * namesM.length)] : namesF[Math.floor(Math.random() * namesF.length)],
            s: surnames[Math.floor(Math.random() * surnames.length)],
            p: fatherName + "ի" // Հայրանունը (օր.՝ Հայկի)
        });
    }

    // Այբբենական սորտավորում ըստ ազգանվան
    tempStudents.sort((a, b) => a.s.localeCompare(b.s, 'hy'));

    const insertStudent = db.prepare("INSERT INTO students (name, surname, patronymic, class_id) VALUES (?, ?, ?, ?)");
    let cIdx = 0, count = 0;
    tempStudents.forEach(st => {
        if (count >= 20 && cIdx < classIds.length - 1) { cIdx++; count = 0; }
        insertStudent.run(st.n, st.s
