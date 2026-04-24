const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-edit-secret', resave: false, saveUninitialized: true }));

function wrapHTML(content) {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 10px; }
        .nav { display: flex; overflow-x: auto; background: white; padding: 10px; border-radius: 12px; gap: 15px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); sticky: top; }
        .nav a { text-decoration: none; color: #555; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .card { background: white; padding: 15px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 800px; margin: auto; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
        .actions { display: flex; gap: 5px; }
        input, select { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 8px; }
        button { background: #6c5ce7; color: white; border: none; padding: 10px; border-radius: 10px; width: 100%; cursor: pointer; font-weight: bold; }
        .btn-edit { color: #0984e3; text-decoration: none; font-size: 11px; border: 1px solid #0984e3; padding: 3px 6px; border-radius: 5px; }
        .btn-del { color: #d63031; text-decoration: none; font-size: 11px; border: 1px solid #d63031; padding: 3px 6px; border-radius: 5px; }
    </style>
    </head><body>
    <div class="nav">
        <a href="/">📋 Հաշվառում</a>
        <a href="/all-students">👥 Բազա (475)</a>
        <a href="/classes">🏫 Դասարաններ</a>
        <a href="/subjects">📚 Առարկաներ</a>
        <a href="/stats">📊 Վիճակագրություն</a>
    </div>
    <div class="card">${content}</div>
    </body></html>`;
}

// ԱՇԱԿԵՐՏՆԵՐԻ ՑՈՒՑԱԿ (Այստեղ կտեսնես բոլոր 475-ին)
app.get('/all-students', (req, res) => {
    const students = db.prepare("SELECT * FROM students").all();
    const classes = db.prepare("SELECT * FROM classes").all();
    const list = students.map(s => `
        <div class="item">
            <div><b>${s.surname} ${s.name} ${s.patronymic}</b></div>
            <div class="actions">
                <a href="/edit-student-page/${s.id}" class="btn-edit">✍️</a>
                <a href="/delete-student/${s.id}" class="btn-del" onclick="return confirm('Ջնջե՞լ')">×</a>
            </div>
        </div>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Բազա</h2><div style="max-height: 500px; overflow-y: auto;">${list}</div>`));
});

// Մնացած հիմնական ֆունկցիաները (նույնն են)
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`<h2>🔍 Հաշվառում</h2><form action="/attendance-list" method="GET"><select name="class_id" required><option value="">Դասարան</option>${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}</select><select name="subject_id" required><option value="">Առարկա</option>${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}</select><button>Բացել</button></form>`));
});

app.get('/classes', (req, res) => {
    const list = db.prepare("SELECT * FROM classes").all().map(c => `<div class="item"><span>${c.name}</span><a href="/delete-class/${c.id}" class="btn-del">×</a></div>`).join('');
    res.send(wrapHTML(`<h2>🏫 Դասարաններ</h2>${list}<hr><form action="/add-class" method="POST"><input type="text" name="n" placeholder="Նոր դասարան" required><button>+</button></form>`));
});
app.post('/add-class', (req, res) => { db.prepare("INSERT INTO classes (name) VALUES (?)").run(req.body.n); res.redirect('/classes'); });

app.get('/subjects', (req, res) => {
    const list = db.prepare("SELECT * FROM subjects").all().map(s => `<div class="item"><span>${s.name}</span><a href="/delete-subject/${s.id}" class="btn-del">×</a></div>`).join('');
    res.send(wrapHTML(`<h2>📚 Առարկաներ</h2>${list}<hr><form action="/add-subject" method="POST"><input type="text" name="n" placeholder="Նոր առարկա" required><button>+</button></form>`));
});
app.post('/add-subject', (req, res) => { db.prepare("INSERT INTO subjects (name) VALUES (?)").run(req.body.n); res.redirect('/subjects'); });

app.get('/delete-student/:id', (req, res) => { db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id); res.redirect('/all-students'); });
app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button>Մտնել</button></form>`)));
app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });

app.listen(process.env.PORT || 3000);
