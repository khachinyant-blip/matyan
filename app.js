const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'shat-gaghtni-ban',
    resave: false,
    saveUninitialized: true
}));

// Օգնող ֆունկցիա դիզայնի համար
function wrapHTML(content) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
        body { font-family: sans-serif; background: #f0f2f5; display: flex; justify-content: center; padding: 20px; }
        .container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); width: 100%; max-width: 500px; }
        input { width: 90%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
        button { background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%; }
        .row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
    </style></head><body><div class="container">${content}</div></body></html>`;
}

// 1. Մուտքի էջ (Login)
app.get('/login', (req, res) => {
    res.send(wrapHTML(`
        <h2>🔐 Մուտք</h2>
        <form action="/login" method="POST">
            <input type="text" name="username" placeholder="Օգտանուն" required><br>
            <input type="password" name="password" placeholder="Գաղտնաբառ" required><br>
            <button type="submit">Մտնել</button>
        </form>
    `));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (row) {
            req.session.user = row.username;
            res.redirect('/');
        } else {
            res.send("Սխալ տվյալներ: <a href='/login'>Նորից փորձել</a>");
        }
    });
});

// 2. Պաշտպանված գլխավոր էջ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    db.all("SELECT * FROM students", [], (err, students) => {
        let list = students.map(s => `<div class="row"><span>${s.name}</span><div>
            <input type="radio" name="st-${s.id}" value="Present" checked> Ն <input type="radio" name="st-${s.id}" value="Absent"> Բ
        </div></div>`).join('');
        
        res.send(wrapHTML(`
            <h2>📝 Մատյան (Բարև, ${req.session.user})</h2>
            <form action="/save" method="POST">${list}<button style="margin-top:20px;">💾 Պահպանել</button></form>
            <br><a href="/report">📊 Հաշվետվություն</a> | <a href="/logout">Դուրս գալ</a>
            <hr><h3>➕ Ավելացնել ուսանող</h3>
            <form action="/add" method="POST"><input type="text" name="name" required><button>Ավելացնել</button></form>
        `));
    });
});

// 3. Ավելացնել, Պահպանել, Հաշվետվություն
app.post('/add', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    db.run("INSERT INTO students (name) VALUES (?)", [req.body.name], () => res.redirect('/'));
});

app.post('/save', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    Object.keys(req.body).forEach(key => {
        db.run("INSERT INTO attendance (student_id, status, date) VALUES (?, ?, ?)", [key.split('-')[1], req.body[key], date]);
    });
    res.send("Պահպանվեց: <a href='/'>Հետ</a>");
});

app.get('/report', (req, res) => {
    db.all("SELECT students.name, attendance.status, attendance.date FROM attendance JOIN students ON students.id = attendance.student_id", (err, rows) => {
        let table = rows.map(r => `<tr><td>${r.date}</td><td>${r.name}</td><td>${r.status}</td></tr>`).join('');
        res.send(wrapHTML(`<h2>📊 Հաշվետվություն</h2><table border="1" width="100%">${table}</table><br><a href="/">Հետ</a>`));
    });
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Սերվերը միացավ ${PORT} պորտում`));