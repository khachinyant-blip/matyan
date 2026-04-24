const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'school-matyan-fixed-2026', 
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
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: var(--bg); margin: 0; color: #2f3542; }
        .header { background: var(--grad); color: white; padding: 40px 20px; text-align: center; font-size: 30px; font-weight: 800; }
        .nav { display: flex; justify-content: center; gap: 10px; padding: 15px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: var(--main); padding: 10px 18px; border-radius: 10px; font-weight: bold; border: 2px solid var(--main); transition: 0.3s; }
        .nav a:hover { background: var(--main); color: white; }
        .container { max-width: 900px; margin: 30px auto; padding: 0 15px; }
        .card { background: white; padding: 30px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 25px; }
        h2 { color: var(--main); text-align: center; }
        select, input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; margin-bottom: 15px; font-size: 16px; }
        .btn { background: var(--main); color: white; border: none; padding: 15px; border-radius: 12px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
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
    const classes = db.prepare("SELECT * FROM classes ORDER BY id ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Դասարանի ընտրություն</h2>
        <form action="/attendance-list" method="GET">
            <select name="class_id" id="classSelect" onchange="filterSubjects()" required>
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>
            <select name="subject_id" id="subjectSelect" required></select>
            <button class="btn">Բացել մատյանը</button>
        </form>
        <script>
            const allSubjs = ${JSON.stringify(subjects)};
            function filterSubjects() {
                const classVal = document.getElementById('classSelect').selectedOptions[0].text;
                const grade = parseInt(classVal);
                let level = grade <= 4 ? 'elem' : (grade <= 9 ? 'mid' : 'high');
                const subjSelect = document.getElementById('subjectSelect');
                subjSelect.innerHTML = '';
                allSubjs.forEach(s => {
                    if (s.level === 'all' || s.level.includes(level)) {
                        const opt = document.createElement('option');
                        opt.value = s.id; opt.textContent = s.name;
                        subjSelect.appendChild(opt);
                    }
                });
            }
            filterSubjects();
        </script>
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
    res.send(wrapHTML(`<h2>📝 Հաշվառում</h2><form action="/save-attendance" method="POST">
        <input type="hidden" name="subject_id" value="${req.query.subject_id}">
        <table>${list}</table><button class="btn" style="margin-top:20px;">Պահպանել</button>
    </form>`));
});

app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    const stmt = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const key in req.body) {
        if (key.startsWith('at-')) stmt.run(key.split('-')[1], req.body.subject_id, req.body[key], date);
    }
    res.send(wrapHTML("✅ Պահպանված է: <br><br><a href='/'><button class='btn'>Հետ</button></a>"));
});

app.get('/stats', (req, res) => {
    const stats = db.prepare(`SELECT s.name, COUNT(a.id) as count FROM subjects s LEFT JOIN attendance a ON s.id = a.subject_id AND a.status = 'Absent' GROUP BY s.id`).all();
    res.send(wrapHTML(`<h2>📊 Բացականեր</h2><canvas id="statChart"></canvas>
        <script>
            new Chart(document.getElementById('statChart'), {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(stats.map(s => s.name))},
                    datasets: [{ label: 'Բացակա', data: ${JSON.stringify(stats.map(s => s.count))}, backgroundColor: '#4834d4' }]
                }
            });
        </script>`));
});

app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h1 style="text-align:center;">🎓 Ինտերակտիվ Գիտարան</h1>
        <div class="card" style="border-left: 10px solid #4834d4;">
            <h3>🌌 Տիեզերք</h3>
            <p>Տիեզերքը սկիզբ է առել 13.8 միլիարդ տարի առաջ: Այն անընդհատ ընդարձակվում է, ինչը ապացուցել է Էդվին Հաբլը:</p>
        </div>
        <div class="card" style="border-left: 10px solid #2ecc71;">
            <h3>🌿 Ֆոտոսինթեզ</h3>
            <p>Բույսերը արևի լույսը վերափոխում են էներգիայի: Բանաձևը. <b>6CO₂ + 6H₂O + լույս → C₆H₁₂O₆ + 6O₂</b>:</p>
        </div>
        <div class="card" style="border-left: 10px solid #e67e22;">
            <h3>🇦🇲 Հայոց Ոսկեդար</h3>
            <p>405թ. Մեսրոպ Մաշտոցի կողմից գրերի գյուտը հիմք դրեց հայ հզոր մշակույթին և պատմագրությանը:</p>
        </div>
        <div class="card" style="border-left: 10px solid #9b59b6;">
            <h3>🧪 Յուրի Օհանեսյան</h3>
            <p>Մենդելեևի աղյուսակի 118-րդ տարրը՝ Օգանեսոնը, անվանվել է մեր հայրենակից մեծ գիտնականի պատվին:</p>
        </div>
    `));
});

app.get('/all-students', (req, res) => {
    const students = db.prepare("SELECT s.*, c.name as cname FROM students s JOIN classes c ON s.class_id = c.id ORDER BY CAST(c.name AS INTEGER) ASC, s.surname ASC").all();
    const list = students.map(s => `<tr><td>${s.cname}</td><td>${s.surname} ${s.name} ${s.patronymic}</td></tr>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Ցանկ</h2><div style="max-height:450px; overflow-y:auto;"><table>${list}</table></div>`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST">
    <input type="text" name="u" placeholder="Admin" required>
    <input type="password" name="p" placeholder="123" required>
    <button class="btn">Մտնել</button>
</form>`)));

app.post('/login', (req, res) => {
    if(req.body.u === 'admin' && req.body.p === '123') { req.session.user = 'admin'; res.redirect('/'); }
    else res.send("Սխալ տվյալներ:");
});

app.listen(process.env.PORT || 3000);
