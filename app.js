const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-ultimate-2026', resave: false, saveUninitialized: true }));

function wrapHTML(content, title = "Դասերի հաճախումների մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Armath&family=Inter:wght@400;700&display=swap');
        :root { --p: #6c5ce7; --s: #00cec9; --accent: #fd79a8; --bg: #f0f2f5; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; color: #2d3436; }
        .nav { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); padding: 12px 0; display: flex; justify-content: space-around; position: sticky; top: 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); z-index: 1000; border-bottom: 2px solid var(--p); }
        .nav a { text-decoration: none; color: #636e72; font-size: 11px; font-weight: bold; text-align: center; transition: 0.3s; }
        .nav a i { display: block; font-size: 24px; margin-bottom: 4px; background: linear-gradient(45deg, var(--p), var(--s)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav a:hover { color: var(--p); transform: translateY(-3px); }
        .hero { background: linear-gradient(135deg, #6c5ce7, #a29bfe, #00cec9); background-size: 400% 400%; animation: gradientBG 10s ease infinite; color: white; padding: 60px 20px; text-align: center; border-radius: 0 0 60px 60px; }
        @keyframes gradientBG { 0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;} }
        .container { max-width: 1200px; margin: -40px auto 40px; padding: 0 20px; }
        .card { background: white; border-radius: 30px; padding: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); margin-bottom: 30px; transition: 0.4s; animation: fadeInUp 0.6s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .edu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; }
        .edu-card { border-radius: 25px; overflow: hidden; background: white; box-shadow: 0 10px 20px rgba(0,0,0,0.05); transition: 0.3s; border: 1px solid #eee; }
        .edu-card:hover { transform: scale(1.03); box-shadow: 0 20px 40px rgba(108, 92, 231, 0.2); }
        .edu-img { width: 100%; height: 180px; object-fit: cover; background: #eee; }
        .edu-content { padding: 20px; }
        .edu-content h3 { color: var(--p); margin: 0 0 10px; font-size: 18px; }
        .btn { background: linear-gradient(45deg, var(--p), var(--s)); color: white; border: none; padding: 15px 25px; border-radius: 18px; font-weight: bold; cursor: pointer; width: 100%; font-size: 16px; transition: 0.3s; }
        .btn:hover { letter-spacing: 1px; box-shadow: 0 10px 20px rgba(108, 92, 231, 0.4); }
        table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
        td { background: #fff; padding: 15px; border-radius: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.03); }
        .status-btn { padding: 10px 20px; border-radius: 12px; border: 2px solid #eee; cursor: pointer; font-weight: bold; background: white; transition: 0.2s; }
        input[type="radio"]:checked + .status-btn { background: var(--p); color: white; border-color: var(--p); }
        .badge { background: var(--accent); color: white; padding: 4px 12px; border-radius: 10px; font-size: 12px; }
    </style>
    </head><body>
    <div class="nav">
        <a href="/"><i class="fa-solid fa-graduation-cap"></i>Կրթություն</a>
        <a href="/attendance"><i class="fa-solid fa-calendar-check"></i>Մատյան</a>
        <a href="/stats"><i class="fa-solid fa-chart-line"></i>Վիճակագրություն</a>
        <a href="/all-students"><i class="fa-solid fa-users-rectangle"></i>Բազա</a>
    </div>
    <div class="hero">
        <h1>✨ Դարերի Ձայնը</h1>
        <p>Կրթական հարթակ և Դասերի հաճախումների մատյան</p>
    </div>
    <div class="container">${content}</div>
    </body></html>`;
}

// 1. ԳԼԽԱՎՈՐ ԷՋ - ԿՐԹՈՒԹՅՈՒՆ (50 ՀՈԴՎԱԾ)
app.get('/', (req, res) => {
    const topics = [
        ["Յուրի Օհանեսյան", "Միակ հայ գիտնականը, ում անունով կոչվել է տարր (Og):", "science"],
        ["Ոսկեդար", "5-րդ դարի մշակութային վերելքը և Մաշտոցի հանճարը:", "history"],
        ["Տիեզերական ճամփորդություն", "Ինչպես են մարդիկ հասել Լուսին և ապագա Մարսի գաղութացումը:", "space"],
        ["Արհեստական Բանականություն", "Ինչպես է AI-ը փոխում մեր կյանքը ամեն վայրկյան:", "tech"],
        ["Օվկիանոսի գաղտնիքները", "Անհայտ էակներ և Մարիանյան անդունդի խորքերը:", "nature"],
        ["ԴՆԹ-ի կոդը", "Մեր մարմնի գենետիկական ինֆորմացիայի կառուցվածքը:", "bio"],
        ["Հայկական լեռնաշխարհ", "Մեր հայրենիքի աշխարհագրական դիրքն ու բնությունը:", "geo"],
        ["Մխիթարյան Միաբանություն", "Վենետիկի Սուրբ Ղազար կղզու հայկական մշակույթը:", "culture"],
        ["Քվանտային ֆիզիկա", "Ատոմների և մասնիկների զարմանահրաշ աշխարհը:", "physics"],
        ["Կլիմայի փոփոխություն", "Ինչպես պահպանել մեր մոլորակը գլոբալ տաքացումից:", "eco"],
        ["Ինքնաթիռների աշխատանքը", "Ինչպես է օդի ճնշումը բարձրացնում հսկա թռչող մեքենաները:", "engineering"],
        ["Հին Հունաստան", "Փիլիսոփայության, դեմոկրատիայի և օլիմպիական խաղերի հայրենիքը:", "history"],
        ["Մարդու ուղեղը", "Աշխարհի ամենաբարդ և ամենահզոր համակարգիչը:", "science"],
        ["Գրերի գյուտը", "Ինչպես է ստեղծվել հայոց այբուբենը 405 թվականին:", "history"],
        ["Կրիպտոարժույթ", "Ինչ է բիթքոինը և բլոկչեյն տեխնոլոգիան:", "tech"],
        ["Արցախի բնությունը", "Լեռնային Ղարաբաղի անտառներն ու պատմական վանքերը:", "nature"],
        ["Մեղուների կյանքը", "Ինչու են մեղուները կարևոր մեր սննդի շղթայի համար:", "bio"],
        ["Վերածնունդ", "Լեոնարդո դա Վինչիի և Միքելանջելոյի դարաշրջանը:", "art"],
        ["Հայկական խաչքարեր", "Քարե արվեստի յուրօրինակ դրսևորումները:", "culture"],
        ["Լուսնի փուլերը", "Ինչու է լուսինը փոխում իր տեսքը երկնքում:", "space"]
        // ... (շարունակելի մինչև 50)
    ];

    // Ստեղծում ենք 50 հոդվածի օրինակ
    let longTopics = [];
    for(let i=0; i<50; i++) {
        let t = topics[i % topics.length];
        longTopics.push(`
            <div class="edu-card">
                <img src="https://picsum.photos/seed/${i+100}/400/250" class="edu-img">
                <div class="edu-content">
                    <span class="badge">Հոդված #${i+1}</span>
                    <h3>${t[0]}</h3>
                    <p>${t[1]} Սա ավելի երկար բովանդակություն է, որը պատմում է տվյալ թեմայի կարևորության և դրա ունեցած ազդեցության մասին մարդկության պատմության մեջ:</p>
                    <button class="btn" style="padding:10px; font-size:12px;">Կարդալ ավելին</button>
                </div>
            </div>
        `);
    }

    res.send(wrapHTML(`
        <div class="card" style="text-align:center; background: rgba(255,255,255,0.7);">
            <h2 style="color:var(--p);"><i class="fa-solid fa-star"></i> Օրվա ուսուցողական նյութերը</h2>
            <p>Բացահայտեք աշխարհը մեզ հետ միասին</p>
        </div>
        <div class="edu-grid">${longTopics.join('')}</div>
    `, "Կրթություն - Դարերի Ձայնը"));
});

// 2. ՄԱՏՅԱՆԻ ԷՋ
app.get('/attendance', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    const today = new Date().toISOString().split('T')[0];
    res.send(wrapHTML(`
        <div class="card">
            <h3><i class="fa-solid fa-pen-nib"></i> Դասերի գրանցում</h3>
            <form action="/attendance-list" method="GET">
                <label>Ամսաթիվ</label><input type="date" name="selected_date" value="${today}" required>
                <label>Դասարան</label>
                <select name="class_id" id="cls" onchange="f()">
                    ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
                </select>
                <label>Առարկա</label><select name="subject_id" id="sbj" required></select>
                <button class="btn">Բացել հաշվառման ցուցակը</button>
            </form>
        </div>
        <script>
            const ss = ${JSON.stringify(subjects)};
            function f() {
                const c = document.getElementById('cls');
                const g = parseInt(c.selectedOptions[0].text);
                let l = g <= 4 ? 'elem' : (g <= 9 ? 'mid' : 'high');
                const s = document.getElementById('sbj'); s.innerHTML = '';
                ss.filter(x => x.level==='all' || x.level.includes(l)).forEach(x => {
                    const o = document.createElement('option'); o.value=x.id; o.textContent=x.name; s.appendChild(o);
                });
            } f();
        </script>
    `));
});

// 3. ՀԱՇՎԱՌՄԱՆ ՑՈՒՑԱԿ
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const rows = students.map(s => `<tr>
        <td><b>${s.surname}</b> ${s.name} ${s.patronymic}</td>
        <td style="text-align:right;">
            <label><input type="radio" name="at-${s.id}" value="Present" checked style="display:none"><span class="status-btn">Ն</span></label>
            <label><input type="radio" name="at-${s.id}" value="Absent" style="display:none"><span class="status-btn">Բ</span></label>
        </td></tr>`).join('');
    res.send(wrapHTML(`
        <div class="card">
            <h3>Գրանցում - ${req.query.selected_date}</h3>
            <form action="/save" method="POST">
                <input type="hidden" name="sub" value="${req.query.subject_id}"><input type="hidden" name="date" value="${req.query.selected_date}">
                <table>${rows}</table>
                <button class="btn" style="margin-top:20px;">Պահպանել հիշողության մեջ</button>
            </form>
        </div>`));
});

// 4. ՀԻՇՈՂՈՒԹՅՈՒՆ (SAVE)
app.post('/save', (req, res) => {
    const st = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const k in req.body) if (k.startsWith('at-')) st.run(k.split('-')[1], req.body.sub, req.body[k], req.body.date);
    res.send(wrapHTML(`
        <div class="card" style="text-align:center;">
            <i class="fa-solid fa-cloud-arrow-up" style="font-size:50px; color:var(--s);"></i>
            <h2>Տվյալները հիշված են</h2>
            <a href="/attendance" class="btn" style="display:inline-block; width:auto;">Հետ</a>
        </div>`));
});

// 5. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ + ՋՆՋՈՒՄ
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
            return `<tr><td><b>${s.surname}</b> ${s.name}</td><td>${s1}</td><td>${s2}</td><td style="font-weight:bold;">${s1+s2}</td></tr>`;
        }).join('');
    }

    res.send(wrapHTML(`
        <div class="card">
            <h3><i class="fa-solid fa-chart-column"></i> Վիճակագրական ամփոփում</h3>
            <form action="/stats" method="GET">
                <select name="class_id" onchange="this.form.submit()">
                    <option value="">--- Ընտրեք դասարանը ---</option>
                    ${classes.map(c => `<option value="${c.id}" ${classId==c.id?'selected':''}>${c.name}</option>`)}
                </select>
            </form>
            ${classId ? `
                <table><thead><tr><th>Աշակերտ</th><th>1-ին կիս.</th><th>2-րդ կիս.</th><th>Ընդհանուր</th></tr></thead><tbody>${table}</tbody></table>
                <form action="/delete-stats" method="POST" onsubmit="return confirm('Ջնջե՞լ այս դասարանի տվյալները:')">
                    <input type="hidden" name="class_id" value="${classId}">
                    <button class="btn" style="background:#ff7675; margin-top:15px;"><i class="fa-solid fa-trash"></i> Մաքրել հիշողությունը</button>
                </form>
            ` : ''}
        </div>`));
});

app.post('/delete-stats', (req, res) => {
    db.prepare("DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)").run(req.body.class_id);
    res.redirect('/stats');
});

// ԱՅԼ ԷՋԵՐ
app.get('/all-students', (req, res) => {
    const s = db.prepare("SELECT s.*, c.name as cn FROM students s JOIN classes c ON s.class_id=c.id ORDER BY cn, s.surname").all();
    res.send(wrapHTML(`<div class="card"><h3>Աշակերտների ամբողջական բազա</h3><table>${s.map(i => `<tr><td><span class="badge">${i.cn}</span></td><td>${i.surname} ${i.name} ${i.patronymic}</td></tr>`).join('')}</table></div>`));
});

app.get('/login', (req, res) => res.send(wrapHTML(`<div class="card"><h2>Մուտք</h2><form action="/login" method="POST"><input name="u" placeholder="Admin"><input type="password" name="p" placeholder="123"><button class="btn">Մտնել</button></form></div>`)));
app.post('/login', (req, res) => { if(req.body.u==='admin' && req.body.p==='123') { req.session.user='admin'; res.redirect('/attendance'); } else res.send("Սխալ"); });

app.listen(process.env.PORT || 3000);
