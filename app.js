const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-2026-v3', resave: false, saveUninitialized: true }));

function wrapHTML(content) {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Դասերի հաճախումների մատյան</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { --p: #6c5ce7; --bg: #f0f3f7; --txt: #2d3436; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: var(--bg); margin: 0; color: var(--txt); line-height: 1.6; }
        .nav { background: white; padding: 15px; display: flex; justify-content: space-around; position: sticky; top: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 100; }
        .nav a { text-decoration: none; color: var(--txt); font-size: 13px; font-weight: bold; text-align: center; transition: 0.3s; }
        .nav i { display: block; font-size: 20px; color: var(--p); margin-bottom: 3px; }
        .hero { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 35px 20px; text-align: center; border-radius: 0 0 40px 40px; }
        .container { max-width: 1000px; margin: 20px auto; padding: 15px; }
        .card { background: white; padding: 30px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 25px; }
        select, input { width: 100%; padding: 14px; border-radius: 12px; border: 2px solid #edf2f7; margin-bottom: 15px; font-size: 16px; outline: none; }
        .btn { background: var(--p); color: white; border: none; padding: 16px; border-radius: 15px; font-weight: bold; cursor: pointer; width: 100%; font-size: 16px; }
        table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
        td { background: #f8fafc; padding: 15px; border-radius: 10px; }
        .status-btn { padding: 8px 18px; border-radius: 10px; border: 2px solid #eee; cursor: pointer; font-weight: bold; background: white; }
        input[type="radio"]:checked + .status-btn { background: var(--p); color: white; border-color: var(--p); }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        @media (max-width: 600px) { .stat-grid { grid-template-columns: 1fr; } }
    </style>
    </head><body>
    <div class="nav">
        <a href="/"><i class="fa-solid fa-list-check"></i>Մատյան</a>
        <a href="/stats"><i class="fa-solid fa-chart-line"></i>Վիճակագրություն</a>
        <a href="/all-students"><i class="fa-solid fa-address-book"></i>Աշակերտների բազա</a>
        <a href="/edu"><i class="fa-solid fa-book-open"></i>Կրթություն</a>
    </div>
    <div class="hero"><h1>Դասերի հաճախումների մատյան</h1></div>
    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

// 1. ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2><i class="fa-solid fa-folder-open"></i> Հաշվառման ընտրություն</h2>
        <form action="/attendance-list" method="GET">
            <select name="class_id" id="cls" onchange="f()" required>
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>
            <select name="subject_id" id="sbj" required></select>
            <button class="btn">Բացել հաճախումների ցուցակը</button>
        </form>
        <script>
            const ss = ${JSON.stringify(subjects)};
            function f() {
                const g = parseInt(document.getElementById('cls').selectedOptions[0].text);
                let l = g <= 4 ? 'elem' : (g <= 9 ? 'mid' : 'high');
                const sel = document.getElementById('sbj'); sel.innerHTML = '';
                ss.filter(s => s.level==='all' || s.level.includes(l)).forEach(s => {
                    const o = document.createElement('option'); o.value=s.id; o.textContent=s.name; sel.appendChild(o);
                });
            } f();
        </script>`));
});

// 2. ՀԱՇՎԱՌՈՒՄ (Ներառյալ հայրանունները)
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const rows = students.map(s => `<tr>
        <td><b>${s.surname}</b> ${s.name} ${s.patronymic}</td>
        <td style="text-align:right;">
            <label><input type="radio" name="at-${s.id}" value="Present" checked style="display:none"><span class="status-btn">Ն</span></label>
            <label><input type="radio" name="at-${s.id}" value="Absent" style="display:none"><span class="status-btn">Բ</span></label>
        </td>
    </tr>`).join('');
    res.send(wrapHTML(`<h2>Գրանցում</h2><form action="/save" method="POST">
        <input type="hidden" name="sub" value="${req.query.subject_id}">
        <table>${rows}</table><button class="btn" style="margin-top:20px;">Պահպանել</button></form>`));
});

app.post('/save', (req, res) => {
    const now = new Date();
    const isoDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const st = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const k in req.body) if (k.startsWith('at-')) st.run(k.split('-')[1], req.body.sub, req.body[k], isoDate);
    res.send(wrapHTML("<div style='text-align:center;'><h2>✅ Տվյալները պահպանվեցին</h2><br><a href='/'><button class='btn'>Հետ</button></a></div>"));
});

// 3. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ (Կիսամյակ և Տարի)
app.get('/stats', (req, res) => {
    const all = db.prepare(`
        SELECT c.name as cls, a.date, a.status 
        FROM attendance a 
        JOIN students s ON a.student_id = s.id 
        JOIN classes c ON s.class_id = c.id 
        WHERE a.status = 'Absent'
    `).all();

    let stats = { year: {}, s1: {}, s2: {} }; // s1: Sept-Dec, s2: Jan-May

    all.forEach(row => {
        const month = new Date(row.date).getMonth() + 1;
        stats.year[row.cls] = (stats.year[row.cls] || 0) + 1;
        if (month >= 9 || month <= 12) stats.s1[row.cls] = (stats.s1[row.cls] || 0) + 1;
        if (month >= 1 && month <= 5) stats.s2[row.cls] = (stats.s2[row.cls] || 0) + 1;
    });

    res.send(wrapHTML(`
        <h2>📊 Բացակաների վիճակագրություն</h2>
        <div class="stat-grid">
            <div class="card"><h3>1-ին Կիսամյակ (Սեպտ-Դեկտ)</h3><canvas id="chartS1"></canvas></div>
            <div class="card"><h3>2-րդ Կիսամյակ (Հուն-Մայ)</h3><canvas id="chartS2"></canvas></div>
        </div>
        <div class="card"><h3>Ուսումնական տարվա կտրվածքով</h3><canvas id="chartYear"></canvas></div>
        
        <script>
            const cfg = (id, labels, data, color) => new Chart(document.getElementById(id), {
                type: 'bar', data: { labels, datasets: [{ label: 'Բացականեր', data, backgroundColor: color, borderRadius: 8 }] }
            });
            cfg('chartS1', ${JSON.stringify(Object.keys(stats.s1))}, ${JSON.stringify(Object.values(stats.s1))}, '#a29bfe');
            cfg('chartS2', ${JSON.stringify(Object.keys(stats.s2))}, ${JSON.stringify(Object.values(stats.s2))}, '#00cec9');
            cfg('chartYear', ${JSON.stringify(Object.keys(stats.year))}, ${JSON.stringify(Object.values(stats.year))}, '#6c5ce7');
        </script>
    `));
});

// 4. ԱՇԱԿԵՐՏՆԵՐԻ ԲԱԶԱ (Հայրանուններով)
app.get('/all-students', (req, res) => {
    const s = db.prepare("SELECT s.*, c.name as cn FROM students s JOIN classes c ON s.class_id=c.id ORDER BY cn, s.surname").all();
    res.send(wrapHTML(`<h2>👥 Աշակերտների բազա</h2><table>${s.map(i => `<tr><td>${i.cn}</td><td><b>${i.surname}</b> ${i.name} ${i.patronymic}</td></tr>`).join('')}</table>`));
});

// 5. ԿՐԹՈՒԹՅՈՒՆ
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h2>💡 Կրթական հոդվածներ</h2>
        <div class="card"><h3>1. Տիեզերք</h3><p>Տիեզերքի հեռավոր անկյունները դեռևս մնում են չբացահայտված: Այն ունի 13.8 միլիարդ տարվա պատմություն:</p></div>
        <div class="card"><h3>2. Յուրի Օհանեսյան</h3><p>Մեր ժամանակների մեծագույն գիտնականը, ում անունով կոչվել է քիմիական տարր:</p></div>
        <div class="card"><h3>3. Հայոց Ոսկեդար</h3><p>5-րդ դարը մեր պատմության ամենալուսավոր էջերից է՝ գրերի գյուտի շնորհիվ:</p></div>
        <div class="card"><h3>4. Անտարկտիդայի գաղտնիքները</h3><p>Ամենացուրտ մայրցամաքը, որը պարունակում է աշխարհի խմելու ջրի պաշարների 70%-ը:</p></div>
        <div class="card"><h3>5. Օվկիանոսների խորքերը</h3><p>Մենք ավելի շատ գիտենք Լուսնի մակերևույթի մասին, քան օվկիանոսի հատակի:</p></div>
        <div class="card"><h3>6. Մարդու ԴՆԹ</h3><p>Եթե մարդու մեկ բջջի ԴՆԹ-ն բացենք, այն կունենա մոտ 2 մետր երկարություն:</p></div>
        <div class="card"><h3>7. Մեղուների կարևորությունը</h3><p>Առանց մեղուների մարդկությունը կկարողանա գոյատևել ընդամենը մի քանի տարի:</p></div>
        <div class="card"><h3>8. Ռեակտիվ շարժիչներ</h3><p>Ինչպես են հսկա ինքնաթիռները բարձրանում օդ և հաղթահարում ձգողականությունը:</p></div>
        <div class="card"><h3>9. Հրաբուխներ</h3><p>Երկրի ներքին ջերմությունը, որը դուրս է գալիս լավայի տեսքով:</p></div>
        <div class="card"><h3>10. Թվային ապագա</h3><p>Ինչպես է ինտերնետը և ծրագրավորումը փոխում մեր կյանքը ամեն օր:</p></div>
    `));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button class="btn">Մտնել</button></form>`)));
app.post('/login', (req, res) => { if(req.body.u==='admin' && req.body.p==='123') { req.session.user='admin'; res.redirect('/'); } else res.send("Սխալ"); });

app.listen(process.env.PORT || 3000);
