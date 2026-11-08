/**
 * El Código de las Estrellas - App del Mago
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

  let currentIndex = 0;
  const totalSlides = slides.length;

  // Touch / Swipe Tracking Variables
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let touchStartTime = 0;
  let isSwiping = false;

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

  // --- Slide Navigation ---
  function goToSlide(index) {
    if (index < 0) index = 0;
    if (index >= totalSlides) index = 0; // Loop back to start

    currentIndex = index;
    slidesTrack.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Update active slide class
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentIndex);
    });

    // Update dots indicator
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  // --- Request Screen Wake Lock ---
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake Lock request skipped or not supported:', err);
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
        console.log('Error attempting fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // --- Cheat Sheet / Magician Copilot ---
  function openCheatSheet() {
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
      updateBinarySolver();
    });
  });

  // --- Event Listeners ---

  // Secret Top Zones
  zoneBack.addEventListener('click', (e) => {
    e.stopPropagation();
    prevSlide();
  });

  zoneFullscreen.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });

  zoneCheat.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCheatSheet();
  });

  // Long press on top-right also opens cheat sheet
  let longPressTimer = null;
  zoneCheat.addEventListener('touchstart', (e) => {
    longPressTimer = setTimeout(() => {
      openCheatSheet();
    }, 500);
  }, { passive: true });

  zoneCheat.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
  });

  btnCloseCheat.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCheatSheet();
  });

  // Main Viewport Tap & Swipe
  viewport.addEventListener('touchstart', (e) => {
    if (cheatDrawer.classList.contains('open')) return;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    touchStartTime = Date.now();
    isSwiping = false;
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (cheatDrawer.classList.contains('open')) return;
    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    if (Math.abs(currentX - touchStartX) > 10 || Math.abs(currentY - touchStartY) > 10) {
      isSwiping = true;
    }
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    if (cheatDrawer.classList.contains('open')) return;
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;

    // Detect horizontal swipe
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && deltaTime < 450) {
      if (deltaX < 0) {
        nextSlide(); // Swiped left -> next
      } else {
        prevSlide(); // Swiped right -> prev
      }
      return;
    }

    // Otherwise, standard tap advances
    if (!isSwiping && deltaTime < 400) {
      // Don't trigger if click was near top secret zones
      if (touchStartY > 80) {
        nextSlide();
        requestWakeLock();
      }
    }
  }, { passive: true });

  // Fallback click for desktop
  viewport.addEventListener('click', (e) => {
    if (cheatDrawer.classList.contains('open')) return;
    if (e.target.closest('.secret-tap-zone') || e.target.closest('#btnRestart')) return;
    nextSlide();
  });

  // Restart Button on Slide 5
  if (btnRestart) {
    btnRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(0);
    });
  }

  // Keyboard navigation for rehearsal on laptop/PC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      nextSlide();
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

  // Initialize
  goToSlide(0);
  requestWakeLock();

  // Register PWA Service Worker for 100% offline usage
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('SW registration error:', err);
      });
    });
  }
})();
