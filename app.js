const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-2026-calendar-v1', resave: false, saveUninitialized: true }));

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
        .nav a { text-decoration: none; color: var(--txt); font-size: 13px; font-weight: bold; text-align: center; }
        .nav i { display: block; font-size: 20px; color: var(--p); margin-bottom: 3px; }
        .hero { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 30px; text-align: center; border-radius: 0 0 40px 40px; }
        .container { max-width: 900px; margin: 20px auto; padding: 15px; }
        .card { background: white; padding: 30px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 25px; }
        label { display: block; margin-bottom: 8px; font-weight: bold; color: var(--p); }
        select, input { width: 100%; padding: 14px; border-radius: 12px; border: 2px solid #edf2f7; margin-bottom: 20px; font-size: 16px; outline: none; box-sizing: border-box; }
        .btn { background: var(--p); color: white; border: none; padding: 16px; border-radius: 15px; font-weight: bold; cursor: pointer; width: 100%; font-size: 16px; transition: 0.3s; }
        .btn:hover { background: #5649c0; transform: translateY(-2px); }
        table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
        td { background: #f8fafc; padding: 15px; border-radius: 12px; }
        .status-btn { padding: 10px 20px; border-radius: 10px; border: 2px solid #eee; cursor: pointer; font-weight: bold; background: white; }
        input[type="radio"]:checked + .status-btn { background: var(--p); color: white; border-color: var(--p); }
        .date-badge { background: #ffeaa7; color: #d63031; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
    </style>
    </head><body>
    <div class="nav">
        <a href="/"><i class="fa-solid fa-calendar-day"></i>Մատյան</a>
        <a href="/stats"><i class="fa-solid fa-chart-pie"></i>Վիճակագրություն</a>
        <a href="/all-students"><i class="fa-solid fa-users-rectangle"></i>Բազա</a>
        <a href="/edu"><i class="fa-solid fa-book-open-reader"></i>Կրթություն</a>
    </div>
    <div class="hero">
        <h1 style="margin:0;">Դասերի հաճախումների մատյան</h1>
    </div>
    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

// 1. ԳԼԽԱՎՈՐ ԷՋ - Ամսաթվի ընտրությամբ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY name").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    const today = new Date().toISOString().split('T')[0];

    res.send(wrapHTML(`
        <h2><i class="fa-solid fa-user-check"></i> Նոր հաշվառում</h2>
        <form action="/attendance-list" method="GET">
            <label>Ընտրեք ամսաթիվը.</label>
            <input type="date" name="selected_date" value="${today}" required>
            
            <label>Դասարան.</label>
            <select name="class_id" id="cls" onchange="f()" required>
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>
            
            <label>Առարկա (ըստ դասացուցակի).</label>
            <select name="subject_id" id="sbj" required></select>
            
            <button class="btn">Բացել օրվա մատյանը</button>
        </form>
        <script>
            const ss = ${JSON.stringify(subjects)};
            function f() {
                const selCls = document.getElementById('cls');
                if(!selCls.selectedOptions.length) return;
                const g = parseInt(selCls.selectedOptions[0].text);
                let l = g <= 4 ? 'elem' : (g <= 9 ? 'mid' : 'high');
                const sel = document.getElementById('sbj'); sel.innerHTML = '';
                ss.filter(s => s.level==='all' || s.level.includes(l)).forEach(s => {
                    const o = document.createElement('option'); o.value=s.id; o.textContent=s.name; sel.appendChild(o);
                });
            } f();
        </script>`));
});

// 2. ՀԱՇՎԱՌՄԱՆ ՑՈՒՑԱԿ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const date = req.query.selected_date;
    
    const rows = students.map(s => `<tr>
        <td><b>${s.surname}</b> ${s.name} ${s.patronymic}</td>
        <td style="text-align:right;">
            <label style="display:inline-block; margin-right:10px;">
                <input type="radio" name="at-${s.id}" value="Present" checked style="display:none">
                <span class="status-btn">Ն</span>
            </label>
            <label style="display:inline-block;">
                <input type="radio" name="at-${s.id}" value="Absent" style="display:none">
                <span class="status-btn">Բ</span>
            </label>
        </td>
    </tr>`).join('');

    res.send(wrapHTML(`
        <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
            <h2 style="margin:0;">Օրվա հաշվառում</h2>
            <span class="date-badge"><i class="fa-solid fa-calendar"></i> ${date}</span>
        </div>
        <form action="/save" method="POST">
            <input type="hidden" name="sub" value="${req.query.subject_id}">
            <input type="hidden" name="date" value="${date}">
            <table>${rows}</table>
            <button class="btn" style="margin-top:20px;">Պահպանել օրվա տվյալները</button>
        </form>`));
});

// 3. ՏՎՅԱԼՆԵՐԻ ՊԱՀՊԱՆՈՒՄ
app.post('/save', (req, res) => {
    const selectedDate = req.body.date;
    const st = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    
    for (const k in req.body) {
        if (k.startsWith('at-')) {
            st.run(k.split('-')[1], req.body.sub, req.body[k], selectedDate);
        }
    }
    res.send(wrapHTML(`
        <div style='text-align:center; padding:20px;'>
            <i class="fa-solid fa-circle-check" style="font-size:60px; color:#2ecc71;"></i>
            <h2>Հաջողությամբ գրանցվեց</h2>
            <p>${selectedDate} ամսաթվի հաշվառումը պահպանված է:</p>
            <a href='/'><button class='btn' style='max-width:200px;'>Հետ դեպի մատյան</button></a>
        </div>`));
});

// 4. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ (Տարի և Կիսամյակ)
app.get('/stats', (req, res) => {
    const all = db.prepare(`
        SELECT c.name as cls, a.date, a.status 
        FROM attendance a 
        JOIN students s ON a.student_id = s.id 
        JOIN classes c ON s.class_id = c.id 
        WHERE a.status = 'Absent'
    `).all();

    let stats = { year: {}, s1: {}, s2: {} };

    all.forEach(row => {
        const m = new Date(row.date).getMonth() + 1;
        stats.year[row.cls] = (stats.year[row.cls] || 0) + 1;
        if (m >= 9 || m <= 12) stats.s1[row.cls] = (stats.s1[row.cls] || 0) + 1;
        if (m >= 1 && m <= 5) stats.s2[row.cls] = (stats.s2[row.cls] || 0) + 1;
    });

    res.send(wrapHTML(`
        <h2>📊 Բացակաների վերլուծություն</h2>
        <div class="card"><h3>Ուսումնական տարի (Ընդհանուր)</h3><canvas id="cy"></canvas></div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div class="card"><h4>1-ին Կիսամյակ</h4><canvas id="c1"></canvas></div>
            <div class="card"><h4>2-րդ Կիսամյակ</h4><canvas id="c2"></canvas></div>
        </div>
        <script>
            const createChart = (id, label, dataObj, color) => new Chart(document.getElementById(id), {
                type: 'bar', data: { labels: Object.keys(dataObj), datasets: [{ label: label, data: Object.values(dataObj), backgroundColor: color, borderRadius: 10 }] }
            });
            createChart('cy', 'Տարեկան բացականեր', ${JSON.stringify(stats.year)}, '#6c5ce7');
            createChart('c1', '1-ին կիսամյակ', ${JSON.stringify(stats.s1)}, '#a29bfe');
            createChart('c2', '2-րդ կիսամյակ', ${JSON.stringify(stats.s2)}, '#00cec9');
        </script>`));
});

// 5. ԱՇԱԿԵՐՏՆԵՐԻ ԲԱԶԱ (Հայրանուններով)
app.get('/all-students', (req, res) => {
    const s = db.prepare("SELECT s.*, c.name as cn FROM students s JOIN classes c ON s.class_id=c.id ORDER BY cn, s.surname").all();
    res.send(wrapHTML(`<h2>👥 Աշակերտների ամբողջական բազա</h2><table>${s.map(i => `<tr><td><span style="color:var(--p); font-weight:bold;">${i.cn}</span></td><td><b>${i.surname}</b> ${i.name} ${i.patronymic}</td></tr>`).join('')}</table>`));
});

// 6. ԿՐԹՈՒԹՅՈՒՆ
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h2>💡 Գիտելիքի շտեմարան</h2>
        <div class="card"><h3>1. Յուրի Օհանեսյան</h3><p>Միակ հայ գիտնականը, ում անունով կենդանության օրոք անվանվել է քիմիական տարր (Օգանեսոն):</p></div>
        <div class="card"><h3>2. Տիեզերքի ընդարձակումը</h3><p>Տիեզերքը ոչ միայն մեծ է, այլև ամեն վայրկյան ավելի արագ է ընդարձակվում:</p></div>
        <div class="card"><h3>3. Հայոց Ոսկեդար</h3><p>405թ. Մաշտոցի գյուտով սկսվեց մեր մշակութային վերելքը:</p></div>
        <div class="card"><h3>4. Օվկիանոսի խորքերը</h3><p>Մարիանյան անդունդը ավելի խորն է, քան Էվերեստը բարձր:</p></div>
        <div class="card"><h3>5. Ապագայի տեխնոլոգիաներ</h3><p>Արհեստական բանականությունը փոխում է կրթության ձևը:</p></div>
    `));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button class="btn">Մտնել</button></form>`)));
app.post('/login', (req, res) => { if(req.body.u==='admin' && req.body.p==='123') { req.session.user='admin'; res.redirect('/'); } else res.send("Սխալ"); });

app.listen(process.env.PORT || 3000);
