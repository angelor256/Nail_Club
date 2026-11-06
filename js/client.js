// Nail Club · vista clienta (landing + reserva + mis citas)
import {
  store, SWATCHES, DRINKS, esc, money, icon, toast, uid, ymd, addDays, fmtLong, fmtShort, parseYmd,
  activeSvcs, activeTechs, availableTimes, freeTechs, toMin, todayYmd, cleanPhone, waLink,
} from './core.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const TESTIMONIOS = [
  ['Salí con las uñas perfectas y un capuchino en la mano. Volveré.', 'Andrea M.'],
  ['Soft gel que dura tres semanas intactas. Un lugar muy tranquilo.', 'Priscilla R.'],
  ['Reservar desde el celular fue facilísimo, y mi flat white ya estaba listo.', 'Karla S.'],
];

function heroArt() {
  const nails = [[-40, 3, 1.25], [-20, 1, 1.45], [0, 4, 1.6], [20, 2, 1.45], [40, 0, 1.25]];
  const n = nails.map(([rot, sw, sc], i) => `
    <g transform="translate(220 470) rotate(${rot}) scale(${sc})">
      <g class="nail" style="--d:${0.15 + i * 0.12}s">
        <path d="M-19 0C-24 -44 -14 -92 0 -118C14 -92 24 -44 19 0Z" fill="${SWATCHES[sw][1]}" stroke="#C9A96A" stroke-width="1.2"/>
        <path d="M-9 -20C-12 -52 -8 -82 -2 -100" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
      </g>
    </g>`).join('');
  return `
  <svg viewBox="0 0 440 540" class="hero-art" role="img" aria-label="Ilustración de uñas en tonos de temporada">
    <defs>
      <linearGradient id="arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22362B"/><stop offset="1" stop-color="#101712"/></linearGradient>
      <radialGradient id="glow" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#C9A96A" stop-opacity=".35"/><stop offset="1" stop-color="#C9A96A" stop-opacity="0"/></radialGradient>
    </defs>
    <path d="M50 520V215a170 170 0 0 1 340 0V520Z" fill="url(#arch)" stroke="#C9A96A" stroke-width="1.2"/>
    <path d="M68 520V218a152 152 0 0 1 304 0V520Z" fill="none" stroke="#C9A96A" stroke-opacity=".45" stroke-width=".8"/>
    <path d="M86 520V220a134 134 0 0 1 268 0V520Z" fill="none" stroke="#C9A96A" stroke-opacity=".25" stroke-width=".8"/>
    <circle cx="220" cy="190" r="120" fill="url(#glow)"/>
    <circle cx="220" cy="150" r="42" fill="none" stroke="#C9A96A" stroke-width="1"/>
    <circle cx="220" cy="150" r="30" fill="none" stroke="#C9A96A" stroke-opacity=".5" stroke-width=".8"/>
    ${n}
    <path d="M130 496h180" stroke="#C9A96A" stroke-opacity=".6" stroke-width=".8"/>
    <g class="twinkle" fill="#C9A96A">
      <path d="M76 120l4 11 11 4-11 4-4 11-4-11-11-4 11-4z"/>
      <path d="M372 300l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" opacity=".8"/>
      <path d="M338 96l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" opacity=".7"/>
    </g>
  </svg>`;
}

