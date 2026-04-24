const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'aesthetic-secret',
    resave: false,
    saveUninitialized: true
}));

// --- ԷՍԹԵՏԻԿ ԴԻԶԱՅՆԻ ՖՈՒՆԿՑԻԱ ---
function wrapHTML(content, user = null) {
    return `
    <!DOCTYPE html>
    <html lang="hy">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Մատյան | Էսթետիկ</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
            
            :root {
                --main-bg: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
                --glass: rgba(255, 255, 255, 0.7);
                --accent: #6c5ce7;
                --text: #2d3436;
            }

            body { 
                font-family: 'Nunito', sans-serif; 
                background: var(--main-bg); 
                min-height: 100vh;
                margin: 0; padding: 20px; 
                display: flex; justify-content: center; align-items: flex-start;
            }

            .container { 
                width: 100%; max-width: 450px; 
                background: var(--glass); 
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                padding: 30px; border-radius: 30px; 
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                border: 1px solid rgba(255,255,255,0.3);
                animation: fadeIn 0.8s ease;
            }

            @keyframes fadeIn { from {opacity: 0; transform: translateY(10px);} to {opacity: 1; transform: translateY(0);} }

            h2 { color: var(--accent); text-align: center; font-weight: 700; margin-bottom: 25px; }

            /* Ինտերակտիվ Քարտեր */
            .card {
                background: white; border-radius: 20px; padding: 15px;
                margin-bottom: 12px; display: flex; justify-content: space-between;
                align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.03);
                transition: 0.3s;
            }
            .card:hover { transform: scale(1.02); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

            /* Նուրբ Կոճակներ */
            button, .btn {
                background: var(--accent); color: white; border: none;
                padding: 12px 20px; border-radius: 15px; cursor: pointer;
                font-weight: 600; transition: 0.3s; text-decoration: none;
                display: inline-block; text-align: center;
            }
            button:hover { opacity: 0.9; box-shadow: 0 5px 15px rgba(108, 92, 231, 0.4); }

            input[type="text"], input[type="password"] {
                width: 100%; padding: 12px; border-radius: 15px;
                border: 1px solid rgba(0,0,0,0.05); background: rgba(255,255,255,0.8);
                margin-bottom: 15px; box-sizing: border-box;
            }

            /* Radio buttons style */
            .status-btn { display: none; }
            .status-label {
                padding: 6px 12px; border-radius: 10px; font-size: 13px;
                cursor: pointer; border: 1px solid #eee; transition: 0.3s;
            }
            .status-btn:checked + .label-p { background: #55efc4; color: white; border-color: #55efc4; }
            .status-btn:checked + .label-a { background: #ff7675; color: white; border-color: #ff7675; }

            .delete-link { color: #fab1a0; text-decoration: none; font-size: 18px; margin-left: 10px; }
            .nav { display: flex; justify-content: space-between; margin-top: 20px; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">${content}</div>
    </body>
    </html>`;
}

// --- ԵՐԹՈՒՂԻՆԵՐ (ROUTES) ---

app.get('/login', (req, res) => {
    res.send(wrapHTML(`
        <h2>✨ Բարի Գալուստ</h2>
        <form action="/login" method="POST">
            <input type="text" name="username" placeholder="Օգտանուն" required>
            <input type="password" name="password" placeholder="Գաղտնաբառ" required>
            <button type="submit">Մուտք Գործել</button>
        </form>
    `));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (row) { req.session.user = row.username; res.redirect('/'); }
        else { res.send(wrapHTML("<h3>Սխալ տվյալներ:</h3><a href='/login'>Նորից փորձել</a>")); }
    });
});

app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    db.all("SELECT * FROM students", (err, students) => {
        let list = students.map(s => `
            <div class="card">
                <span>${s.name}</span>
                <div style="display:flex; align-items:center;">
                    <input type="radio" name="st-${s.id}" value="Present" checked id="p-${s.id}" class="status-btn">
                    <label for="p-${s.id}" class="status-label label-p">Ն</label>
                    <input type="radio" name="st-${s.id}" value="Absent" id="a-${s.id}" class="status-btn">
                    <label for="a-${s.id}" class="status-label label-a" style="margin-left:5px;">Բ</label>
                    <a href="/delete/${s.id}" class="delete-link" onclick="return confirm('Ջնջե՞լ')">×</a>
                </div>
            </div>
        `).join('');

        res.send(wrapHTML(`
            <h2>📝 Դասամատյան</h2>
            <form action="/save" method="POST">
                ${list || '<p style="text-align:center; opacity:0.6;">Ցուցակը դատարկ է</p>'}
                <button type="submit" style="margin-top:20px; background:#6c5ce7;">💾 Պահպանել Հաշվառումը</button>
            </form>
            <div class="nav">
                <a href="/report" style="color:var(--accent); text-decoration:none;">📊 Հաշվետվություն</a>
                <a href="/logout" style="color:#ff7675; text-decoration:none;">Դուրս գալ</a>
            </div>
            <hr style="margin:25px 0; border:none; border-top:1px solid rgba(0,0,0,0.05);">
            <form action="/add" method="POST" style="display:flex; gap:10px;">
                <input type="text" name="name" placeholder="Նոր աշակերտ" required style="margin:0;">
                <button type="submit" style="width:auto; padding:10px 15px;">+</button>
            </form>
        `));
    });
});

app.post('/add', (req, res) => {
    db.run("INSERT INTO students (name) VALUES (?)", [req.body.name], () => res.redirect('/'));
});

app.get('/delete/:id', (req, res) => {
    db.run("DELETE FROM students WHERE id = ?", [req.params.id], () => res.redirect('/'));
});

app.post('/save', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    Object.keys(req.body).forEach(key => {
        if(key.startsWith('st-')) {
            db.run("INSERT INTO attendance (student_id, status, date) VALUES (?, ?, ?)", [key.split('-')[1], req.body[key], date]);
        }
    });
    res.send(wrapHTML("<h3>✅ Հաջողությամբ պահպանվեց</h3><a href='/' class='btn'>Հետ վերադառնալ</a>"));
});

app.get('/report', (req, res) => {
    db.all("SELECT students.name, attendance.status, attendance.date FROM attendance JOIN students ON students.id = attendance.student_id ORDER BY attendance.date DESC", (err, rows) => {
        let table = rows.map(r => `
            <div class="card" style="font-size:14px;">
                <span><b>${r.date}</b> - ${r.name}</span>
                <span style="color:${r.status === 'Present' ? '#2ecc71' : '#e74c3c'}">${r.status === 'Present' ? 'Ներկա' : 'Բացակա'}</span>
            </div>
        `).join('');
        res.send(wrapHTML(`<h2>📊 Հաշվետվություն</h2>${table}<br><a href="/" class="btn" style="width:100%; box-sizing:border-box;">⬅ Հետ</a>`));
    });
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Կայքը պատրաստ է ${PORT} պորտում`));