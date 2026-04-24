const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'school-matyan-final-2026', 
    resave: false, 
    saveUninitialized: true 
}));

function wrapHTML(content, title = "Էլեկտրոնային Մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root { --main: #4834d4; --grad: linear-gradient(135deg, #4834d4, #686de0); --bg: #f5f6fa; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; color: #2f3542; }
        .header { background: var(--grad); color: white; padding: 40px 20px; text-align: center; font-size: 32px; font-weight: 800; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .nav { display: flex; justify-content: center; gap: 10px; padding: 15px; background: white; flex-wrap: wrap; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: var(--main); padding: 12px 20px; border-radius: 12px; font-weight: bold; font-size: 15px; border: 2px solid var(--main); transition: 0.3s; }
        .nav a:hover { background: var(--main); color: white; }
        .container { max-width: 950px; margin: 30px auto; padding: 0 15px; }
        .card { background: white; padding: 35px; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.06); margin-bottom: 30px; }
        h2 { color: var(--main); text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f1f2f6; padding: 15px; text-align: left; border-bottom: 2px solid var(--main); }
        td { padding: 15px; border-bottom: 1px solid #f1f2f6; }
        .btn { background: var(--main); color: white; border: none; padding: 15px 30px; border-radius: 15px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%; transition: 0.3s; }
        .chart-box { margin: 40px 0; padding: 20px; background: #fff; border-radius: 20px; border: 1px solid #eee; }
        .article { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
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

app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY CAST(name AS INTEGER) ASC, name ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Օրվա Մատյան</h2>
        <form action="/attendance-list" method="GET">
            <select name="class_id" required>${classes.map(c => `<option value="${c.id}">${c.name} դասարան</option>`)}</select>
            <select name="subject_id" required>${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}</select>
            <button class="btn">Բացել</button>
        </form>
    `));
});

app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const list = students.map(s => `<tr>
        <td><b>${s.surname} ${s.name} ${s.patronymic}</b></td>
        <td style="text-align:right;">
            <input type="radio" name="at-${s.id}" value="Present" checked> Ն 
            <input type="radio" name="at-${s.id}" value="Absent"> Բ
        </td>
    </tr>`).join('');
    res.send(wrapHTML(`<h2>📝 Հաշվառում</h2><form action="/save-attendance" method="POST"><input type="hidden" name="subject_id" value="${req.query.subject_id}"><table>${list}</table><button class="btn" style="margin-top:20px;">Պահպանել</button></form>`));
});

app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    const stmt = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const key in req.body) {
        if (key.startsWith('at-')) stmt.run(key.split('-')[1], req.body.subject_id, req.body[key], date);
    }
    res.send(wrapHTML("✅ Հաջողությամբ պահպանվեց! <br><br><a href='/'><button class='btn'>Հետ</button></a>"));
});

app.get('/stats', (req, res) => {
    const subjectStats = db.prepare(`SELECT s.name, COUNT(a.id) as count FROM subjects s LEFT JOIN attendance a ON s.id = a.subject_id AND a.status = 'Absent' GROUP BY s.id`).all();
    res.send(wrapHTML(`
        <h2>📊 Վիճակագրություն</h2>
        <div class="chart-box"><canvas id="subjChart"></canvas></div>
        <script>
            new Chart(document.getElementById('subjChart'), {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(subjectStats.map(s => s.name))},
                    datasets: [{ label: 'Բացակա', data: ${JSON.stringify(subjectStats.map(s => s.count))}, backgroundColor: '#4834d4' }]
                }
            });
        </script>
    `));
});

app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h2>💡 Կրթական Անկյուն</h2>
        <div class="article"><h3>🔭 Տիեզերք</h3><p>Տիեզերքը մշտապես ընդարձակվում է: Հաբլի օրենքը բացատրում է գալակտիկաների հեռացումը:</p></div>
        <div class="article"><h3>🧬 ԴՆԹ</h3><p>ԴՆԹ-ն կրում է բոլոր կենդանի օրգանիզմների գենետիկական կոդը:</p></div>
        <div class="article"><h3>🇦🇲 Ոսկեդար</h3><p>5-րդ դարը հայ գրականության և պատմագրության վերելքի շրջանն է:</p></div>
    `));
});

app.get('/all-students', (req, res) => {
    const students = db.prepare("SELECT s.*, c.name as cname FROM students s JOIN classes c ON s.class_id = c.id ORDER BY CAST(c.name AS INTEGER) ASC, c.name ASC, s.surname ASC").all();
    const list = students.map(s => `<tr><td>${s.cname}</td><td>${s.surname} ${s.name} ${s.patronymic}</td></tr>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Ցանկ</h2><div style="max-height:500px; overflow-y:auto;"><table>${list}</table></div>`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Admin" style="width:100%; padding:10px; margin-bottom:10px;"><input type="password" name="p" placeholder="123" style="width:100%; padding:10px; margin-bottom:10px;"><button class="btn">Մտնել</button></form>`)));
app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });

app.listen(process.env.PORT || 3000);
