const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'school-matyan-pro-2026', 
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
        .header { background: var(--grad); color: white; padding: 30px; text-align: center; font-size: 28px; font-weight: bold; }
        .nav { display: flex; justify-content: center; gap: 10px; padding: 15px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); sticky; top:0; z-index:100; }
        .nav a { text-decoration: none; color: var(--main); padding: 10px 15px; border-radius: 10px; font-weight: bold; border: 2px solid var(--main); transition: 0.3s; }
        .nav a:hover { background: var(--main); color: white; }
        .container { max-width: 1000px; margin: 20px auto; padding: 0 15px; }
        .card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); margin-bottom: 20px; }
        h2 { color: var(--main); border-bottom: 2px solid #eee; padding-bottom: 10px; }
        select, input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; margin-bottom: 15px; }
        .btn { background: var(--main); color: white; border: none; padding: 15px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
        .cls-badge { background: #eb4d4b; color: white; padding: 2px 8px; border-radius: 5px; font-size: 14px; }
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

// 1. ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY id ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Դասամատյանի Լրացում</h2>
        <form action="/attendance-list" method="GET">
            <label>Դասարան.</label>
            <select name="class_id" id="classSelect" onchange="filterSubjects()" required>
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>
            <label>Առարկա.</label>
            <select name="subject_id" id="subjectSelect" required></select>
            <button class="btn">Բացել ցուցակը</button>
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

// 2. ՀԱՇՎԱՌՄԱՆ ՑՈՒՑԱԿ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const list = students.map(s => `<tr>
        <td><b>${s.surname} ${s.name} ${s.patronymic}</b></td>
        <td style="text-align:right;">
            <input type="radio" name="at-${s.id}" value="Present" checked> Ն
            <input type="radio" name="at-${s.id}" value="Absent"> Բ
        </td>
    </tr>`).join('');
    res.send(wrapHTML(`<h2>📝 Հաշվառում (${req.query.class_id} դասարան)</h2><form action="/save-attendance" method="POST">
        <input type="hidden" name="subject_id" value="${req.query.subject_id}">
        <table>${list}</table><button class="btn" style="margin-top:20px;">Պահպանել</button>
    </form>`));
});

// 3. ՏՎՅԱԼՆԵՐԻ ՊԱՀՊԱՆՈՒՄ
app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    const stmt = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const key in req.body) {
        if (key.startsWith('at-')) stmt.run(key.split('-')[1], req.body.subject_id, req.body[key], date);
    }
    res.send(wrapHTML("✅ Հաշվառումը հաջողությամբ կատարվեց: <br><br><a href='/'><button class='btn'>Հետ</button></a>"));
});

// 4. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ՝ ԴԱՍԱՐԱՆՆԵՐՈՎ ՏԱՐԱՆՋԱՏՎԱԾ
app.get('/stats', (req, res) => {
    // Բացականերն ըստ դասարանների
    const classStats = db.prepare(`
        SELECT c.name as className, COUNT(a.id) as totalAbsents 
        FROM classes c 
        JOIN students s ON s.class_id = c.id 
        JOIN attendance a ON a.student_id = s.id 
        WHERE a.status = 'Absent' 
        GROUP BY c.id
    `).all();

    const classLabels = JSON.stringify(classStats.map(i => i.className));
    const classData = JSON.stringify(classStats.map(i => i.totalAbsents));

    res.send(wrapHTML(`
        <h2>📊 Վիճակագրություն ըստ դասարանների</h2>
        <div class="card">
            <h3>Ընդհանուր բացակաները</h3>
            <canvas id="classChart"></canvas>
        </div>
        
        <div class="card">
            <h3>Մանրամասն հաշվետվություն</h3>
            <table>
                <thead><tr><th>Դասարան</th><th>Բացակաների քանակ</th></tr></thead>
                <tbody>
                    ${classStats.map(s => `<tr><td><b>${s.className}</b></td><td>${s.totalAbsents}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>

        <script>
            new Chart(document.getElementById('classChart'), {
                type: 'bar',
                data: {
                    labels: ${classLabels},
                    datasets: [{
                        label: 'Բացականեր',
                        data: ${classData},
                        backgroundColor: '#4834d4'
                    }]
                },
                options: { responsive: true }
            });
        </script>
    `));
});

// 5. ԿՐԹԱԿԱՆ ԱՆԿՅՈՒՆ
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h2>💡 Կրթական Անկյուն</h2>
        <div class="card"><h3>🌌 Տիեզերք</h3><p>Տիեզերքը ծնվել է 13.8 մլրդ տարի առաջ Մեծ Պայթյունի արդյունքում:</p></div>
        <div class="card"><h3>🌿 Ֆոտոսինթեզ</h3><p>Բույսերը արևի լույսը վերածում են էներգիայի: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</p></div>
        <div class="card"><h3>🇦🇲 Ոսկեդար</h3><p>5-րդ դար. հայոց գրերի գյուտը Մեսրոպ Մաշտոցի կողմից:</p></div>
    `));
});

// 6. ԱՇԱԿԵՐՏՆԵՐԻ ՑՈՒՑԱԿ
app.get('/all-students', (req, res) => {
    const students = db.prepare("SELECT s.*, c.name as cname FROM students s JOIN classes c ON s.class_id = c.id ORDER BY CAST(c.name AS INTEGER) ASC, s.surname ASC").all();
    const list = students.map(s => `<tr><td><span class="cls-badge">${s.cname}</span></td><td><b>${s.surname}</b> ${s.name} ${s.patronymic}</td></tr>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Ցանկ</h2><div style="max-height:450px; overflow-y:auto;"><table>${list}</table></div>`));
});

// 7. ՄՈՒՏՔ
app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Admin" required><input type="password" name="p" placeholder="123" required><button class="btn">Մտնել</button></form>`)));
app.post('/login', (req, res) => {
    if(req.body.u === 'admin' && req.body.p === '123') { req.session.user = 'admin'; res.redirect('/'); }
    else res.send("Սխալ տվյալներ:");
});

app.listen(process.env.PORT || 3000);
