// Nail Club · núcleo: datos por defecto, almacenamiento local, utilidades y disponibilidad.

export const SWATCHES = [
  ['Salvia', '#8A9A7B'],
  ['Moca', '#7E6653'],
  ['Rosé', '#E3C1B4'],
  ['Champagne', '#D9C3A0'],
  ['Burdeos', '#6B2737'],
  ['Ónix', '#1B1B1B'],
];

export const DRINKS = ['Capuchino', 'Flat White', 'Latte Macchiato', 'Espresso', 'Té caliente', 'Agua con gas'];
export const STATUSES = ['Confirmada', 'En proceso', 'Completada', 'Cancelada'];
export const STD_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
export const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const BASE_HOURS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const DEFAULTS = {
  svcs: [
    { id: 's1', name: 'Manicure Gel', desc: 'Esmaltado semipermanente con prep de cutícula.', price: 14000, min: 60, active: true },
    { id: 's2', name: 'Soft Gel', desc: 'Extensión ligera y flexible, acabado natural.', price: 22000, min: 90, active: true },
    { id: 's3', name: 'Acrílicas', desc: 'Estructura y largo a tu medida.', price: 26000, min: 120, active: true },
    { id: 's4', name: 'Pedicure Spa', desc: 'Exfoliación, masaje e hidratación.', price: 18000, min: 75, active: true },
    { id: 's5', name: 'Nail Art personalizado', desc: 'Diseño a mano; se cotiza según detalle.', price: 8000, min: 45, active: true },
    { id: 's6', name: 'Retiro', desc: 'Retiro seguro de gel o acrílico.', price: 6000, min: 30, active: true },
  ],
  techs: [
    { id: 't1', name: 'Valeria', spec: 'Soft gel y nail art', active: true },
    { id: 't2', name: 'Daniela', spec: 'Acrílicas y pedicure', active: true },
  ],
  appts: [],
  notices: [],
  mine: [],
  pwaHide: false,
  settings: {
    // Cambia el número en Admin → Ajustes (formato internacional, sin "+": 506XXXXXXXX)
    whatsapp: '50600000000',
    address: 'San José, Costa Rica',
    hours: 'Lunes a sábado · 10:00 – 18:00',
    pin: '1234',
  },
  avail: {
    // 0 = domingo … 6 = sábado
    weekly: { 0: [], 1: BASE_HOURS, 2: BASE_HOURS, 3: BASE_HOURS, 4: BASE_HOURS, 5: BASE_HOURS, 6: BASE_HOURS },
    // overrides['2026-11-20'] = ['10:00', …]  ([] = día cerrado)
    overrides: {},
  },
};

/* ───────── Almacenamiento ───────── */
const PREFIX = 'nc2_';
const cache = new Map();
const subs = new Set();
const clone = (v) => JSON.parse(JSON.stringify(v));
const emit = () => subs.forEach((fn) => fn());

export const store = {
  get(key) {
    if (!cache.has(key)) {
      let v;
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw != null) v = JSON.parse(raw);
      } catch { /* sin storage: usa memoria */ }
      if (v === undefined || v === null) v = clone(DEFAULTS[key]);
      if (key === 'settings') v = { ...DEFAULTS.settings, ...v };
      if (key === 'avail') v = { weekly: { ...DEFAULTS.avail.weekly, ...(v.weekly || {}) }, overrides: v.overrides || {} };
      cache.set(key, v);
    }
    return cache.get(key);
  },
  set(key, value) {
    cache.set(key, value);
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* ignorar */ }
    emit();
  },
  update(key, fn) {
    const draft = clone(this.get(key));
    const out = fn(draft);
    this.set(key, out === undefined ? draft : out);
  },
  on(fn) { subs.add(fn); return () => subs.delete(fn); },
  resetAll() {
    try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignorar */ }
    cache.clear();
    emit();
  },
};

// Cambios hechos desde otra pestaña (por ejemplo: admin abierto en otra ventana)
addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith(PREFIX)) { cache.delete(e.key.slice(PREFIX.length)); emit(); }
});

/* ───────── Utilidades ───────── */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => '₡' + Number(n || 0).toLocaleString('es-CR');
export const uid = (p = 'x') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Fecha LOCAL en formato AAAA-MM-DD (toISOString usa UTC y corre el día de noche en Costa Rica)
export const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const todayYmd = () => ymd(new Date());
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const fmtLong = (s) => parseYmd(s).toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtShort = (s) => parseYmd(s).toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' });
export const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const normTime = (t) => { const [h, m] = t.split(':'); return String(+h).padStart(2, '0') + ':' + String(+m).padStart(2, '0'); };
export const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
export const waLink = (phone, text = '') => `https://wa.me/${cleanPhone(phone)}${text ? '?text=' + encodeURIComponent(text) : ''}`;

export const activeSvcs = () => store.get('svcs').filter((s) => s.active !== false);
export const activeTechs = () => store.get('techs').filter((t) => t.active !== false);

/* ───────── Disponibilidad ───────── */
export function slotsFor(date) {
  const a = store.get('avail');
  const o = a.overrides[date];
  const list = o !== undefined ? o : a.weekly[parseYmd(date).getDay()] || [];
  return [...new Set(list)].sort();
}

export const isPast = (date, time) => new Date(`${date}T${time}:00`) <= new Date();

function busy(techId, date, start, end) {
  return store.get('appts').some((a) => a.date === date && a.tech === techId && a.status !== 'Cancelada'
    && toMin(a.time) < end && start < toMin(a.time) + (a.min || 60));
}

// Técnicas libres para esa fecha/hora y duración. choice = id de técnica o 't0' (primera disponible)
export function freeTechs(date, time, minutes, choice) {
  const pool = choice && choice !== 't0' ? activeTechs().filter((t) => t.id === choice) : activeTechs();
  const s = toMin(time);
  return pool.filter((t) => !busy(t.id, date, s, s + minutes));
}

export function availableTimes(date, minutes, choice) {
  return slotsFor(date).filter((t) => !isPast(date, t) && freeTechs(date, t, minutes, choice).length > 0);
}

/* ───────── Íconos (trazo) ───────── */
const P = {
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v2M10 2v2M14 2v2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/>',
  spark: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
};
export const icon = (name, size = 18) =>
  `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 3200);
}
