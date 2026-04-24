const express = require('express');
const session = require('express-session');
const db = require('./database');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'visual-stats-2026', resave: false, saveUninitialized: true }));

function wrapHTML(content, title = "Էլեկտրոնային Մատյան") {
    return `<!DOCTYPE html><html lang="hy"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root { --main: #4834d4; --bg: #f5f6fa; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; }
        .header { background: linear-gradient(135deg, #4834d4, #686de0); color: white; padding: 30px; text-align: center; font-size: 28px; font-weight: bold; }
        .nav { display: flex; justify-content: center; gap: 10px; padding: 15px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .nav a { text-decoration: none; color: var(--main); padding: 10px 20px; border-radius: 10px; font-weight: bold; border: 2px solid var(--main); }
        .container { max-width: 1000px; margin: 20px auto; padding: 0 15px; }
        .card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 20px; }
        .chart-container { position: relative; height: 300px; width: 100%; margin-bottom: 40px; }
        h3 { color: var(--main); border-left: 5px solid var(--main); padding-left: 10px; margin-bottom: 20px; }
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

app.get('/stats', (req, res) => {
    // 1. Բացականերն ըստ առարկաների
    const subjectStats = db.prepare(`
        SELECT s.name, COUNT(a.id) as count 
        FROM subjects s 
        LEFT JOIN attendance a ON s.id = a.subject_id AND a.status = 'Absent'
        GROUP BY s.id
    `).all();

    // 2. Բացականերն ըստ դասարանների
    const classStats = db.prepare(`
        SELECT c.name, COUNT(a.id) as count 
        FROM classes c 
        LEFT JOIN students st ON c.id = st.class_id
        LEFT JOIN attendance a ON st.id = a.student_id AND a.status = 'Absent'
        GROUP BY c.id
    `).all();

    const chartScript = `
        <script>
        // Առարկաների գրաֆիկ
        new Chart(document.getElementById('subjChart'), {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(subjectStats.map(s => s.name))},
                datasets: [{
                    label: 'Բացակաների քանակ',
                    data: ${JSON.stringify(subjectStats.map(s => s.count))},
                    backgroundColor: '#686de0'
                }]
            }
        });

        // Դասարանների մրցույթ
        new Chart(document.getElementById('classChart'), {
            type: 'pie',
            data: {
                labels: ${JSON.stringify(classStats.map(c => c.name))},
                datasets: [{
                    data: ${JSON.stringify(classStats.map(c => c.count))},
                    backgroundColor: ['#ff7675', '#74b9ff', '#55efc4', '#ffeaa7', '#a29bfe', '#fab1a0']
                }]
            }
        });
        </script>
    `;

    res.send(wrapHTML(`
        <h2>📊 Տեսողական Վերլուծություն</h2>
        
        <div class="chart-container">
            <h3>📚 Բացականերն ըստ առարկաների</h3>
            <canvas id="subjChart"></canvas>
        </div>
        <hr>
        <div class="chart-container" style="height: 400px; display:flex; flex-direction:column; align-items:center;">
            <h3>🏫 Դասարանների «հաճախելիության» պատկերը</h3>
            <canvas id="classChart"></canvas>
        </div>
        ${chartScript}
    `));
});

// Այստեղ կավելացնես նախորդ app.js-ի մնացած ֆունկցիաները (/, /attendance-list, /save-attendance, և այլն)
// ... (պահպանիր նախորդ կոդի մյուս մասերը)

app.listen(process.env.PORT || 3000);
