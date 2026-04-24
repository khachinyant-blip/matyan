const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'el-matyan-visual-2026', resave: false, saveUninitialized: true }));

function wrapHTML(content, title = "Էլեկտրոնային Մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root { --main: #4834d4; --grad: linear-gradient(135deg, #4834d4, #686de0); --bg: #f5f6fa; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; color: #2f3542; }
        .header { background: var(--grad); color: white; padding: 40px 20px; text-align: center; font-size: 32px; font-weight: 800; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .nav { display: flex; justify-content: center; gap: 10px; padding: 15px; background: white; flex-wrap: wrap; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: var(--main); padding: 12px 20px; border-radius: 12px; font-weight: bold; font-size: 15px; border: 2px solid var(--main); transition: 0.3s; }
        .nav a:hover { background: var(--main); color: white; }
        .container { max-width: 900px; margin: 30px auto; padding: 0 15px; }
        .card { background: white; padding: 35px; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        .chart-box { margin: 40px 0; padding: 20px; border: 1px solid #eee; border-radius: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f1f2f6; padding: 15px; text-align: left; }
        td { padding: 15px; border-bottom: 1px solid #f1f2f6; }
        .btn { background: var(--main); color: white; border: none; padding: 15px; border-radius: 15px; font-weight: bold; cursor: pointer; width: 100%; }
        .article { margin-bottom: 40px; }
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

// ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY CAST(name AS INTEGER) ASC, name ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Օրվա Մատյան</h2>
        <form action="/attendance-list" method="GET">
            <select name="class_id" required style="width:100%; padding:15px; margin-bottom:10px;">${classes.map(c => `<option value="${c.id}">${c.name} դասարան</option>`)}</select>
            <select name="subject_id" required style="width:100%; padding:15px; margin-bottom:10px;">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}</select>
            <button class="btn">Բացել</button>
        </form>
    `));
});

// ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ (ԳՐԱՖԻԿՆԵՐՈՎ)
app.get('/stats', (req, res) => {
    const subjectStats = db.prepare(`SELECT s.name, COUNT(a.id) as count FROM subjects s LEFT JOIN attendance a ON s.id = a.subject_id AND a.status = 'Absent' GROUP BY s.id`).all();
    const classStats = db.prepare(`SELECT c.name, COUNT(a.id) as count FROM classes c LEFT JOIN students st ON c.id = st.class_id LEFT JOIN attendance a ON st.id = a.student_id AND a.status = 'Absent' GROUP BY c.id`).all();

    res.send(wrapHTML(`
        <h2>📊 Վիճակագրական Վերլուծություն</h2>
        <div class="chart-box">
            <h3>📚 Բացականերն ըստ առարկաների</h3>
            <canvas id="subjChart"></canvas>
        </div>
        <div class="chart-box">
            <h3>🏫 Դասարանների հաճախելիությունը</h3>
            <canvas id="classChart"></canvas>
        </div>
        <script>
            new Chart(document.getElementById('subjChart'), { type: 'bar', data: { labels: ${JSON.stringify(subjectStats.map(s => s.name))}, datasets: [{ label: 'Բացակա', data: ${JSON.stringify(subjectStats.map(s => s.count))}, backgroundColor: '#4834d4' }] } });
            new Chart(document.getElementById('classChart'), { type: 'doughnut', data: { labels: ${JSON.stringify(classStats.map(c => c.name))}, datasets: [{ data: ${JSON.stringify(classStats.map(c => c.count))}, backgroundColor: ['#ff7675','#74b9ff','#55efc4','#ffeaa7','#a29bfe','#fdcb6e'] }] } });
        </script>
    `));
});

// ՀԱՇՎԱՌՄԱՆ ՑՈՒՑԱԿ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const list = students.map(s => `<tr><td><b>${s.surname} ${s.name}</b></td><td style="text-align:right;"><input type="radio" name="at-${s.id}" value="Present" checked> Ն <input type="radio" name="at-${s.id}" value="Absent"> Բ</td></tr>`).join('');
    res.send(wrapHTML(`<h2>📝 Հաշվառում</h2><form action="/save-attendance" method="POST"><input type="hidden" name="subject_id" value="${req.query.subject_id}"><table>${list}</table><button class="btn" style="margin-top:20px;">Պահպանել</button></form>`));
});

app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    const stmt = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const key in req.body) { if (key.startsWith('at-')) stmt.run(key.split('-')[1], req.body.subject_id, req.body[key], date); }
    res.send(wrapHTML("✅ Պահպանված է: <br><br><a href='/'><button class='btn'>Հետ</button></a>"));
});

// ԿՐԹԱԿԱՆ ԱՆԿՅՈՒՆ
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h2>💡 Կրթական Անկյուն</h2>
        <div class="article">
            <h3>🔭 Տիեզերքի Գաղտնիքները</h3>
            <p>Տիեզերքը մշտապես ընդարձակվում է։ Յուրաքանչյուր վայրկյան գալակտիկաները հեռանում են միմյանցից ահռելի արագությամբ։</p>
        </div>
        <div class="article">
            <h3>🏛️ Մատենադարան</h3>
            <p>Հայաստանի հպարտությունը՝ Մատենադարանը, պահպանում է ավելի քան 20,000 հնագույն ձեռագրեր, որոնք մեր պատմության վկաներն են։</p>
        </div>
    `));
});

app.get('/all-students', (req, res) => {
    const students = db.prepare("SELECT s.*, c.name as cname FROM students s JOIN classes c ON s.class_id = c.id ORDER BY CAST(c.name AS INTEGER) ASC, c.name ASC, s.surname ASC").all();
    const list = students.map(s => `<tr><td><span style="background:var(--main); color:white; padding:3px 8px; border-radius:5px;">${s.cname}</span></td><td>${s.surname} ${s.name}</td></tr>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Ցանկ</h2><div style="max-height:500px; overflow-y:auto;"><table>${list}</table></div>`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Admin" style="width:100%; padding:10px; margin-bottom:10px;"><input type="password" name="p" placeholder="123" style="width:100%; padding:10px; margin-bottom:10px;"><button class="btn">Մտնել</button></form>`)));
app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });

app.listen(process.env.PORT || 3000);
