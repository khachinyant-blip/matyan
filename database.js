const Database = require('better-sqlite3');
const db = new Database('school.db');

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
    id INTEGER PRIMARY KEY, 
    student_id INTEGER, 
    subject_id INTEGER, 
    status TEXT, 
    date TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );
`);

const admin = db.prepare("SELECT * FROM users WHERE username = ?").get('admin');
if (!admin) db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', '123');

// Գեներացնում ենք 475 աշակերտի տվյալ
const count = db.prepare("SELECT COUNT(*) as count FROM students").get().count;
if (count === 0) {
    const namesM = ['Արամ', 'Հայկ', 'Տիգրան', 'Գոռ', 'Արթուր', 'Կարեն', 'Դավիթ', 'Էրիկ', 'Սամվել', 'Վահե', 'Արմեն', 'Ռոբերտ', 'Աշոտ', 'Ալեն', 'Գուրգեն', 'Լևոն', 'Արտակ', 'Վիգեն', 'Սուրեն', 'Հովհաննես'];
    const namesF = ['Անի', 'Մարիամ', 'Էլեն', 'Լիլիթ', 'Նարե', 'Սոնա', 'Մանե', 'Անահիտ', 'Լուսինե', 'Գայանե', 'Ալիսա', 'Տաթևիկ', 'Քրիստինե', 'Մարիա', 'Շուշան', 'Ռուզաննա', 'Իրինա', 'Սյուզաննա', 'Անժելա', 'Միլենա'];
    const surnames = ['Գրիգորյան', 'Մարտիրոսյան', 'Վարդանյան', 'Հովհաննիսյան', 'Սարգսյան', 'Ավետիսյան', 'Խաչատրյան', 'Նազարյան', 'Դավթյան', 'Գևորգյան', 'Մինասյան', 'Հակոբյան', 'Պետրոսյան', 'Թորոսյան', 'Բաղդասարյան', 'Ղազարյան', 'Ալեքսանյան', 'Միրզոյան', 'Կարապետյան', 'Մելքոնյան', 'Ստեփանյան', 'Պողոսյան', 'Արզումանյան', 'Սիմոնյան', 'Երիցյան'];
    
    const insert = db.prepare("INSERT INTO students (name, surname, patronymic) VALUES (?, ?, ?)");
    
    for (let i = 0; i < 475; i++) {
        const isMale = Math.random() > 0.5;
        const firstName = isMale ? namesM[Math.floor(Math.random() * namesM.length)] : namesF[Math.floor(Math.random() * namesF.length)];
        const lastName = surnames[Math.floor(Math.random() * surnames.length)];
        const fatherName = namesM[Math.floor(Math.random() * namesM.length)] + (isMale ? "ի" : "ի"); // Պարզեցված հայրանուն
        
        insert.run(firstName, lastName, fatherName);
    }
}

module.exports = db;
