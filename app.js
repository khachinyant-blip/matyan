const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-2026-attendance', resave: false, saveUninitialized: true }));

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
        .nav a:hover { color: var(--p); }
        .hero { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 40px 20px; text-align: center; border-radius: 0 0 40px 40px; box-shadow: 0 4px 15px rgba(108, 92, 231, 0.2); }
        .container { max-width: 900px; margin: 20px auto; padding: 15px; }
        .card { background: white; padding: 30px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 25px; }
        select, input { width: 100%; padding: 14px; border-radius: 12px; border: 2px solid #edf2f7; margin-bottom: 15px; font-size: 16px; outline: none; }
        .btn { background: var(--p); color: white; border: none; padding: 16px; border-radius: 15px; font-weight: bold; cursor: pointer; width: 100%; font-size: 16px; transition: 0.3s; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(108, 92, 231, 0.4); }
        table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
        td { background: #f8fafc; padding: 15px; border-radius: 10px; }
        .status-btn { padding: 8px 18px; border-radius: 10px; border: 2px solid #eee; cursor: pointer; font-weight: bold; background: white; transition: 0.2s; }
        input[type="radio"]:checked + .status-btn { background: var(--p); color: white; border-color: var(--p); }
        .edu-item { border-left: 6px solid var(--p); padding-left: 20px; margin-bottom: 40px; }
        .edu-item h3 { color: var(--p); margin-top: 0; }
        .badge { background: var(--p); color: white; padding: 3px 10px; border-radius: 8px; font-size: 12px; margin-right: 10px; }
    </style>
    </head><body>
    <div class="nav">
        <a href="/"><i class="fa-solid fa-list-check"></i>Մատյան</a>
        <a href="/stats"><i class="fa-solid fa-chart-line"></i>Վիճակագրություն</a>
        <a href="/all-students"><i class="fa-solid fa-address-book"></i>Աշակերտների բազա</a>
        <a href="/edu"><i class="fa-solid fa-book-open"></i>Կրթություն</a>
    </div>
    <div class="hero">
        <h1 style="margin:0;">Դասերի հաճախումների մատյան</h1>
        <p style="margin:10px 0 0; opacity: 0.9;">Ուսումնական գործընթացի կառավարման հարթակ</p>
    </div>
    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

// 1. ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2><i class="fa-solid fa-folder-open"></i> Ընտրեք դասարանը և առարկան</h2>
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

// 2. ՀԱՇՎԱՌՈՒՄ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const rows = students.map(s => `<tr><td><b>${s.surname}</b> ${s.name}</td><td style="text-align:right;">
        <label><input type="radio" name="at-${s.id}" value="Present" checked style="display:none"><span class="status-btn">Ն</span></label>
        <label><input type="radio" name="at-${s.id}" value="Absent" style="display:none"><span class="status-btn">Բ</span></label>
    </td></tr>`).join('');
    res.send(wrapHTML(`<h2>Հաճախումների գրանցում</h2><form action="/save" method="POST">
        <input type="hidden" name="sub" value="${req.query.subject_id}"><table>${rows}</table>
        <button class="btn" style="margin-top:20px;">Պահպանել մատյանում</button></form>`));
});

app.post('/save', (req, res) => {
    const d = new Date().toLocaleDateString('hy-AM');
    const st = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const k in req.body) if (k.startsWith('at-')) st.run(k.split('-')[1], req.body.sub, req.body[k], d);
    res.send(wrapHTML("<div style='text-align:center;'><h2>✅ Տվյալները պահպանվեցին</h2><br><a href='/'><button class='btn' style='width:200px;'>Հետ</button></a></div>"));
});

// 3. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ
app.get('/stats', (req, res) => {
    const s = db.prepare("SELECT c.name, COUNT(a.id) as n FROM classes c JOIN students st ON st.class_id=c.id JOIN attendance a ON a.student_id=st.id WHERE a.status='Absent' GROUP BY c.id").all();
    res.send(wrapHTML(`<h2>📊 Բացակաների վիճակագրություն</h2><canvas id="c"></canvas>
        <script>new Chart(document.getElementById('c'), {type:'bar', data:{labels:${JSON.stringify(s.map(i=>i.name))}, datasets:[{label:'Բացակաների քանակ', data:${JSON.stringify(s.map(i=>i.n))}, backgroundColor:'#6c5ce7', borderRadius:10}]}});</script>`));
});

// 4. ԱՇԱԿԵՐՏՆԵՐԻ ԲԱԶԱ
app.get('/all-students', (req, res) => {
    const s = db.prepare("SELECT s.*, c.name as cn FROM students s JOIN classes c ON s.class_id=c.id ORDER BY cn, s.surname").all();
    res.send(wrapHTML(`<h2>👥 Աշակերտների ամբողջական բազա</h2><table>${s.map(i => `<tr><td><span class="badge">${i.cn}</span></td><td><b>${i.surname}</b> ${i.name}</td></tr>`).join('')}</table>`));
});

// 5. ԿՐԹՈՒԹՅՈՒՆ (10 ՀՈԴՎԱԾ)
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h2 style="text-align:center; color:var(--p);">💡 Գիտելիքի Անկյուն</h2>
        <div class="edu-item">
            <h3>1. Տիեզերքի հեռավոր անկյունները</h3>
            <p>Տիեզերքը սկիզբ է առել մոտ 13.8 միլիարդ տարի առաջ Մեծ պայթյունի արդյունքում: Այսօր տեսանելի տիեզերքի տրամագիծը կազմում է 93 միլիարդ լուսատարի, և այն շարունակում է ընդարձակվել ավելի արագ, քան երբևէ:</p>
        </div>
        <div class="edu-item">
            <h3>2. Ֆոտոսինթեզ. Կյանքի շնչառությունը</h3>
            <p>Բույսերը արևի լույսի էներգիան վերափոխում են քիմիական էներգիայի: Այս գործընթացի շնորհիվ մենք ունենք թթվածին: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ բանաձևը մեր մոլորակի գոյության հիմքն է:</p>
        </div>
        <div class="edu-item">
            <h3>3. Մեսրոպ Մաշտոց և Հայոց Ոսկեդար</h3>
            <p>405 թվականին ստեղծված հայկական գրերը ոչ միայն պահպանեցին մեր ինքնությունը, այլև սկիզբ դրեցին հզոր պատմագրությանն ու թարգմանչական արվեստին, որն անվանում ենք Ոսկեդար:</p>
        </div>
        <div class="edu-item">
            <h3>4. Արհեստական Բանականություն</h3>
            <p>AI-ը համակարգչային գիտության ճյուղ է, որը մեքենաներին թույլ է տալիս սովորել սեփական փորձից: Այսօր այն օգնում է բժիշկներին՝ ախտորոշել հիվանդություններ, և ճարտարագետներին՝ ստեղծել ինքնավար մեքենաներ:</p>
        </div>
        <div class="edu-item">
            <h3>5. Ջրի շրջապտույտը բնության մեջ</h3>
            <p>Երկրի վրա ջուրը երբեք չի վերջանում, այն պարզապես փոխում է իր վիճակը: Գոլորշիացումը, խտացումը և տեղումները կազմում են մի անվերջ շղթա, որը ջուրը մշտապես մաքրում և վերադարձնում է մեզ:</p>
        </div>
        <div class="edu-item">
            <h3>6. Յուրի Օհանեսյան. Մերօրյա լեգենդը</h3>
            <p>Մենդելեևի աղյուսակի 118-րդ տարրը կոչվում է Օգանեսոն (Og): Այն անվանվել է հայ ակադեմիկոս Յուրի Օհանեսյանի պատվին, ով աշխարհում երկրորդ մարդն է, ում կենդանության օրոք տարր է անվանվել:</p>
        </div>
        <div class="edu-item">
            <h3>7. Ինչպես է աշխատում մարդու ուղեղը</h3>
            <p>Մարդու ուղեղը պարունակում է մոտ 86 միլիարդ նեյրոն: Այն սպառում է մարմնի ամբողջ էներգիայի 20%-ը: Ուղեղը չունի ցավի ընկալիչներ, ինչի պատճառով ուղեղի վիրահատությունները կարող են կատարվել արթուն վիճակում:</p>
        </div>
        <div class="edu-item">
            <h3>8. Հին աշխարհի 7 հրաշալիքները</h3>
            <p>Գիզայի բուրգերից մինչև Բաբելոնի կախովի այգիներ. այս կառույցները վկայում են մարդկային մտքի անսահման հնարավորությունների մասին դեռևս հազարավոր տարիներ առաջ:</p>
        </div>
        <div class="edu-item">
            <h3>9. Օվկիանոսների գաղտնիքները</h3>
            <p>Մարդկությունը հետազոտել է համաշխարհային օվկիանոսի միայն 5%-ը: Օվկիանոսների խորքերում դեռևս կան անհայտ կենդանիներ և լանդշաֆտներ, որոնք սպասում են իրենց հայտնագործմանը:</p>
        </div>
        <div class="edu-item">
            <h3>10. Էկոլոգիա և Կայուն զարգացում</h3>
            <p>Մոլորակի պահպանումը սկսվում է յուրաքանչյուրիցս: Թափոնների տեսակավորումը և վերականգնվող էներգիայի օգտագործումը միակ ճանապարհն են՝ ապահովելու ապագա սերունդների կյանքը Երկրի վրա:</p>
        </div>
    `));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք համակարգ</h2><form action="/login" method="POST"><input name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button class="btn">Մտնել</button></form>`)));
app.post('/login', (req, res) => { if(req.body.u==='admin' && req.body.p==='123') { req.session.user='admin'; res.redirect('/'); } else res.send("Սխալ տվյալներ"); });

app.listen(process.env.PORT || 3000);
