const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

function wrapHTML(content) {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <style>
        body { font-family: sans-serif; background: linear-gradient(135deg, #e0c3fc, #8ec5fc); min-height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0; }
        .box { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 350px; text-align: center; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; }
        button { background: #6c5ce7; color: white; border: none; padding: 12px; width: 100%; border-radius: 10px; cursor: pointer; font-weight: bold; }
        .card { background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 10px; display: flex; justify-content: space-between; }
    </style>
    </head><body><div class="box">${content}</div></body></html>`;
}

app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const students = db.prepare("SELECT * FROM students").all();
    let list = students.map(s => `<div class="card"><span>${s.name}</span> <a href="/delete/${s.id}" style="color:red; text-decoration:none;">×</a></div>`).join('');
    res.send(wrapHTML(`<h2>📝 Մատյան</h2> ${list} <hr> <form action="/add" method="POST"><input type="text" name="name" placeholder="Անուն" required><button>+</button></form> <br> <a href="/logout">Դուրս գալ</a>`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>✨ Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Օգտանուն"><input type="password" name="p" placeholder="Գաղտնաբառ"><button>Մտնել</button></form>`)));

app.post('/login', (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(req.body.u, req.body.p);
    if (user) { req.session.user = user.username; res.redirect('/'); }
    else res.send("Սխալ է: <a href='/login'>Հետ</a>");
});

app.post('/add', (req, res) => { db.prepare("INSERT INTO students (name) VALUES (?)").run(req.body.name); res.redirect('/'); });
app.get('/delete/:id', (req, res) => { db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id); res.redirect('/'); });
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Live at ${PORT}`));
