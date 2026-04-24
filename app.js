const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'modern-school-secret', resave: false, saveUninitialized: true }));

// Ժամանակակից դիզայնի ֆունկցիա
function wrapHTML(content, title = "Դպրոցական Մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        :root { --primary: #6c5ce7; --secondary: #a29bfe; --bg: #f8f9fd; --text: #2d3436; --accent: #00cec9; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 0; }
        .header { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 25px; text-align: center; border-radius: 0 0 30px 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .nav { display: flex; justify-content: center; gap: 15px; padding: 20px; flex-wrap: wrap; }
        .nav a { text-decoration: none; color: var(--primary); background: white; padding: 12px 20px; border-radius: 15px; font-weight: bold; font-size: 16px; transition: 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .nav a:hover { transform: translateY(-3px); background: var(--primary); color: white; }
        .container { max-width: 900px; margin: 20px auto; padding: 0 15px; }
        .card { background: white; padding: 30px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); animation: fadeIn 0.5s ease-in; }
        h2 { color: var(--primary); border-bottom: 2px solid var(--bg); padding-bottom: 10px; font-size: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 15px; overflow: hidden; }
        th { background: var(--primary); color: white; padding: 15px; text-align: left; }
        td { padding: 15px; border-bottom: 1px solid #eee; font-size: 15px; }
        tr:hover { background: #f1f0ff; }
        .badge { background: #ffeaa7; color: #d63031; padding: 5px 10px; border-radius: 8px; font-weight: bold; }
        .edu-card { background: #f1f2f6; border-left: 5px solid var(--accent); padding: 15px; margin-bottom: 20px; border-radius: 10px; }
        .edu-img { width: 100%; border-radius: 15px; margin-top: 10px; }
        input, select { padding: 12px; border: 2px solid #eee; border-radius: 12px; font-size: 16px; outline: none; transition: 0.3s; }
        input:focus { border-color: var(--primary); }
        button { background: var(--primary); color: white; border: none; padding: 15px 30px; border-radius: 15px; font-size: 18px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        button:hover { opacity: 0.9; transform: scale(1.02); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
    </head><body>
    <div class="header"><h1>✨ Կրթական Մատյան</h1></div>
    <div class="nav">
        <a href="/">📋 Հաշվառում</a>
        <a href="/stats">📊 Վիճակագրություն</a>
        <a href="/all-students">👥 Աշակերտներ</a>
        <a href="/edu">💡 Գիտելիքի անկյուն</a>
    </div>
    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

// 1. ՎԻՃԱԿԱԳՐՈՒԹՅԱՆ ԷՋ (Աղյուսակով)
app.get('/stats', (req, res) => {
    const students = db.prepare(`
        SELECT s.id, s.name, s.surname, c.name as cname,
        (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'Absent') as total_absents
        FROM students s JOIN classes c ON s.class_id = c.id
        ORDER BY total_absents DESC
    `).all();

    let tableRows = students.map(s => {
        const subjectStats = db.prepare(`
            SELECT sub.name, COUNT(at.id) as count
            FROM attendance at
            JOIN subjects sub ON at.subject_id = sub.id
            WHERE at.student_id = ? AND at.status = 'Absent'
            GROUP BY sub.id
        `).all(s.id);

        let subDetail = subjectStats.map(sub => `${sub.name}: ${sub.count}`).join(', ') || '---';

        return `<tr>
            <td><b>${s.surname} ${s.name}</b><br><small>${s.cname}</small></td>
            <td><span class="badge">${s.total_absents}</span></td>
            <td style="font-size: 12px; color: #636e72;">${subDetail}</td>
        </tr>`;
    }).join('');

    res.send(wrapHTML(`
        <h2>📊 Բացակաների Հաշվետվություն</h2>
        <table>
            <thead>
                <tr>
                    <th>Աշակերտ</th>
                    <th>Ընդհանուր</th>
                    <th>Ըստ առարկաների</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
    `));
});

// 2. ԿՐԹԱԿԱՆ ԲԱԺԻՆ (Գիտահանրամատչելի)
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h2>💡 Հետաքրքիր է իմանալ</h2>
        <div class="edu-card">
            <h3>🌌 Տիեզերքի գաղտնիքները</h3>
            <p>Գիտեի՞ք, որ Վեներա մոլորակի վրա մեկ օրը ավելի երկար է տևում, քան մեկ տարին։ Այն շատ դանդաղ է պտտվում իր առանցքի շուրջ։</p>
            

[Image of planet Venus in solar system]

        </div>
        <div class="edu-card">
            <h3>🧬 Մարդու ԴՆԹ-ն</h3>
            <p>Եթե մարդու մարմնի բոլոր ԴՆԹ մոլեկուլները բացենք ու իրար միացնենք, դրանք կհասնեն մինչև Պլուտոն և հետ։</p>
            

[Image of DNA double helix structure]

        </div>
        <div class="edu-card">
            <h3>🇦🇲 Հայոց Լեզվի հարստությունը</h3>
            <p>Հայերենն ունի ավելի քան 360,000 բառ։ Այն աշխարհի ամենահին և ամենաճկուն լեզուներից մեկն է։</p>
        </div>
    `));
});

// 3. ՀԱՇՎԱՌՄԱՆ ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY CAST(name AS INTEGER) ASC, name ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Օրվա Հաշվառում</h2>
        <form action="/attendance-list" method="GET" style="display:flex; flex-direction:column; gap:15px;">
            <label>Ընտրեք Դասարանը</label>
            <select name="class_id">${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}</select>
            <label>Ընտրեք Առարկան</label>
            <select name="subject_id">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}</select>
            <button>Սկսել հաշվառումը</button>
        </form>
    `));
});

// 4. ԱՇԱԿԵՐՏՆԵՐԻ ՑՈՒՑԱԿ
app.get('/all-students', (req, res) => {
    const students = db.prepare(`SELECT s.*, c.name as cname FROM students s JOIN classes c ON s.class_id = c.id ORDER BY c.name ASC, s.surname ASC`).all();
    const list = students.map(s => `<div class="item"><span><span class="badge" style="background:#e17055; color:white;">${s.cname}</span> ${s.surname} ${s.name}</span></div>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Բազա</h2><div style="max-height:500px; overflow-y:auto;">${list}</div>`));
});

// 5. ՄՈՒՏՔ
app.get('/login', (req, res) => res.send(wrapHTML(`
    <div style="text-align:center;">
        <h2>Մուտք Համակարգ</h2>
        <form action="/login" method="POST" style="display:inline-block; text-align:left;">
            <input type="text" name="u" placeholder="Օգտանուն" required><br>
            <input type="password" name="p" placeholder="Գաղտնաբառ" required><br><br>
            <button>Մուտք</button>
        </form>
    </div>
`)));

app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const list = students.map(s => `<div class="item"><span>${s.surname} ${s.name}</span><div><input type="radio" name="at-${s.id}" value="Present" checked> Ն <input type="radio" name="at-${s.id}" value="Absent"> Բ</div></div>`).join('');
    res.send(wrapHTML(`<h2>Հաշվառում</h2><form action="/save-attendance" method="POST"><input type="hidden" name="subject_id" value="${req.query.subject_id}">${list}<button style="margin-top:20px;">Պահպանել</button></form>`));
});
app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    for (const key in req.body) { if (key.startsWith('at-')) db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)").run(key.split('-')[1], req.body.subject_id, req.body[key], date); }
    res.send(wrapHTML("✅ Հաջողությամբ պահպանվեց։ <br><br><a href='/'><button>Վերադառնալ</button></a>"));
});

app.listen(process.env.PORT || 3000);