/* ───────── Shell de la página ───────── */
export function mountClient(root) {
  const s = store.get('settings');
  root.innerHTML = `
  <header class="top">
    <div class="wrap top-in">
      <a class="brand" href="#" aria-label="Nail Club, inicio"><span class="brand-n">Nail Club</span><span class="brand-s">Atelier de uñas</span></a>
      <nav class="top-nav" aria-label="Principal">
        <a href="#servicios">Servicios</a><a href="#tonos">Tonos</a><a href="#cafe">Café</a><a href="#mis-citas">Mis citas</a>
      </nav>
      <button class="btn btn-gold btn-sm" data-act="book">Reservar</button>
    </div>
  </header>

  <main>
    <section class="hero grain">
      <div class="wrap hero-in">
        <div class="hero-copy">
          <p class="kicker rise" style="--d:.05s">Atelier de uñas &amp; pies · San José</p>
          <h1 class="rise" style="--d:.15s">Manos que <em>hablan</em> de&nbsp;ti</h1>
          <p class="lead rise" style="--d:.3s">Un estudio íntimo donde cada detalle es una pieza de arte. Café de cortesía mientras te consientes.</p>
          <div class="hero-cta rise" style="--d:.45s">
            <button class="btn btn-gold" data-act="book">Reservar mi cita</button>
            <a class="btn btn-ghost" href="#servicios">Ver servicios</a>
          </div>
        </div>
        <div class="hero-visual rise" style="--d:.25s">${heroArt()}</div>
      </div>
      <div class="marquee" aria-hidden="true"><div class="marquee-in">${Array(2).fill('<span>Soft gel</span><i>✦</i><span>Acrílicas</span><i>✦</i><span>Nail art</span><i>✦</i><span>Pedicure spa</span><i>✦</i><span>Café de cortesía</span><i>✦</i>').join('')}</div></div>
    </section>

    <div id="install" class="wrap"></div>
    <div id="notice" class="wrap"></div>

    <section id="servicios" class="sec sec-ivory">
      <div class="wrap">
        <header class="sec-head reveal"><span class="num">I</span><h2>La carta <em>de servicios</em></h2><p>Cada servicio incluye consulta, preparación y acabado de autor.</p></header>
        <ul id="svc-list" class="menu"></ul>
      </div>
    </section>

    <section id="tonos" class="sec sec-paper" aria-labelledby="tonos-t">
      <div class="wrap tonos reveal">
        <span class="num">II</span>
        <h2 id="tonos-t">Tonos <em>de temporada</em></h2>
        <p class="tono-name" id="tono-name" aria-live="polite"></p>
        <div class="bottles" role="group" aria-label="Elige un tono">
          ${SWATCHES.map(([n, c], i) => `
            <button class="bottle" data-act="tono" data-i="${i}" aria-label="${n}" style="--c:${c}">
              <span class="bottle-cap"></span><span class="bottle-body"><b>${n}</b></span>
            </button>`).join('')}
        </div>
      </div>
    </section>

    <section id="cafe" class="sec sec-dark grain">
      <div class="wrap cafe reveal">
        <div>
          <span class="num num-gold">III</span>
          <h2>Tu café <em>te espera</em></h2>
          <p>Elige tu bebida al reservar y la preparamos para tu llegada. Va por la casa.</p>
        </div>
        <div class="cafe-art">
          <div class="steam" aria-hidden="true"><span></span><span></span><span></span></div>
          <ul class="drinks">${DRINKS.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
        </div>
      </div>
    </section>

    <section class="sec sec-ivory">
      <div class="wrap">
        <header class="sec-head reveal"><span class="num">IV</span><h2>Lo que <em>dicen ellas</em></h2></header>
        <div class="quotes">
          ${TESTIMONIOS.map(([q, a]) => `<figure class="quote reveal"><span class="qm" aria-hidden="true">“</span><blockquote>${esc(q)}</blockquote><figcaption>— ${esc(a)}</figcaption></figure>`).join('')}
        </div>
      </div>
    </section>

    <section id="mis-citas" class="sec sec-paper">
      <div class="wrap">
        <header class="sec-head reveal"><span class="num">V</span><h2>Mis <em>citas</em></h2></header>
        <div id="my-appts"></div>
      </div>
    </section>
  </main>

  <footer class="foot grain">
    <div class="wrap foot-in">
      <div><p class="brand-n foot-brand">Nail Club</p><p id="f-hours" class="muted-l"></p><p id="f-addr" class="muted-l"></p></div>
      <div class="foot-links">
        <a id="f-waze" class="btn btn-ghost btn-sm" target="_blank" rel="noopener">Waze</a>
        <a id="f-maps" class="btn btn-ghost btn-sm" target="_blank" rel="noopener">${icon('pin', 14)} Google Maps</a>
      </div>
      <a class="team-link" href="#admin">Acceso equipo</a>
      <p class="credit">Creado por <a href="https://angelor256.github.io/buildbeetech/#inicio" target="_blank" rel="noopener">Buildbee</a></p>
    </div>
  </footer>

  <a id="wa" class="wa" aria-label="Escribir por WhatsApp" target="_blank" rel="noopener">${icon('chat', 24)}</a>

  <nav class="tabbar" aria-label="Navegación móvil">
    <a href="#">${icon('home', 20)}<span>Inicio</span></a>
    <a href="#servicios">${icon('spark', 20)}<span>Servicios</span></a>
    <button data-act="book" class="tab-main" aria-label="Reservar cita">${icon('plus', 22)}</button>
    <a href="#mis-citas">${icon('cal', 20)}<span>Mis citas</span></a>
    <a href="#admin">${icon('lock', 20)}<span>Equipo</span></a>
  </nav>`;

  setTono(2);
  refreshClient();
  setupInstall();
  setupReveal();

  root.addEventListener('click', onClick);
  return store.on(refreshClient);
}

