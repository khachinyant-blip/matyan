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
        .tag { background: #6c5ce7; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 8px; }
        button { background: #6c5ce7; color: white; border: none; padding: 10px; border-radius: 10px; width: 100%; cursor: pointer; font-weight: bold; }
        .del { color: #ff7675; text-decoration: none; font-size: 14px; font-weight: bold; }
    </style>
    </head><body>
    <div class="nav">
        <a href="/">📋 Հաշվառում</a>
        <a href="/all-students">👥 Աշակերտներ</a>
        <a href="/classes">🏫 Դասարաններ</a>
        <a href="/subjects">📚 Առարկաներ</a>
    </div>
    <div class="card">${content}</div>
    </body></html>`;
}

// Բազան՝ ըստ դասարանի (1-12) և ըստ ազգանվան
app.get('/all-students', (req, res) => {
    const students = db.prepare(`
        SELECT students.*, classes.name as cname 
        FROM students 
        JOIN classes ON students.class_id = classes.id 
        ORDER BY CAST(classes.name AS INTEGER) ASC, classes.name ASC, students.surname ASC
    `).all();
    const list = students.map(s => `
        <div class="item">
            <div><span class="tag">${s.cname}</span> ${s.surname} ${s.name}</div>
            <a href="/delete-student/${s.id}" class="del">×</a>
        </div>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Ցանկ</h2><div style="max-height:550px; overflow-y:auto;">${list}</div>`));
});

app.get('/classes', (req, res) => {
    const list = db.prepare("SELECT * FROM classes ORDER BY CAST(name AS INTEGER) ASC, name ASC").all().map(c => `
        <div class="item"><span>${c.name}</span> <a href="/delete-class/${c.id}" class="del" onclick="return confirm('Ջնջե՞լ դասարանը')">ջնջել</a></div>
    `).join('');
    res.send(wrapHTML(`<h2>🏫 Դասարաններ</h2>${list}`));
});

app.get('/subjects', (req, res) => {
    const list = db.prepare("SELECT * FROM subjects").all().map(s => `<div class="item"><span>${s.name}</span> <a href="/delete-subject/${s.id}" class="del">×</a></div>`).join('');
    res.send(wrapHTML(`<h2>📚 Առարկաներ</h2>${list}`));
});

app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY CAST(name AS INTEGER) ASC, name ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`<h2>🔍 Հաշվառում</h2><form action="/attendance-list" method="GET"><select name="class_id">${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}</select><select name="subject_id">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}</select><button>Բացել</button></form>`));
});

// Մնացած գործողությունները
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const list = students.map(s => `<div class="item"><span>${s.surname} ${s.name}</span><div><input type="radio" name="at-${s.id}" value="Present" checked> Ն <input type="radio" name="at-${s.id}" value="Absent"> Բ</div></div>`).join('');
    res.send(wrapHTML(`<h2>Հաշվառում</h2><form action="/save-attendance" method="POST"><input type="hidden" name="subject_id" value="${req.query.subject_id}">${list}<button style="margin-top:20px;">Պահպանել</button></form>`));
});

app.get('/delete-class/:id', (req, res) => { db.prepare("DELETE FROM students WHERE class_id = ?").run(req.params.id); db.prepare("DELETE FROM classes WHERE id = ?").run(req.params.id); res.redirect('/classes'); });
app.get('/delete-student/:id', (req, res) => { db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id); res.redirect('/all-students'); });
app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button>Մտնել</button></form>`)));
app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });
app.listen(process.env.PORT || 3000);
