const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-ultimate-2026-v2', resave: false, saveUninitialized: true }));

// Ծավալուն հոդվածների տվյալների բազա
const topicsData = [
    { 
        title: "Յուրի Օհանեսյան. Տարրերի տիրակալը", 
        desc: "Հայ մեծագույն գիտնական, ում անունով կոչվել է պարբերական աղյուսակի 118-րդ տարրը:", 
        full: "Յուրի Օհանեսյանը ժամանակակից գիտության լեգենդներից է: Նա աշխարհում երկրորդ մարդն է, ում կենդանության օրոք պարբերական աղյուսակի տարր է անվանակոչվել (Օգանեսոն՝ Og): Նրա հետազոտությունները միջուկային ֆիզիկայի բնագավառում թույլ են տվել հայտնաբերել «կայունության կղզյակը» գերծանր տարրերի աշխարհում: Օհանեսյանի աշխատանքը ոչ միայն պատիվ է բերում հայ գիտությանը, այլև հիմնարար դեր ունի տիեզերքի կառուցվածքը հասկանալու գործում: Նրա ղեկավարած լաբորատորիայում սինթեզվել են աղյուսակի վերջին հինգ տարրերը, ինչը գիտական սխրանք է:" 
    },
    { 
        title: "Հայոց Ոսկեդար. Մշակութային վերելք", 
        desc: "5-րդ դարի հոգևոր և գրական հեղափոխությունը, որը փոխեց հայության ընթացքը:", 
        full: "5-րդ դարը հայ պատմագրության մեջ անվանվում է Ոսկեդար: Ամեն ինչ սկսվեց 405 թվականին, որբ Մեսրոպ Մաշտոցը ստեղծեց հայոց գրերը: Սա լոկ այբուբենի ստեղծում չէր, այլ հայապահպանության հզոր զենք: Կարճ ժամանակում թարգմանվեց Աստվածաշունչը, որը կոչվեց «Թագուհի թարգմանութեանց»: Սկիզբ դրվեց հայ ինքնուրույն գրականությանը, պատմագրությանը (Մովսես Խորենացի, Ագաթանգեղոս) և փիլիսոփայությանը: Ոսկեդարը հայկական մշակույթի այն ամուր հիմքն է, որի վրա կառուցվել է մեր հետագա ողջ հոգևոր ժառանգությունը:" 
    },
    { 
        title: "Տիեզերական նվաճումներ", 
        desc: "Ինչպես է մարդկությունը դուրս գալիս Երկրի սահմաններից և նայում դեպի Մարս:", 
        full: "Տիեզերքի նվաճումը սկսվեց 1957-ին առաջին արբանյակի արձակմամբ, բայց այսօր մենք թևակոխել ենք նոր դարաշրջան: Մասնավոր ընկերությունները, ինչպիսին է SpaceX-ը, հեղափոխում են ոլորտը՝ ստեղծելով բազմակի օգտագործման հրթիռներ: Մարդկության հաջորդ մեծ նպատակը Մարս մոլորակի գաղութացումն է: Սա պահանջում է լուծել բարդ խնդիրներ՝ տիեզերական ճառագայթումից պաշտպանություն, թթվածնի ստացում և երկարատև ինքնավար կյանքի ապահովում: Տիեզերքի ուսումնասիրությունը մեզ օգնում է հասկանալ նաև մեր սեփական մոլորակի կլիմայական փոփոխությունները և պաշտպանել այն:" 
    },
    { 
        title: "Արհեստական Բանականություն", 
        desc: "Մեքենայական ուսուցումից մինչև գիտակից համակարգեր. ինչ է սպասվում մեզ:", 
        full: "Արհեստական բանականությունը (AI) այլևս ֆանտաստիկա չէ, այլ մեր առօրյայի մաս: Այն օգնում է բժիշկներին ավելի ճշգրիտ ախտորոշել հիվանդությունները, վարում է ինքնակառավարվող մեքենաները և անգամ ստեղծագործում է: Սակայն AI-ի զարգացումը բերում է նաև էթիկական հարցեր: Ինչպե՞ս պաշտպանել անձնական տվյալները, կփոխարինե՞ն արդյոք ռոբոտները մարդկանց աշխատաշուկայում: Կարևոր է հիշել, որ AI-ն գործիք է, որը պետք է ծառայի մարդուն՝ բարձրացնելով արդյունավետությունը և լուծելով գլոբալ խնդիրներ, ինչպիսիք են սովը կամ էներգետիկ ճգնաժամը:" 
    },
    { 
        title: "Օվկիանոսի անհայտ խորքերը", 
        desc: "Մարիանյան անդունդ և ջրային աշխարհի չբացահայտված էակները:", 
        full: "Չնայած մարդը եղել է Լուսնի վրա, մեր օվկիանոսների 80%-ից ավելին դեռևս մնում է չհետազոտված: Օվկիանոսի ամենախորը կետը՝ Մարիանյան անդունդը (մոտ 11 կմ խորությամբ), թաքցնում է զարմանալի էակներ, որոնք ապրում են բացարձակ մթության և ահռելի ճնշման տակ: Այստեղ կենդանիները հաճախ լուսարձակում են (բիոլյումինեսցենցիա)՝ որս անելու կամ հաղորդակցվելու համար: Օվկիանոսները կարգավորում են Երկրի ջերմաստիճանը և արտադրում են մեր շնչած թթվածնի կեսից ավելին: Դրանց պահպանությունը կենսական նշանակություն ունի մոլորակի էկոհամակարգի համար:" 
    }
];

