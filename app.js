app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const classes = db.prepare("SELECT * FROM classes ORDER BY id ASC").all();
    const subjects = db.prepare("SELECT * FROM subjects").all();

    res.send(wrapHTML(`
        <h2>🔍 Օրվա Մատյան</h2>
        <form action="/attendance-list" method="GET">
            <label>Ընտրեք դասարանը.</label>
            <select name="class_id" id="classSelect" onchange="filterSubjects()" required>
                ${classes.map(c => `<option value="${c.id}">${c.name}</option>`)}
            </select>

            <label>Ընտրեք առարկան.</label>
            <select name="subject_id" id="subjectSelect" required>
                </select>
            <button class="btn" style="margin-top:15px;">Բացել ցուցակը</button>
        </form>

        <script>
            const allSubjs = ${JSON.stringify(subjects)};
            
            function filterSubjects() {
                const classSelect = document.getElementById('classSelect');
                const subjSelect = document.getElementById('subjectSelect');
                const className = classSelect.options[classSelect.selectedIndex].text;
                const grade = parseInt(className);

                let level = '';
                if (grade <= 4) level = 'elem';
                else if (grade <= 9) level = 'mid';
                else level = 'high';

                subjSelect.innerHTML = '';
                allSubjs.forEach(s => {
                    if (s.level === 'all' || s.level.includes(level)) {
                        const opt = document.createElement('option');
                        opt.value = s.id;
                        opt.textContent = s.name;
                        subjSelect.appendChild(opt);
                    }
                });
            }
            filterSubjects(); // Կանչել առաջին անգամ
        </script>
    `));
});
