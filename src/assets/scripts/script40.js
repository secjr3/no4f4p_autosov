


let data = {
  startTime: Date.now(),
  relapses: [],
  bestStreak: 0,
  goals: [],

  tasks: {},
  dailyRecords: {},
};

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

const prfrchk = () => {
  const today = getTodayKey();
  if (!data.dailyRecords[today]) {
    data.dailyRecords[today] = {
      checkinTime: null,
      relapseTimes: [],
      tasks: {},
      note: null
    };
  }
};

async function performCheckin() {
  const today = getTodayKey()
  

  if (!data.dailyRecords[today]) {
    data.dailyRecords[today] = {
      checkinTime: null,
      relapseTimes: [],
      tasks: {},
      note: null
    };

  }



  

  if (data.dailyRecords[today].checkinTime) {
    console.log("Check-in já realizado hoje.");
    return;
  }


  data.dailyRecords[today].checkinTime = Date.now();
  
 
  await save();
}

function getLastCheckinTimestamp() {
  const records = data.dailyRecords;
  const dates = Object.keys(records).sort().reverse(); 
  for (let date of dates) {
    if (records[date].checkinTime) {
      return records[date].checkinTime;
    }
  }
  return null;
}
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
  fail: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
  success: new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3")
};


async function save() {

  try {

    await AutoSovDB.saveAppData(data);

    if (!navigator.onLine) {
      await AutoSovDB.queueSyncOperation({
        type: "SAVE_APP_DATA",
        payload: data
      });
    }

  } catch (e) {
    console.error("[AutoSov] erro ao salvar:", e);
  }
}

function getDetailedStats() {
  const now = Date.now();
  const totalMs = now - data.startTime;

  const totalHours = Math.floor(totalMs / 3600000);
  const totalDays = Math.floor(totalHours / 24);

  const streaks = data.relapses.map(r => r.streak); 

  const totalStreakDays = streaks.reduce((a, b) => a + b, 0);

  const avgStreakDays = streaks.length > 0 ? (totalStreakDays / streaks.length) : 0;

  const avgStreakHours = streaks.length > 0
    ? (totalStreakDays * 24 / streaks.length).toFixed(1)
    : "0.0";

  const totalRelapses = data.relapses.length;

  const timeLostInRelapses = totalStreakDays * 86400000; 

  const victoryRate = totalMs > 0
    ? Math.round((totalMs - timeLostInRelapses) / totalMs * 100)
    : 100;

  const successDaysRate = totalDays > 0
    ? Math.round((totalDays - totalStreakDays) / totalDays * 100)
    : 100;
  const last10 = [...data.relapses].reverse().slice(0, 10);


  const avgStreak = streaks.length > 0
    ? (streaks.reduce((a, b) => a + b, 0) / streaks.length).toFixed(1)
    : totalDays;

  const vulnerability = {};
  data.relapses.forEach(r => {
    const day = new Date(r.date).toLocaleDateString('pt-BR', { weekday: 'long' });
    vulnerability[day] = (vulnerability[day] || 0) + 1;
  });

  const worstDay = Object.keys(vulnerability).reduce((a, b) => vulnerability[a] > vulnerability[b] ? a : b, "Nenhum");

  // Próximo Nível
  const currentStreak = Math.floor((now - data.startTime) / 86400000);
  const nextLevel = levels.find(l => l.day > currentStreak) || levels[levels.length - 1];
  const bestLevel = levels.reduce((r, e) => {
    if (totalDays >= e.day) {
      r = e
    }
    return r
  }, {})

  const daysToNext = nextLevel.day - currentStreak;

  return {
    totalDays,
    totalHours,
    currentStreak,
    avgStreak,
    avgStreakDays: avgStreakDays.toFixed(1),
    avgStreakHours,
    bestLevel,
    bestStreak: data.bestStreak,
    worstDay,
    victoryRate,
    successDaysRate,
    nextLevel,
    daysToNext: daysToNext > 0 ? daysToNext : 0,
    totalRelapses,
    last10
  };
}

function update() {
  const diff = Date.now() - data.startTime;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  document.getElementById("d").innerText = d;
  document.getElementById("h").innerText = h;
  document.getElementById("m").innerText = m;
  document.getElementById("s").innerText = s;

  // Nível atual
  const lv = [...levels].reverse().find(l => d >= l.day);
  const banner = document.getElementById("level-indicator");
  banner.innerText = `NÍVEL: ${lv.label}`;
  banner.style.background = lv.color;

  if (d > data.bestStreak) data.bestStreak = d;
  document.getElementById("best-streak").innerText = data.bestStreak + "d";
  document.getElementById("total-relapses").innerText = data.relapses.length;


  prfrchk()
  updateCheckinStatus()
  save();
  debounceStats()
  getTodayKey()
  updateProgressBar()


}
let statsTimeout;
function debounceStats() {
  clearTimeout(statsTimeout);
  statsTimeout = setTimeout(renderStatsTab, 2000);
}

window.addEventListener("offline", () => {
  const banner = document.getElementById("level-indicator");
  banner.innerText = "Modo Offline Ativo";
  banner.style.background = "#7f8c8d";
  console.log("[AutoSov] Aplicação em modo offline — dados continuam a ser guardados localmente.");
});

