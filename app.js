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
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 10px; }
        .nav { display: flex; overflow-x: auto; background: white; padding: 10px; border-radius: 12px; gap: 10px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: #555; font-size: 11px; font-weight: 600; white-space: nowrap; padding: 5px; }
        .card { background: white; padding: 15px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 600px; margin: auto; }
        .item { border-bottom: 1px solid #eee; padding: 8px 0; display: flex; justify-content: space-between; align-items: center; }
        .class-tag { background: #6c5ce7; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 8px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 8px; }
        button { background: #6c5ce7; color: white; border: none; padding: 10px; border-radius: 10px; width: 100%; cursor: pointer; font-weight: bold; }
    </style>
    </head><body>
    <div class="nav">
        <a href="/">📋 Հաշվառում</a>
        <a href="/all-students">👥 Բազա</a>
        <a href="/classes">🏫 Դասարաններ</a>
        <a href="/subjects">📚 Առարկաներ</a>
        <a href="/stats">📊 Վիճակագրություն</a>
    </div>
    <div class="card">${content}</div>
    </body></html>`;
}

// ԱՇԱԿԵՐՏՆԵՐԻ ԲԱԶԱ (Ցույց է տալիս դասարանը)
app.get('/all-students', (req, res) => {
    const students = db.prepare(`
        SELECT students.*, classes.name as class_name 
        FROM students 
        LEFT JOIN classes ON students.class_id = classes.id
        ORDER BY classes.name ASC
    `).all();
    const list = students.map(s => `
        <div class="item">
            <div>
                <span class="class-tag">${s.class_name || '---'}</span>
                <b>${s.surname} ${s.name} ${s.patronymic}</b>
            </div>
            <a href="/delete-student/${s.id}" style="color:red; text-decoration:none;">×</a>
        </div>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Բազա</h2><div style="max-height:500px; overflow-y:auto;">${list}</div>`));
});

// ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Հաշվառում</h2>
        <form action="/attendance-list" method="GET">
            <select name="class_id" required><option value="">Ընտրել դասարանը</option>${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}</select>
            <select name="subject_id" required><option value="">Ընտրել առարկան</option>${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}</select>
            <button>Բացել ցուցակը</button>
        </form>
    `));
});

// Հաշվառման ցուցակ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ?").all(req.query.class_id);
    const list = students.map(s => `<div class="item"><span>${s.surname} ${s.name}</span><div><input type="radio" name="at-${s.id}" value="Present" checked> Ն <input type="radio" name="at-${s.id}" value="Absent"> Բ</div></div>`).join('');
    res.send(wrapHTML(`<h2>Հաշվառում</h2><form action="/save-attendance" method="POST"><input type="hidden" name="subject_id" value="${req.query.subject_id}">${list || "Այս դասարանում աշակերտներ չկան"}<button style="margin-top:20px;">Պահպանել</button></form>`));
});

app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    for (const key in req.body) { if (key.startsWith('at-')) db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)").run(key.split('-')[1], req.body.subject_id, req.body[key], date); }
    res.send(wrapHTML("✅ Պահպանված է: <a href='/'>Հետ</a>"));
});

app.get('/classes', (req, res) => {
    const list = db.prepare("SELECT * FROM classes").all().map(c => `<div class="item"><span>${c.name}</span></div>`).join('');
    res.send(wrapHTML(`<h2>🏫 Դասարաններ</h2>${list}`));
});

app.get('/subjects', (req, res) => {
    const list = db.prepare("SELECT * FROM subjects").all().map(s => `<div class="item"><span>${s.name}</span></div>`).join('');
    res.send(wrapHTML(`<h2>📚 Առարկաներ</h2>${list}<hr><form action="/add-subject" method="POST"><input type="text" name="n" placeholder="Նոր առարկա" required><button>+</button></form>`));
});
app.post('/add-subject', (req, res) => { db.prepare("INSERT INTO subjects (name) VALUES (?)").run(req.body.n); res.redirect('/subjects'); });

app.get('/delete-student/:id', (req, res) => { db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id); res.redirect('/all-students'); });

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button>Մտնել</button></form>`)));
app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });

app.listen(process.env.PORT || 3000);
