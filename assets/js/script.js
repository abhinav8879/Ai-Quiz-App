if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {});
    });
}

const dot = document.getElementById("cursorDot");
const outline = document.getElementById("cursorOutline");
window.addEventListener("mousemove", function(e) {
    if(dot && outline) {
        dot.style.left = e.clientX + "px";
        dot.style.top = e.clientY + "px";
        outline.style.left = e.clientX + "px";
        outline.style.top = e.clientY + "px";
    }
});
function cursorHover() { if(outline){ outline.style.transform = "translate(-50%, -50%) scale(1.5)"; outline.style.backgroundColor = "rgba(124,58,237,0.1)"; } }
function cursorLeave() { if(outline){ outline.style.transform = "translate(-50%, -50%) scale(1)"; outline.style.backgroundColor = "transparent"; } }

function showToast(msg) {
    const t = document.getElementById('toast');
    if(!t) return;
    document.getElementById('toastMsg').innerText = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function toggleTheme() {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
}

function toggleSidebar() {
    document.getElementById('mainSidebar').classList.toggle('mobile-open');
}

function navTo(screenId, navId) {
    document.querySelectorAll('.app-wrap main .screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    document.querySelectorAll('.s-item').forEach(i => i.classList.remove('active'));
    if(document.getElementById(navId)) document.getElementById(navId).classList.add('active');
    
    document.getElementById('mainSidebar').classList.remove('mobile-open');
    clearInterval(timerInterval);
    
    if(screenId === 'analyticsScreen') setTimeout(renderLiveChart, 100);
}

// --- AUTHENTICATION & PROFILE SYSTEM ---

function toggleAuth(mode) {
    if(mode === 'register') {
        document.getElementById('loginFormBlock').style.display = 'none';
        document.getElementById('registerFormBlock').style.display = 'block';
    } else {
        document.getElementById('registerFormBlock').style.display = 'none';
        document.getElementById('loginFormBlock').style.display = 'block';
    }
}

function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const uid = document.getElementById('regUid').value.trim().toUpperCase();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value.trim();

    if(!name || !uid || !email || !pass) {
        showToast("Please fill all details!");
        return;
    }

    // Save to Browser's LocalStorage (Fake Backend)
    const userObj = { name: name, uid: uid, email: email, pass: pass };
    localStorage.setItem('QuizUser_' + uid, JSON.stringify(userObj));
    
    showToast("Profile Created Successfully! Please Login.");
    
    // Clear fields & Switch to Login
    document.getElementById('regName').value = '';
    document.getElementById('regUid').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPass').value = '';
    toggleAuth('login');
    
    // Pre-fill UID in login screen for convenience
    document.getElementById('loginUid').value = uid;
}

function handleLogin() {
    const uid = document.getElementById('loginUid').value.trim().toUpperCase();
    const pass = document.getElementById('loginPass').value.trim();

    if(!uid || !pass) {
        showToast("Enter UID and Password!");
        return;
    }

    // Default Admin Access (Taki aapka purana login hamesha chale)
    if(uid === "O23BCA110050" && pass === "password123") {
        updateDashboardData("ABHINAV KUMAR", uid);
        startApp();
        return;
    }

    // Check LocalStorage for registered users
    const savedUser = localStorage.getItem('QuizUser_' + uid);
    if(savedUser) {
        const userData = JSON.parse(savedUser);
        if(userData.pass === pass) {
            updateDashboardData(userData.name, userData.uid);
            startApp();
        } else {
            showToast("Incorrect Password!");
        }
    } else {
        showToast("User not found! Please Create a Profile first.");
    }
}

// Update UI with the logged-in user's details
function updateDashboardData(name, uid) {
    // 1. Update Navbar Name & UID
    document.querySelector('.avatar-info .name').innerText = name.toUpperCase();
    document.querySelector('.avatar-info .uid').innerText = "UID: " + uid;
    
    // 2. Generate Avatar Initials (e.g. Abhinav Kumar -> AK)
    let initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.querySelector('.avatar-ring').innerText = initials;

    // 3. Update Sidebar Project Info
    const projectBoxVals = document.querySelectorAll('.sidebar-project-box .box-val');
    if(projectBoxVals.length > 1) {
        projectBoxVals[0].innerText = name.toUpperCase();
        projectBoxVals[1].innerText = uid;
    }
    
    // 4. Save name globally so Certificate can use it
    window.currentLoggedUser = name.toUpperCase();
}

function startApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appMain').style.display = 'flex';
    document.getElementById('navProfile').style.display = 'flex'; // <-- YEH NAYI LINE ADD KI HAI
    showToast("Welcome to QuizAI!");
}