window.addEventListener("online", async () => {
  console.log("[AutoSov] Ligação restaurada. A sincronizar operações pendentes...");
  update();
  await _drainSyncQueue();
});
async function _drainSyncQueue() {
  try {
    const pending = await AutoSovDB.getPendingSyncOperations();
    if (pending.length === 0) return;

    console.log(`[AutoSov] ${pending.length} operação(ões) pendente(s) na fila de sync.`);

    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("autosov-sync");
      console.log("[AutoSov] Background Sync registado.");
    } else {
      for (const op of pending) {
        await AutoSovDB.markSynced(op.queueId);
      }
      await AutoSovDB.clearSyncedOperations();
      console.log("[AutoSov] Fila de sync processada (modo fallback).");
    }
  } catch (e) {
    console.warn("[AutoSov] Erro ao drenar fila de sync:", e);
  }
}


//  ACÇÕES DO UTILIZADOR
// ─────────────────────────────────────────────

async function triggerRelapse() {
  const confirmed = await NotificationSystem.confirm(
    "Confirmar Recaída?",
    "Sua sequência voltará a zero e a penalidade será aplicada. Tens a certeza?",
    "relapse"
  );
  const penality = [
    "30 Flexões ou Banho Frio AGORA! Não negocie com o erro. Volta ao jogo!",
    "VOCE NAO PODE SE ACOSTUMAR COM O ERRO",
    "1 vez é normal, mais que isso vira rotina",
    "1 minutos de cardio imediato. Energia mal usada vira energia que treina.",
    "Sem redes sociais por 2h. Você escolheu foco ou distração?",
    "Escreva 1 página sobre seus objetivos e leia em voz alta.",
    "Acordar 1 hora mais cedo amanhã. Disciplina tem preço.",
    "Sem açúcar hoje. Controle começa nas pequenas escolhas.",
    "Estudo ou treino dobrado hoje. Compense com ação.",
    "Meditação obrigatória por 5 minutos. Controle mental é prioridade.",
    "Revise suas metas. Quem você quer ser de verdade?",
    "coclua uma meta Hoje", "trace 3 metas obrigatorias pra essa semana "
  ];
  let relapse = penality[Math.floor(Math.random() * penality.length)]

  if (confirmed) {
    const today = getTodayKey()
    sfx.fail.play();
    NotificationSystem.hapticFeedback("error");
    data.relapses.push({
      date: new Date().toLocaleString(),
      streak: Math.floor((Date.now() - data.startTime) / 86400000)
    });
    data.dailyRecords[today].relapseTimes.push(
      new Date().toLocaleString()
    )
    data.startTime = Date.now();



    await NotificationSystem.alert(
      "PENALIDADE APLICADA",
      relapse, "relapse"
    );

    if (typeof renderRelapses === "function") renderRelapses();
    renderStatsTab();
    generateRelief();
    updateChart();
    save();
    update();
  }
}
function generateRelief() {
  const container = document.getElementById("relief-dates");
  if (!container) return;
  container.innerHTML = "";

  if (!data.startTime) {
    container.innerHTML = `<p class="empty-message">Inicie sua jornada para ver o calendário de alívio.</p>`;
    return;
  }

  const intervals = [4, 3, 4, 3, 7, 7, 14, 14, 30, 30];
  let current = new Date(data.startTime);
  current.setHours(0, 0, 0, 0);  

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  intervals.forEach((gap, i) => {
    const prevDate = new Date(current);

    current.setDate(current.getDate() + gap);

    while (current.getDay() !== 3 && current.getDay() !== 6) {
      current.setDate(current.getDate() + 1);
    }


    const phaseDate = new Date(current);

    const isPassed = phaseDate <= now;

    const hasFailed = data.relapses.some(r => {
      const rDate = new Date(r.date);
      rDate.setHours(0, 0, 0, 0);
      return rDate > prevDate && rDate <= phaseDate;
    });

    const phaseClass = !isPassed
      ? "phase-future"
      : (hasFailed ? "phase-failed" : "phase-success");

    const statusIcon = !isPassed ? "○" : (hasFailed ? "✕" : "✓");

    container.innerHTML += `
      <div class="list-item relief-phase ${phaseClass}">
        <span class="phase-text">
          Fase ${i + 1}: 
          ${phaseDate.toLocaleDateString("pt-br", { day: "2-digit", month: "2-digit" })} 
          (${phaseDate.toLocaleDateString("pt-br", { weekday: "short" })})
        </span>
        <span class="phase-icon">${statusIcon}</span>
      </div>`;
  });



}

function getDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

let showFullCalendar = false;

