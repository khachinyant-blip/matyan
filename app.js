const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'el-matyan-secure', resave: false, saveUninitialized: true }));

function wrapHTML(content, title = "Էլեկտրոնային Մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root { --main: #4834d4; --grad: linear-gradient(135deg, #4834d4, #686de0); --bg: #f5f6fa; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; color: #2f3542; }
        .header { background: var(--grad); color: white; padding: 40px 20px; text-align: center; font-size: 32px; font-weight: 800; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .nav { display: flex; justify-content: center; gap: 10px; padding: 15px; background: white; flex-wrap: wrap; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: var(--main); padding: 12px 20px; border-radius: 12px; font-weight: bold; font-size: 15px; border: 2px solid var(--main); transition: 0.3s; }
        .nav a:hover { background: var(--main); color: white; transform: translateY(-2px); }
        .container { max-width: 900px; margin: 30px auto; padding: 0 15px; }
        .card { background: white; padding: 35px; border-radius: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        h2 { color: var(--main); text-align: center; font-size: 28px; margin-bottom: 25px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f1f2f6; color: #57606f; padding: 15px; text-align: left; border-bottom: 2px solid var(--main); }
        td { padding: 15px; border-bottom: 1px solid #f1f2f6; font-size: 17px; }
        .btn { background: var(--main); color: white; border: none; padding: 15px 30px; border-radius: 15px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%; transition: 0.3s; }
        .btn:hover { filter: brightness(1.2); }
        .article { margin-bottom: 50px; }
        .article h3 { color: #eb4d4b; font-size: 24px; }
        .article p { line-height: 1.8; font-size: 18px; color: #535c68; text-align: justify; }
        .absent-num { background: #ff7675; color: white; padding: 4px 10px; border-radius: 8px; font-weight: bold; }
    </style>
    </head><body>
    <div class="header">📱 Էլեկտրոնային Մատյան</div>
    <div class="nav">
        <a href="/">📋 Հաշվառում</a>
        <a href="/stats">📊 Վիճակագրություն</a>
        <a href="/all-students">👥 Աշակերտների Բազա</a>
        <a href="/edu">💡 Կրթական Անկյուն</a>
    </div>
    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

// 1. ԳԼԽԱՎՈՐ ԷՋ (ՀԱՇՎԱՌՈՒՄ)
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY CAST(name AS INTEGER) ASC, name ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Ընտրել Դասարանը և Առարկան</h2>
        <form action="/attendance-list" method="GET">
            <select name="class_id" required style="width:100%; padding:15px; margin-bottom:15px; border-radius:12px; border:2px solid #ddd;">
                ${classes.map(c => `<option value="${c.id}">${c.name} դասարան</option>`)}
            </select>
            <select name="subject_id" required style="width:100%; padding:15px; margin-bottom:20px; border-radius:12px; border:2px solid #ddd;">
                ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}
            </select>
            <button class="btn">Բացել Մատյանը</button>
        </form>
    `));
});

// 2. ՀԱՇՎԱՌՄԱՆ ՑՈՒՑԱԿ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const list = students.map(s => `<tr>
        <td><b>${s.surname} ${s.name}</b></td>
        <td style="text-align:right;">
            <label style="cursor:pointer;"><input type="radio" name="at-${s.id}" value="Present" checked> <span style="color:green; font-weight:bold;">Ն</span></label>
            <label style="margin-left:25px; cursor:pointer;"><input type="radio" name="at-${s.id}" value="Absent"> <span style="color:red; font-weight:bold;">Բ</span></label>
        </td>
    </tr>`).join('');
    res.send(wrapHTML(`
        <h2>📝 Դասամատյան</h2>
        <form action="/save-attendance" method="POST">
            <input type="hidden" name="subject_id" value="${req.query.subject_id}">
            <table style="width:100%">${list}</table>
            <button class="btn" style="margin-top:25px; background:#20bf6b;">Պահպանել Ներկայությունը</button>
        </form>
    `));
});

// 3. ՊԱՀՊԱՆՈՒՄ
app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    const sid = req.body.subject_id;
    const stmt = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const key in req.body) {
        if (key.startsWith('at-')) {
            stmt.run(key.split('-')[1], sid, req.body[key], date);
        }
    }
    res.send(wrapHTML("<div style='text-align:center;'><h3>✅ Տվյալները հաջողությամբ գրանցվեցին:</h3><br><a href='/'><button class='btn' style='width:auto;'>Վերադառնալ</button></a></div>"));
});

// 4. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ (Շտկված)
app.get('/stats', (req, res) => {
    const stats = db.prepare(`
        SELECT s.name, s.surname, c.name as cname, COUNT(a.id) as absents
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        WHERE a.status = 'Absent'
        GROUP BY s.id
        ORDER BY absents DESC
    `).all();
    const rows = stats.map(s => `<tr><td>${s.surname} ${s.name}</td><td>${s.cname}</td><td><span class="absent-num">${s.absents} բացակա</span></td></tr>`).join('');
    res.send(wrapHTML(`<h2>📊 Բացակայությունների Վիճակագրություն</h2><table><thead><tr><th>Աշակերտ</th><th>Դասարան</th><th>Ընդհանուր</th></tr></thead><tbody>${rows || '<tr><td colspan="3" style="text-align:center;">Դեռևս բացականեր չկան</td></tr>'}</tbody></table>`));
});

// 5. ԿՐԹԱԿԱՆ ԱՆԿՅՈՒՆ (Ընդարձակ հոդվածներով)
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h2>💡 Կրթական Անկյուն</h2>
        <div class="article">
            <h3>🌌 Տիեզերքի ընդարձակումը</h3>
            <p>1929 թվականին Էդվին Հաբլը հայտնաբերեց, որ գալակտիկաները հեռանում են մեզնից։ Սա նշանակում է, որ տիեզերքը մշտապես ընդարձակվում է։ Եթե մենք պատկերացնենք տիեզերքը որպես փուչիկ, որի վրա կետեր են նկարված, փուչիկը փչելիս բոլոր կետերը միաժամանակ հեռանում են իրարից։ Այս հայտնագործությունը հիմք դրեց «Մեծ Պայթյունի» տեսությանը։</p>
            

[Image of the expanding universe model]

        </div>
        <div class="article">
            <h3>🧪 Քիմիայի հրաշքները. Ինչու՞ է ադամանդը կարծր</h3>
            <p>Ադամանդը և գրաֆիտը (մատիտի միջուկը) երկուսն էլ կազմված են նույն տարրից՝ ածխածնից։ Տարբերությունը նրանց ատոմների դասավորության մեջ է։ Ադամանդում ածխածնի յուրաքանչյուր ատոմ կապված է չորս այլ ատոմների հետ՝ ստեղծելով ամուր բյուրեղային ցանց, ինչն էլ այն դարձնում է բնության ամենակարծր նյութը։</p>
            

[Image of diamond vs graphite atomic structure]

        </div>
        <div class="article">
            <h3>🦁 Կենդանական աշխարհի զարմանահրաշ փաստերը</h3>
            <p>Գիտեի՞ք, որ ծովաձիուկը միակ կենդանին է, որի մոտ արուներն են ծննդաբերում։ Կամ որ ութոտնուկն ունի երեք սիրտ և կապույտ արյուն։ Բնությունը լի է անհավանական լուծումներով, որոնք օգնում են կենդանիներին գոյատևել տարբեր պայմաններում։</p>
        </div>
    `));
});

app.get('/all-students', (req, res) => {
    const students = db.prepare("SELECT s.*, c.name as cname FROM students s JOIN classes c ON s.class_id = c.id ORDER BY CAST(c.name AS INTEGER) ASC, c.name ASC, s.surname ASC").all();
    const list = students.map(s => `<tr><td><span style="background:var(--main); color:white; padding:3px 10px; border-radius:6px; font-size:12px;">${s.cname}</span></td><td><b>${s.surname}</b> ${s.name}</td></tr>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Այբբենական Ցուցակ (475)</h2><div style="max-height:600px; overflow-y:auto;"><table>${list}</table></div>`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Admin" style="width:100%; padding:15px; margin-bottom:10px;"><input type="password" name="p" placeholder="123" style="width:100%; padding:15px; margin-bottom:10px;"><button class="btn">Մուտք</button></form>`)));
app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });

app.listen(process.env.PORT || 3000);
