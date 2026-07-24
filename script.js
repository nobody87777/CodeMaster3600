// MultitaskCoder — script.js
//
// This file is shared by every page (loaded as ./script.js from index.html
// and as ../script.js from pages/*.html), so every path it touches is
// computed relative to this script's own URL rather than hard-coded, and
// every feature checks that its target element exists before wiring up
// (so this same file works whether or not a given page has that element).
//
// Sections:
//   1. Service worker registration
//   2. PWA "Install app" prompt
//   3. Theme toggle (light/dark, persisted)
//   4. Mobile nav drawer
//   5. Shared XP / Level system (persisted, read by every page's header
//      and by the analytics dashboard)
//   6. 3D tilt effect for workspace cards
//   7. Home-screen loading splash

(function () {
  'use strict';

  // Resolve this script's own folder so sub-pages (in /pages) and the
  // homepage both compute the correct absolute-but-relative-origin path
  // to files that live at the project root (sw.js etc.), regardless of
  // which page loaded this file.
  var THIS_SCRIPT_URL = document.currentScript ? document.currentScript.src : new URL('script.js', location.href).href;
  function fromProjectRoot(relativePath) {
    return new URL(relativePath, THIS_SCRIPT_URL).href;
  }

  // ---------------------------------------------------------------------
  // 1. Service worker registration
  // ---------------------------------------------------------------------
  var isSecureContextForSW =
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.hostname === '[::1]');

  if (isSecureContextForSW) {
    window.addEventListener('load', function () {
      var swURL = fromProjectRoot('sw.js');
      var scopeURL = fromProjectRoot('./');
      navigator.serviceWorker.register(swURL, { scope: scopeURL }).catch(function (err) {
        console.warn('Service worker registration failed:', err);
      });
    });
  }

  // ---------------------------------------------------------------------
  // 2. "Install app" button — standard beforeinstallprompt / appinstalled flow.
  // ---------------------------------------------------------------------
  var installBtn = document.getElementById('installAppBtn');
  if (installBtn) {
    var deferredPrompt = null;

    function hideInstallButton() {
      installBtn.classList.add('is-hidden');
      // Wait for the fade-out transition (0.3s in style.css) to finish
      // before pulling it out of layout entirely.
      setTimeout(function () {
        installBtn.style.display = 'none';
      }, 320);
    }

    function isRunningStandalone() {
      return (
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        window.navigator.standalone === true // legacy iOS Safari flag
      );
    }

    if (isRunningStandalone()) {
      // Already installed (e.g. opened from the home-screen icon, or the
      // browser tab itself is running in standalone mode) — nothing to
      // install, so there's no reason to ever show the button.
      hideInstallButton();
    } else {
      installBtn.disabled = true;

      window.addEventListener('beforeinstallprompt', function (event) {
        event.preventDefault();
        deferredPrompt = event;
        installBtn.disabled = false;
      });

      installBtn.addEventListener('click', function () {
        if (!deferredPrompt) return;
        installBtn.disabled = true;
        var promptEvent = deferredPrompt;
        promptEvent.prompt();
        promptEvent.userChoice
          .then(function (choice) {
            if (choice && choice.outcome === 'accepted') {
              hideInstallButton();
            }
            // If dismissed, leave it disabled — this specific prompt event
            // is spent either way; the button re-enables automatically if
            // the browser fires a fresh beforeinstallprompt later.
          })
          .finally(function () {
            deferredPrompt = null;
          });
      });

      window.addEventListener('appinstalled', function () {
        deferredPrompt = null;
        hideInstallButton();
      });
    }
  }

  // ---------------------------------------------------------------------
  // 3. Theme toggle (persisted in localStorage, applied on every page)
  // ---------------------------------------------------------------------
  var THEME_KEY = 'mtc-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    var icon = document.getElementById('themeIcon');
    if (icon) icon.classList.toggle('icon-moon', theme === 'light');
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage may be unavailable */ }
  }

  function initTheme() {
    var saved = 'dark';
    try { saved = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) { /* ignore */ }
    applyTheme(saved);

    var btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  }

  // ---------------------------------------------------------------------
  // 4. Mobile nav drawer
  // ---------------------------------------------------------------------
  function initMenu() {
    var btn = document.getElementById('menuToggleBtn');
    var drawer = document.getElementById('navDrawer');
    var overlay = document.getElementById('navOverlay');
    var closeBtn = document.getElementById('navCloseBtn');
    if (!btn || !drawer) return;

    function openMenu() {
      drawer.classList.add('nav-drawer-open');
      if (overlay) overlay.classList.add('nav-overlay-open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      drawer.classList.remove('nav-drawer-open');
      if (overlay) overlay.classList.remove('nav-overlay-open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu(); else openMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // ---------------------------------------------------------------------
  // 5. Shared XP / Level system
  // ---------------------------------------------------------------------
  var XP_KEY = 'mtc-xp';
  var STATS_KEY = 'mtc-stats';

  function getXP() {
    try {
      var raw = localStorage.getItem(XP_KEY);
      return raw === null ? 10 : parseInt(raw, 10) || 0;
    } catch (e) {
      return 10;
    }
  }

  function setXP(value) {
    try { localStorage.setItem(XP_KEY, String(Math.max(0, value))); } catch (e) { /* ignore */ }
  }

  function addXP(amount) {
    var next = Math.max(0, getXP() + amount);
    setXP(next);
    renderLevelBadge();
    return next;
  }

  function xpToLevel(xp) {
    var level = 1;
    var remaining = xp;
    var threshold = 50;
    while (remaining >= threshold) {
      remaining -= threshold;
      level += 1;
      threshold += 50;
    }
    return { level: level, into: remaining, span: threshold };
  }

  function renderLevelBadge() {
    var xp = getXP();
    var info = xpToLevel(xp);
    var lvlEl = document.getElementById('levelLabel');
    var xpEl = document.getElementById('xpLabel');
    var barEl = document.getElementById('xpBar');
    if (lvlEl) lvlEl.textContent = 'Lvl ' + info.level;
    if (xpEl) xpEl.textContent = xp + ' XP';
    if (barEl) barEl.style.width = Math.round((info.into / info.span) * 100) + '%';
  }

  function getStats() {
    var defaults = {
      typingBestWpm: { c: 0, python: 0, java: 0 },
      typingRuns: 0,
      debuggerCorrect: 0,
      debuggerTotal: 0,
      quizBest: 0,
      quizRuns: 0,
      history: [] // { type, label, detail, xp, at }
    };
    try {
      var raw = localStorage.getItem(STATS_KEY);
      if (!raw) return defaults;
      var parsed = JSON.parse(raw);
      return Object.assign({}, defaults, parsed, {
        typingBestWpm: Object.assign({}, defaults.typingBestWpm, parsed.typingBestWpm || {})
      });
    } catch (e) {
      return defaults;
    }
  }

  function saveStats(stats) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
  }

  function recordActivity(entry) {
    var stats = getStats();
    stats.history.unshift(Object.assign({ at: Date.now() }, entry));
    stats.history = stats.history.slice(0, 25);
    saveStats(stats);
  }

  // Expose a small shared API for the per-page scripts (typing/debugger/
  // quiz/analytics) to use without each reimplementing storage handling.
  window.MTC = {
    addXP: addXP,
    getXP: getXP,
    xpToLevel: xpToLevel,
    getStats: getStats,
    saveStats: saveStats,
    recordActivity: recordActivity,
    renderLevelBadge: renderLevelBadge
  };

  // ---------------------------------------------------------------------
  // 6. 3D tilt effect for workspace cards (mouse-driven; ignored on
  //    touch-only devices since mousemove doesn't meaningfully fire there)
  // ---------------------------------------------------------------------
  function initCardTilt() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var cards = document.querySelectorAll('.workspace-card');
    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        card.classList.add('is-tilting');
        card.style.transition = 'none';
      });
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        var rotateX = ((y - cy) / cy) * -5;
        var rotateY = ((x - cx) / cx) * 5;
        card.style.transform =
          'perspective(900px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' +
          rotateY.toFixed(2) + 'deg) translateY(-2px) translateZ(6px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.45s cubic-bezier(.22,1,.36,1)';
        card.style.transform = '';
        setTimeout(function () { card.classList.remove('is-tilting'); }, 460);
      });
    });
  }

  // ---------------------------------------------------------------------
  // 7. Home-screen loading splash (only present on index.html — every
  //    other page's #pageLoader lookup below simply no-ops)
  // ---------------------------------------------------------------------
  function initPageLoader() {
    var loader = document.getElementById('pageLoader');
    if (!loader) return;

    var MIN_SHOWN_MS = 450;
    var HARD_TIMEOUT_MS = 2500; // safety net if 'load' never fires
    var start = Date.now();
    var hidden = false;

    function hide() {
      if (hidden) return;
      hidden = true;
      var elapsed = Date.now() - start;
      var wait = Math.max(0, MIN_SHOWN_MS - elapsed);
      setTimeout(function () {
        loader.classList.add('is-hidden');
        setTimeout(function () { loader.remove(); }, 450);
      }, wait);
    }

    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide);
    }
    setTimeout(hide, HARD_TIMEOUT_MS);
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initMenu();
    renderLevelBadge();
    initCardTilt();
    initPageLoader();
  });
})();
