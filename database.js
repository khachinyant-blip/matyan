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
    id INTEGER PRIMARY KEY, 
    student_id INTEGER, 
    subject_id INTEGER, 
    status TEXT, 
    date TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );
`);

// Ստեղծում ենք դասարաններ 1-12 (Ա և Բ զուգահեռներով)
const insertClass = db.prepare("INSERT INTO classes (name) VALUES (?)");
const classIds = [];
for (let i = 1; i <= 12; i++) {
    classIds.push(insertClass.run(`${i}Ա`).lastInsertRowid);
    classIds.push(insertClass.run(`${i}Բ`).lastInsertRowid);
}

// Գեներացնում ենք 475 աշակերտ
const namesM = ['Արամ', 'Հայկ', 'Տիգրան', 'Գոռ', 'Արթուր', 'Կարեն', 'Դավիթ', 'Էրիկ', 'Սամվել', 'Վահե', 'Արմեն', 'Ռոբերտ', 'Աշոտ', 'Ալեն', 'Գուրգեն', 'Լևոն', 'Արտակ', 'Վիգեն', 'Սուրեն', 'Հովհաննես'];
const namesF = ['Անի', 'Մարիամ', 'Էլեն', 'Լիլիթ', 'Նարե', 'Սոնա', 'Մանե', 'Անահիտ', 'Լուսինե', 'Գայանե', 'Ալիսա', 'Տաթևիկ', 'Քրիստինե', 'Մարիա', 'Շուշան', 'Ռուզաննա', 'Իրինա', 'Սյուզաննա', 'Անժելա', 'Միլենա'];
const surnames = ['Գրիգորյան', 'Մարտիրոսյան', 'Վարդանյան', 'Հովհաննիսյան', 'Սարգսյան', 'Ավետիսյան', 'Խաչատրյան', 'Նազարյան', 'Դավթյան', 'Գևորգյան', 'Մինասյան', 'Հակոբյան', 'Պետրոսյան', 'Թորոսյան', 'Բաղդասարյան', 'Ղազարյան', 'Ալեքսանյան', 'Միրզոյան', 'Կարապետյան', 'Մելքոնյան', 'Ստեփանյան', 'Պողոսյան', 'Արզումանյան', 'Սիմոնյան', 'Երիցյան'];

const insertStudent = db.prepare("INSERT INTO students (name, surname, patronymic, class_id) VALUES (?, ?, ?, ?)");

let currentClassIdx = 0;
let countInClass = 0;

for (let i = 0; i < 475; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = isMale ? namesM[Math.floor(Math.random() * namesM.length)] : namesF[Math.floor(Math.random() * namesF.length)];
    const lastName = surnames[Math.floor(Math.random() * surnames.length)];
    const patro = namesM[Math.floor(Math.random() * namesM.length)] + "ի";

    if (countInClass >= 20 && currentClassIdx < classIds.length - 1) {
        currentClassIdx++;
        countInClass = 0;
    }

    insertStudent.run(firstName, lastName, patro, classIds[currentClassIdx]);
    countInClass++;
}

db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', '123');
module.exports = db;
