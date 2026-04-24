const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'school-matyan-final-ultra-2026', 
    resave: false, 
    saveUninitialized: true 
}));

// Ընդհանուր դիզայնի Wrapper
function wrapHTML(content, title = "Էլեկտրոնային Մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root { --main: #4834d4; --grad: linear-gradient(135deg, #4834d4, #686de0); --bg: #f5f6fa; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: var(--bg); margin: 0; color: #2f3542; line-height: 1.6; }
        .header { background: var(--grad); color: white; padding: 40px 20px; text-align: center; font-size: 32px; font-weight: 800; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .nav { display: flex; justify-content: center; gap: 10px; padding: 15px; background: white; flex-wrap: wrap; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: var(--main); padding: 12px 20px; border-radius: 12px; font-weight: bold; font-size: 15px; border: 2px solid var(--main); transition: 0.3s; }
        .nav a:hover { background: var(--main); color: white; }
        .container { max-width: 950px; margin: 30px auto; padding: 0 15px; }
        .card { background: white; padding: 35px; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.06); margin-bottom: 30px; }
        h2 { color: var(--main); text-align: center; margin-bottom: 25px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f1f2f6; padding: 15px; text-align: left; border-bottom: 2px solid var(--main); }
        td { padding: 15px; border-bottom: 1px solid #f1f2f6; }
        .btn { background: var(--main); color: white; border: none; padding: 15px 30px; border-radius: 15px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%; transition: 0.3s; margin-top: 10px; }
        .btn:hover { filter: brightness(1.1); transform: scale(1.01); }
        select, input { width: 100%; padding: 15px; border-radius: 12px; border: 2px solid #ddd; font-size: 16px; margin-bottom: 15px; }
        .badge { background: #4834d4; color: white; padding: 3px 10px; border-radius: 6px; font-size: 12px; }
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

// 1. ԳԼԽԱՎՈՐ ԷՋ (ՀԱՇՎԱՌՄԱՆ ՄԵՆՅՈՒ + ՖԻԼՏՐ)
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY id ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Օրվա Մատյանի Լրացում</h2>
        <form action="/attendance-list" method="GET">
            <label>Ընտրեք դասարանը.</label>
            <select name="class_id" id="classSelect" onchange="filterSubjects()" required>
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>
            <label>Ընտրեք առարկան.</label>
            <select name="subject_id" id="subjectSelect" required></select>
            <button class="btn">Բացել Աշակերտների Ցուցակը</button>
        </form>
        <script>
            const allSubjs = ${JSON.stringify(subjects)};
            function filterSubjects() {
                const classSelect = document.getElementById('classSelect');
                const subjSelect = document.getElementById('subjectSelect');
                const className = classSelect.options[classSelect.selectedIndex].text;
                const grade = parseInt(className);
                let level = grade <= 4 ? 'elem' : (grade <= 9 ? 'mid' : 'high');
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

// 2. ՀԱՇՎԱՌՄԱՆ ՑՈՒՑԱԿ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const list = students.map(s => `<tr>
        <td><b>${s.surname} ${s.name} ${s.patronymic}</b></td>
        <td style="text-align:right;">
            <label><input type="radio" name="at-${s.id}" value="Present" checked> Ն</label>
            <label style="margin-left:10px;"><input type="radio" name="at-${s.id}" value="Absent"> Բ</label>
        </td>
    </tr>`).join('');
    res.send(wrapHTML(`<h2>📝 Հաշվառում</h2><form action="/save-attendance" method="POST"><input type="hidden" name="subject_id" value="${req.query.subject_id}"><table>${list}</table><button class="btn">Պահպանել</button></form>`));
});

// 3. ՏՎՅԱԼՆԵՐԻ ՊԱՀՊԱՆՈՒՄ
app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    const stmt = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const key in req.body) {
        if (key.startsWith('at-')) stmt.run(key.split('-')[1], req.body.subject_id, req.body[key], date);
    }
    res.send(wrapHTML("<h3>✅ Տվյալները պահպանվեցին</h3><br><a href='/'><button class='btn'>Վերադառնալ</button></a>"));
});

// 4. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ
app.get('/stats', (req, res) => {
    const stats = db.prepare(`SELECT s.name, COUNT(a.id) as count FROM subjects s LEFT JOIN attendance a ON s.id = a.subject_id AND a.status = 'Absent' GROUP BY s.id`).all();
    res.send(wrapHTML(`
        <h2>📊 Վիճակագրություն (Բացականեր)</h2>
        <canvas id="statChart"></canvas>
        <script>
            new Chart(document.getElementById('statChart'), {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(stats.map(s => s.name))},
                    datasets: [{ label: 'Բացակա', data: ${JSON.stringify(stats.map(s => s.count))}, backgroundColor: '#4834d4' }]
                }
            });
        </script>
    `));
});

// 5. ԿՐԹԱԿԱՆ ԱՆԿՅՈՒՆ (ԶԱՐԳԱՑՎԱԾ)
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h1 style="text-align:center;">🎓 Ինտերակտիվ Գիտարան</h1>
        <div class="card" style="border-left: 10px solid #4834d4;">
            <h3 style="color:#4834d4;">🌌 Տիեզերքի ընդարձակումը</h3>
