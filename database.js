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

// 1. Դասարանների ստեղծում
const insertClass = db.prepare("INSERT INTO classes (name) VALUES (?)");
const classIds = [];
for (let i = 1; i <= 12; i++) {
    classIds.push(insertClass.run(`${i}Ա`).lastInsertRowid);
    classIds.push(insertClass.run(`${i}Բ`).lastInsertRowid);
}

// 2. ՀՀ դպրոցական առարկաների ավելացում
const subjectsList = [
    'Մայրենի', 'Հայոց լեզու', 'Հայ գրականություն', 'Մաթեմատիկա', 'Հանրահաշիվ', 'Երկրաչափություն',
    'Օտար լեզու (Անգլերեն)', 'Ռուսաց լեզու', 'Բնագիտություն', 'Ես և շրջակա աշխարհը', 'Հայոց պատմություն',
    'Համաշխարհային պատմություն', 'Հասարակագիտություն', 'Ինֆորմատիկա', 'Ֆիզիկա', 'Քիմիա', 'Կենսաբանություն',
    'Աշխարհագրություն', 'Ֆիզկուլտուրա', 'Տեխնոլոգիա', 'Կերպարվեստ', 'Երաժշտություն', 'ՆԶՊ', 'Շախմատ'
];
const insertSubj = db.prepare("INSERT INTO subjects (name) VALUES (?)");
subjectsList.forEach(s => insertSubj.run(s));

// 3. 475 Աշակերտների ավտոմատ բաշխում
const namesM = ['Արամ', 'Բաբկեն', 'Գագիկ', 'Դավիթ', 'Երվանդ', 'Զավեն', 'Էդգար', 'Թորոս', 'Իշխան', 'Լևոն', 'Կարեն', 'Հայկ', 'Միքայել', 'Նարեկ', 'Շանթ', 'Պետրոս', 'Ռուբեն', 'Սամվել', 'Տիգրան', 'Վահե'];
const namesF = ['Անի', 'Բելլա', 'Գայանե', 'Դիանա', 'Ելենա', 'Զարուհի', 'Էլեն', 'Թամարա', 'Ինեսա', 'Լիլիթ', 'Մարիամ', 'Նանե', 'Շուշան', 'Ոսկեհատ', 'Պայծառ', 'Ռուզաննա', 'Սյուզաննա', 'Տաթևիկ', 'Ուստիան', 'Փիրուզա'];
const surnames = ['Աբրահամյան', 'Բաղդասարյան', 'Գևորգյան', 'Դավթյան', 'Ենոքյան', 'Զաքարյան', 'Էլիզբարյան', 'Թադևոսյան', 'Իսահակյան', 'Լալայան', 'Խաչատրյան', 'Կարապետյան', 'Հակոբյան', 'Մարգարյան', 'Նալբանդյան', 'Շահնազարյան', 'Ոսկանյան', 'Պետրոսյան', 'Ջանիկյան', 'Սարգսյան', 'Վարդանյան', 'Տերտերյան', 'Փանոսյան', 'Քոչարյան', 'Օհանյան'];

const insertStudent = db.prepare("INSERT INTO students (name, surname, patronymic, class_id) VALUES (?, ?, ?, ?)");
let cIdx = 0;
let count = 0;

for (let i = 0; i < 475; i++) {
    const isM = Math.random() > 0.5;
    const n = isM ? namesM[Math.floor(Math.random() * namesM.length)] : namesF[Math.floor(Math.random() * namesF.length)];
    const s = surnames[Math.floor(Math.random() * surnames.length)];
    const p = namesM[Math.floor(Math.random() * namesM.length)] + "ի";
    
    if (count >= 20 && cIdx < classIds.length - 1) { cIdx++; count = 0; }
    insertStudent.run(n, s, p, classIds[cIdx]);
    count++;
}

db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', '123');
module.exports = db;
