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
        .nav { display: flex; overflow-x: auto; background: white; padding: 10px; border-radius: 12px; gap: 15px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: #555; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .card { background: white; padding: 15px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 800px; margin: auto; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; align-items: center; }
        .actions { display: flex; gap: 5px; align-items: center; }
        .class-tag { background: #6c5ce7; color: white; padding: 2px 8px; border-radius: 6px; font-size: 11px; margin-right: 10px; }
        input, select { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 8px; }
        button { background: #6c5ce7; color: white; border: none; padding: 10px; border-radius: 10px; width: 100%; cursor: pointer; font-weight: bold; }
        .btn-del { color: #d63031; text-decoration: none; font-size: 14px; padding: 0 5px; }
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

app.get('/all-students', (req, res) => {
    const students = db.prepare(`
        SELECT students.*, classes.name as class_name 
        FROM students 
        LEFT JOIN classes ON students.class_id = classes.id
    `).all();
    const list = students.map(s => `
        <div class="item">
            <div>
                <span class="class-tag">${s.class_name || '---'}</span>
                <b>${s.surname} ${s.name} ${s.patronymic}</b>
            </div>
            <div class="actions">
                <a href="/edit-student-page/${s.id}" style="text-decoration:none; font-size:12px;">✏️</a>
                <a href="/delete-student/${s.id}" class="btn-del" onclick="return confirm('Ջնջե՞լ')">×</a>
            </div>
        </div>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Բազա (475 հոգի)</h2><div style="max-height:600px; overflow-y:auto;">${list}</div>`));
});

// Հիմնական մյուս էջերը (Հաշվառում, Դասարաններ և այլն)
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`<h2>🔍 Հաշվառում</h2><form action="/attendance-list" method="GET"><select name="class_id" required><option value="">Ընտրել դասարանը</option>${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}</select><select name="subject_id" required><option value="">Ընտրել առարկան</option>${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}</select><button>Բացել ցուցակը</button></form>`));
});

app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ?").all(req.query.class_id);
    const list = students.map(s => `<div class="item"><span>${s.surname} ${s.name}</span><div><input type="radio" name="at-${s.id}" value="Present" checked> Ն <input type="radio" name="at-${s.id}" value="Absent"> Բ</div></div>`).join('');
    res.send(wrapHTML(`<h2>Դասարանի հաշվառում</h2><form action="/save-attendance" method="POST"><input type="hidden" name="subject_id" value="${req.query.subject_id}">${list || "Այս դասարանում աշակերտներ չկան"}<button style="margin-top:20px;">Պահպանել</button></form>`));
});

app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    for (const key in req.body) { if (key.startsWith('at-')) db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)").run(key.split('-')[1], req.body.subject_id, req.body[key], date); }
    res.send(wrapHTML("✅ Պահպանված է: <a href='/'>Հետ</a>"));
});

app.get('/classes', (req, res) => {
    const list = db.prepare("SELECT * FROM classes").all().map(c => `<div class="item"><span>${c.name}</span> <a href="/delete-class/${c.id}" class="btn-del">×</a></div>`).join('');
    res.send(wrapHTML(`<h2>🏫 Դասարանների Ցանկ</h2>${list}`));
});

app.get('/subjects', (req, res) => {
    const list = db.prepare("SELECT * FROM subjects").all().map(s => `<div class="item"><span>${s.name}</span> <a href="/delete-subject/${s.id}" class="btn-del">×</a></div>`).join('');
    res.send(wrapHTML(`<h2>📚 Առարկաներ</h2>${list}<hr><form action="/add-subject" method="POST"><input type="text" name="n" placeholder="Նոր առարկա" required><button>+</button></form>`));
});
app.post('/add-subject', (req, res) => { db.prepare("INSERT INTO subjects (name) VALUES (?)").run(req.body.n); res.redirect('/subjects'); });

app.get('/delete-student/:id', (req, res) => { db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id); res.redirect('/all-students'); });
app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button>Մտնել</button></form>`)));
app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });

app.listen(process.env.PORT || 3000);