function setTono(i) {
  const [name, c] = SWATCHES[i];
  const el = document.getElementById('tono-name');
  if (el) el.textContent = name;
  const sec = document.getElementById('tonos');
  if (sec) sec.style.setProperty('--tone', c);
  document.querySelectorAll('.bottle').forEach((b, k) => b.classList.toggle('on', k === i));
}

function onClick(e) {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const act = t.dataset.act;
  if (act === 'book') openBooking(t.dataset.svc);
  else if (act === 'tono') setTono(+t.dataset.i);
  else if (act === 'cancel-mine') {
    const id = t.dataset.id;
    if (!confirm('¿Cancelar esta cita?')) return;
    store.update('appts', (a) => { const x = a.find((y) => y.id === id); if (x) x.status = 'Cancelada'; });
    toast('Tu cita fue cancelada.');
  } else if (act === 'hide-install') { store.set('pwaHide', true); }
}

/* ───────── Partes dinámicas ───────── */
function refreshClient() {
  const s = store.get('settings');
  const svcs = activeSvcs();
  const list = document.getElementById('svc-list');
  if (!list) return;
  list.innerHTML = svcs.map((v, i) => `
    <li><button class="menu-row reveal in" data-act="book" data-svc="${v.id}">
      <span class="menu-n">${ROMAN[i] || i + 1}</span>
      <span class="menu-main">
        <span class="menu-line"><span class="menu-name">${esc(v.name)}</span><span class="menu-dots" aria-hidden="true"></span><span class="menu-price">${money(v.price)}</span></span>
        <span class="menu-desc">${esc(v.desc)} <em>${v.min} min</em></span>
      </span>
    </button></li>`).join('') || '<li class="empty">Pronto publicaremos nuestra carta.</li>';

  const n = store.get('notices')[0];
  document.getElementById('notice').innerHTML = n
    ? `<aside class="notice">${icon('bell', 18)}<div><b>${esc(n.title)}</b>${n.body ? `<p>${esc(n.body)}</p>` : ''}</div></aside>` : '';

  document.getElementById('my-appts').innerHTML = renderMine();

  document.getElementById('f-hours').textContent = s.hours;
  document.getElementById('f-addr').textContent = s.address;
  document.getElementById('f-waze').href = `https://waze.com/ul?q=${encodeURIComponent(s.address)}`;
  document.getElementById('f-maps').href = `https://www.google.com/maps/search/${encodeURIComponent(s.address)}`;
  document.getElementById('wa').href = waLink(s.whatsapp, 'Hola Nail Club, quisiera información.');
}

