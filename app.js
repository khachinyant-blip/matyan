const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'school-matyan-secret-2026', 
    resave: false, 
    saveUninitialized: true 
}));

// Ընդհանուր դիզայնի շաբլոն (Wrapper)
function wrapHTML(content, title = "Էլեկտրոնային Մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root { --main: #4834d4; --grad: linear-gradient(135deg, #4834d4, #686de0); --bg: #f5f6fa; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); margin: 0; color: #2f3542; }
        .header { background: var(--grad); color: white; padding: 40px 20px; text-align: center; font-size: 32px; font-weight: 800; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .nav { display: flex; justify-content: center; gap: 10px; padding: 15px; background: white; flex-wrap: wrap; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: var(--main); padding: 12px 20px; border-radius: 12px; font-weight: bold; font-size: 15px; border: 2px solid var(--main); transition: 0.3s; }
        .nav a:hover { background: var(--main); color: white; transform: translateY(-2px); }
        .container { max-width: 950px; margin: 30px auto; padding: 0 15px; }
        .card { background: white; padding: 35px; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.06); margin-bottom: 30px; }
        h2 { color: var(--main); text-align: center; font-size: 28px; margin-bottom: 25px; }
        h3 { color: #57606f; margin-bottom: 15px; border-left: 5px solid var(--main); padding-left: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f1f2f6; color: #57606f; padding: 15px; text-align: left; border-bottom: 2px solid var(--main); }
        td { padding: 15px; border-bottom: 1px solid #f1f2f6; font-size: 16px; }
        .btn { background: var(--main); color: white; border: none; padding: 15px 30px; border-radius: 15px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%; transition: 0.3s; }
        .btn:hover { filter: brightness(1.2); transform: scale(1.01); }
        .chart-box { margin: 40px 0; padding: 20px; background: #fff; border-radius: 20px; border: 1px solid #eee; }
        .article { margin-bottom: 50px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .article h3 { color: #eb4d4b; border: none; padding: 0; font-size: 26px; }
        .article p { line-height: 1.8; font-size: 18px; color: #535c68; text-align: justify; }
        .badge { background: #ff7675; color: white; padding: 4px 10px; border-radius: 8px; font-weight: bold; }
        input[type="radio"] { transform: scale(1.5); margin-right: 5px; cursor: pointer; }
        select, input[type="text"], input[type="password"] { width: 100%; padding: 15px; border-radius: 12px; border: 2px solid #ddd; font-size: 16px; margin-bottom: 15px; }
    </style>
    </head><body>
    <div class="header">📱 Էլեկտրոնային Մատյան</div>
    <div class="nav">
        <a href="/">📋 Հաշվառում</a>
        <a href="/stats">📊 Վիճակագրություն</a>
        <a href="/all-students">👥 Աշակերտներ</a>
        <a href="/edu">💡 Կրթական Անկյուն</a>
    </div>
    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

// 1. ԳԼԽԱՎՈՐ ԷՋ (ՀԱՇՎԱՌՄԱՆ ՄԵՆՅՈՒ)
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY CAST(name AS INTEGER) ASC, name ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Օրվա Մատյանի Լրացում</h2>
        <form action="/attendance-list" method="GET">
            <label>Ընտրեք դասարանը.</label>
            <select name="class_id" required>
                ${classes.map(c => `<option value="${c.id}">${c.name} դասարան</option>`)}
            </select>
            <label>Ընտրեք առարկան.</label>
            <select name="subject_id" required>
                ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}
            </select>
            <button class="btn">Բացել Աշակերտների Ցուցակը</button>
        </form>
    `));
});

// 2. ՀԱՇՎԱՌՄԱՆ ՑՈՒՑԱԿ (ԱՅՍՏԵՂ ԵՆ ՀԱՅՐԱՆՈՒՆՆԵՐԸ)
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const list = students.map(s => `<tr>
        <td><b>${s.surname} ${s.name} ${s.patronymic}</b></td>
        <td style="text-align:right;">
            <label style="margin-right:15px; color:green; font-weight:bold;"><input type="radio" name="at-${s.id}" value="Present" checked> Ն</label>
            <label style="color:red; font-weight:bold;"><input type="radio" name="at-${s.id}" value="Absent"> Բ</label>
        </td>
    </tr>`).join('');
    res.send(wrapHTML(`
        <h2>📝 Դասամատյանի Հաշվառում</h2>
        <form action="/save-attendance" method="POST">
            <input type="hidden" name="subject_id" value="${req.query.subject_id}">
            <table>
                <thead><tr><th>Աշակերտի Ազգանուն Անուն Հայրանուն</th><th style="text-align:right;">Կարգավիճակ</th></tr></thead>
                <tbody>${list}</tbody>
            </table>
            <button class="btn" style="margin-top:25px; background:#20bf6b;">Պահպանել Տվյալները</button>
        </form>
    `));
});

// 3. ՏՎՅԱԼՆԵՐԻ ՊԱՀՊԱՆՈՒՄ
app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    const sid = req.body.subject_id;
    const stmt = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const key in req.body) {
        if (key.startsWith('at-')) {
            stmt.run(key.split('-')[1], sid, req.body[key], date);
        }
    }
    res.send(wrapHTML("<div style='text-align:center;'><h3>✅ Հաշվառումը հաջողությամբ պահպանվեց!</h3><br><a href='/'><button class='btn' style='width:auto;'>Վերադառնալ</button></a></div>"));
});

// 4. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ (ԳՐԱՖԻԿՆԵՐՈՎ)
app.get('/stats', (req, res) => {
    const subjectStats = db.prepare(`SELECT s.name, COUNT(a.id) as count FROM subjects s LEFT JOIN attendance a ON s.id = a.subject_id AND a.status = 'Absent' GROUP BY s.id`).all();
    const classStats = db.prepare(`SELECT c.name, COUNT(a.id) as count FROM classes c LEFT JOIN students st ON c.id = st.class_id LEFT JOIN attendance a ON st.id = a.student_id AND a.status = 'Absent'
