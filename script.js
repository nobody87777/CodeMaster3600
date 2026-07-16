// MultitaskCoder — script.js
//
// NOTE ON SCOPE OF THIS FILE
// --------------------------
// The original single-file export had no <script> tag at all — the only
// JavaScript present was two inert `<link rel="modulepreload">` data-URIs
// (a React runtime chunk and a lazily-loaded route chunk that imports a
// second file that was never included). Neither was ever wired up to a
// <script> element, so none of it executed in the file that was provided,
// and it depended on React. Per the project's "no React / no build tools"
// requirement, that bundle has intentionally NOT been carried over — doing
// so would not restore any working behavior, since the module reference is
// broken and nothing on the page ever invoked it.
//
// What follows is small, framework-free, standards-based JavaScript that
// wires up the two pieces of real, unambiguous functionality this page's
// own markup and manifest point to: registering the service worker and
// handling the PWA "Install app" button. The "Toggle theme" and "Open
// menu" buttons are left exactly as they were delivered (present, but
// inert) because there is no alternate theme or menu content anywhere in
// the source to attach to them — inventing one would mean guessing at
// content/behavior that was never actually part of the design.

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Register the service worker (enables offline/repeat-visit caching of
  // the static app shell — see sw.js). Service workers require a secure
  // context (https:, or http://localhost), so this is skipped entirely
  // when the page is opened directly via file:// — the site still works
  // perfectly in that case, it just won't have offline caching.
  // ---------------------------------------------------------------------
  const isSecureContextForSW =
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.hostname === '[::1]');

  if (isSecureContextForSW) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }

  // ---------------------------------------------------------------------
  // "Install app" button — standard beforeinstallprompt / appinstalled flow.
  // The button already ships with a `disabled:opacity-60` style in
  // style.css, so disabling it simply dims it until the browser confirms
  // installation is actually available.
  // ---------------------------------------------------------------------
  const installBtn = document.getElementById('installAppBtn');

  if (installBtn) {
    let deferredPrompt = null;
    installBtn.disabled = true;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      installBtn.disabled = false;
    });

    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      installBtn.disabled = true;
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } finally {
        deferredPrompt = null;
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      installBtn.disabled = true;
    });
  }
})();