function renderCalendar() {
  const container = document.getElementById("calendar-container");
  if (!container) return;
  container.innerHTML = "";

  const startDate = new Date(data.startTime);
  const endDate = new Date(data.startTime);
  const intervals = [4, 4, 4, 4, 7, 7, 14, 14, 30, 30];  
  let phaseEnd = new Date(startDate);

  intervals.forEach(gap => {
    phaseEnd.setDate(phaseEnd.getDate() + gap);
    while (phaseEnd.getDay() !== 3 && phaseEnd.getDay() !== 6) {
      phaseEnd.setDate(phaseEnd.getDate() + 1);
    }
  });
  endDate.setTime(phaseEnd.getTime() + 7 * 86400000);

  const monthsToShow = showFullCalendar
    ? getMonthsBetween(startDate, endDate)
    : [new Date()];  

  monthsToShow.forEach(monthDate => {
    const monthDiv = document.createElement("div");
    monthDiv.className = "calendar-month";

    const monthTitle = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    monthDiv.innerHTML = `<h4>${monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)}</h4>`;

    const grid = document.createElement("div");
    grid.className = "calendar-grid";
 
    ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach(day => {
      const header = document.createElement("div");
      header.className = "calendar-day header";
      header.textContent = day;
      grid.appendChild(header);
    });

     
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    let weekday = firstDay.getDay();
    for (let i = 0; i < weekday; i++) {
      grid.appendChild(document.createElement("div"));
    }

    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const dayDiv = document.createElement("div");
      dayDiv.className = "calendar-day";

      const isAllowed = date.getDay() === 3 || date.getDay() === 6;
      if (isAllowed) dayDiv.classList.add("allowed");

      const isPast = date < new Date().setHours(0, 0, 0, 0);
      const isFuture = date > new Date();

      const key = getDateKey(date);
      const dataDay = data.dailyRecords[key];

      const checkinThatDay = !!dataDay?.checkinTime;
      const hasRelapse = dataDay?.relapseTimes?.length > 0;

      if (isPast) {
        if (hasRelapse) {
          dayDiv.classList.add("passed-failed");
          dayDiv.innerHTML = `<div class="day-number">${day}</div><div class="status-icon">✗</div>`;
          dayDiv.style.background = "rgba(206, 2, 2, 0.2)";
        } else if (checkinThatDay || isAllowed) { 
          dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
          if (isAllowed) dayDiv.classList.add("future");
          if (checkinThatDay) {
            dayDiv.classList.add("passed-success");
            dayDiv.innerHTML = `<div class="day-number">${day}</div><div class="status-icon">✓</div>`;
          }
        } else {
          dayDiv.style.background = "rgba(128,128,128,0.2)";
          dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
        }
      } else if (isFuture) {
        dayDiv.classList.add("future");
        dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
      } else {
        dayDiv.classList.add("today")
        dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
      }

      dayDiv.onclick = () => showDayDetails(date);

      grid.appendChild(dayDiv);
    }

    monthDiv.appendChild(grid);
    container.appendChild(monthDiv);
  });
}