function handleForgotPassword() {
    const uid = document.getElementById('loginUid').value.trim().toUpperCase();
    
    if(!uid) {
        showToast("Please enter your UID first to reset password!");
        return;
    }

    // Default master account check
    if(uid === "O23BCA110050") {
        showToast("Master Password reset link sent to registered email!");
        return;
    }

    // LocalStorage check for registered users
    const savedUser = localStorage.getItem('QuizUser_' + uid);
    if(savedUser) {
        showToast("Password reset link sent to your registered email!");
    } else {
        showToast("UID not found! Please check your UID or Create a Profile.");
    }
}

function logout() {
    document.getElementById('appMain').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('navProfile').style.display = 'none'; // <-- YEH NAYI LINE ADD KI HAI
    navTo('homeScreen', 'nav-home');
}

let selectedTopic = "General Knowledge";
let selectedDiff = "adaptive";
function pickTopic(el) {
    document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedTopic = el.dataset.topic;
    document.getElementById('customTopic').value = '';
}
function pickDiff(diff, el) {
    document.querySelectorAll('.diff-chip').forEach(b => b.classList.remove('sel'));
    el.classList.add('sel');
    selectedDiff = diff;
}

let curQIndex = 0;
let curScore = 0;
let timerInterval;
let timeLeft = 60;
const totalQs = 5;
let currentLevel = 'medium'; 

const adaptiveQs = {
    easy: [
        { q: "Which language is used for styling web pages?", opts: ["HTML", "JQuery", "CSS", "XML"], ans: 2 },
        { q: "What is the brain of a computer?", opts: ["RAM", "CPU", "Hard Disk", "Monitor"], ans: 1 }
    ],
    medium: [
        { q: "What does 'PWA' stand for?", opts: ["Progressive Web App", "Private Web Access", "Public Wide Area", "Primary Web Architecture"], ans: 0 },
        { q: "In MySQL, which command is used to fetch data?", opts: ["UPDATE", "INSERT", "DELETE", "SELECT"], ans: 3 }
    ],
    hard: [
        { q: "Which HTTP status code signifies 'Not Found'?", opts: ["200", "404", "500", "403"], ans: 1 },
        { q: "What does JWT stand for in backend security?", opts: ["Java Web Token", "JSON Web Token", "JavaScript Window Time", "None"], ans: 1 }
    ]
};

function startQuiz() {
    const inputTopic = document.getElementById('customTopic').value.trim();
    if(inputTopic) selectedTopic = inputTopic;
    
    curQIndex = 0; curScore = 0; currentLevel = 'medium'; 
    document.getElementById('topicCrumb').innerText = selectedTopic;
    navTo('quizScreen', 'nav-quiz');
    loadQuestion();
}

