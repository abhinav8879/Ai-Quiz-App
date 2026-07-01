
// --- PWA SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Mock registration to show PWA capability in JS. 
        // In real project, you must create sw.js file in root directory.
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('Service Worker Registered!', reg);
        }).catch(err => {
            console.log('Service Worker registration failed: ', err);
        });
    });
}

// --- CUSTOM CURSOR ---
const dot = document.getElementById("cursorDot");
const outline = document.getElementById("cursorOutline");
window.addEventListener("mousemove", function(e) {
    dot.style.left = e.clientX + "px";
    dot.style.top = e.clientY + "px";
    outline.style.left = e.clientX + "px";
    outline.style.top = e.clientY + "px";
});
function cursorHover() { outline.style.transform = "translate(-50%, -50%) scale(1.5)"; outline.style.backgroundColor = "rgba(124,58,237,0.1)"; }
function cursorLeave() { outline.style.transform = "translate(-50%, -50%) scale(1)"; outline.style.backgroundColor = "transparent"; }

// --- TOAST NOTIFICATIONS ---
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').innerText = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// --- THEME & FULLSCREEN ---
function toggleTheme() {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}
function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
}

// --- MOBILE SIDEBAR TOGGLE ---
function toggleSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    sidebar.classList.toggle('mobile-open');
}

// --- NAVIGATION LOGIC ---
function navTo(screenId, navId) {
    document.querySelectorAll('.app-wrap main .screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    document.querySelectorAll('.s-item').forEach(i => i.classList.remove('active'));
    document.getElementById(navId).classList.add('active');
    
    // Auto-close sidebar on mobile after clicking
    document.getElementById('mainSidebar').classList.remove('mobile-open');
    
    clearInterval(timerInterval); // Stop timer if navigating away
}

// --- AUTHENTICATION ---
function login() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appMain').style.display = 'flex';
    showToast("Login Successful! JWT Token generated.");
}
function logout() {
    document.getElementById('appMain').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    navTo('homeScreen', 'nav-home');
}

// --- TOPIC & DIFFICULTY SELECTION ---
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

// --- ADAPTIVE QUIZ ENGINE & TIMER ---
let curQIndex = 0;
let curScore = 0;
let timerInterval;
let timeLeft = 60;
const totalQs = 5;
let currentLevel = 'medium'; // Quiz humesha Medium se start hoga

// Adaptive Question Bank (Easy, Medium, Hard)
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
    
    curQIndex = 0; curScore = 0; currentLevel = 'medium'; // Reset level
    document.getElementById('topicCrumb').innerText = selectedTopic;
    navTo('quizScreen', 'nav-quiz');
    loadQuestion();
}

function loadQuestion() {
    if(curQIndex >= totalQs) { endQuiz(); return; }
    
    document.getElementById('qIndexDisplay').innerText = curQIndex + 1;
    // UI mein Question ke upar level bhi dikhayega (e.g. Question 1 - MEDIUM LEVEL)
    document.getElementById('qTagDisplay').innerText = (curQIndex + 1) + " (" + currentLevel.toUpperCase() + " LEVEL)";
    document.getElementById('scoreDisplay').innerText = curScore;
    
    // Level ke hisaab se question uthana
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
    
    // Sound Effects
    const successSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    const errorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3');
    successSound.volume = 0.5; errorSound.volume = 0.4;
    
    if(selected === correct) {
        btn.classList.add('correct');
        curScore++;
        successSound.play();
        
        // ADAPTIVE LOGIC: Sahi jawab par difficulty badhayenge
        if(currentLevel === 'easy') currentLevel = 'medium';
        else if(currentLevel === 'medium') currentLevel = 'hard';
        showToast("Correct! Difficulty Increased 📈");
        
    } else {
        btn.classList.add('wrong');
        buttons[correct].classList.add('correct');
        errorSound.play();
        
        // ADAPTIVE LOGIC: Galat jawab par difficulty ghatayenge
        if(currentLevel === 'hard') currentLevel = 'medium';
        else if(currentLevel === 'medium') currentLevel = 'easy';
        showToast("Incorrect! Difficulty Decreased 📉");
    }
    
    document.getElementById('scoreDisplay').innerText = curScore;
    setTimeout(() => { curQIndex++; loadQuestion(); }, 1500); // Thoda zyada time diya taaki user dekh sake
}
    clearInterval(timerInterval);
    const buttons = document.querySelectorAll('.opt-btn');
    buttons.forEach(b => b.disabled = true);
    
    if(selected === correct) {
        btn.classList.add('correct');
        curScore++;
    } else {
        btn.classList.add('wrong');
        buttons[correct].classList.add('correct');
    }
    
    document.getElementById('scoreDisplay').innerText = curScore;
    setTimeout(() => { curQIndex++; loadQuestion(); }, 1200);
}

function skipQuestion() {
    clearInterval(timerInterval);
    showToast("Question skipped. Negative marking applied (-1 XP)");
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
    else if(timeLeft > 10) timerBox.className = 'timer-widget';
    else timerBox.className = 'timer-widget'; // red
}

function endQuiz() {
    clearInterval(timerInterval);
    document.getElementById('rsScore').innerText = curScore;
    navTo('resultsScreen', 'nav-quiz');
}
// --- LIVE DATA ANALYTICS CHART ---
let performanceChartInstance = null;

function renderLiveChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Agar chart pehle se bana hai, toh usko destroy karein taaki naya ban sake
    if (performanceChartInstance) {
        performanceChartInstance.destroy();
    }

    // Glowing gradient effect create karna
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.5)'); // Purple glow
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.0)');

    performanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Quiz Accuracy (%)',
                data: [65, 72, 68, 85, 82, 90, 87], // Yeh aapka data hai
                borderColor: '#7c3aed', // Primary Purple
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#06b6d4', // Cyan accent
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4 // Curve effect ke liye
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0', font: { family: "'Inter', sans-serif", weight: '600' } }
                }
            },
            scales: {
                x: { 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } } 
                },
                y: { 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } },
                    min: 0, max: 100
                }
            }
        }
    });
}