function getMonthsBetween(start, end) {
  const months = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function showDayDetails(date) {
  const detailsDiv = document.getElementById("day-details");
  const title = document.getElementById("day-title");
  const stats = document.getElementById("day-stats");


  title.textContent = date.toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const statsObj = getDetailedStats();
  const isAllowed = date.getDay() === 3 || date.getDay() === 6;
  const key = getDateKey(date);
  const day = data.dailyRecords[key];
  const b = getDateKey(date);




  const checkinDay = !!day?.checkinTime;
  const hasRelapse = day?.relapseTimes?.length > 0;
  const checkinStreak = updateStreak(b);
  
  stats.innerHTML = `
    <div class="list-item"><span>Status</span><b style="color: ${hasRelapse ? '#ff4d4d' : (checkinDay || isAllowed ? '#27ae60' : '#888')}">
      ${hasRelapse ? 'Recaída' : (checkinDay ? 'Check-in feito' : (isAllowed ? 'Permitido' : 'Não verificado'))}
    </b></div>
    <div class="list-item"><span>Horas desde início</span><b>${statsObj.totalHours.toLocaleString()} h</b></div>
    <div class="list-item"><span>Streak de Checkins no Dia</span><b>${checkinStreak} </b></div>
    ${checkinDay ? '<div class="list-item"><span>Check-in</span><b style="color:#27ae60">✓ Feito às ' + new Date(day.checkinTime).toLocaleTimeString("pt-BR") + '</b></div>' : ''}
  `;

  detailsDiv.style.display = 'block';
  detailsDiv.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("toggle-full-calendar")?.addEventListener("click", () => {
  showFullCalendar = !showFullCalendar;
  document.getElementById("toggle-full-calendar").textContent = showFullCalendar ? "Ver Apenas Mês Atual" : "Ver Completo";
  renderCalendar();
});

function renderMonthCalendar(container, monthStart, journeyStart, allowedDates, journeyEnd) {
  const monthDiv = document.createElement("div");
  monthDiv.className = "calendar-month";
  monthDiv.textContent = monthStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  container.appendChild(monthDiv);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach(day => {
    const header = document.createElement("div");
    header.className = "calendar-day weekday-header";
    header.textContent = day;
    grid.appendChild(header);
  });

  const firstDay = new Date(monthStart);
  const dayOfWeek = firstDay.getDay();  

  for (let i = 0; i < dayOfWeek; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day";
    grid.appendChild(empty);
  }

  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
    date.setHours(0, 0, 0, 0);

    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";

    const numberSpan = document.createElement("span");
    numberSpan.className = "day-number";
    numberSpan.textContent = d;
    dayDiv.appendChild(numberSpan);

    const isAllowed = allowedDates.some(allowed => allowed.toDateString() === date.toDateString());

    if (isAllowed) {
      dayDiv.classList.add("allowed");

      const isPast = date < today;
      const isToday = date.toDateString() === today.toDateString();
      const hasRelapseInInterval = data.relapses.some(r => {
        const rDate = new Date(r.date);
        rDate.setHours(0, 0, 0, 0);
        return rDate.getTime() === date.getTime();
      });

      if (isToday) {
        dayDiv.classList.add("today");
      }

      if (isPast) {
        if (hasRelapseInInterval) {
          dayDiv.classList.add("passed-failed");
          dayDiv.title = "Recaída neste dia permitido";
        } else {
          dayDiv.classList.add("passed-success");
          dayDiv.title = "Dia permitido concluído sem recaída";
        }
      } else {
        dayDiv.classList.add("future");
        dayDiv.title = "Próximo dia permitido";
      }
    }

    if (date < journeyStart) {
      dayDiv.style.opacity = "0.4";
    }

    grid.appendChild(dayDiv);
  }

  container.appendChild(grid);
}

function updateStreak(today = new Date()) {
  const records = data.dailyRecords;

  let streak = 0;
  const date = new Date(today);

  for (let i = 0; i < 365; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() - i);

    const key = getLocalDateKey(d);
    const record = records[key];

    const hasCheckin = record?.checkinTime != null;
    const hasRelapse = record?.relapseTimes?.length > 0;

    if (hasCheckin && !hasRelapse) {
      streak++;
    } else {
      break; 
    }
  }

  if (streak > data.bestStreak) {
    data.bestStreak = streak;
  }

  return streak;
}
function getLocalDateKey(date) {
  const d = new Date(date);
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function updateProgressBar() {
  const now = Date.now();
  const totalMs = now - data.startTime;
  const currentDays = totalMs / 86400000;  
  let nextLevel = levels.find(l => l.day > currentDays);
  if (!nextLevel) nextLevel = levels[levels.length - 1];
  let progressPercent = (currentDays / nextLevel.day) * 100;
  progressPercent = Math.min(100, progressPercent);

  const progressBar = document.getElementById("progress-bar");
  const nextLevelName = document.getElementById("next-level-name");
  const progressText = document.getElementById("progress-text");

  if (!progressBar || !nextLevelName || !progressText) return;

  nextLevelName.textContent = nextLevel.label;

  if (nextLevel.day === 90) {
    progressBar.classList.add("gold");
  } else {
    progressBar.classList.remove("gold");
  }
  progressBar.style.width = `${progressPercent}%`;
  
  const daysLeft = nextLevel.day - currentDays;
  const daysLeftFormatted = daysLeft > 1 
    ? Math.ceil(daysLeft) + " dias" 
    : (daysLeft * 24).toFixed(0) + " horas";

  progressText.innerHTML = daysLeft > 0 
    ? `Faltam <strong>${daysLeftFormatted}</strong> para o próximo nível` 
    : `<strong>Você alcançou o nível máximo!</strong>`;
}


function renderStatsTab() {
  const stats = getDetailedStats();
  const performanceDiv = document.getElementById("perfomance-analysis");
  const historyDiv = document.getElementById("relapse-history");
  const levelsDiv = document.getElementById("levels-card")
  if (!performanceDiv || !historyDiv) return;


  performanceDiv.innerHTML = `
    <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
      <div class="stat-card" style="background: rgba(39,174,96,0.08); padding: 16px; border-radius: 12px; text-align: center;">
        <div style="font-size: 0.9rem; opacity: 0.8;">Total desde o início</div>
        <div style="font-size: 1.8rem; font-weight: bold; color: var(--primary-color);">
          ${stats.totalHours.toLocaleString()} h
        </div>
        <div style="font-size: 0.85rem; opacity: 0.7;">(${stats.totalDays} dias)</div>
      </div>

      <div class="stat-card" style="background: rgba(52,152,219,0.08); padding: 16px; border-radius: 12px; text-align: center;">
        <div style="font-size: 0.9rem; opacity: 0.8;">Média sem recair</div>
        <div style="font-size: 1.8rem; font-weight: bold; color: var(--primary-color);">
          ${stats.avgStreakHours} h
        </div>
        <div style="font-size: 0.85rem; opacity: 0.7;">(${stats.avgStreakDays} dias)</div>
      </div>
     <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">Próximo Nível</span>
        <span id="next-level-name" class="next-level">Homem de Ouro</span>
      </div>
      
      <div class="progress-bar-container">
        <div id="progress-bar" class="progress-bar"></div>
      </div>
      
      <div class="progress-info">
        <span id="progress-text">Faltam <strong>23 dias</strong> para o próximo nível</span>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Média de Streak</div>
        <div class="stat-value sucess">${stats.avgStreak}d</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Dia Crítico</div>
        <div class="stat-value fail" style="font-size:1.2rem">${stats.worstDay}</div>
      </div>
    </div>

    

    <div class="best-level-card">
      <div class="best-level-title">MELHOR NÍVEL ALCANÇADO</div>
      <div class="best-level-name">${stats.bestLevel.label}</div>
      <button class="btn-levels" onclick="toggleLevelsOverlay(true)">Ver todos os níveis</button>
    </div>


    <div class="list-item"><span>Sequência Atual</span><b style="color: var(--primary-color);">${stats.currentStreak}d</b></div>

    <div class="list-item"><span>Recaídas totais</span><b style="color: #ff4d4d;">${stats.totalRelapses}</b></div>
    <div class="list-item"><span>Melhor sequência</span><b style="color: var(--primary-color);">${stats.bestStreak}d</b></div>
    <div class="list-item"><span>Taxa de vitória</span><b style="color: #27ae60;">${stats.victoryRate}%</b></div>
    <div class="list-item"><span>Dias sem recaída</span><b style="color: #27ae60;">${stats.successDaysRate}%</b></div>
  `;

  historyDiv.innerHTML = `
    <h4 style="margin: 24px 0 12px 0; font-weight: 600;">Últimas 10 Recaídas</h4>
    ${stats.last10.length > 0
      ? stats.last10.map(r => `
          <div class="list-item" style="border-left: 4px solid #ff4d4d; padding-left: 12px; margin-bottom: 8px; font-size: 0.9rem;">
            <span style="opacity: 0.9;">${r.date}</span>
            <b style="color: #ff4d4d;">${r.streak}d</b>
          </div>
        `).join("")
      : "<p style='text-align:center; opacity:0.6; margin: 20px 0;'>Nenhuma recaída registada ainda. Continua firme!</p>"
    }
  `;

}

function renderLevels() {
  const container = document.getElementById("levels-list"); // 
  if (!container) return;
  container.innerHTML = "";

  const currentDays = Math.floor((Date.now() - data.startTime) / 86400000);

  levels
    .sort((a, b) => a.day - b.day)
    .forEach(level => {
      const reached = currentDays >= level.day;
      const div = document.createElement("div");
      div.className = "levels-card";

      if (level.day === 90) {
        div.classList.add("final-level");
      } else {
        div.style.borderLeft = `4px solid ${level.color}`;
        div.style.opacity = reached ? "1" : "0.55";
      }

      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:bold;">${level.label}</span>
          <span>${level.day}d</span>
        </div>
        <div style="font-size:0.85rem; opacity:0.85; margin-top: 4px;">
          ${reached ? "✓ Alcançado" : "Bloqueado"}
        </div>
      `;

      container.appendChild(div);
    });
}

function toggleLevelsOverlay(show) {
  const overlay = document.getElementById("levels-overlay");
  if (!overlay) return;

  if (show) {
    overlay.classList.add("active");
    overlay.classList.remove("closing");
    renderLevels()
  } else {
    overlay.classList.add("closing");

    setTimeout(() => {
      overlay.classList.remove("active");
      overlay.classList.remove("closing");
    }, 300);
  }
}




let activeGoalId = null;
function addGoal() {
  const nameInput = document.getElementById("g-name");
  const daysInput = document.getElementById("g-days");
  const name = nameInput.value;
  const days = parseInt(daysInput.value);
  const goalType = document.getElementById("chkType").value;

  const verifyTasks = data.goals
  .find(g => {
    if(name == g.name && goalType == g.type) return true
    return false
  })
  
  if (name && days && !verifyTasks) {
    
    data.goals.push({ name, days, id: Date.now(),type:goalType,createdAt: Date.now() });
    sfx.success.play();
    NotificationSystem.success("Meta Criada!", `${name} em ${days} dias`, 3000);
    NotificationSystem.hapticFeedback("success");
    renderGoals();
    nameInput.value = "";
    daysInput.value = "";
    save();
  }else if(verifyTasks){
    NotificationSystem.warning("não foi possivel salvar", `${name}, mude o nome`, 3000);
    NotificationSystem.hapticFeedback("warning");
  } 
  else {
    NotificationSystem.warning("Campos Vazios", "Preenche o nome e os dias da meta.", 2000);
    NotificationSystem.hapticFeedback("warning");
  }
}
function deleteGoal(id) {
  data.goals = data.goals.filter(g => g.id !== id);
  save();
  renderGoals();

  NotificationSystem.success("Meta Removida", "Meta eliminada com sucesso.", 2000);
  NotificationSystem.hapticFeedback("success");
}

function renderGoals() {
  const div = document.getElementById("custom-goals");
  
  div.innerHTML = data.goals.map(g => {
    let currentDays = 0;

        if (g.type === "streak") {
            currentDays = Math.floor(
                (Date.now() - data.startTime) / 86400000
            );

        }

        else if (g.type === "habits") {

            currentDays = Math.floor(
                (Date.now() - g.createdAt) / 86400000
            );

        }

        const completed = currentDays >= g.days;
    
    
    return `
  <div class="card"
       onclick="toggleGoal(${g.id})"
       style="text-align:left; position:relative; cursor:pointer">

    <div style="display:flex; justify-content:space-between; align-items:center">
      
      <strong class="${completed ? "completed" : ""}">
            <span 
              class="goal-indicator ${g.type}"
              aria-label="${g.type}"
            ></span>
          ${g.name}
      </strong>

      <div class="days-wrapper">
        <span class="days ${activeGoalId === g.id ? "move-left" : ""}">
          ${currentDays}/${g.days}d
        </span>
      </div>

    </div>

    <button 
      class="delete-btn ${activeGoalId === g.id ? "show" : ""}"
      onclick="event.stopPropagation(); deleteGoal(${g.id})">
      ✕
    </button>
  </div>
`}).join("");
}
function toggleGoal(id) {
  const delBtn = document.querySelector(".delete-btn")
  delBtn.classList.add("show")
  activeGoalId = activeGoalId === id ? null : id;
  if (navigator.vibrate) {
    navigator.vibrate(15);
  }
  renderGoals();
}


function renderRelapses() {
  const div = document.getElementById("relapse-history");
  if (!div) return;
  div.innerHTML = "<h4>Histórico</h4>" +
    data.relapses
      .map(r => `<div>&#x274C; ${r.date} (Durou ${r.streak} dias)</div>`)
      .reverse()
      .slice(0, 5)
      .join("");
}

function openTab(id) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");

  const btn = document.getElementById(id + "-btn");
  if (btn) btn.classList.add("active");

  if (id === "relief") {
    generateRelief();
    renderCalendar();
  }
  if (id === "stats") renderStatsTab();
}
function toggleTheme() {
  const b = document.body;
  b.getAttribute("data-theme") === "dark"
    ? b.removeAttribute("data-theme")
    : b.setAttribute("data-theme", "dark");
  localStorage.setItem("theme", b.getAttribute("data-theme") || "light");

  if (b.getAttribute("data-theme") === "dark") {
    const bestLevelCard = document.querySelector(".best-level-card")
    bestLevelCard.classList.add("BL-card")
  } else {
    const bestLevelCard = document.querySelector(".best-level-card")
    bestLevelCard.classList.remove("BL-card")
  }
}

function triggerSOS() {
  document.body.style.backgroundColor = "#ff0000";
  sfx.fail.play();
  NotificationSystem.hapticFeedback("error");

  const conselhos = [
    "LARGUE O DISPOSITIVO AGORA!", "PRECISA SE DISTRAIR",
    "VÁ PARA ONDE HÁ PESSOAS.",
    "FAÇA 20 FLEXÕES OU 1 MIN DE PRANCHA.",
    "ISSO É APENAS UM IMPULSO QUÍMICO, ELE VAI PASSAR EM 10 MINUTOS.",
    "BOM VER QUE NAO GOSTA DE ERRAR", "SEU EU HOJE SOFRE,O DE AMANHHA SE ALEGRA"
  ];

  const conselho = conselhos[Math.floor(Math.random() * conselhos.length)];

  setTimeout(async () => {
    await NotificationSystem.alert(
      "🔥 PROTOCOLO DE EMERGÊNCIA",
      conselho,
      "sos"
    );
    document.body.style.backgroundColor = "";
  }, 100);
}

//  SISTEMA DE TAREFAS
// ─────────────────────────────────────────────
async function renderTasks() {
  const tasks = await TaskManager.getTasks();
  const list = document.getElementById("taskList");
  if (!list) return;

  list.innerHTML = "";

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  if (pending.length > 0) {
    const pendingSection = document.createElement("div");
    pendingSection.style.marginBottom = "15px";
    pendingSection.innerHTML = "<small style='opacity:0.6; font-weight:bold;'>PENDENTES</small>";
    list.appendChild(pendingSection);

    pending.forEach(task => {
      const li = _createTaskElement(task);
      list.appendChild(li);
    });
  }

  if (completed.length > 0) {
    const completedSection = document.createElement("div");
    completedSection.style.marginTop = "20px";
    completedSection.style.marginBottom = "15px";
    completedSection.innerHTML = "<small style='opacity:0.6; font-weight:bold;'>CONCLUÍDAS (auto-remove em 24h)</small>";
    list.appendChild(completedSection);

    completed.forEach(task => {
      const li = _createTaskElement(task);
      list.appendChild(li);
    });
  }

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.style.textAlign = "center";
    empty.style.opacity = "0.5";
    empty.innerHTML = "Nenhuma tarefa — Adicione uma para começar!";
    list.appendChild(empty);
  }
}

function _createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "list-item";
  li.style.justifyContent = "space-between";
  li.style.display = "flex";
  li.style.alignItems = "center";
  li.style.padding = "10px";
  li.style.marginBottom = "8px";
  li.style.borderRadius = "6px";
  li.style.backgroundColor = task.completed ? "rgba(39, 174, 96, 0.1)" : "rgba(52, 152, 219, 0.05)";
  li.style.borderLeft = task.completed ? "4px solid #27ae60" : "4px solid #3498db";

  const titleSpan = document.createElement("span");
  titleSpan.style.flex = "1";
  titleSpan.style.textDecoration = task.completed ? "line-through" : "none";
  titleSpan.style.opacity = task.completed ? "0.6" : "1";
  titleSpan.innerText = task.title;

  const btnContainer = document.createElement("div");
  btnContainer.style.display = "flex";
  btnContainer.style.gap = "8px";

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "btn-task";
  toggleBtn.style.padding = "6px 10px";
  toggleBtn.style.fontSize = "0.85rem";
  toggleBtn.style.border = "1px solid #27ae60";
  toggleBtn.style.borderRadius = "4px";
  toggleBtn.style.backgroundColor = task.completed ? "#27ae60" : "transparent";
  toggleBtn.style.color = task.completed ? "white" : "#27ae60";
  toggleBtn.style.cursor = "pointer";
  toggleBtn.style.fontWeight = "bold";
  toggleBtn.innerText = task.completed ? "✓" : "○";

  toggleBtn.addEventListener("click", async () => {
    if (task.completed) {
      await TaskManager.uncompleteTask(task.id);
      NotificationSystem.info("Tarefa Reaberta", task.title, 2000);
    } else {
      await TaskManager.completeTask(task.id);
      NotificationSystem.success("Tarefa Concluída!", task.title, 2000);
    }
    renderTasks();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-del";
  deleteBtn.style.padding = "6px 10px";
  deleteBtn.style.fontSize = "0.85rem";
  deleteBtn.style.border = "1px solid #e74c3c";
  deleteBtn.style.borderRadius = "4px";
  deleteBtn.style.backgroundColor = "transparent";
  deleteBtn.style.color = "#e74c3c";
  deleteBtn.style.cursor = "pointer";
  deleteBtn.style.fontWeight = "bold";
  deleteBtn.innerText = "✕";

  deleteBtn.addEventListener("click", async () => {
    const confirmed = await NotificationSystem.confirm("Eliminar Tarefa?", `Tens a certeza que queres eliminar "${task.title}"?`);
    if (confirmed) {
      await TaskManager.deleteTask(task.id);
      NotificationSystem.success("Tarefa Eliminada", task.title, 2000);
      renderTasks();
    }
  });

  btnContainer.appendChild(toggleBtn);
  btnContainer.appendChild(deleteBtn);

  li.appendChild(titleSpan);
  li.appendChild(btnContainer);

  return li;
}

//  INICIALIZAÇÃO — ponto único de entrada
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await AutoSovDB.init();
    console.log("[AutoSov] Base de dados pronta.");

    data = await AutoSovDB.loadAppData();
    console.log("[AutoSov] Dados carregados:", data);

    if (!data.dailyRecords) data.dailyRecords = {};
    if (!data.tasks) data.tasks = {};

    if (localStorage.getItem("theme") === "dark") {
      document.body.setAttribute("data-theme", "dark");
    }

    let chart; // 
    function initDynamicChart() {
      const ctx = document.getElementById("evolutionChart").getContext("2d");

      const today = new Date();
      const labels = [];
      const progressData = [];
      const relapseMarkers = [];

      const daysSinceStart = Math.floor((Date.now() - data.startTime) / 86400000);
      const maxDays = Math.min(90, daysSinceStart + 10);

      for (let i = maxDays; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));

        const daysToThatPoint = maxDays - i;
        const progress = Math.min(100, daysToThatPoint * (100 / (daysSinceStart + 1)));
        progressData.push(progress);
      }

      data.relapses.forEach(r => {
        const relapseDate = new Date(r.date.split(',')[0]); // 
        const daysAgo = Math.floor((today - relapseDate) / 86400000);
        if (daysAgo <= maxDays) {
          const xIndex = maxDays - daysAgo;
          relapseMarkers.push({
            x: labels[xIndex],
            y: 5, //
            title: `Recaída após ${r.streak} dias`
          });
        }
      });

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Seu Autodomínio',
              data: progressData,
              borderColor: '#27ae60',
              backgroundColor: 'rgba(39,174,96,0.12)',
              fill: true,
              tension: 0.3,
              pointRadius: 0, 
              borderWidth: 3
            },
            {
              type: 'scatter',
              label: 'Recaídas',
              data: relapseMarkers,
              backgroundColor: '#ff4d4d',
              pointRadius: 8,
              pointHoverRadius: 12,
              pointStyle: 'crossRot',
              borderColor: '#c0392b',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  if (ctx.dataset.label === 'Recaídas') return ctx.raw.title;
                  return `Nível: ${Math.round(ctx.parsed.y)}%`;
                }
              }
            }
          },
          scales: {
            x: { title: { display: true, text: 'Dias Recentes' } },
            y: { min: 0, max: 100, title: { display: true, text: 'Progresso %' } }
          },
          animation: { duration: 800 }
        }
      });
      updateCheckinStatus();
    }

    function updateChart() {
      if (chart) chart.destroy();
      initDynamicChart();
    }
    updateChart()


    const form = document.getElementById("taskForm");
    const input = document.getElementById("taskInput");

    if (form && input) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (input.value.trim() !== "") {
          const taskTitle = input.value;
          await TaskManager.addTask(taskTitle);
          NotificationSystem.success("Tarefa Adicionada", taskTitle, 2000);
          NotificationSystem.hapticFeedback("success");
          input.value = "";
          renderTasks();
        } else {
          NotificationSystem.warning("Campo Vazio", "Escreve uma tarefa para adicionar.", 2000);
          NotificationSystem.hapticFeedback("warning");
        }
      });
    }


    update();
    renderGoals();
    renderRelapses();
    renderTasks();
    renderCalendar();

    setInterval(update, 1000);
    setInterval(() => {
      const el = document.getElementById("phrase");
      if (el) el.innerText = phrases[Math.floor(Math.random() * phrases.length)];
    }, 15000);


    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js")
        .then(reg => {
          console.log("[AutoSov] Service Worker registado:", reg.scope);
        })
        .catch(err => {
          console.warn("[AutoSov] Falha ao registar Service Worker:", err);
        });
    }
    if (navigator.onLine) {
      await _drainSyncQueue();
    }

  } catch (error) {
    console.error("[AutoSov] Falha crítica na inicialização:", error);
  }
  renderStatsTab();
});
// BUTTONS 
const addGoalBtn = document.getElementById("add-goal")
addGoalBtn.addEventListener("click", addGoal)//190 