function renderMine() {
  const mine = new Set(store.get('mine'));
  const now = todayYmd();
  const list = store.get('appts').filter((a) => mine.has(a.id)).sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1));
  if (!list.length) return '<p class="empty">Aún no tienes citas en este dispositivo. <button class="link" data-act="book">Reserva la primera</button>.</p>';
  return `<div class="appts">${list.map((a) => {
    const upcoming = a.date >= now && a.status === 'Confirmada';
    return `<article class="appt ${a.status === 'Cancelada' ? 'is-off' : ''}">
      <div class="appt-date"><b>${parseYmd(a.date).getDate()}</b><span>${parseYmd(a.date).toLocaleDateString('es-CR', { month: 'short' })}</span></div>
      <div class="appt-body">
        <h3>${esc(a.svcName)}</h3>
        <p>${fmtLong(a.date)} · ${esc(a.time)} · con ${esc(a.techName)}</p>
        <p class="muted">${icon('coffee', 14)} ${esc(a.drink)}</p>
      </div>
      <div class="appt-side"><span class="pill st-${a.status.replace(/\s/g, '').toLowerCase()}">${esc(a.status)}</span>
        ${upcoming ? `<button class="link" data-act="cancel-mine" data-id="${a.id}">Cancelar</button>` : ''}</div>
    </article>`;
  }).join('')}</div>`;
}

/* ───────── Instalación PWA ───────── */
function setupInstall() {
  let deferred = null;
  const box = document.getElementById('install');
  const draw = () => {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (store.get('pwaHide') || standalone) { box.innerHTML = ''; return; }
    const ios = /iphone|ipad/i.test(navigator.userAgent);
    box.innerHTML = `<aside class="notice notice-install">${icon('share', 18)}<div>
      <b>Lleva Nail Club en tu celular</b>
      <p>${ios ? 'En Safari toca Compartir y luego “Añadir a pantalla de inicio”.' : 'En Chrome abre el menú ⋮ y elige “Instalar app”.'}</p>
      ${deferred ? '<button class="btn btn-gold btn-sm" id="do-install">Instalar</button>' : ''}</div>
      <button class="icon-btn" data-act="hide-install" aria-label="Cerrar">${icon('x', 16)}</button></aside>`;
    document.getElementById('do-install')?.addEventListener('click', () => deferred.prompt());
  };
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; draw(); });
  store.on(draw);
  draw();
}

function setupReveal() {
  const els = document.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}

/* ───────── Reserva ───────── */
const STEP_TITLES = ['', '¿Qué te vas a hacer?', '¿Con quién?', '¿Cuándo?', 'Tu bebida de cortesía', 'Tus datos', 'Resumen de tu cita', 'Cita confirmada'];
let B;
let dlg;

function openBooking(svcId) {
  const svcs = activeSvcs();
  B = { step: 1, svc: svcs.find((s) => s.id === svcId)?.id || null, tech: null, date: null, time: null, drink: null, name: '', phone: '', error: '', done: null };
  if (B.svc) B.step = 2;
  dlg = document.getElementById('sheet');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'sheet';
    dlg.className = 'sheet';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', onSheetClick);
    dlg.addEventListener('input', onSheetInput);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }
  renderSheet();
  if (!dlg.open) dlg.showModal();
}

const svcOf = () => activeSvcs().find((s) => s.id === B.svc) || store.get('svcs').find((s) => s.id === B.svc);

function stepValid() {
  switch (B.step) {
    case 1: return !!B.svc;
    case 2: return !!B.tech;
    case 3: return !!(B.date && B.time);
    case 4: return !!B.drink;
    case 5: return B.name.trim().length >= 2 && cleanPhone(B.phone).length >= 8;
    default: return true;
  }
}

