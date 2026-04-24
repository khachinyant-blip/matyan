const Database = require('better-sqlite3');
const db = new Database('school.db');

db.exec(`
  DROP TABLE IF EXISTS attendance;
  DROP TABLE IF EXISTS students;
  DROP TABLE IF EXISTS classes;
  DROP TABLE IF EXISTS subjects;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);
  CREATE TABLE classes (id INTEGER PRIMARY KEY, name TEXT);
  CREATE TABLE subjects (id INTEGER PRIMARY KEY, name TEXT);
  
  CREATE TABLE students (
    id INTEGER PRIMARY KEY, 
    name TEXT, 
    surname TEXT,
    patronymic TEXT,
    class_id INTEGER,
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    student_id INTEGER, 
    subject_id INTEGER, 
    status TEXT, 
    date TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );
`);

// 1. Ստեղծում ենք դասարանները (1Ա-12Բ)
const insertClass = db.prepare("INSERT INTO classes (name) VALUES (?)");
const classIds = [];
for (let i = 1; i <= 12; i++) {
    classIds.push(insertClass.run(`${i}Ա`).lastInsertRowid);
    classIds.push(insertClass.run(`${i}Բ`).lastInsertRowid);
}

// 2. Ավելացնում ենք հիմնական առարկաները
const subjectsList = ['Մայրենի', 'Հայոց լեզու', 'Գրականություն', 'Մաթեմատիկա', 'Հանրահաշիվ', 'Երկրաչափություն', 'Անգլերեն', 'Ռուսաց լեզու', 'Ֆիզիկա', 'Քիմիա', 'Կենսաբանություն', 'Հայոց պատմություն', 'Ինֆորմատիկա', 'Ֆիզկուլտուրա', 'ՆԶՊ', 'Շախմատ'];
const insertSubj = db.prepare("INSERT INTO subjects (name) VALUES (?)");
subjectsList.forEach(s => insertSubj.run(s));

// 3. Ստեղծում ենք 475 անուն և ՍՈՐՏԱՎՈՐՈՒՄ ենք նախքան դասարանների մեջ դնելը
const namesM = ['Աբրահամ', 'Բագրատ', 'Գոռ', 'Դավիթ', 'Երվանդ', 'Զավեն', 'Էդգար', 'Թաթուլ', 'Իշխան', 'Լևոն', 'Կարեն', 'Հայկ', 'Միքայել', 'Նարեկ', 'Շանթ', 'Պետրոս', 'Ռուբեն', 'Սամվել', 'Տիգրան', 'Վահե'];
const namesF = ['Անի', 'Բելլա', 'Գայանե', 'Դիանա', 'Ելենա', 'Զարուհի', 'Էլեն', 'Թամարա', 'Ինեսա', 'Լիլիթ', 'Մարիամ', 'Նանե', 'Շուշան', 'Ոսկեհատ', 'Պայծառ', 'Ռուզաննա', 'Սյուզաննա', 'Տաթևիկ', 'Ուստիան', 'Փիրուզա'];
const surnames = ['Ադամյան', 'Բարսեղյան', 'Գալստյան', 'Դանիելյան', 'Եղիազարյան', 'Զաքարյան', 'Էլբակյան', 'Թորոսյան', 'Իսպիրյան', 'Լուսինյան', 'Խաչատրյան', 'Կարապետյան', 'Հովհաննիսյան', 'Մանուկյան', 'Նալբանդյան', 'Շահինյան', 'Ոսկանյան', 'Պողոսյան', 'Ջանիկյան', 'Սարգսյան', 'Վարդանյան', 'Տերտերյան', 'Փանոսյան', 'Քոչարյան', 'Օհանյան'];

let tempStudents = [];
for (let i = 0; i < 475; i++) {
    const isM = Math.random() > 0.5;
    tempStudents.push({
        n: isM ? namesM[Math.floor(Math.random() * namesM.length)] : namesF[Math.floor(Math.random() * namesF.length)],
        s: surnames[Math.floor(Math.random() * surnames.length)],
        p: namesM[Math.floor(Math.random() * namesM.length)] + "ի"
    });
}

// Խիստ այբբենական սորտավորում ըստ Ազգանվան, հետո Անվան
tempStudents.sort((a, b) => a.s.localeCompare(b.s, 'hy') || a.n.localeCompare(a.n, 'hy'));

const insertStudent = db.prepare("INSERT INTO students (name, surname, patronymic, class_id) VALUES (?, ?, ?, ?)");
let classIdx = 0;
let studentCount = 0;

tempStudents.forEach(st => {
    // Երբ դասարանում լրանում է 20 հոգի, անցնում ենք հաջորդ դասարանին
    if (studentCount >= 20 && classIdx < classIds.length - 1) {
        classIdx++;
        studentCount = 0;
    }
    insertStudent.run(st.n, st.s, st.p, classIds[classIdx]);
    studentCount++;
});

db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', '123');
module.exports = db;