const homeBtn = document.getElementById("home-btn")
const statsBtn = document.getElementById("stats-btn")
const reliefBtn = document.getElementById("relief-btn")
const goalsBtn = document.getElementById("goals-btn")
homeBtn.addEventListener("click", () => {
  openTab('home')
  console.log(data)
})//586
statsBtn.addEventListener("click", () => { openTab('stats') })//235
reliefBtn.addEventListener("click", () => { openTab('relief') })//235
goalsBtn.addEventListener("click", () => { openTab('goals') })//235

const btnTheme = document.getElementById("btn-theme")
btnTheme.addEventListener("click", () => { toggleTheme(), updateCheckinStatus() }) //242

const resetBtn = document.getElementById("btn-reset")
resetBtn.addEventListener("click", triggerRelapse)

const sosBtn = document.getElementById("btn-sos")
sosBtn.addEventListener("click", triggerSOS)

const checkinBtn = document.getElementById('daily-checkin-btn');
const statusEl = document.getElementById('checkin-status');



const customSelect = document.getElementById("goalTypeSelect");
const trigger = customSelect.querySelector(".select-trigger");
const options = customSelect.querySelectorAll(".select-option");
const selectedText = document.getElementById("selected-goal-type");
const hiddenInput = document.getElementById("chkType");

