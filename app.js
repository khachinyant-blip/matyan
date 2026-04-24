const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-memory-2026', resave: false, saveUninitialized: true }));

function wrapHTML(content) {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Դասերի հաճախումների մատյան</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { --p: #6c5ce7; --s: #a29bfe; --bg: #f4f7fa; --txt: #2d3436; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: var(--bg); margin: 0; color: var(--txt); overflow-x: hidden; }
        .nav { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); padding: 15px; display: flex; justify-content: space-around; position: sticky; top: 0; box-shadow: 0 2px 15px rgba(0,0,0,0.1); z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.3); }
        .nav a { text-decoration: none; color: var(--txt); font-size: 12px; font-weight: bold; text-align: center; transition: 0.3s; opacity: 0.8; }
        .nav i { display: block; font-size: 22px; color: var(--p); margin-bottom: 4px; }
        .nav a:hover { opacity: 1; transform: translateY(-2px); }
        .hero { background: linear-gradient(135deg, var(--p), var(--s)); color: white; padding: 40px 20px; text-align: center; border-radius: 0 0 50px 50px; box-shadow: 0 10px 20px rgba(108, 92, 231, 0.2); }
        .container { max-width: 1000px; margin: 20px auto; padding: 15px; }
        .card { background: white; padding: 30px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 25px; animation: slideUp 0.5s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        select, input { width: 100%; padding: 14px; border-radius: 15px; border: 2px solid #edf2f7; margin-bottom: 15px; font-size: 16px; outline: none; transition: 0.3s; }
        select:focus { border-color: var(--p); }
        .btn { background: var(--p); color: white; border: none; padding: 16px; border-radius: 15px; font-weight: bold; cursor: pointer; width: 100%; font-size: 16px; transition: 0.3s; box-shadow: 0 5px 15px rgba(108, 92, 231, 0.3); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(108, 92, 231, 0.4); }
        .btn-red { background: #ff7675; box-shadow: 0 5px 15px rgba(255, 118, 117, 0.3); margin-top: 10px; }
        table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
        td { background: #f8fafc; padding: 15px; border-radius: 15px; border: 1px solid #f1f5f9; }
        .status-btn { padding: 10px 20px; border-radius: 12px; border: 2px solid #eee; cursor: pointer; font-weight: bold; background: white; transition: 0.2s; display: inline-block; }
        input[type="radio"]:checked + .status-btn { background: var(--p); color: white; border-color: var(--p); transform: scale(1.1); }
        .edu-item { border-left: 6px solid var(--p); padding: 10px 20px; margin-bottom: 30px; background: #fff; border-radius: 0 15px 15px 0; }
        .edu-item h3 { color: var(--p); margin-top: 0; }
    </style>
    </head><body>
    <div class="nav">
        <a href="/"><i class="fa-solid fa-clipboard-user"></i>Մատյան</a>
        <a href="/stats"><i class="fa-solid fa-chart-pie"></i>Վիճակագրություն</a>
        <a href="/all-students"><i class="fa-solid fa-users-viewfinder"></i>Բազա</a>
        <a href="/edu"><i class="fa-solid fa-lightbulb"></i>Կրթություն</a>
    </div>
    <div class="hero">
        <h1 style="margin:0; font-size: 26px;">Դասերի հաճախումների մատյան</h1>
        <p style="margin:8px 0 0; opacity: 0.8;">Պահպանեք և կառավարեք տվյալները հեշտությամբ</p>
    </div>
    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

// 1. ՄԱՏՅԱՆԻ ՄՈՒՏՔ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY name").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    const today = new Date().toISOString().split('T')[0];
    res.send(wrapHTML(`
        <h3><i class="fa-solid fa-calendar-plus"></i> Օրվա հաշվառում</h3>
        <form action="/attendance-list" method="GET">
            <label style="font-weight:bold; display:block; margin-bottom:5px;">Ամսաթիվ</label>
            <input type="date" name="selected_date" value="${today}" required>
            <label style="font-weight:bold; display:block; margin-bottom:5px;">Դասարան</label>
            <select name="class_id" id="cls" onchange="f()" required>
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>
            <label style="font-weight:bold; display:block; margin-bottom:5px;">Առարկա</label>
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

// 2. ՆԵՐԿԱ-ԲԱՑԱԿԱ (ՀԱՅՐԱՆՈՒՆՆԵՐՈՎ)
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const rows = students.map(s => `<tr>
        <td><b>${s.surname}</b> ${s.name} ${s.patronymic}</td>
        <td style="text-align:right;">
            <label><input type="radio" name="at-${s.id}" value="Present" checked style="display:none"><span class="status-btn">Ն</span></label>
            <label><input type="radio" name="at-${s.id}" value="Absent" style="display:none"><span class="status-btn">Բ</span></label>
        </td></tr>`).join('');
    res.send(wrapHTML(`<h3>Գրանցում (${req.query.selected_date})</h3>
        <form action="/save" method="POST">
            <input type="hidden" name="sub" value="${req.query.subject_id}">
            <input type="hidden" name="date" value="${req.query.selected_date}">
            <table>${rows}</table>
            <button class="btn" style="margin-top:20px;">Պահպանել տվյալները</button>
        </form>`));
});

// 3. ՀԻՇՈՂՈՒԹՅՈՒՆ (SAVE)
app.post('/save', (req, res) => {
    const st = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const k in req.body) if (k.startsWith('at-')) st.run(k.split('-')[1], req.body.sub, req.body[k], req.body.date);
    res.send(wrapHTML("<div style='text-align:center;'><h2>✅ Տվյալները հիշվեցին</h2><br><a href='/'><button class='btn' style='width:200px;'>Հետ</button></a></div>"));
});

// 4. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ + ՋՆՋԵԼՈՒ ՀՆԱՐԱՎՈՐՈՒԹՅՈՒՆ
app.get('/stats', (req, res) => {
    const classes = db.prepare("SELECT * FROM classes ORDER BY name").all();
    const classId = req.query.class_id;
    let table = "";

    if (classId) {
        const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(classId);
        const att = db.prepare("SELECT student_id, date FROM attendance WHERE status='Absent' AND student_id IN (SELECT id FROM students WHERE class_id=?)").all(classId);
        
        table = students.map(s => {
            const sAtt = att.filter(a => a.student_id === s.id);
            let s1 = 0, s2 = 0;
            sAtt.forEach(a => { const m = new Date(a.date).getMonth()+1; if(m>=9 || m<=12) s1++; else s2++; });
            return `<tr><td><b>${s.surname}</b> ${s.name}</td><td>${s1}</td><td>${s2}</td><td style="font-weight:bold; color:var(--p);">${s1+s2}</td></tr>`;
        }).join('');
    }

    res.send(wrapHTML(`
        <h3>Մանրամասն վիճակագրություն</h3>
        <form action="/stats" method="GET">
            <select name="class_id" onchange="this.form.submit()">
                <option value="">--- Ընտրեք դասարանը ---</option>
                ${classes.map(c => `<option value="${c.id}" ${classId==c.id?'selected':''}>${c.name} դասարան</option>`)}
            </select>
        </form>
        ${classId ? `
            <table><thead><tr><th>Աշակերտ</th><th>1-ին կիս.</th><th>2-րդ կիս.</th><th>Ընդհանուր</th></tr></thead><tbody>${table}</tbody></table>
            <form action="/delete-stats" method="POST" onsubmit="return confirm('Վստա՞հ եք, որ ուզում եք ջնջել այս դասարանի բոլոր տվյալները:')">
                <input type="hidden" name="class_id" value="${classId}">
                <button class="btn btn-red"><i class="fa-solid fa-trash-can"></i> Ջնջել այս դասարանի հիշողությունը</button>
            </form>
        ` : '<p style="text-align:center; color:#888;">Ընտրեք դասարանը տվյալները տեսնելու համար</p>'}`));
});

// 5. ՋՆՋՈՒՄ (DELETE)
app.post('/delete-stats', (req, res) => {
    db.prepare("DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)").run(req.body.class_id);
    res.redirect('/stats');
});

// 6. ԿՐԹՈՒԹՅՈՒՆ (10 ՀՈԴՎԱԾ)
app.get('/edu', (req, res) => {
    const articles = [
        ["Յուրի Օհանեսյան", "Միակ հայ գիտնականը, ում անունով կենդանության օրոք անվանվել է քիմիական տարր՝ Օգանեսոն (Og):"],
        ["Տիեզերքի ընդարձակումը", "Տիեզերքը ոչ միայն մեծ է, այլև ամեն վայրկյան ավելի արագ է ընդարձակվում դեպի անհայտություն:"],
        ["Հայոց Ոսկեդար", "405 թվականին Մաշտոցի հանճարեղ գյուտով սկսվեց հայ գրականության և թարգմանչական արվեստի վերելքը:"],
        ["Արհեստական Բանականություն", "AI-ը սովորում է տվյալների հիման վրա և այժմ օգնում է բժիշկներին, ինժեներներին և ուսուցիչներին:"],
        ["Օվկիանոսի խորքերը", "Մարդկությունը ավելի շատ գիտի Մարսի մակերևույթի մասին, քան օվկիանոսի ամենախորը կետերի:"],
        ["Մարդու ԴՆԹ", "Մեկ մարդու բջջի ԴՆԹ-ն, եթե բացենք, կունենա մոտ 2 մետր երկարություն: Մենք գենետիկ հրաշք ենք:"],
        ["Բույսերի ֆոտոսինթեզ", "Առանց բույսերի և լույսի համագործակցության երկրի վրա թթվածին չէր լինի: Սա կյանքի բանաձևն է:"],
        ["Հին աշխարհի հրաշալիքներ", "Գիզայի բուրգերը միակն են 7 հրաշալիքներից, որոնք կանգուն են մնացել մինչ մեր օրերը:"],
        ["Մեղուների կարևորությունը", "Եթե աշխարհից անհետանան մեղուները, մարդկությունը կունենա ընդամենը 4 տարվա կյանք:"],
        ["Թվային անվտանգություն", "Ինտերնետում ձեր տվյալները պաշտպանելը նույնքան կարևոր է, որքան տան դուռը փակելը:"]
    ];
    res.send(wrapHTML(`<h2>💡 Կրթական անկյուն</h2>${articles.map(a => `<div class="edu-item"><h3>${a[0]}</h3><p>${a[1]}</p></div>`).join('')}`));
});

app.get('/all-students', (req, res) => {
    const s = db.prepare("SELECT s.*, c.name as cn FROM students s JOIN classes c ON s.class_id=c.id ORDER BY cn, s.surname").all();
    res.send(wrapHTML(`<h3>Աշակերտների բազա</h3><table>${s.map(i => `<tr><td><span style="color:var(--p);font-weight:bold;">${i.cn}</span></td><td>${i.surname} ${i.name} ${i.patronymic}</td></tr>`).join('')}</table>`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button class="btn">Մտնել</button></form>`)));
app.post('/login', (req, res) => { if(req.body.u==='admin' && req.body.p==='123') { req.session.user='admin'; res.redirect('/'); } else res.send("Սխալ"); });

app.listen(process.env.PORT || 3000);
