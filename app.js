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

  zoneCheat.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    toggleCheatSheet();
  });

  // Long press on top-right also opens cheat sheet
  let longPressTimer = null;
  zoneCheat.addEventListener('pointerdown', (e) => {
    longPressTimer = setTimeout(() => {
      openCheatSheet();
    }, 450);
  });

  zoneCheat.addEventListener('pointerup', () => {
    clearTimeout(longPressTimer);
  });

  btnCloseCheat.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCheatSheet();
  });

  // --- Covert On-Screen Peek on Slide 6 (Crystal Ball) ---
  if (telepathyGlow && revealSubtitle) {
    telepathyGlow.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentSum = getCalculatedSum();

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

  // Initialize
  goToSlide(0);
  requestWakeLock();

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
