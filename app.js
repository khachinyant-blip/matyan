const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-2026', resave: false, saveUninitialized: true }));

function wrapHTML(content) {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Մատյան</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { --p: #6c5ce7; --bg: #f0f3f7; --txt: #2d3436; }
        body { font-family: sans-serif; background: var(--bg); margin: 0; color: var(--txt); }
        .nav { background: white; padding: 15px; display: flex; justify-content: space-around; sticky; top: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 100; }
        .nav a { text-decoration: none; color: var(--txt); font-size: 14px; font-weight: bold; text-align: center; }
        .nav i { display: block; font-size: 20px; color: var(--p); margin-bottom: 3px; }
        .hero { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 30px; text-align: center; border-radius: 0 0 30px 30px; }
        .container { max-width: 800px; margin: 20px auto; padding: 15px; }
        .card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); margin-bottom: 20px; }
        select, input { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #ddd; margin-bottom: 10px; font-size: 16px; }
        .btn { background: var(--p); color: white; border: none; padding: 15px; border-radius: 12px; font-weight: bold; cursor: pointer; width: 100%; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 15px; border-bottom: 1px solid #eee; }
        .status-btn { padding: 8px 15px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer; font-weight: bold; }
        input[type="radio"]:checked + .status-btn { background: var(--p); color: white; border-color: var(--p); }
    </style>
    </head><body>
    <div class="nav">
        <a href="/"><i class="fa-solid fa-check"></i>Մատյան</a>
        <a href="/stats"><i class="fa-solid fa-chart-bar"></i>Վիճակ</a>
        <a href="/all-students"><i class="fa-solid fa-users"></i>Աշակերտ</a>
        <a href="/edu"><i class="fa-solid fa-lightbulb"></i>Կրթություն</a>
    </div>
    <div class="hero"><h1>Դասամատյան 2.0</h1></div>
    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2><i class="fa-solid fa-search"></i> Ընտրություն</h2>
        <form action="/attendance-list" method="GET">
            <select name="class_id" id="cls" onchange="f()" required>
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>
            <select name="subject_id" id="sbj" required></select>
            <button class="btn">Բացել</button>
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

app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ?").all(req.query.class_id);
    const rows = students.map(s => `<tr><td><b>${s.surname}</b> ${s.name}</td><td>
        <label><input type="radio" name="at-${s.id}" value="Present" checked style="display:none"><span class="status-btn">Ն</span></label>
        <label><input type="radio" name="at-${s.id}" value="Absent" style="display:none"><span class="status-btn">Բ</span></label>
    </td></tr>`).join('');
    res.send(wrapHTML(`<h2>Հաշվառում</h2><form action="/save" method="POST">
        <input type="hidden" name="sub" value="${req.query.subject_id}"><table>${rows}</table>
        <button class="btn" style="margin-top:15px;">Պահպանել</button></form>`));
});

app.post('/save', (req, res) => {
    const d = new Date().toLocaleDateString('hy-AM');
    const st = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const k in req.body) if (k.startsWith('at-')) st.run(k.split('-')[1], req.body.sub, req.body[k], d);
    res.send(wrapHTML("✅ Պահպանված է <br><br><a href='/'><button class='btn'>Հետ</button></a>"));
});

app.get('/stats', (req, res) => {
    const s = db.prepare("SELECT c.name, COUNT(a.id) as n FROM classes c JOIN students st ON st.class_id=c.id JOIN attendance a ON a.student_id=st.id WHERE a.status='Absent' GROUP BY c.id").all();
    res.send(wrapHTML(`<h2>Վիճակագրություն</h2><canvas id="c"></canvas>
        <script>new Chart(document.getElementById('c'), {type:'bar', data:{labels:${JSON.stringify(s.map(i=>i.name))}, datasets:[{label:'Բացակա', data:${JSON.stringify(s.map(i=>i.n))}, backgroundColor:'#6c5ce7'}]}});</script>`));
});

app.get('/all-students', (req, res) => {
    const s = db.prepare("SELECT s.*, c.name as cn FROM students s JOIN classes c ON s.class_id=c.id ORDER BY cn, s.surname").all();
    res.send(wrapHTML(`<h2>Աշակերտներ</h2><table>${s.map(i => `<tr><td>${i.cn}</td><td>${i.surname} ${i.name}</td></tr>`).join('')}</table>`));
});

app.get('/edu', (req, res) => {
    res.send(wrapHTML(`<h2>Կրթություն</h2>
        <div class="card"><h3>🌌 Տիեզերք</h3><p>Տիեզերքը 13.8 մլրդ տարեկան է:</p></div>
        <div class="card"><h3>🇦🇲 Ոսկեդար</h3><p>405թ. Մեսրոպ Մաշտոցը ստեղծեց հայոց գրերը:</p></div>`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button class="btn">Մտնել</button></form>`)));
app.post('/login', (req, res) => { if(req.body.u==='admin' && req.body.p==='123') { req.session.user='admin'; res.redirect('/'); } else res.send("Սխալ"); });

app.listen(process.env.PORT || 3000);
