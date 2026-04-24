const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'school-matyan-luxury-2026', 
    resave: false, 
    saveUninitialized: true 
}));

function wrapHTML(content, title = "Էլեկտրոնային Մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { 
            --primary: #6c5ce7; 
            --secondary: #a29bfe; 
            --accent: #00cec9;
            --bg: #f0f3f7;
            --card-bg: rgba(255, 255, 255, 0.9);
            --text: #2d3436;
        }
        
        body { 
            font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif; 
            background: var(--bg); 
            background-image: radial-gradient(circle at 10% 20%, rgb(239, 246, 249) 0%, rgb(206, 239, 253) 90%);
            margin: 0; 
            color: var(--text);
            min-height: 100vh;
        }

        /* Գեղեցիկ Մենյու */
        .navbar {
            background: var(--card-bg);
            backdrop-filter: blur(10px);
            padding: 15px 0;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 4px 30px rgba(0,0,0,0.05);
            border-bottom: 1px solid rgba(255,255,255,0.3);
        }
        
        .nav-container {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            justify-content: space-around;
            align-items: center;
        }

        .nav-link {
            text-decoration: none;
            color: var(--text);
            font-weight: 600;
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 13px;
            transition: 0.3s;
            opacity: 0.7;
        }

        .nav-link i { font-size: 20px; margin-bottom: 5px; color: var(--primary); }
        .nav-link:hover { opacity: 1; transform: translateY(-2px); }
        .nav-link.active { opacity: 1; color: var(--primary); }

        /* Գլխավոր Header */
        .hero {
            background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 0 0 50px 50px;
            margin-bottom: 30px;
            box-shadow: 0 10px 20px rgba(108, 92, 231, 0.2);
        }

        .container { max-width: 900px; margin: 0 auto; padding: 20px; }

        /* Քարտերի ոճը */
        .card { 
            background: var(--card-bg);
            backdrop-filter: blur(10px);
            padding: 30px; 
            border-radius: 24px; 
            box-shadow: 0 15px 35px rgba(0,0,0,0.05); 
            border: 1px solid rgba(255,255,255,0.5);
            margin-bottom: 25px;
            animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* Ֆորմաների դիզայն */
        select, input { 
            width: 100%; padding: 14px; border-radius: 15px; 
            border: 2px solid #edf2f7; background: #f8fafc;
            font-size: 16px; margin-bottom: 15px; outline: none; transition: 0.3s;
        }
        select:focus { border-color: var(--primary); background: white; }

        .btn { 
            background: var(--primary); color: white; border: none; 
            padding: 16px; border-radius: 15px; font-size: 17px; 
            font-weight: bold; cursor: pointer; width: 100%; 
            box-shadow: 0 8px 15px rgba(108, 92, 231, 0.3); transition: 0.3s;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 20px rgba(108, 92, 231, 0.4); }

        table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
        tr { transition: 0.2s; }
        td { background: #fff; padding: 18px; border: none; }
        td:first-child { border-radius: 15px 0 0 15px; }
        td:last-child { border-radius: 0 15px 15px 0; }
        
        .status-btn { padding: 8px 15px; border-radius: 10px; cursor: pointer; border: 2px solid #eee; background: white; font-weight: bold; }
        input[type="radio"] { display: none; }
        input[type="radio"]:checked + span { background: var(--primary); color: white; border-color: var(--primary); }

        .edu-card { border-left: 6px solid var(--primary); transition: 0.3s; }
        .edu-card:hover { transform: scale(1.02); }

    </style>
    </head><body>
    <div class="navbar">
        <div class="nav-container">
            <a href="/" class="nav-link"><i class="fa-solid fa-calendar-check"></i>Մատյան</a>
            <a href="/stats" class="nav-link"><i class="fa-solid fa-chart-pie"></i>Վիճակագրություն</a>
            <a href="/all-students" class="nav-link"><i class="fa-solid fa-user-graduate"></i>Աշակերտներ</a>
            <a href="/edu" class="nav-link"><i class="fa-solid fa-lightbulb"></i>Կրթություն</a>
        </div>
    </div>

    <div class="hero">
        <h1 style="margin:0; font-size: 28px;">Դասամատյան 2.0</h1>
        <p style="opacity: 0.9; margin-top: 5px;">Կրթության կառավարման ժամանակակից հարթակ</p>
    </div>

    <div class="container"><div class="card">${content}</div></div>
    </body></html>`;
}

// 1. ԳԼԽԱՎՈՐ ԷՋ
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY id ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();
    res.send(wrapHTML(`
        <h2 style="text-align:left; color: var(--primary);"><i class="fa-solid fa-magnifying-glass"></i> Ընտրեք Դասարանը</h2>
