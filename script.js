// --- ESTADO E CONFIGURAÇÕES ---
let data = JSON.parse(localStorage.getItem('nofap_elite_data')) || {
    startTime: Date.now(),
    relapses: [],
    bestStreak: 0,
    goals: []
};

const phrases = [
    "A disciplina é a liberdade.", "Não troque o que mais quer pelo que quer agora.",
    "Seja mestre dos seus impulsos.", "A dor do crescimento é melhor que a do arrependimento.",
    "Um vencedor é apenas um perdedor que tentou mais uma vez.", "Sua energia vital é seu poder.",
    "A clareza mental não tem preço.", "O vício é uma prisão com as portas abertas.",
    "Você é o arquiteto do seu destino.", "Cada dia vencido é um neurônio curado.",
    "Não se sabote, você merece o topo.", "Mantenha a guarda alta.",
    "A vontade de mudar deve ser maior que a de permanecer o mesmo.", "Sua versão de 90 dias agradece hoje.",
    "O prazer momentâneo é o inimigo do sucesso duradouro.", "Respire fundo, a fissura passa.",
    "Reconquiste sua masculinidade.", "Domine sua mente, domine sua vida.",
    "Você é mais forte do que a sua vontade de desistir.", "Foco na missão.",
    "Nem sempre falhar significa ser fraco.", "Não tenha vergonha de admitir que erra e quer melhorar.",
    "Tenha vergonha do que se tornará se não mudar.", "Você tem a chave pra fugir dessa realidade.",
    "Cair é normal, mas você consegue se reerguer."
];

const levels = [
    { day: 0, label: "Novo Começo", color: "#95a5a6" },
    { day: 3, label: "Início do Foco", color: "#3498db" },
    { day: 7, label: "Evolução Iniciada", color: "#27ae60" },
    { day: 15, label: "Guerreiro Resiliente", color: "#8e44ad" },
    { day: 30, label: "Novo Homem", color: "#d35400" },
    { day: 90, label: "Homem de Ouro", color: "#f1c40f" }
];

const sfx = {
    fail: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    success: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3')
};

// --- FUNÇÕES CORE ---
function update() {
    const diff = Date.now() - data.startTime;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    document.getElementById('d').innerText = d;
    document.getElementById('h').innerText = h;
    document.getElementById('m').innerText = m;
    document.getElementById('s').innerText = s;

    // Atualizar Nível
    const lv = [...levels].reverse().find(l => d >= l.day);
    const banner = document.getElementById('level-indicator');
    banner.innerText = `NÍVEL: ${lv.label}`;
    banner.style.backgroundColor = lv.color;

    if (d > data.bestStreak) data.bestStreak = d;
    document.getElementById('best-streak').innerText = data.bestStreak + "d";
    document.getElementById('total-relapses').innerText = data.relapses.length;

    save();
}

function triggerRelapse() {
    if(confirm("Confirmar recaída? Sua sequência voltará a zero e a penalidade será aplicada.")) {
        sfx.fail.play();
        data.relapses.push({ 
            date: new Date().toLocaleString(), 
            streak: Math.floor((Date.now() - data.startTime)/86400000) 
        });
        data.startTime = Date.now();
        alert("PENALIDADE: 50 Flexões e Banho Frio agora! Não negocie com o erro.");
        renderRelapses();
        save();
        update();
    }
}

function generateAlivio() {
    const container = document.getElementById('alivio-dates');
    container.innerHTML = "";
    let intervals = [4, 4, 7, 7, 14, 14, 30, 30]; 
    let current = new Date(data.startTime);

    intervals.forEach((gap, i) => {
        current.setDate(current.getDate() + gap);
        while(current.getDay() !== 3 && current.getDay() !== 6) {
            current.setDate(current.getDate() + 1);
        }
        container.innerHTML += `
            <div class="list-item">
                <span>Fase ${i+1}</span>
                <b>${current.toLocaleDateString('pt-br', {day:'2-digit', month:'2-digit'})} (${current.toLocaleDateString('pt-br', {weekday:'short'})})</b>
            </div>`;
    });
}

function addGoal() {
    const nameInput = document.getElementById('g-name');
    const daysInput = document.getElementById('g-days');
    const name = nameInput.value;
    const days = parseInt(daysInput.value);
    
    if(name && days) {
        data.goals.push({ name, days, id: Date.now() });
        sfx.success.play();
        renderGoals();
        nameInput.value = "";
        daysInput.value = "";
        save();
    }
}

function renderGoals() {
    const div = document.getElementById('custom-goals');
    const currentDays = Math.floor((Date.now() - data.startTime)/86400000);
    div.innerHTML = data.goals.map(g => `
        <div class="card" style="text-align:left">
            <div style="display:flex; justify-content:space-between">
                <strong class="${currentDays >= g.days ? 'completed' : ''}">${g.name}</strong>
                <span>${currentDays}/${g.days}d</span>
            </div>
        </div>
    `).join("");
}

function renderRelapses() {
    const div = document.getElementById('relapse-history');
    if (!div) return;
    div.innerHTML = "<h4>Histórico</h4>" + data.relapses.map(r => `<div>❌ ${r.date} (Durou ${r.streak} dias)</div>`).reverse().slice(0,5).join("");
}

function openTab(event, id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');
    if(id === 'alivio') generateAlivio();
}

function toggleTheme() {
    const b = document.body;
    b.getAttribute('data-theme') === 'dark' ? b.removeAttribute('data-theme') : b.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', b.getAttribute('data-theme') || 'light');
}

function triggerSOS() {
    document.body.style.backgroundColor = "#ff0000";
    sfx.fail.play();

    const conselhos = [
        "LARGUE O DISPOSITIVO AGORA!",
        "VÁ PARA A SALA ONDE HÁ PESSOAS.",
        "FAÇA 20 FLEXÕES OU 1 MIN DE PRANCHA.",
        "ISSO É APENAS UM IMPULSO QUÍMICO, ELE VAI PASSAR EM 10 MINUTOS."
    ];

    setTimeout(() => {
        alert("🔥 PROTOCOLO DE EMERGÊNCIA:\n\n" + conselhos[Math.floor(Math.random() * conselhos.length)]);
        document.body.style.backgroundColor = ""; 
    }, 100);
}

function save() { 
    localStorage.setItem('nofap_elite_data', JSON.stringify(data)); 
}

// --- INICIALIZAÇÃO ---
window.onload = () => {
    // Carregar Tema
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }

    // Configurar Gráfico
    const ctx = document.getElementById('evolutionChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['D0', 'D3', 'D7', 'D15', 'D30', 'D90'],
            datasets: [{
                label: 'Poder de Autodomínio %',
                data: [0, 20, 50, 70, 85, 100],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                fill: true, tension: 0.4
            }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { display: false } } }
    });

    // Intervals
    setInterval(update, 1000);
    setInterval(() => {
        document.getElementById('phrase').innerText = phrases[Math.floor(Math.random()*phrases.length)];
    }, 15000);

    update();
    renderGoals();
    renderRelapses();

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(() => {
            console.log('Service Worker Registrado');
        });
    }
};