function loadQuestion() {
    if(curQIndex >= totalQs) { endQuiz(); return; }
    
    document.getElementById('qIndexDisplay').innerText = curQIndex + 1;
    document.getElementById('qTagDisplay').innerText = (curQIndex + 1) + " (" + currentLevel.toUpperCase() + " LEVEL)";
    document.getElementById('scoreDisplay').innerText = curScore;
    
    const qList = adaptiveQs[currentLevel];
    const qData = qList[curQIndex % qList.length]; 
    
    const qTextEl = document.getElementById('qText');
    const optsBox = document.getElementById('optsList');
    
    qTextEl.innerText = "";
    optsBox.innerHTML = '';
    
    let i = 0;
    const txt = qData.q;
    const speed = 25; 
    
    function typeWriter() {
        if (i < txt.length) {
            qTextEl.innerHTML += txt.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        } else {
            qData.opts.forEach((opt, index) => {
                const btn = document.createElement('button');
                btn.className = 'opt-btn';
                btn.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + index)}</span> ${opt}`;
                btn.onclick = () => handleAnswer(index, qData.ans, btn);
                btn.onmouseenter = cursorHover;
                btn.onmouseleave = cursorLeave;
                btn.style.opacity = 0;
                btn.style.animation = `fadeUp 0.3s ease forwards ${index * 0.1}s`;
                optsBox.appendChild(btn);
            });
            startTimer(); 
        }
    }
    typeWriter(); 
}

function handleAnswer(selected, correct, btn) {
    clearInterval(timerInterval);
    const buttons = document.querySelectorAll('.opt-btn');
    buttons.forEach(b => b.disabled = true);
    
    const successSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    const errorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3');
    successSound.volume = 0.5; errorSound.volume = 0.4;
    
    if(selected === correct) {
        btn.classList.add('correct');
        curScore++;
        successSound.play().catch(e=>console.log(e));
        if(currentLevel === 'easy') currentLevel = 'medium';
        else if(currentLevel === 'medium') currentLevel = 'hard';
        showToast("Correct! Difficulty Increased 📈");
    } else {
        btn.classList.add('wrong');
        buttons[correct].classList.add('correct');
        errorSound.play().catch(e=>console.log(e));
        if(currentLevel === 'hard') currentLevel = 'medium';
        else if(currentLevel === 'medium') currentLevel = 'easy';
        showToast("Incorrect! Difficulty Decreased 📉");
    }
    
    document.getElementById('scoreDisplay').innerText = curScore;
    setTimeout(() => { curQIndex++; loadQuestion(); }, 1500); 
}

function skipQuestion() {
    clearInterval(timerInterval);
    showToast("Question skipped. (-1 XP)");
    curQIndex++;
    loadQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 60;
    updateTimerUI();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            showToast("Time's up!");
            skipQuestion();
        }
    }, 1000);
}

function updateTimerUI() {
    const timerBox = document.getElementById('timerDisplay');
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;
    document.getElementById('timeText').innerText = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    if(timeLeft > 20) timerBox.className = 'timer-widget safe';
    else timerBox.className = 'timer-widget'; 
}

function endQuiz() {
    clearInterval(timerInterval);
    document.getElementById('rsScore').innerText = curScore;
    navTo('resultsScreen', 'nav-quiz');
}

function exportDataToCSV() {
    showToast('Preparing CSV Export...');
    const exportData = [
        ["Student Name", "UID", "Quiz Topic", "Score (XP)", "Accuracy", "Weakness"],
        ["Aarav Mishra", "O23BCA110012", "Java Core OOPS", "5200", "92%", "None"],
        ["Priya Singh", "O23BCA110088", "Data Structures", "4850", "88%", "Graphs"],
        ["ABHINAV KUMAR", "O23BCA110050", "Cloud Computing", "2450", "87%", "Database Normalization"]
    ];
    let csvContent = "data:text/csv;charset=utf-8,";
    exportData.forEach(function(rowArray) {
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Student_Performance_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => { showToast('Export Successful!'); }, 1000);
}

let performanceChartInstance = null;
function renderLiveChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    if (performanceChartInstance) { performanceChartInstance.destroy(); }
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.5)'); 
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.0)');
    performanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Quiz Accuracy (%)',
                data: [65, 72, 68, 85, 82, 90, 87], 
                borderColor: '#7c3aed', 
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#06b6d4', 
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#e2e8f0', font: { family: "'Inter', sans-serif", weight: '600' } } } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } }, min: 0, max: 100 }
            }
        }
    });
}

// --- GENERATE REAL PDF CERTIFICATE ---
function downloadCertificate() {
    showToast('Generating Real PDF Certificate...');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setFillColor(15, 15, 26);
    doc.rect(0, 0, width, height, 'F');

    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(2);
    doc.rect(10, 10, width - 20, height - 20);

    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, width - 30, height - 30);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICATE OF COMPLETION", width / 2, 50, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("This is proudly presented to", width / 2, 70, { align: "center" });

    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(124, 58, 237);
    doc.text(window.currentLoggedUser || "ABHINAV KUMAR", width / 2, 95, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(226, 232, 240);
    const topic = selectedTopic || "Advanced AI Learning";
    doc.text(`For successfully completing the quiz assessment on`, width / 2, 115, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    doc.text(`"${topic}"`, width / 2, 125, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.text(`with an outstanding score of ${curScore} XP points.`, width / 2, 135, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date: ${today}`, 40, 175);
    doc.line(30, 170, 80, 170); 

    doc.text("AI Engine Signature", width - 40, 175, { align: "right" });
    doc.line(width - 90, 170, width - 30, 170); 
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(124, 58, 237);
    doc.text("QuizAI - Chandigarh University", width / 2, 185, { align: "center" });

    setTimeout(() => {
        doc.save(`QuizAI_Certificate_${topic.replace(/\s+/g, '_')}.pdf`);
        showToast('Certificate Downloaded Successfully!');
    }, 1200);
}
