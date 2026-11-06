import { mountClient } from './client.js';
import { mountAdmin } from './admin.js';

let off = null;
let current = null;

function route() {
  const view = location.hash === '#admin' ? 'admin' : 'client';
  if (view === current) {
    // Navegación por anclas (#servicios, etc.) dentro de la vista clienta: no remontar
    return;
  }
  current = view;
  if (off) off();
  document.getElementById('sheet')?.close?.();
  const fresh = document.createElement('div'); // contenedor nuevo: elimina listeners de la vista anterior
  fresh.id = 'app';
  document.getElementById('app').replaceWith(fresh);
  window.scrollTo(0, 0);
  document.body.dataset.view = view;
  off = (view === 'admin' ? mountAdmin : mountClient)(fresh);
  fresh.dataset.view = view;
  document.title = view === 'admin' ? 'Nail Club · Equipo' : 'Nail Club · Manos que hablan de ti';
}

addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