function renderSheet() {
  const sv = svcOf();
  const techs = activeTechs();
  let body = '';
  if (B.step === 1) {
    body = `<div class="opts">${activeSvcs().map((v) => `
      <button class="opt ${B.svc === v.id ? 'on' : ''}" data-s="svc" data-id="${v.id}">
        <span class="opt-top"><b>${esc(v.name)}</b><span>${money(v.price)}</span></span>
        <span class="opt-sub">${esc(v.desc)} · ${v.min} min</span></button>`).join('')}</div>`;
  } else if (B.step === 2) {
    body = `<div class="opts">
      <button class="opt ${B.tech === 't0' ? 'on' : ''}" data-s="tech" data-id="t0"><span class="opt-top"><b>Primera disponible</b></span><span class="opt-sub">Te asignamos a quien tenga espacio</span></button>
      ${techs.map((t) => `<button class="opt ${B.tech === t.id ? 'on' : ''}" data-s="tech" data-id="${t.id}"><span class="opt-top"><b>${esc(t.name)}</b></span><span class="opt-sub">${esc(t.spec)}</span></button>`).join('')}</div>`;
  } else if (B.step === 3) {
    const days = Array.from({ length: 21 }, (_, i) => addDays(new Date(), i));
    const strip = days.map((d) => {
      const key = ymd(d);
      const has = availableTimes(key, sv.min, B.tech).length > 0;
      return `<button class="day ${B.date === key ? 'on' : ''}" data-s="date" data-id="${key}" ${has ? '' : 'disabled'} aria-label="${fmtLong(key)}${has ? '' : ', sin disponibilidad'}">
        <small>${d.toLocaleDateString('es-CR', { weekday: 'short' })}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString('es-CR', { month: 'short' })}</small></button>`;
    }).join('');
    let times = '<p class="hint">Elige un día para ver los horarios.</p>';
    if (B.date) {
      const list = availableTimes(B.date, sv.min, B.tech);
      times = list.length
        ? `<div class="times">${list.map((t) => `<button class="chip ${B.time === t ? 'on' : ''}" data-s="time" data-id="${t}">${t}</button>`).join('')}</div>`
        : '<p class="hint">Sin horarios este día.</p>';
    }
    const any = days.some((d) => availableTimes(ymd(d), sv.min, B.tech).length);
    body = any
      ? `<div class="strip">${strip}</div>${times}`
      : '<p class="hint">Por ahora no hay horarios publicados para esta combinación. Prueba con otra especialista o escríbenos por WhatsApp.</p>';
  } else if (B.step === 4) {
    body = `<div class="coffee-box">${icon('coffee', 26)}<p>La tendremos lista cuando llegues.</p>
      <div class="times">${DRINKS.map((d) => `<button class="chip ${B.drink === d ? 'on' : ''}" data-s="drink" data-id="${esc(d)}">${esc(d)}</button>`).join('')}</div></div>`;
  } else if (B.step === 5) {
    body = `<form class="form" onsubmit="return false" autocomplete="on">
      <label>Nombre<input class="inp" name="name" autocomplete="name" value="${esc(B.name)}" placeholder="Tu nombre"></label>
      <label>Teléfono / WhatsApp<input class="inp" name="phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(B.phone)}" placeholder="8888 8888"></label>
      <p class="hint">Solo lo usamos para confirmar tu cita.</p></form>`;
  } else if (B.step >= 6) {
    const a = B.done;
    const techName = a ? a.techName : B.tech === 't0' ? 'Primera disponible' : techs.find((t) => t.id === B.tech)?.name || '';
    body = `<div class="summary">
      <p class="sum-svc">${esc(sv.name)}</p>
      <p>${fmtLong(B.date)}, ${esc(B.time)}</p>
      <p>Con ${esc(techName)}</p>
      <p>Bebida: ${esc(B.drink)}</p>
      <p>A nombre de ${esc(B.name)}</p>
      <p class="sum-price">${money(sv.price)}</p></div>
      ${B.step === 7 ? '<p class="ok">Te esperamos. Recibirás confirmación por WhatsApp si el equipo lo necesita.</p>' : ''}`;
  }

  const dots = Array.from({ length: 6 }, (_, i) => `<i class="${i < Math.min(B.step, 6) ? 'on' : ''}"></i>`).join('');
  dlg.innerHTML = `
    <div class="sheet-in">
      <div class="sheet-head"><h2>${STEP_TITLES[B.step]}</h2><button class="icon-btn" data-s="close" aria-label="Cerrar">${icon('x')}</button></div>
      <div class="progress" aria-hidden="true">${dots}</div>
      ${B.error ? `<p class="err" role="alert">${esc(B.error)}</p>` : ''}
      <div class="sheet-body">${body}</div>
      <div class="sheet-foot">
        ${B.step > 1 && B.step < 7 ? '<button class="btn btn-ghost" data-s="back">Atrás</button>' : '<span></span>'}
        ${B.step < 6 ? `<button class="btn btn-gold" id="next" data-s="next" ${stepValid() ? '' : 'disabled'}>Continuar</button>` : ''}
        ${B.step === 6 ? '<button class="btn btn-gold" data-s="confirm">Confirmar cita</button>' : ''}
        ${B.step === 7 ? '<div class="foot-btns"><button class="btn btn-ghost" data-s="ics">Añadir al calendario</button><button class="btn btn-gold" data-s="close">Listo</button></div>' : ''}
      </div>
    </div>`;
  dlg.querySelector('.sheet-body')?.scrollTo?.(0, 0);
}

