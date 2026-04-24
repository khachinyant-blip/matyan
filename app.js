const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'el-matyan-2026', resave: false, saveUninitialized: true }));

function wrapHTML(content, title = "Էլեկտրոնային Մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root { --primary: #4834d4; --secondary: #686de0; --bg: #f0f3f7; --card-bg: #ffffff; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: var(--bg); margin: 0; padding: 0; color: #30336b; }
        .header { background: linear-gradient(45deg, #4834d4, #be2edd); color: white; padding: 30px; text-align: center; font-size: 28px; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .nav { display: flex; justify-content: center; gap: 15px; padding: 20px; background: white; sticky: top; }
        .nav a { text-decoration: none; color: var(--primary); padding: 12px 25px; border-radius: 30px; font-weight: bold; border: 2px solid var(--primary); transition: 0.3s; }
        .nav a:hover { background: var(--primary); color: white; }
        .container { max-width: 1000px; margin: 30px auto; padding: 0 20px; }
        .card { background: var(--card-bg); padding: 30px; border-radius: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        h2 { font-size: 32px; text-align: center; color: #130f40; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; border-radius: 15px; overflow: hidden; }
        th { background: #686de0; color: white; padding: 18px; font-size: 18px; }
        td { padding: 15px; border-bottom: 1px solid #dff9fb; font-size: 16px; }
        .btn-save { background: #6ab04c; color: white; border: none; padding: 15px 40px; border-radius: 12px; font-size: 20px; cursor: pointer; width: 100%; margin-top: 20px; }
        .article { margin-bottom: 40px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
        .article img { width: 100%; border-radius: 20px; margin: 15px 0; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .article p { line-height: 1.8; font-size: 18px; color: #535c68; }
        .badge-absent { background: #ff7979; color: white; padding: 4px 10px; border-radius: 6px; font-weight: bold; }
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

// ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY CAST(name AS INTEGER) ASC, name ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2>🔍 Օրվա Մատյան</h2>
        <form action="/attendance-list" method="GET">
            <label style="font-size: 18px;">Ընտրել դասարանը.</label>
            <select name="class_id" style="width:100%; padding:15px; margin:10px 0; border-radius:10px;">${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}</select>
            <label style="font-size: 18px;">Ընտրել առարկան.</label>
            <select name="subject_id" style="width:100%; padding:15px; margin:10px 0; border-radius:10px;">${subjects.map(s => `<option value="${s.id}">${s.name}</option>`)}</select>
            <button class="btn-save" style="background:#4834d4;">Բացել Ցուցակը</button>
        </form>
    `));
});

// ՀԱՇՎԱՌՈՒՄ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const list = students.map(s => `<tr>
        <td><b>${s.surname} ${s.name}</b></td>
        <td style="text-align:right;">
            <label><input type="radio" name="at-${s.id}" value="Present" checked> Ն</label>
            <label style="margin-left:20px; color:red;"><input type="radio" name="at-${s.id}" value="Absent"> Բ</label>
        </td>
    </tr>`).join('');
    res.send(wrapHTML(`
        <h2>📝 Հաշվառում</h2>
        <form action="/save-attendance" method="POST">
            <input type="hidden" name="subject_id" value="${req.query.subject_id}">
            <table>${list}</table>
            <button class="btn-save">Պահպանել Տվյալները</button>
        </form>
    `));
});

app.post('/save-attendance', (req, res) => {
    const date = new Date().toLocaleDateString('hy-AM');
    const subject_id = req.body.subject_id;
    const stmt = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const key in req.body) {
        if (key.startsWith('at-')) {
            const student_id = key.split('-')[1];
            stmt.run(student_id, subject_id, req.body[key], date);
        }
    }
    res.send(wrapHTML("<div style='text-align:center;'>✅ Տվյալները հաջողությամբ պահպանվեցին!<br><br><a href='/'><button class='btn-save' style='width:auto;'>Վերադառնալ</button></a></div>"));
});

// ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ
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
    const rows = stats.map(s => `<tr><td>${s.surname} ${s.name}</td><td>${s.cname}</td><td><span class="badge-absent">${s.absents}</span></td></tr>`).join('');
    res.send(wrapHTML(`<h2>📊 Բացակայությունների Աղյուսակ</h2><table><thead><tr><th>Աշակերտ</th><th>Դասարան</th><th>Քանակ</th></tr></thead><tbody>${rows}</tbody></table>`));
});

// ԿՐԹԱԿԱՆ ԱՆԿՅՈՒՆ (Ընդարձակ)
app.get('/edu', (req, res) => {
    res.send(wrapHTML(`
        <h2>💡 Կրթական Անկյուն</h2>
        <div class="article">
            <h3>🔭 Հայաստանի աստղագիտական հրաշքը. Բյուրական</h3>
            <p>Բյուրականի աստղադիտարանը հիմնադրվել է 1946 թվականին Վիկտոր Համբարձումյանի կողմից։ Այն հանդիսանում է տարածաշրջանի ամենակարևոր գիտական կենտրոններից մեկը։ Այստեղ հայտնաբերվել են աստղասփյուռներ, որոնք փոխեցին մեր պատկերացումները տիեզերքի մասին։</p>
            
        </div>
        <div class="article">
            <h3>🔬 Ինչու՞ է երկինքը կապույտ</h3>
            <p>Սա պայմանավորված է Ռելեյի ցրմամբ։ Երբ արևի լույսը մտնում է մթնոլորտ, այն բախվում է օդի մոլեկուլներին և ցրվում բոլոր ուղղություններով։ Կապույտ լույսը ցրվում է ավելի շատ, քան մյուս գույները, քանի որ այն ունի ավելի կարճ ալիքի երկարություն։</p>
            
        </div>
        <div class="article">
            <h3>🏛️ Մատենադարան. Մեր ինքնության պահապանը</h3>
            <p>Մեսրոպ Մաշտոցի անվան Մատենադարանը աշխարհի ամենահարուստ ձեռագրատներից մեկն է։ Այստեղ պահվում են ավելի քան 17,000 հին ձեռագրեր և միլիոնավոր արխիվային փաստաթղթեր։ Ամենափոքր գիրքը կշռում է ընդամենը 19 գրամ, իսկ ամենամեծը՝ 28 կիլոգրամ։</p>
            
        </div>
    `));
});

app.get('/all-students', (req, res) => {
    const students = db.prepare("SELECT s.*, c.name as cname FROM students s JOIN classes c ON s.class_id = c.id ORDER BY CAST(c.name AS INTEGER) ASC, c.name ASC, s.surname ASC").all();
    const list = students.map(s => `<tr><td><span style="background:#4834d4; color:white; padding:3px 8px; border-radius:5px; font-size:12px;">${s.cname}</span></td><td>${s.surname} ${s.name}</td></tr>`).join('');
    res.send(wrapHTML(`<h2>👥 Աշակերտների Ցանկ (475)</h2><table>${list}</table>`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<h2>Մուտք</h2><form action="/login" method="POST"><input type="text" name="u" placeholder="Օգտանուն" style="width:100%; padding:15px; margin:10px 0;"><input type="password" name="p" placeholder="Գաղտնաբառ" style="width:100%; padding:15px; margin:10px 0;"><button class="btn-save">Մուտք</button></form>`)));
app.post('/login', (req, res) => { req.session.user = 'admin'; res.redirect('/'); });

app.listen(process.env.PORT || 3000);
