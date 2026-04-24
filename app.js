const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-2026-advanced-stats', resave: false, saveUninitialized: true }));

function wrapHTML(content) {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Դասերի հաճախումների մատյան</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { --p: #6c5ce7; --bg: #f0f3f7; --txt: #2d3436; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; color: var(--txt); }
        .nav { background: white; padding: 15px; display: flex; justify-content: space-around; position: sticky; top: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 100; }
        .nav a { text-decoration: none; color: var(--txt); font-size: 13px; font-weight: bold; text-align: center; }
        .nav i { display: block; font-size: 20px; color: var(--p); margin-bottom: 3px; }
        .hero { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 25px; text-align: center; border-radius: 0 0 40px 40px; }
        .container { max-width: 1100px; margin: 20px auto; padding: 0 15px; }
        .card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); margin-bottom: 20px; }
        select, input { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #ddd; margin-bottom: 15px; font-size: 16px; }
        .btn { background: var(--p); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: bold; cursor: pointer; width: 100%; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8fafc; color: var(--p); }
        .total-badge { background: var(--p); color: white; padding: 2px 8px; border-radius: 5px; font-weight: bold; }
    </style>
    </head><body>
    <div class="nav">
        <a href="/"><i class="fa-solid fa-calendar-check"></i>Մատյան</a>
        <a href="/stats"><i class="fa-solid fa-chart-line"></i>Վիճակագրություն</a>
        <a href="/all-students"><i class="fa-solid fa-users"></i>Բազա</a>
        <a href="/edu"><i class="fa-solid fa-lightbulb"></i>Կրթություն</a>
    </div>
    <div class="hero"><h2>Դասերի հաճախումների մատյան</h2></div>
    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

// ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    const today = new Date().toISOString().split('T')[0];
    res.send(wrapHTML(`
        <h3><i class="fa-solid fa-edit"></i> Գրանցել հաճախում</h3>
        <form action="/attendance-list" method="GET">
            <input type="date" name="selected_date" value="${today}" required>
            <select name="class_id" id="cls" onchange="f()" required>
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>
            <select name="subject_id" id="sbj" required></select>
            <button class="btn">Բացել ցուցակը</button>
        </form>
        <script>
            const ss = ${JSON.stringify(subjects)};
            function f() {
                const c = document.getElementById('cls'); if(!c.selectedOptions.length) return;
                const g = parseInt(c.selectedOptions[0].text);
                let l = g <= 4 ? 'elem' : (g <= 9 ? 'mid' : 'high');
                const s = document.getElementById('sbj'); s.innerHTML = '';
                ss.filter(x => x.level==='all' || x.level.includes(l)).forEach(x => {
                    const o = document.createElement('option'); o.value=x.id; o.textContent=x.name; s.appendChild(o);
                });
            } f();
        </script>`));
});

// ՀԱՇՎԱՌՄԱՆ ՑՈՒՑԱԿ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const rows = students.map(s => `<tr><td>${s.surname} ${s.name} ${s.patronymic}</td><td style="text-align:right;">
        <label><input type="radio" name="at-${s.id}" value="Present" checked style="display:none"><span style="padding:8px 15px; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-weight:bold;">Ն</span></label>
        <label><input type="radio" name="at-${s.id}" value="Absent" style="display:none"><span style="padding:8px 15px; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-weight:bold;">Բ</span></label>
    </td></tr>`).join('');
    res.send(wrapHTML(`<h3>Գրանցում (${req.query.selected_date})</h3><form action="/save" method="POST">
        <input type="hidden" name="sub" value="${req.query.subject_id}"><input type="hidden" name="date" value="${req.query.selected_date}">
        <table>${rows}</table><button class="btn" style="margin-top:20px;">Պահպանել</button></form>`));
});

app.post('/save', (req, res) => {
    const st = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const k in req.body) if (k.startsWith('at-')) st.run(k.split('-')[1], req.body.sub, req.body[k], req.body.date);
    res.send(wrapHTML("✅ Պահպանված է <br><br><a href='/'><button class='btn'>Հետ</button></a>"));
});

// ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ ԸՍՏ ԴԱՍԱՐԱՆԻ ԵՎ ԱՇԱԿԵՐՏԻ
app.get('/stats', (req, res) => {
    const classes = db.prepare("SELECT * FROM classes").all();
    const classId = req.query.class_id;
    let tableContent = "";

    if (classId) {
        const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(classId);
        const attendance = db.prepare(`
            SELECT student_id, status, date FROM attendance 
            WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)
        `).all(classId);

        tableContent = students.map(s => {
            const sAtt = attendance.filter(a => a.student_id === s.id && a.status === 'Absent');
            let s1 = 0, s2 = 0;
            sAtt.forEach(a => {
                const m = new Date(a.date).getMonth() + 1;
                if (m >= 9 || m <= 12) s1++; else s2++;
            });
            return `<tr>
                <td><b>${s.surname}</b> ${s.name}</td>
                <td>${s1}</td>
                <td>${s2}</td>
                <td><span class="total-badge">${s1 + s2}</span></td>
            </tr>`;
        }).join('');
    }

    res.send(wrapHTML(`
        <h3><i class="fa-solid fa-chart-pie"></i> Մանրամասն վիճակագրություն</h3>
        <form action="/stats" method="GET">
            <label>Ընտրեք դասարանը.</label>
            <select name="class_id" onchange="this.form.submit()">
                <option value="">--- Ընտրել ---</option>
                ${classes.map(c => `<option value="${c.id}" ${classId == c.id ? 'selected' : ''}>${c.name}</option>`)}
            </select>
        </form>
        ${classId ? `
            <table>
                <thead><tr><th>Աշակերտ (Ազգանուն Անուն)</th><th>1-ին կիս.</th><th>2-րդ կիս.</th><th>Ընդհանուր</th></tr></thead>
                <tbody>${tableContent}</tbody>
            </table>
        ` : '<p style="text-align:center; color:#888;">Ընտրեք դասարանը տվյալները տեսնելու համար:</p>'}
    `));
});

// ԱՇԱԿԵՐՏՆԵՐԻ ԲԱԶԱ
app.get('/all-students', (req, res) => {
    const s = db.prepare("SELECT s.*, c.name as cn FROM students s JOIN classes c ON s.class_id=c.id ORDER BY cn, s.surname").all();
    res.send(wrapHTML(`<h3>Աշակերտների բազա</h3><table>${s.map(i => `<tr><td>${i.cn}</td><td>${i.surname} ${i.name} ${i.patronymic}</td></tr>`).join('')}</table>`));
});

// ԿՐԹՈՒԹՅՈՒՆ
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`<h3>Կրթական հոդվածներ</h3>
        <div class="card"><h4>1. Յուրի Օհանեսյան</h4><p>Հայ մեծագույն գիտնական, ում անունով կոչվել է 118-րդ տարրը:</p></div>
        <div class="card"><h4>2. Հայոց Ոսկեդար</h4><p>Մշակութային վերելքի ժամանակաշրջան Մեսրոպ Մաշտոցի գյուտից հետո:</p></div>
        <div class="card"><h4>3. Տիեզերք</h4><p>Տիեզերքը անվերջ ընդարձակվում է Մեծ պայթյունից ի վեր:</p></div>
    `));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button class="btn">Մտնել</button></form>`)));
app.post('/login', (req, res) => { if(req.body.u==='admin' && req.body.p==='123') { req.session.user='admin'; res.redirect('/'); } else res.send("Սխալ"); });

app.listen(process.env.PORT || 3000);