function onSheetInput(e) {
  if (!e.target.name) return;
  B[e.target.name] = e.target.value;
  const next = dlg.querySelector('#next');
  if (next) next.disabled = !stepValid();
}

function onSheetClick(e) {
  const t = e.target.closest('[data-s]');
  if (!t) return;
  const k = t.dataset.s, id = t.dataset.id;
  B.error = '';
  if (k === 'close') return dlg.close();
  if (k === 'svc') { B.svc = id; B.time = null; B.date = null; }
  else if (k === 'tech') { B.tech = id; B.time = null; B.date = null; }
  else if (k === 'date') { B.date = id; B.time = null; }
  else if (k === 'time') B.time = id;
  else if (k === 'drink') B.drink = id;
  else if (k === 'back') B.step -= 1;
  else if (k === 'next') { if (!stepValid()) return; B.step += 1; }
  else if (k === 'confirm') return confirmBooking();
  else if (k === 'ics') return downloadIcs();
  renderSheet();
}

function confirmBooking() {
  const sv = svcOf();
  // Revalidar por si otra persona tomó el espacio mientras tanto
  const free = freeTechs(B.date, B.time, sv.min, B.tech);
  if (!free.length) {
    B.error = 'Ese horario acaba de ocuparse. Elige otro, por favor.';
    B.step = 3; B.time = null;
    return renderSheet();
  }
  const tech = free[0];
  const a = {
    id: uid('a'), created: Date.now(), svc: sv.id, svcName: sv.name, price: sv.price, min: sv.min,
    tech: tech.id, techName: tech.name, date: B.date, time: B.time, drink: B.drink,
    name: B.name.trim(), phone: B.phone.trim(), status: 'Confirmada',
  };
  store.update('appts', (list) => { list.push(a); });
  store.update('mine', (m) => { m.push(a.id); });
  B.done = a;
  B.step = 7;
  renderSheet();
}

function downloadIcs() {
  const sv = svcOf();
  const pad = (n) => String(n).padStart(2, '0');
  const start = B.date.replace(/-/g, '') + 'T' + B.time.replace(':', '') + '00';
  const endMin = toMin(B.time) + sv.min;
  const end = B.date.replace(/-/g, '') + 'T' + pad(Math.floor(endMin / 60) % 24) + pad(endMin % 60) + '00';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nail Club//ES', 'BEGIN:VEVENT', `UID:${B.done?.id || uid()}@nailclub`,
    `DTSTAMP:${stamp}`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:Nail Club · ${sv.name}`,
    `LOCATION:${store.get('settings').address}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'nail-club.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