function wrapHTML(content, title = "Դասերի հաճախումների մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        :root { --p: #6c5ce7; --s: #00cec9; --accent: #fd79a8; --bg: #f0f2f5; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; color: #2d3436; }
        .nav { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); padding: 12px 0; display: flex; justify-content: space-around; position: sticky; top: 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); z-index: 1000; border-bottom: 2px solid var(--p); }
        .nav a { text-decoration: none; color: #636e72; font-size: 11px; font-weight: bold; text-align: center; transition: 0.3s; }
        .nav a i { display: block; font-size: 24px; margin-bottom: 4px; background: linear-gradient(45deg, var(--p), var(--s)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav a:hover { color: var(--p); transform: translateY(-3px); }
        .hero { background: linear-gradient(135deg, #6c5ce7, #a29bfe, #00cec9); background-size: 400% 400%; animation: gradientBG 10s ease infinite; color: white; padding: 60px 20px; text-align: center; border-radius: 0 0 60px 60px; }
        @keyframes gradientBG { 0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;} }
        .container { max-width: 1200px; margin: -40px auto 40px; padding: 0 20px; }
        .card { background: white; border-radius: 30px; padding: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); margin-bottom: 30px; animation: fadeInUp 0.6s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .edu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; }
        .edu-card { border-radius: 25px; overflow: hidden; background: white; box-shadow: 0 10px 20px rgba(0,0,0,0.05); transition: 0.3s; border: 1px solid #eee; }
        .edu-card:hover { transform: scale(1.03); }
        .edu-img { width: 100%; height: 180px; object-fit: cover; }
        .edu-content { padding: 20px; }
        .btn { background: linear-gradient(45deg, var(--p), var(--s)); color: white; border: none; padding: 15px 25px; border-radius: 18px; font-weight: bold; cursor: pointer; width: 100%; display: block; text-align: center; text-decoration: none; transition: 0.3s; }
        .btn:hover { letter-spacing: 1px; opacity: 0.9; }
        .badge { background: var(--accent); color: white; padding: 4px 12px; border-radius: 10px; font-size: 12px; }
        table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
        td { background: #fff; padding: 15px; border-radius: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.03); }
        .status-btn { padding: 10px 20px; border-radius: 12px; border: 2px solid #eee; cursor: pointer; font-weight: bold; background: white; }
        input[type="radio"]:checked + .status-btn { background: var(--p); color: white; border-color: var(--p); }
    </style>
    </head><body>
    <div class="nav">
        <a href="/"><i class="fa-solid fa-book-open"></i>Կրթություն</a>
        <a href="/attendance"><i class="fa-solid fa-clipboard-check"></i>Մատյան</a>
        <a href="/stats"><i class="fa-solid fa-chart-pie"></i>Վիճակագրություն</a>
        <a href="/all-students"><i class="fa-solid fa-database"></i>Բազա</a>
    </div>
    <div class="hero">
        <h1>📊 Դասերի հաճախումների մատյան</h1>
        <p>Կրթական հարթակ և թվային հաշվառման համակարգ</p>
    </div>
    <div class="container">${content}</div>
    </body></html>`;
}

// 1. ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    let cards = "";
    for(let i=0; i<50; i++) {
        let t = topicsData[i % topicsData.length];
        cards += `<div class="edu-card">
            <img src="https://picsum.photos/seed/${i+200}/400/250" class="edu-img">
            <div class="edu-content">
                <span class="badge">Թեմա #${i+1}</span>
                <h3 style="color:var(--p); margin:10px 0;">${t.title}</h3>
                <p style="font-size:14px; color:#636e72;">${t.desc}</p>
                <a href="/article/${i}" class="btn" style="padding:10px; font-size:14px;">Կարդալ ամբողջը</a>
            </div>
        </div>`;
    }
    res.send(wrapHTML(`<div class="card" style="text-align:center;"><h2><i class="fa-solid fa-lightbulb"></i> Գիտելիքների շտեմարան</h2><p>Ընդլայնված հոդվածներ ձեր զարգացման համար</p></div><div class="edu-grid">${cards}</div>`));
});

// 2. ՀՈԴՎԱԾԻ ԷՋ
app.get('/article/:id', (req, res) => {
    const id = req.params.id % topicsData.length;
    const t = topicsData[id];
    res.send(wrapHTML(`<div class="card">
        <img src="https://picsum.photos/seed/${req.params.id+200}/800/400" style="width:100%; border-radius:20px; margin-bottom:20px;">
        <h1 style="color:var(--p);">${t.title}</h1>
        <div style="font-size:18px; line-height:1.8; color:#2d3436; text-align:justify;">
            ${t.full}
            <br><br>
            <i>Այս հոդվածը պատրաստվել է հատուկ «Դասերի հաճախումների մատյան» հարթակի համար:</i>
        </div>
        <a href="/" class="btn" style="width:180px; background:#636e72; margin-top:30px;">⬅ Վերադառնալ</a>
    </div>`, t.title));
});

// 3. ՄԱՏՅԱՆ (Հայրանուններով)
app.get('/attendance', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    const today = new Date().toISOString().split('T')[0];
    res.send(wrapHTML(`<div class="card">
        <h3><i class="fa-solid fa-pen-to-square"></i> Գրանցել հաճախումները</h3>
        <form action="/attendance-list" method="GET">
            <label>Ամսաթիվ</label><input type="date" name="selected_date" value="${today}" required style="width:100%; padding:10px; margin-bottom:15px; border-radius:10px; border:1px solid #ddd;">
            <label>Դասարան</label>
            <select name="class_id" id="cls" onchange="f()" style="width:100%; padding:10px; margin-bottom:15px; border-radius:10px;">
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>
            <label>Առարկա</label><select name="subject_id" id="sbj" required style="width:100%; padding:10px; margin-bottom:15px; border-radius:10px;"></select>
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
        </script>
    </div>`));
});

// 4. ՀԱՃԱԽՈՒՄՆԵՐԻ ՑՈՒՑԱԿ (Հայրանուններով)
app.get('/attendance-list', (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE class_id = ? ORDER BY surname ASC").all(req.query.class_id);
    const rows = students.map(s => `<tr>
        <td><b>${s.surname}</b> ${s.name} ${s.patronymic}</td>
        <td style="text-align:right;">
            <label><input type="radio" name="at-${s.id}" value="Present" checked style="display:none"><span class="status-btn">Ն</span></label>
            <label><input type="radio" name="at-${s.id}" value="Absent" style="display:none"><span class="status-btn">Բ</span></label>
        </td></tr>`).join('');
    res.send(wrapHTML(`<div class="card"><h3>Գրանցում - ${req.query.selected_date}</h3><form action="/save" method="POST"><input type="hidden" name="sub" value="${req.query.subject_id}"><input type="hidden" name="date" value="${req.query.selected_date}"><table>${rows}</table><button class="btn" style="margin-top:20px;">Պահպանել</button></form></div>`));
});

app.post('/save', (req, res) => {
    const st = db.prepare("INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)");
    for (const k in req.body) if (k.startsWith('at-')) st.run(k.split('-')[1], req.body.sub, req.body[k], req.body.date);
    res.send(wrapHTML(`<div class="card" style="text-align:center;"><h2>✅ Պահպանվեց</h2><a href="/attendance" class="btn" style="display:inline-block; width:auto;">Հետ</a></div>`));
});

// 5. ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ
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
            sAtt.forEach(a => { const m = new Date(a.date).getMonth()+1; if(m>=9 || m<=1