trigger.addEventListener("click", () => {
    customSelect.classList.toggle("open");
});

options.forEach(option => {
    option.addEventListener("click", () => {
        options.forEach(o => {
            o.classList.remove("active");
        });
        option.classList.add("active");
        hiddenInput.value = option.dataset.value;
        selectedText.textContent = option.textContent;
        customSelect.classList.remove("open");
    });

});

document.addEventListener("click", (e) => {

    if (!customSelect.contains(e.target)) {
        customSelect.classList.remove("open");
    }
    const type = document.getElementById("chkType").value;
        
    } 
    
);


function isAfter1800() {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 11;
}

function updateCheckinStatus() {

  const btn = document.getElementById("daily-checkin-btn");
  const statusEl = document.getElementById("checkin-status");
  const statusBox = document.querySelector(".daily-checkin")
  if (!btn || !statusEl) return;

  const today = getTodayKey();
  //"2026-04-24" recaiu
  const day = data.dailyRecords[today];

  const hasCheckinToday = day && day.checkinTime;
  const hasRelapse = day && day.relapseTimes.length > 0;

  const b = document.body;
  if (hasRelapse) {
    statusEl.textContent = "Recaída registrada hoje ⚠";
    btn.style.display = "none";
    if (b.getAttribute("data-theme") === "dark") {
      statusBox.style.color = "rgb(255, 138, 128)"
      statusBox.style.background = "rgba(255, 82, 82, 0.1)"
      statusBox.style.border = "1px solid rgba(255, 82, 82, 0.3)"
      statusEl.classList.remove("fail");
      statusBox.classList.remove("daily-checkin-fail")

    }
    else {
      statusEl.className = "fail";
      statusBox.classList.add("daily-checkin-fail");
    }

  } else {
    if (hasCheckinToday) {
      statusEl.textContent = "Check-in realizado hoje ✓";
      statusEl.className = "success";
      btn.style.display = "none";
      return;
    }

    // se não fez hoje
    if (isAfter1800()) {
      statusEl.textContent = "Finalize o dia com vitória ✓";
      btn.style.display = "block";
      statusEl.classList.remove("fail");
      statusBox.classList.remove("daily-checkin-fail")

    } else {
      statusEl.textContent = "Check-in disponível após 18:00";
      statusEl.classList.add("early-message")
      btn.style.display = "none";
      console.log(statusBox);

    }

  }



}


checkinBtn.addEventListener("click", async () => {
  if (!isAfter1800()) {
    NotificationSystem.warning(
      "Ainda cedo",
      "Check-in disponível apenas após 18:00",
      3000
    );
    return;
  }

  const today = getTodayKey();
  const day = performCheckin(today);

  if (day.checkinTime) {
    NotificationSystem.info(
      "Check-in já feito",
      "Hoje já registraste tua vitória.",
      2000
    );
    return;
  }


  day.checkinTime = Date.now()

  try {
    await save();
  } catch (e) {
    console.error(e);
  }
  updateCheckinStatus();
  



  if (typeof updateChart === "function") updateChart();
  if (typeof renderCalendar === "function") renderCalendar();

  NotificationSystem.success(
    "Dia vencido!",
    "Mais um passo na disciplina.",
    3000
  );
  await performCheckin();
});
//
updateCheckinStatus();

setInterval(() => {
  if (!isAfter1800()) updateCheckinStatus(); //
}, 60000);

// ultima troca
