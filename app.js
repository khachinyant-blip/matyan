const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-secret', resave: false, saveUninitialized: true }));

function wrapHTML(content) {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 15px; }
        .nav { display: flex; overflow-x: auto; background: white; padding: 10px; border-radius: 12px; gap: 15px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: #555; font-size: 13px; font-weight: 600; white-space: nowrap; }
        .nav a:hover { color: #6c5ce7; }
        .card { background: white; padding: 20px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 600px; margin: auto; }
        .item { border-bottom: 1px solid #eee; padding: 12px 0; display: flex; justify-content: space-between; align-items: center; }
        input, select { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
        button { background: #6c5ce7; color: white; border: none; padding: 12px; border-radius: 10px; width: 100%; cursor: pointer; font-weight: bold; }
        .badge { background: #e0dcfc; color: #6c5ce7; padding: 3px 8px; border-radius: 5px; font-size: 11px; }
    </style>
    </head><body>
    <div class="nav">
        <a href="/">📋 Հաշվառում</a>
        <a href="/all-students">👥 Աշակերտների Բազա</a>
        <a href="/classes">🏫 Դասարաններ</a>
        <a href="/subjects">📚 Առարկաներ</a>
        <a href="/stats">📊 Վիճակագրություն</a>
    </div>
    <div class="card">${content}</div>
    </body></html>`;
}

// Հաշվառման էջ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Օրվա Հաշվառում</h2>
        <form action="/attendance-list" method="GET">
            <select name="class_id" required><option value="">Ընտրել Դասարանը</option>${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}</select>
            <select name="subject_id" required><option value="">Ընտրել Առարկան</option>${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}</select>
            <button>Բացել ցուցակը</button>
        </form>
    `));
});

// Աշակերտների բազա (Ավելացում և Դասարանի կցում)
app.get('/all-students', (req, res) => {
    const students = db.prepare("SELECT * FROM students").all();
    const classes = db.prepare("SELECT * FROM classes").all();
    const list = students.map(s => `
        <div class="item">
            <span>${s.name} ${s.surname}</span>
            <form action="/assign-class" method="POST" style="display:flex; gap:5px;">
                <input type="hidden" name="student_id" value="${s.id}">
                <select name="class_id" onchange="this.form.submit()" style="width:120px; margin:0; padding:2px; font-size:12px;">
                    <option value="">Դասարան</option>
                    ${classes.map(c => `<option value="${c.id}" ${s.class_id == c.id ? 'selected' : ''}>${c.name}</option>`)}
                </select>
            </form>
        </div>`).join('');
    res.send(wrapHTML(`
        <h2>👥 Աշակերտների Ընդհանուր Բազա</h2>
        <form action="/add-student" method="POST">
            <input type="text" name="n" placeholder="Անուն" required>
            <input type="text" name="s" placeholder="Ազգանուն" required>
            <button>Ավելացնել Բազայի մեջ</button>
        </form>
        <div style="margin-top:20px;">${list}</div>
    `));
});

app.post('/add-student', (req, res) => {
    db.prepare("INSERT INTO students (name, surname) VALUES (?, ?)").run(req.body.n, req.body.s);
    res.redirect('/all-students');
});

app.post('/assign-class', (req, res) => {
    db.prepare("UPDATE students SET class_id = ? WHERE id = ?").run(req.body.class_id, req.body.student_id);
    res.redirect('/all-students');
});

// Դասարանների և Առարկաների ավելացում
app.get('/classes', (req, res) => {
    const list = db.prepare("SELECT * FROM classes").all().map(c => `<div class="item">${c.name}</div>`).join('');
    res.send(wrapHTML(`<h2>🏫 Դասարաններ</h2>${list}<hr><form action="/add-class" method="POST"><input type="text" name="n" placeholder="Նոր դասարան"><button>+</button></form>`));
});
app.post('/add-class', (req, res) => { db.prepare("INSERT INTO classes (name) VALUES (?)").run(req.body.n); res.redirect('/classes'); });

app.get('/subjects', (req, res) => {
    const list = db.prepare("SELECT * FROM subjects").all().map(s => `<div class="item">${s.name}</div>`).join('');
    res.send(wrapHTML(`<h2>📚 Առարկաներ</h2>${list}<hr><form action="/add-subject" method="POST"><input type="text" name="n" placeholder="Նոր առարկա"><button>+</button></form>`));
});
app.post('/add-subject', (req, res) => { db.prepare("INSERT INTO subjects (name) VALUES (?)").run(req.body.n); res.redirect('/subjects'); });

// Հաշվառման ցուցակի բացում
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ?").all(req.query.class_id);
    const list = students.map(s => `
        <div class="item">
            <span>${s.name} ${s.surname}</span>
            <div>
                <input type="radio" name="at-${s.id}" value="Present" checked> Ն
                <input type="radio" name="at-${s.id}" value="Absent"> Բ
            </div>
        </div>`).join('');
    res.send(wrapHTML(`
        <h2>Հաշվառում (${new Date().toLocaleDateString()})</h2>
        <form action="/save-attendance" method="POST">
            <input type="hidden" name="subject_id" value="${req.query.subject_id}">
            ${list || "Այս դասարանում աշակերտներ չկան:"}
            <button style="margin-top:20px;">Պահպանել</button>
        </form>
    `));
});

app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    for (const key in req.body) {
        if (key.startsWith('at-')) {
            db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)").run(key.split('-')[1], req.body.subject_id, req.body[key], date);
        }
    }
    res.send(wrapHTML("✅ Պահպանված է: <a href='/'>Հետ</a>"));
});

// Վիճակագրություն
app.get('/stats', (req, res) => {
    const stats = db.prepare("SELECT students.name, students.surname, COUNT(attendance.id) as absents FROM attendance JOIN students ON attendance.student_id = students.id WHERE attendance.status = 'Absent' GROUP BY students.id").all();
    const list = stats.map(s => `<div class="item"><span>${s.name} ${s.surname}</span> <span class="badge">${s.absents} բացակա</span></div>`).join('');
    res.send(wrapHTML(`<h2>📊 Բացակաների Վիճակագրություն</h2>${list || "Դեռ բացականեր չկան"}`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button>Մտնել</button></form>`)));
app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

app.listen(process.env.PORT || 3000);
