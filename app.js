const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'school-ultimate-2026-v2', resave: false, saveUninitialized: true }));

function wrapHTML(content, title = "Դասերի հաճախումների մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
        .card { background: white; border-radius: 30px; padding: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); margin-bottom: 30px; transition: 0.4s; animation: fadeInUp 0.6s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .edu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; }
        .edu-card { border-radius: 25px; overflow: hidden; background: white; box-shadow: 0 10px 20px rgba(0,0,0,0.05); transition: 0.3s; border: 1px solid #eee; }
        .edu-card:hover { transform: scale(1.03); box-shadow: 0 20px 40px rgba(108, 92, 231, 0.2); }
        .edu-img { width: 100%; height: 180px; object-fit: cover; }
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

app.get('/', (req, res) => {
    const topics = [
        ["Յուրի Օհանեսյան", "Հայ մեծագույն գիտնական, ում անունով կոչվել է 118-րդ քիմիական տարրը:", "science"],
        ["Ոսկեդար", "5-րդ դարի մշակութային վերելքը, Մաշտոցի հանճարն ու գրերի գյուտը:", "history"],
        ["Տիեզերական ճամփորդություն", "Ինչպես է մարդկությունը նվաճում աստղերն ու մոլորակները:", "space"],
        ["Արհեստական Բանականություն", "Թվային ապագան և AI-ի ազդեցությունը մեր առօրյայի վրա:", "tech"],
        ["Օվկիանոսի գաղտնիքները", "Ջրային աշխարհի անհայտ խորքերն ու Մարիանյան անդունդը:", "nature"]
    ];
    let longTopics = [];
    for(let i=0; i<50; i++) {
        let t = topics[i % topics.length];
        longTopics.push(`<div class="edu-card">
            <img src="https://picsum.photos/seed/${i+50}/400/250" class="edu-img">
            <div class="edu-content">
                <span class="badge">#${i+1} Գիտելիք</span>
                <h3>${t[0]}</h3>
                <p>${t[1]} Այս թեման բացահայտում է կարևորագույն փաստեր, որոնք պետք է իմանա յուրաքանչյուր ոք:</p>
                <button class="btn" style="padding:8px; font-size:12px;">Կարդալ ավելին</button>
            </div>
        </div>`);
    }
    res.send(wrapHTML(`
        <div class="card" style="text-align:center;">
            <h2 style="color:var(--p);"><i class="fa-solid fa-lightbulb"></i> Գիտելիքների շտեմարան</h2>
            <p>50 հետաքրքիր հոդվածներ ձեր զարգացման համար</p>
        </div>
        <div class="edu-grid">${longTopics.join('')}</div>`));
});

app.get('/attendance', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    const today = new Date().toISOString().split('T')[0];
    res.send(wrapHTML(`
        <div class="card">
            <h3><i class="fa-solid fa-pen-to-square"></i> Օրվա ներկա-բացակա</h3>
            <form action="/attendance-list" method="GET">
                <label>Ամսաթիվ</label><input type="date" name="selected_date" value="${today}" required>
                <label>Դասարան</label>
                <select name="class_id" id="cls" onchange="f()">
                    ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
                </select>
                <label>Առարկա</label><select name="subject_id" id="sbj" required></select>
                <button class="btn">Բացել ցուցակը</button>
            </form>
        </div>
        <script>
            const ss = ${JSON.stringify(subjects)};
            function f() {
                const c = document.getElementById('cls');
                const g = parseInt(c.selectedOptions[0].text);
                let l = g <= 4 ? 'elem' : (g <=
