
const NotificationSystem = (() => {

  
  function playHapticSound(type = "click") {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      switch (type) {
        case "click":
          // Som curto e discreto (200ms)
          const osc1 = audioContext.createOscillator();
          const gain1 = audioContext.createGain();
          osc1.connect(gain1);
          gain1.connect(audioContext.destination);
          osc1.frequency.value = 800;
          gain1.gain.setValueAtTime(0.05, now); // volume muito baixo
          gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc1.start(now);
          osc1.stop(now + 0.1);
          break;

        case "success":
          const notes = [523, 659, 784]; 
          const noteDuration = 0.1;
          notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.04, now + i * noteDuration);
            gain.gain.exponentialRampToValueAtTime(0.01, now + (i + 1) * noteDuration);
            osc.start(now + i * noteDuration);
            osc.stop(now + (i + 1) * noteDuration);
          });
          break;

        case "error":
          const osc3 = audioContext.createOscillator();
          const gain3 = audioContext.createGain();
          osc3.connect(gain3);
          gain3.connect(audioContext.destination);
          osc3.frequency.value = 300;
          gain3.gain.setValueAtTime(0.03, now);
          gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc3.start(now);
          osc3.stop(now + 0.15);
          break;

        case "warning":
          const osc4 = audioContext.createOscillator();
          const gain4 = audioContext.createGain();
          osc4.connect(gain4);
          gain4.connect(audioContext.destination);
          osc4.frequency.value = 600;
          gain4.gain.setValueAtTime(0.04, now);
          gain4.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc4.start(now);
          osc4.stop(now + 0.12);
          break;
      }
    } catch (e) {
      console.warn("[NotificationSystem] Erro ao reproduzir som haptic:", e);
    }
  }
  function vibrate(pattern = [10]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  function hapticFeedback(type = "click") {
    playHapticSound(type);
    switch (type) {
      case "click":
        vibrate([10]);
        break;
      case "success":
        vibrate([10, 20, 10]);
        break;
      case "error":
        vibrate([20, 10, 20]);
        break;
      case "warning":
        vibrate([15, 15]);
        break;
    }
  }

  // ─────────────────────────────────────────────
  //  NOTIFICAÇÕES TOAST
  // ─────────────────────────────────────────────

  /**
   * Exibe uma notificação toast (canto superior direito).
   * @param {string} type
   * @param {string} title 
   * @param {string} message 
   * @param {number} duration  
   */
  function showNotification(type = "info", title = "", message = "", duration = 4000) {
    const container = document.getElementById("notificationContainer");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    
    // Ícone
    const iconMap = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ"
    };

    const icon = document.createElement("div");
    icon.className = "notification-icon";
    icon.innerText = iconMap[type] || "•";

    // Conteúdo
    const content = document.createElement("div");
    content.className = "notification-content";

    const titleEl = document.createElement("p");
    titleEl.className = "notification-title";
    titleEl.innerText = title;
    content.appendChild(titleEl);

    if (message) {
      const messageEl = document.createElement("p");
      messageEl.className = "notification-message";
      messageEl.innerText = message;
      content.appendChild(messageEl);
    }

    // Botão fechar
    const closeBtn = document.createElement("button");
    closeBtn.className = "notification-close";
    closeBtn.innerText = "×";
    closeBtn.addEventListener("click", () => {
      notification.classList.add("removing");
      setTimeout(() => notification.remove(), 300);
    });

    notification.appendChild(icon);
    notification.appendChild(content);
    notification.appendChild(closeBtn);
    container.appendChild(notification);

    // Auto-remover após duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.classList.add("removing");
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }

    // Feedback tátil
    hapticFeedback(type);
  }

  //  DIÁLOGOS MODAIS
  // ─────────────────────────────────────────────
  /**
   * Exibe um diálogo modal com botões customizáveis.
   * @param {string} title
   * @param {string} message 
   * @param {Array} buttons
   * @param {string} alertType
   */
  function showDialog(title = "", message = "", buttons = [], alertType = "info") {
    return new Promise((resolve) => {
      const overlay = document.getElementById("dialogOverlay");
      const box = document.getElementById("dialogBox");
      const titleEl = document.getElementById("dialogTitle");
      const messageEl = document.getElementById("dialogMessage");
      const actionsEl = document.getElementById("dialogActions");

      if (!overlay || !box) return;

      // Define o tipo de alerta para estilização CSS
      box.setAttribute("data-alert-type", alertType);

      titleEl.innerText = title;
      messageEl.innerText = message;
      actionsEl.innerHTML = "";

      buttons.forEach((btn, index) => {
        const button = document.createElement("button");
        button.className = `btn-${btn.type || "secondary"}`;
        button.innerText = btn.label || "OK";

        button.addEventListener("click", () => {
          overlay.style.display = "none";
          box.style.display = "none";
          if (btn.callback) btn.callback();
          resolve(index);
          hapticFeedback("click");
        });

        actionsEl.appendChild(button);
      });

      overlay.style.display = "block";
      box.style.display = "block";
      hapticFeedback("info");

      // Fechar ao clicar no overlay
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.style.display = "none";
          box.style.display = "none";
          resolve(-1);
        }
      });
    });
  }

  /**
   * Diálogo de confirmação (OK/Cancelar).
   * @returns {Promise<boolean>} true se OK, false se Cancelar
   */
  async function confirm(title = "", message = "", alertType = "info") {
    const result = await showDialog(title, message, [
      { label: "Cancelar", type: "secondary" },
      { label: "Confirmar", type: "primary" }
    ], alertType);
    return result === 1;
  }

  /**
   * Diálogo de alerta (apenas OK).
   * @returns {Promise<void>}
   */
  async function alert(title = "", message = "", alertType = "info") {
    await showDialog(title, message, [
      { label: "OK", type: "primary" }
    ], alertType);
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────

  return {
    // Notificações
    showNotification,
    success: (title, message, duration) => showNotification("success", title, message, duration),
    error: (title, message, duration) => showNotification("error", title, message, duration),
    warning: (title, message, duration) => showNotification("warning", title, message, duration),
    info: (title, message, duration) => showNotification("info", title, message, duration),

    // Diálogos
    showDialog,
    confirm,
    alert,

    // Haptics
    hapticFeedback,
    playHapticSound,
    vibrate
  };

})();
