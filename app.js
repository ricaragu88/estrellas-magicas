/**
 * Los Emojis Mágicos - El Gran Alexander
 * Presentación interactiva de magia y mentalismo para Congreso Infantil
 */

(() => {
  // --- DOM Elements ---
  const slidesTrack = document.getElementById('slidesTrack');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots = Array.from(document.querySelectorAll('.dot'));
  const viewport = document.getElementById('viewport');
  const btnRestart = document.getElementById('btnRestart');

  // Secret Zones
  const zoneBack = document.getElementById('zoneBack');
  const zoneFullscreen = document.getElementById('zoneFullscreen');
  const zoneCheat = document.getElementById('zoneCheat');

  // Magician Drawer
  const cheatDrawer = document.getElementById('cheatDrawer');
  const btnCloseCheat = document.getElementById('btnCloseCheat');
  const baseToggles = Array.from(document.querySelectorAll('.btn-toggle-base'));
  const solverSumVal = document.getElementById('solverSumVal');
  const solverSymbol = document.getElementById('solverSymbol');
  const solverName = document.getElementById('solverName');
  const mnemItems = Array.from(document.querySelectorAll('.mnem-item'));

  // Reveal Slide Elements
  const telepathyGlow = document.getElementById('telepathyGlow');
  const revealSubtitle = document.getElementById('revealSubtitle');
  const defaultSubtitleText = 'Sé exactamente el emoji que has elegido';
  let peekTimer = null;

  let currentIndex = 0;
  const totalSlides = slides.length;

  // Strict transition lock to prevent double skipping
  let isNavigating = false;

  // Wake Lock reference to prevent screen dimming
  let wakeLock = null;

  // --- Mnemonic Dictionary (1 to 15) ---
  const MNEMONIC_DATA = {
    1: { emoji: '🕯️', name: 'Vela (Forma de 1)' },
    2: { emoji: '😍', name: 'Enamorado (2 ojos)' },
    3: { emoji: '😘', name: 'Beso (Labios de 3)' },
    4: { emoji: '🍀', name: 'Trébol (4 hojas)' },
    5: { emoji: '🖐️', name: 'Mano (5 dedos)' },
    6: { emoji: '🎲', name: 'Dado (6 caras)' },
    7: { emoji: '🎵', name: 'Nota Musical (7 notas)' },
    8: { emoji: '🐙', name: 'Pulpo (8 tentáculos)' },
    9: { emoji: '🎈', name: 'Globo (Silueta de 9)' },
    10: { emoji: '❌', name: 'Cruz (X en romanos = 10)' },
    11: { emoji: '⚽', name: 'Balón Fútbol (11 jugadores)' },
    12: { emoji: '🕒', name: 'Reloj (12 horas)' },
    13: { emoji: '💀', name: 'Calavera (Número 13 misterio)' },
    14: { emoji: '🌸', name: 'Flor (14 Febrero San Valentín)' },
    15: { emoji: '👱‍♀️', name: 'Quinceañera (15 años)' }
  };

  // --- Covert Dual-Input Mentalism Engine ---
  // Slide 2: Estrella 1 (Vela · Base 1)
  // Slide 3: Estrella 2 (Enamorado · Base 2)
  // Slide 4: Estrella 3 (Trébol · Base 4)
  // Slide 5: Estrella 4 (Pulpo · Base 8)
  const STAR_BASES = {
    2: 1,
    3: 2,
    4: 4,
    5: 8
  };
  let answers = { 1: false, 2: false, 4: false, 8: false };

  function registerStarAnswer(isYes) {
    if (STAR_BASES[currentIndex] !== undefined) {
      const base = STAR_BASES[currentIndex];
      answers[base] = isYes;
    }
  }

  function undoLastAnswer() {
    const prevIndex = currentIndex - 1;
    if (STAR_BASES[prevIndex] !== undefined) {
      const base = STAR_BASES[prevIndex];
      answers[base] = false;
    }
  }

  function getCalculatedSum() {
    let sum = 0;
    for (const [base, isYes] of Object.entries(answers)) {
      if (isYes) sum += parseInt(base, 10);
    }
    return sum;
  }

  // --- Slide Navigation ---
  function goToSlide(index) {
    if (isNavigating) return;
    isNavigating = true;
    setTimeout(() => { isNavigating = false; }, 420);

    if (index < 0) index = 0;
    if (index >= totalSlides) index = 0; // Loop back to start

    currentIndex = index;
    slidesTrack.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Reset answers if returning to Cover or Grid
    if (currentIndex === 0 || currentIndex === 1) {
      answers = { 1: false, 2: false, 4: false, 8: false };
      baseToggles.forEach(btn => btn.classList.remove('active'));
      updateBinarySolver();
      if (revealSubtitle) {
        clearTimeout(peekTimer);
        revealSubtitle.textContent = defaultSubtitleText;
        revealSubtitle.classList.remove('showing-peek');
      }
    }

    // Auto-sync solver when reaching reveal slide (6)
    if (currentIndex === 6) {
      baseToggles.forEach(btn => {
        const val = parseInt(btn.dataset.val, 10);
        btn.classList.toggle('active', !!answers[val]);
      });
      updateBinarySolver();
    }

    // Update active slide class
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentIndex);
    });

    // Update dots indicator
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function nextSlideWithAnswer(isYes) {
    registerStarAnswer(isYes);
    goToSlide(currentIndex + 1);
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    undoLastAnswer();
    goToSlide(currentIndex - 1);
  }

  // --- Request Screen Wake Lock ---
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake Lock skipped:', err);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestWakeLock();
    }
  });

  // --- Fullscreen Toggle ---
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen skipped:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // --- Cheat Sheet / Magician Copilot ---
  function openCheatSheet() {
    // Ensure solver is synced with latest answers
    baseToggles.forEach(btn => {
      const val = parseInt(btn.dataset.val, 10);
      btn.classList.toggle('active', !!answers[val]);
    });
    updateBinarySolver();

    cheatDrawer.classList.add('open');
    cheatDrawer.setAttribute('aria-hidden', 'false');
  }

  function closeCheatSheet() {
    cheatDrawer.classList.remove('open');
    cheatDrawer.setAttribute('aria-hidden', 'true');
  }

  function toggleCheatSheet() {
    if (cheatDrawer.classList.contains('open')) {
      closeCheatSheet();
    } else {
      openCheatSheet();
    }
  }

  // Live Binary Solver calculation
  function updateBinarySolver() {
    let sum = 0;
    baseToggles.forEach(btn => {
      if (btn.classList.contains('active')) {
        sum += parseInt(btn.dataset.val, 10);
      }
    });

    solverSumVal.textContent = sum;

    if (sum === 0) {
      solverSymbol.textContent = '❓';
      solverName.textContent = 'Ninguna tarjeta afirmativa';
    } else if (MNEMONIC_DATA[sum]) {
      solverSymbol.textContent = MNEMONIC_DATA[sum].emoji;
      solverName.textContent = MNEMONIC_DATA[sum].name;
    } else {
      solverSymbol.textContent = '⚠️';
      solverName.textContent = 'Fuera de rango (máx 15)';
    }

    // Highlight row in mnemonic list
    mnemItems.forEach(item => {
      const num = parseInt(item.dataset.num, 10);
      item.classList.toggle('highlighted', num === sum);
      if (num === sum) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  baseToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('active');
      const val = parseInt(btn.dataset.val, 10);
      answers[val] = btn.classList.contains('active');
      updateBinarySolver();
    });
  });

  // --- Secret Top Zones Listeners ---
  zoneBack.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    prevSlide();
  });

  zoneFullscreen.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });

  // Track multi-taps for Alex Magician / Admin access
  let cheatTapTimes = [];
  function recordCheatTap() {
    const now = Date.now();
    cheatTapTimes.push(now);
    cheatTapTimes = cheatTapTimes.filter(t => now - t <= 1800);

    if (cheatTapTimes.length >= 5) {
      cheatTapTimes = [];
      triggerAlexMagicianAccess();
      return true;
    }
    return false;
  }

  zoneCheat.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    const reachedFive = recordCheatTap();
    if (!reachedFive) {
      // Normal single tap opens/closes the assistant
      if (cheatTapTimes.length === 1) {
        toggleCheatSheet();
      }
    }
  });

  const drawerHeaderTitle = document.getElementById('drawerHeaderTitle');
  if (drawerHeaderTitle) {
    drawerHeaderTitle.addEventListener('click', (e) => {
      e.stopPropagation();
      recordCheatTap();
    });
  }

  btnCloseCheat.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCheatSheet();
  });

  // --- Covert On-Screen Peek on Slide 6 (Crystal Ball) ---
  if (telepathyGlow && revealSubtitle) {
    telepathyGlow.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentSum = getCalculatedSum();

      if (!isMagician()) {
        // In Spectator Mode: encourage using the assistant
        clearTimeout(peekTimer);
        revealSubtitle.textContent = '✨ ¡Mente Conectada! Abre el ayudante arriba para ver tu emoji.';
        peekTimer = setTimeout(() => {
          revealSubtitle.textContent = defaultSubtitleText;
        }, 3500);
        return;
      }

      // In Magician Mode: show covert peek
      if (revealSubtitle.classList.contains('showing-peek')) {
        // Toggle back off
        clearTimeout(peekTimer);
        revealSubtitle.textContent = defaultSubtitleText;
        revealSubtitle.classList.remove('showing-peek');
      } else {
        // Show covert peek
        revealSubtitle.classList.add('showing-peek');
        if (currentSum > 0 && MNEMONIC_DATA[currentSum]) {
          revealSubtitle.innerHTML = `<span style="color:var(--gold-accent); font-weight:800; font-size:1.15rem; text-shadow:0 0 12px rgba(245,196,67,0.5);">🔮 ${MNEMONIC_DATA[currentSum].emoji} ${MNEMONIC_DATA[currentSum].name}</span>`;
        } else {
          revealSubtitle.innerHTML = `<span style="color:#94a3b8; font-weight:600;">(Ninguna estrella afirmativa · 0)</span>`;
        }
        // Auto hide after 4.5 seconds
        clearTimeout(peekTimer);
        peekTimer = setTimeout(() => {
          revealSubtitle.textContent = defaultSubtitleText;
          revealSubtitle.classList.remove('showing-peek');
        }, 4500);
      }
    });
  }

  // --- UNIFIED POINTER EVENTS (Touch swipe & tap handler) ---
  let ptrStartX = 0;
  let ptrStartY = 0;
  let ptrCurrentX = 0;
  let ptrCurrentY = 0;
  let ptrStartTime = 0;
  let ptrMoved = false;
  let isPointerActive = false;

  viewport.addEventListener('pointerdown', (e) => {
    if (cheatDrawer.classList.contains('open')) return;
    if (e.target.closest('.secret-tap-zone') || e.target.closest('#btnRestart') || e.target.closest('#btnInstallApp') || e.target.closest('#telepathyGlow')) return;

    isPointerActive = true;
    ptrStartX = e.clientX;
    ptrStartY = e.clientY;
    ptrCurrentX = e.clientX;
    ptrCurrentY = e.clientY;
    ptrStartTime = Date.now();
    ptrMoved = false;

    try {
      viewport.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isPointerActive) return;
    ptrCurrentX = e.clientX;
    ptrCurrentY = e.clientY;
    if (Math.abs(ptrCurrentX - ptrStartX) > 8 || Math.abs(ptrCurrentY - ptrStartY) > 8) {
      ptrMoved = true;
    }
  });

  function handlePointerEnd(e) {
    if (!isPointerActive) return;
    isPointerActive = false;

    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (cheatDrawer.classList.contains('open')) return;
    if (e.target.closest('.secret-tap-zone') || e.target.closest('#btnRestart') || e.target.closest('#btnInstallApp') || e.target.closest('#telepathyGlow')) return;

    const endX = (typeof e.clientX === 'number' && e.clientX !== 0) ? e.clientX : ptrCurrentX;
    const endY = (typeof e.clientY === 'number' && e.clientY !== 0) ? e.clientY : ptrCurrentY;
    const deltaX = endX - ptrStartX;
    const deltaY = endY - ptrStartY;
    const deltaTime = Date.now() - ptrStartTime;

    // 1. Detect Swipe (Horizontal drag of 25px or more)
    if (Math.abs(deltaX) >= 25 && Math.abs(deltaX) >= Math.abs(deltaY) * 0.75) {
      if (deltaX < 0) {
        // Swiped left -> NEXT SLIDE
        // In the stars routine: SWIPING LEFT MEANS "NO" (+0)!
        nextSlideWithAnswer(false);
      } else {
        // Swiped right -> PREV SLIDE
        prevSlide();
      }
      return;
    }

    // 2. Detect Tap (minimal movement and quick release)
    if (!ptrMoved && deltaTime < 450) {
      if (ptrStartY > 75) {
        // Tapped screen -> NEXT SLIDE
        // In the stars routine: TAPPING MEANS "SÍ" (+Base)!
        nextSlideWithAnswer(true);
        requestWakeLock();
      }
    }
  }

  viewport.addEventListener('pointerup', handlePointerEnd);
  viewport.addEventListener('pointercancel', handlePointerEnd);

  // Restart Button on Slide 6
  if (btnRestart) {
    btnRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(1); // Go to grid for the next kid
    });
  }

  // Keyboard navigation for rehearsal on laptop/PC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      nextSlideWithAnswer(true); // Default tap = YES
    } else if (e.key === 's' || e.key === 'S' || e.key === 'y' || e.key === 'Y') {
      nextSlideWithAnswer(true); // SÍ (+Base)
    } else if (e.key === 'n' || e.key === 'N') {
      nextSlideWithAnswer(false); // NO (+0)
    } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
      prevSlide();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    } else if (e.key === 'c' || e.key === 'C') {
      toggleCheatSheet();
    } else if (e.key === 'Escape') {
      closeCheatSheet();
    }
  });

  // --- In-App Browser Detection (WhatsApp / Telegram) ---
  const ua = navigator.userAgent || '';
  const isInApp = /WhatsApp|Telegram|Instagram|FBAN|FBAV/i.test(ua);
  const inAppWarning = document.getElementById('inAppWarning');
  const btnCloseBanner = document.getElementById('btnCloseBanner');
  if (isInApp && inAppWarning) {
    inAppWarning.style.display = 'flex';
  }
  if (btnCloseBanner) {
    btnCloseBanner.addEventListener('click', (e) => {
      e.stopPropagation();
      inAppWarning.style.display = 'none';
    });
  }

  // --- In-App Install Prompt Handling ---
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const btnInstallApp = document.getElementById('btnInstallApp');
  const installModal = document.getElementById('installModal');
  const installStepsContent = document.getElementById('installStepsContent');
  const btnCloseInstallModal = document.getElementById('btnCloseInstallModal');
  let deferredPrompt = null;

  if (isStandalone && btnInstallApp) {
    btnInstallApp.style.display = 'none';
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!isStandalone && btnInstallApp) {
      btnInstallApp.style.display = 'inline-flex';
    }
  });

  function showInstallModal() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      installStepsContent.innerHTML = `
        <div class="install-steps">
          <div class="install-step-item">
            <span class="step-num">1</span>
            <span>Toca el botón <strong>Compartir</strong> <span style="font-size:1.1rem">⎋</span> (abajo en la barra de Safari).</span>
          </div>
          <div class="install-step-item">
            <span class="step-num">2</span>
            <span>Baja un poco y pulsa en <strong>«Añadir a la pantalla de inicio»</strong> ➕.</span>
          </div>
          <div class="install-step-item">
            <span class="step-num">3</span>
            <span>Pulsa en <strong>«Añadir»</strong> (arriba a la derecha en azul).</span>
          </div>
        </div>
      `;
    } else {
      installStepsContent.innerHTML = `
        <div class="install-steps">
          <div class="install-step-item">
            <span class="step-num">1</span>
            <span>Toca los <strong>tres puntos (⋮)</strong> en la esquina superior de Chrome.</span>
          </div>
          <div class="install-step-item">
            <span class="step-num">2</span>
            <span>Selecciona <strong>«Instalar aplicación»</strong> o <strong>«Añadir a pantalla de inicio»</strong>.</span>
          </div>
          <div class="install-step-item">
            <span class="step-num">💡</span>
            <span><em>En Xiaomi/Redmi: Concede el permiso en Ajustes > Aplicaciones > Chrome > Otros permisos > Accesos directos.</em></span>
          </div>
        </div>
      `;
    }
    installModal.style.display = 'flex';
    installModal.setAttribute('aria-hidden', 'false');
  }

  if (btnInstallApp) {
    btnInstallApp.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          btnInstallApp.style.display = 'none';
        }
        deferredPrompt = null;
      } else {
        showInstallModal();
      }
    });
  }

  if (btnCloseInstallModal) {
    btnCloseInstallModal.addEventListener('click', (e) => {
      e.stopPropagation();
      installModal.style.display = 'none';
      installModal.setAttribute('aria-hidden', 'true');
    });
  }

  if (installModal) {
    installModal.addEventListener('click', (e) => {
      if (e.target === installModal) {
        installModal.style.display = 'none';
      }
    });
  }

  // ========================================================
  // Gated Access Control & Magician Code Manager
  // ========================================================
  const LOCK_ACTIVATION_TIMESTAMP = new Date('2026-11-15T00:00:00+01:00').getTime();
  const MASTER_KEYS = ['ALEXANDER', 'ALEX2026', 'CONGRESO2026', 'ELGRANALEXANDER'];
  const ADMIN_PIN = 'ALEX2026';

  const UNIQUE_CODES_LIST = [
    "ALX-2049","ALX-4947","ALX-8935","ALX-9280","ALX-3112","ALX-9145","ALX-1402","ALX-8169","ALX-4872","ALX-8043",
    "ALX-3519","ALX-1434","ALX-7892","ALX-9848","ALX-7208","ALX-7505","ALX-5442","ALX-4609","ALX-4913","ALX-8456",
    "ALX-3450","ALX-9563","ALX-4457","ALX-7019","ALX-4167","ALX-7466","ALX-8878","ALX-5768","ALX-3046","ALX-4023",
    "ALX-6852","ALX-3907","ALX-8493","ALX-7878","ALX-3311","ALX-2214","ALX-4599","ALX-4006","ALX-2849","ALX-6955",
    "ALX-9625","ALX-3926","ALX-6473","ALX-3295","ALX-8171","ALX-5614","ALX-3886","ALX-3443","ALX-7158","ALX-5338",
    "ALX-3429","ALX-4698","ALX-3947","ALX-1996","ALX-3463","ALX-7923","ALX-8821","ALX-9275","ALX-7957","ALX-6843",
    "ALX-7400","ALX-3467","ALX-6449","ALX-6791","ALX-6934","ALX-9627","ALX-4367","ALX-8979","ALX-9081","ALX-3529",
    "ALX-6268","ALX-9074","ALX-3020","ALX-9394","ALX-8541","ALX-4980","ALX-8178","ALX-9493","ALX-7068","ALX-5166",
    "ALX-4332","ALX-9108","ALX-8451","ALX-4204","ALX-1462","ALX-7290","ALX-6341","ALX-4128","ALX-8081","ALX-7958",
    "ALX-3528","ALX-9197","ALX-5215","ALX-9767","ALX-6742","ALX-7086","ALX-3821","ALX-1193","ALX-2794","ALX-7639"
  ];
  const UNIQUE_CODES_SET = new Set(UNIQUE_CODES_LIST);

  // Toast Notification Helper
  let toastEl = null;
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'magic-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3200);
  }

  function normalizeCode(raw) {
    if (!raw) return '';
    let clean = raw.trim().toUpperCase();
    if (/^ALX\d{4}$/.test(clean)) {
      clean = 'ALX-' + clean.slice(3);
    }
    return clean;
  }

  function isValidAccessCode(code) {
    const clean = normalizeCode(code);
    if (!clean) return false;
    if (MASTER_KEYS.includes(clean)) return true;
    if (UNIQUE_CODES_SET.has(clean)) return true;
    // Algorithmic fallback: ALX-XXXX with sum of digits even
    if (/^ALX-\d{4}$/.test(clean)) {
      const digits = clean.slice(4).split('').map(Number);
      const sum = digits.reduce((a, b) => a + b, 0);
      if (sum % 2 === 0) return true;
    }
    return false;
  }

  // Check URL params for testing (?test_lock=1, ?clear_lock=1, ?admin=1)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('test_lock') === '1') {
    sessionStorage.setItem('alex_test_lock', 'true');
  } else if (urlParams.get('clear_lock') === '1') {
    localStorage.removeItem('alex_unlocked');
    localStorage.removeItem('alex_unlocked_code');
    sessionStorage.removeItem('alex_test_lock');
  }

  if (urlParams.get('admin') === '1' || urlParams.get('mago') === '1') {
    setTimeout(() => triggerAlexMagicianAccess(), 200);
  } else if (urlParams.get('clear_mago') === '1') {
    localStorage.removeItem('alex_is_magician');
    sessionStorage.removeItem('alex_admin_logged');
  }

  // --- Lock UI Elements ---
  const lockScreenOverlay = document.getElementById('lockScreenOverlay');
  const lockCodeInput = document.getElementById('lockCodeInput');
  const btnUnlockApp = document.getElementById('btnUnlockApp');
  const lockErrorMsg = document.getElementById('lockErrorMsg');
  const lockForm = document.getElementById('lockForm');
  const lockIconGlow = document.getElementById('lockIconGlow');

  function isAppUnlocked() {
    return localStorage.getItem('alex_unlocked') === 'true';
  }

  function isSimulationMode() {
    return sessionStorage.getItem('alex_test_lock') === 'true';
  }

  function shouldLockScreenBeVisible() {
    if (isSimulationMode()) return true;
    if (isAppUnlocked()) return false;
    // Free open access before midnight of Nov 14 (Nov 15 00:00:00 CET)!
    return Date.now() >= LOCK_ACTIVATION_TIMESTAMP;
  }

  function updateLockScreenVisibility() {
    if (!lockScreenOverlay) return;
    const mustLock = shouldLockScreenBeVisible();
    if (mustLock) {
      lockScreenOverlay.style.display = 'flex';
      lockScreenOverlay.setAttribute('aria-hidden', 'false');
      if (lockCodeInput) {
        setTimeout(() => lockCodeInput.focus(), 300);
      }
    } else {
      lockScreenOverlay.style.display = 'none';
      lockScreenOverlay.setAttribute('aria-hidden', 'true');
    }
    updateAdminStatusPill();
  }

  function showLockError(msg) {
    if (!lockErrorMsg) return;
    lockErrorMsg.textContent = msg;
    lockErrorMsg.style.display = 'block';
    if (lockCodeInput) {
      lockCodeInput.style.borderColor = '#ef4444';
      setTimeout(() => {
        lockCodeInput.style.borderColor = '';
      }, 1500);
    }
  }

  function handleUnlockAttempt() {
    if (!lockCodeInput) return;
    const val = lockCodeInput.value;
    if (!val || !val.trim()) {
      showLockError('Por favor, escribe un código de acceso.');
      return;
    }
    const clean = normalizeCode(val);
    if (isValidAccessCode(clean)) {
      // Valid Code!
      localStorage.setItem('alex_unlocked', 'true');
      localStorage.setItem('alex_unlocked_code', clean);
      sessionStorage.removeItem('alex_test_lock');
      
      markCodeAsUsedLocally(clean);

      if (lockErrorMsg) lockErrorMsg.style.display = 'none';
      btnUnlockApp.innerHTML = '<span>¡Desbloqueado! ✨</span>';
      btnUnlockApp.style.background = 'linear-gradient(135deg, #10b981, #059669)';

      setTimeout(() => {
        lockScreenOverlay.style.transition = 'opacity 0.5s ease';
        lockScreenOverlay.style.opacity = '0';
        setTimeout(() => {
          lockScreenOverlay.style.display = 'none';
          lockScreenOverlay.style.opacity = '1';
          lockScreenOverlay.style.transition = '';
          btnUnlockApp.innerHTML = '<span>Entrar ✨</span>';
          btnUnlockApp.style.background = '';
          lockCodeInput.value = '';
          goToSlide(0);
          showToast('✨ ¡Bienvenido a Los Emojis Mágicos!');
        }, 500);
      }, 400);
    } else {
      showLockError('Código no válido. Comprueba los dígitos o pídelo a Alex.');
    }
  }

  if (btnUnlockApp) {
    btnUnlockApp.addEventListener('click', (e) => {
      e.preventDefault();
      handleUnlockAttempt();
    });
  }

  if (lockForm) {
    lockForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUnlockAttempt();
    });
  }

  if (lockCodeInput) {
    lockCodeInput.addEventListener('input', () => {
      lockCodeInput.value = lockCodeInput.value.toUpperCase();
      if (lockErrorMsg) lockErrorMsg.style.display = 'none';
    });
  }

  // Alex Secret Shortcut on Lock Screen: 5 quick taps on 🔐 opens Admin Drawer
  let lockTapCount = 0;
  let lockTapTimer = null;
  if (lockIconGlow) {
    lockIconGlow.addEventListener('click', () => {
      lockTapCount++;
      clearTimeout(lockTapTimer);
      if (lockTapCount >= 5) {
        lockTapCount = 0;
        triggerAlexMagicianAccess();
      } else {
        lockTapTimer = setTimeout(() => { lockTapCount = 0; }, 1200);
      }
    });
  }

  // --- Magician Mode & Admin Panel System ---
  const adminStatusPill = document.getElementById('adminStatusPill');
  const adminPinGate = document.getElementById('adminPinGate');
  const adminPinInput = document.getElementById('adminPinInput');
  const btnAdminLogin = document.getElementById('btnAdminLogin');
  const adminPinError = document.getElementById('adminPinError');
  const adminControlsPanel = document.getElementById('adminControlsPanel');
  const btnCopyNextCode = document.getElementById('btnCopyNextCode');
  const nextCodePreview = document.getElementById('nextCodePreview');
  const btnToggleSimulateLock = document.getElementById('btnToggleSimulateLock');
  const usedCodesCountEl = document.getElementById('usedCodesCount');
  const btnToggleCodesList = document.getElementById('btnToggleCodesList');
  const adminCodesListContainer = document.getElementById('adminCodesListContainer');
  const codesChipsGrid = document.getElementById('codesChipsGrid');
  const btnResetUsedCodes = document.getElementById('btnResetUsedCodes');
  const btnLockThisDevice = document.getElementById('btnLockThisDevice');
  const btnExitMagicianMode = document.getElementById('btnExitMagicianMode');

  function isMagician() {
    return localStorage.getItem('alex_is_magician') === 'true';
  }

  function setMagicianMode(active) {
    if (active) {
      localStorage.setItem('alex_is_magician', 'true');
      sessionStorage.setItem('alex_admin_logged', 'true');
    } else {
      localStorage.removeItem('alex_is_magician');
      sessionStorage.removeItem('alex_admin_logged');
      sessionStorage.removeItem('temp_show_admin');
    }
    updateMagicianSectionsVisibility();
    checkAdminSession();
  }

  function updateMagicianSectionsVisibility() {
    const active = isMagician();
    const magicianSecretsSection = document.getElementById('magicianSecretsSection');
    const adminBox = document.getElementById('adminBox');

    if (magicianSecretsSection) {
      magicianSecretsSection.style.display = active ? 'block' : 'none';
    }
    if (adminBox) {
      if (active || sessionStorage.getItem('temp_show_admin') === 'true') {
        adminBox.style.display = 'block';
      } else {
        adminBox.style.display = 'none';
      }
    }
  }

  function triggerAlexMagicianAccess() {
    if (isMagician()) {
      showToast('🎩 Modo Mago Activo');
      openCheatSheet();
      updateMagicianSectionsVisibility();
    } else {
      sessionStorage.setItem('temp_show_admin', 'true');
      updateMagicianSectionsVisibility();
      openCheatSheet();
      setTimeout(() => {
        const adminBox = document.getElementById('adminBox');
        if (adminBox) adminBox.scrollIntoView({ behavior: 'smooth' });
        if (adminPinInput) adminPinInput.focus();
      }, 350);
      showToast('🎩 Acceso Maestro: Introduce el PIN de Alex');
    }
  }

  function getUsedCodes() {
    try {
      const data = localStorage.getItem('alex_managed_codes_used');
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  function markCodeAsUsedLocally(code) {
    if (!code || !code.startsWith('ALX-')) return;
    const used = getUsedCodes();
    if (!used.includes(code)) {
      used.push(code);
      localStorage.setItem('alex_managed_codes_used', JSON.stringify(used));
      renderAdminCodesUI();
    }
  }

  function getNextAvailableCode() {
    const usedSet = new Set(getUsedCodes());
    for (const c of UNIQUE_CODES_LIST) {
      if (!usedSet.has(c)) return c;
    }
    return null;
  }

  function updateAdminStatusPill() {
    if (!adminStatusPill) return;
    const now = Date.now();
    const isFree = now < LOCK_ACTIVATION_TIMESTAMP && !isSimulationMode();
    if (isFree) {
      adminStatusPill.textContent = 'Libre Hoy (hasta 00:00)';
      adminStatusPill.className = 'admin-status-pill status-free';
    } else {
      adminStatusPill.textContent = isSimulationMode() ? 'Modo Prueba' : 'Bloqueo Activo';
      adminStatusPill.className = 'admin-status-pill status-locked';
    }
  }

  function renderAdminCodesUI() {
    const usedCodes = getUsedCodes();
    const usedSet = new Set(usedCodes);
    if (usedCodesCountEl) {
      usedCodesCountEl.textContent = usedCodes.length;
    }
    const nextCode = getNextAvailableCode();
    if (nextCodePreview) {
      nextCodePreview.textContent = nextCode ? nextCode : '¡Agotados!';
    }

    if (codesChipsGrid) {
      codesChipsGrid.innerHTML = '';
      UNIQUE_CODES_LIST.forEach((code) => {
        const isUsed = usedSet.has(code);
        const chip = document.createElement('div');
        chip.className = `code-chip ${isUsed ? 'used' : 'available'}`;
        chip.textContent = code;
        chip.title = isUsed ? 'Entregado (Toca para volver a disponible)' : 'Disponible (Toca para copiar)';
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!isUsed) {
            copyCodeToClipboard(code);
            markCodeAsUsedLocally(code);
          } else {
            const newUsed = getUsedCodes().filter(c => c !== code);
            localStorage.setItem('alex_managed_codes_used', JSON.stringify(newUsed));
            renderAdminCodesUI();
            showToast(`Código ${code} marcado como disponible.`);
          }
        });
        codesChipsGrid.appendChild(chip);
      });
    }
  }

  async function copyCodeToClipboard(code) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast(`📋 ¡Código ${code} copiado al portapapeles!`);
    } catch (_) {
      showToast(`Código: ${code}`);
    }
  }

  function checkAdminSession() {
    const isAdminLogged = sessionStorage.getItem('alex_admin_logged') === 'true' || isMagician();
    if (isAdminLogged) {
      if (adminPinGate) adminPinGate.style.display = 'none';
      if (adminControlsPanel) adminControlsPanel.style.display = 'block';
      renderAdminCodesUI();
    } else {
      if (adminPinGate) adminPinGate.style.display = 'block';
      if (adminControlsPanel) adminControlsPanel.style.display = 'none';
    }
    updateAdminStatusPill();
    updateMagicianSectionsVisibility();
  }

  if (btnAdminLogin && adminPinInput) {
    btnAdminLogin.addEventListener('click', () => {
      const pin = adminPinInput.value.trim().toUpperCase();
      if (pin === ADMIN_PIN || pin === 'ALEXANDER') {
        setMagicianMode(true);
        if (adminPinError) adminPinError.style.display = 'none';
        adminPinInput.value = '';
        showToast('✨ ¡Modo Mago activado permanentemente en este móvil!');
      } else {
        if (adminPinError) {
          adminPinError.style.display = 'block';
          adminPinError.textContent = 'PIN incorrecto (usa ALEX2026)';
        }
      }
    });

    adminPinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        btnAdminLogin.click();
      }
    });
  }

  if (btnCopyNextCode) {
    btnCopyNextCode.addEventListener('click', () => {
      const nextCode = getNextAvailableCode();
      if (nextCode) {
        copyCodeToClipboard(nextCode);
        markCodeAsUsedLocally(nextCode);
      } else {
        showToast('⚠️ Se han entregado los 100 códigos.');
      }
    });
  }

  if (btnToggleSimulateLock) {
    btnToggleSimulateLock.addEventListener('click', () => {
      closeCheatSheet();
      sessionStorage.setItem('alex_test_lock', 'true');
      updateLockScreenVisibility();
      showToast('🧪 Probando pantalla de bloqueo');
    });
  }

  if (btnToggleCodesList && adminCodesListContainer) {
    btnToggleCodesList.addEventListener('click', () => {
      const isHidden = adminCodesListContainer.style.display === 'none';
      adminCodesListContainer.style.display = isHidden ? 'block' : 'none';
      btnToggleCodesList.textContent = isHidden ? 'Ocultar códigos ▴' : 'Ver todos los códigos ▾';
    });
  }

  if (btnResetUsedCodes) {
    btnResetUsedCodes.addEventListener('click', () => {
      if (confirm('¿Quieres reiniciar la lista de códigos entregados?')) {
        localStorage.removeItem('alex_managed_codes_used');
        renderAdminCodesUI();
        showToast('Lista de códigos reiniciada.');
      }
    });
  }

  if (btnLockThisDevice) {
    btnLockThisDevice.addEventListener('click', () => {
      localStorage.removeItem('alex_unlocked');
      localStorage.removeItem('alex_unlocked_code');
      sessionStorage.setItem('alex_test_lock', 'true');
      closeCheatSheet();
      updateLockScreenVisibility();
      showToast('🔒 Móvil bloqueado para prueba.');
    });
  }

  if (btnExitMagicianMode) {
    btnExitMagicianMode.addEventListener('click', () => {
      setMagicianMode(false);
      closeCheatSheet();
      showToast('🔒 Has salido del Modo Mago (Modo Espectador activado).');
    });
  }

  // Initialize App & Lock System
  goToSlide(0);
  requestWakeLock();
  updateLockScreenVisibility();
  checkAdminSession();

  // Register PWA Service Worker with auto-update
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        reg.update();
      }).catch(err => {
        console.log('SW registration error:', err);
      });
    });
  }
})();
