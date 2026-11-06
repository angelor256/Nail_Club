// Nail Club · panel de administración (agenda, disponibilidad, equipo, servicios, avisos, ajustes)
import {
  store, STATUSES, STD_TIMES, DAYS_ES, esc, money, icon, toast, uid, ymd, addDays, parseYmd, fmtLong,
  todayYmd, slotsFor, normTime, waLink, cleanPhone,
} from './core.js';

const TABS = ['Agenda', 'Disponibilidad', 'Equipo', 'Servicios', 'Avisos', 'Ajustes'];
const ui = { tab: 'Agenda', filter: 'Próximas', month: new Date(new Date().getFullYear(), new Date().getMonth(), 1), sel: null, weekday: 1 };

const unlocked = () => { try { return sessionStorage.getItem('nc2_unlock') === '1'; } catch { return false; } };
const setUnlocked = (v) => { try { v ? sessionStorage.setItem('nc2_unlock', '1') : sessionStorage.removeItem('nc2_unlock'); } catch { /* ignorar */ } };

export function mountAdmin(root) {
  const draw = () => {
    // No redibujar mientras se escribe en un campo (evita perder el foco)
    if (root.contains(document.activeElement) && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName) && document.activeElement.dataset.live) return;
    root.innerHTML = unlocked() ? panel() : lock();
  };
  draw();
  root.addEventListener('click', (e) => onClick(e, draw));
  root.addEventListener('change', (e) => onChange(e));
  root.addEventListener('submit', (e) => onSubmit(e, draw));
  return store.on(draw);
}

const lock = () => `
  <main class="admin admin-lock grain">
    <form class="lock-card" data-form="pin">
      <span class="lock-ico">${icon('lock', 26)}</span>
      <h1>Acceso <em>equipo</em></h1>
      <p>Ingresa el PIN para administrar la agenda.</p>
      <input class="inp" name="pin" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN" aria-label="PIN" autofocus>
      <p class="err" id="pin-err" role="alert" hidden>PIN incorrecto</p>
      <button class="btn btn-gold" type="submit">Entrar</button>
      <a class="link" href="#">← Volver a la vista clienta</a>
    </form>
  </main>`;

const panel = () => `
  <main class="admin">
    <header class="admin-head">
      <div><p class="kicker">Atelier · Panel</p><h1>Administración</h1></div>
      <div class="admin-actions"><a class="btn btn-ghost btn-sm" href="#">Vista clienta</a><button class="btn btn-ghost btn-sm" data-act="logout">Salir</button></div>
    </header>
    <div class="tabs" role="tablist">${TABS.map((t) => `<button role="tab" aria-selected="${ui.tab === t}" class="chip ${ui.tab === t ? 'on' : ''}" data-act="tab" data-v="${t}">${t}</button>`).join('')}</div>
    <section class="admin-body">${({ Agenda: agenda, Disponibilidad: disponibilidad, Equipo: equipo, Servicios: servicios, Avisos: avisos, Ajustes: ajustes })[ui.tab]()}</section>
  </main>`;

/* ───────── Agenda ───────── */
function agenda() {
  const all = store.get('appts');
  const now = todayYmd();
  const live = all.filter((a) => a.status !== 'Cancelada');
  const hoy = live.filter((a) => a.date === now).length;
  const prox = live.filter((a) => a.date >= now);
  const ingreso = prox.reduce((s, a) => s + (a.price || 0), 0);
  let list = [...all].sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1));
  if (ui.filter === 'Próximas') list = list.filter((a) => a.date >= now);
  if (ui.filter === 'Pasadas') list = list.filter((a) => a.date < now).reverse();
  let last = '';
  const rows = list.map((a) => {
    const head = a.date !== last ? `<h3 class="day-head">${fmtLong(a.date)}${a.date === now ? ' · <em>hoy</em>' : ''}</h3>` : '';
    last = a.date;
    const ph = cleanPhone(a.phone);
    return `${head}<article class="card appt-adm ${a.status === 'Cancelada' ? 'is-off' : ''}">
      <div class="appt-time">${esc(a.time)}</div>
      <div class="appt-adm-body">
        <h4>${esc(a.svcName)} <span class="muted">· ${money(a.price)} · ${a.min || ''} min</span></h4>
        <p><b>${esc(a.name || 'Sin nombre')}</b>${ph ? ` · <a class="link" href="tel:${ph}">${esc(a.phone)}</a> · <a class="link" target="_blank" rel="noopener" href="${waLink(ph.length === 8 ? '506' + ph : ph, `Hola ${a.name || ''}, te escribimos de Nail Club sobre tu cita del ${fmtLong(a.date)} a las ${a.time}.`)}">WhatsApp</a>` : ''}</p>
        <p class="muted">Con ${esc(a.techName || '—')} · ${icon('coffee', 13)} Preparar: ${esc(a.drink)}</p>
      </div>
      <div class="appt-adm-side">
        <select class="inp inp-sm" data-change="status" data-id="${a.id}" aria-label="Estado">${STATUSES.map((s) => `<option ${a.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <button class="icon-btn" data-act="del-appt" data-id="${a.id}" aria-label="Eliminar cita">${icon('trash', 16)}</button>
      </div>
    </article>`;
  }).join('');
  return `
    <div class="stats"><div><b>${hoy}</b><span>Citas hoy</span></div><div><b>${prox.length}</b><span>Próximas</span></div><div><b>${money(ingreso)}</b><span>Ingreso estimado</span></div></div>
    <div class="tabs sub">${['Próximas', 'Pasadas', 'Todas'].map((f) => `<button class="chip ${ui.filter === f ? 'on' : ''}" data-act="filter" data-v="${f}">${f}</button>`).join('')}</div>
    ${rows || '<p class="empty">Sin citas aquí todavía. Las que se reserven en la vista clienta aparecerán en esta lista. Puedes cargar ejemplos desde Ajustes.</p>'}`;
}

/* ───────── Disponibilidad ───────── */
function timeChips(selected, attr, extra = '') {
  const set = new Set(selected);
  const all = [...new Set([...STD_TIMES, ...selected])].sort();
  return `<div class="times">${all.map((t) => `<button class="chip ${set.has(t) ? 'on' : ''}" data-act="${attr}" data-t="${t}" ${extra} aria-pressed="${set.has(t)}">${t}</button>`).join('')}</div>`;
}

function disponibilidad() {
  const av = store.get('avail');
  const wk = av.weekly[ui.weekday] || [];
  const m = ui.month;
  const first = new Date(m.getFullYear(), m.getMonth(), 1);
  const dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // semana inicia en lunes
  const now = todayYmd();
  const booked = store.get('appts').filter((a) => a.status !== 'Cancelada');
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span></span>');
  for (let d = 1; d <= dim; d++) {
    const key = ymd(new Date(m.getFullYear(), m.getMonth(), d, 12));
    const n = slotsFor(key).length;
    const past = key < now;
    const ov = av.overrides[key] !== undefined;
    const bk = booked.filter((a) => a.date === key).length;
    cells.push(`<button class="cal-day ${ui.sel === key ? 'on' : ''} ${past ? 'past' : ''} ${n ? 'open' : 'shut'} ${ov ? 'ov' : ''}" data-act="pick-day" data-d="${key}" ${past ? 'disabled' : ''} aria-label="${fmtLong(key)}: ${n} horarios${bk ? ', ' + bk + ' citas' : ''}">
      <b>${d}</b><small>${n ? n + ' h' : 'cerr.'}</small>${bk ? `<i class="dot" title="${bk} citas"></i>` : ''}</button>`);
  }
  let dayPanel = '<p class="hint">Toca un día del calendario para abrir, cerrar o ajustar sus horarios.</p>';
  if (ui.sel) {
    const sl = slotsFor(ui.sel);
    const ov = av.overrides[ui.sel] !== undefined;
    const bookedTimes = booked.filter((a) => a.date === ui.sel).map((a) => `${a.time} (${esc(a.name || 's/n')})`);
    dayPanel = `
      <h3>${fmtLong(ui.sel)}</h3>
      <p class="muted">${ov ? 'Horario personalizado para este día.' : 'Usa el horario base del ' + DAYS_ES[parseYmd(ui.sel).getDay()].toLowerCase() + '.'}${bookedTimes.length ? ' Citas: ' + bookedTimes.join(', ') + '.' : ''}</p>
      ${timeChips(sl, 'tog-day-time')}
      <form class="add-time" data-form="add-day-time"><input class="inp inp-sm" type="time" name="t" step="900" required aria-label="Hora personalizada"><button class="btn btn-ghost btn-sm" type="submit">${icon('plus', 14)} Añadir hora</button></form>
      <div class="row-btns">
        <button class="btn btn-ghost btn-sm" data-act="close-day">Cerrar este día</button>
        <button class="btn btn-ghost btn-sm" data-act="open-day">Abrir con horario base</button>
        ${ov ? '<button class="btn btn-ghost btn-sm" data-act="reset-day">Restablecer</button>' : ''}
      </div>`;
  }
  return `
    <div class="card pad">
      <h3>Fechas específicas</h3>
      <p class="muted">Publica, cierra o ajusta los horarios disponibles de cualquier día. Un punto dorado marca días con citas.</p>
      <div class="cal-nav"><button class="icon-btn" data-act="month" data-v="-1" aria-label="Mes anterior">${icon('left')}</button>
        <b>${m.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })}</b>
        <button class="icon-btn" data-act="month" data-v="1" aria-label="Mes siguiente">${icon('right')}</button></div>
      <div class="cal-grid" role="grid"><span class="cal-h">L</span><span class="cal-h">M</span><span class="cal-h">M</span><span class="cal-h">J</span><span class="cal-h">V</span><span class="cal-h">S</span><span class="cal-h">D</span>${cells.join('')}</div>
      <div class="day-panel">${dayPanel}</div>
    </div>
    <div class="card pad">
      <h3>Horario semanal base</h3>
      <p class="muted">Se aplica a todos los días que no tengan un horario personalizado.</p>
      <div class="tabs sub">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button class="chip ${ui.weekday === d ? 'on' : ''}" data-act="weekday" data-v="${d}">${DAYS_ES[d].slice(0, 3)}</button>`).join('')}</div>
      <p class="muted">${DAYS_ES[ui.weekday]}: ${wk.length ? wk.length + ' horarios' : 'cerrado'}</p>
      ${timeChips(wk, 'tog-week-time')}
      <form class="add-time" data-form="add-week-time"><input class="inp inp-sm" type="time" name="t" step="900" required aria-label="Hora personalizada"><button class="btn btn-ghost btn-sm" type="submit">${icon('plus', 14)} Añadir hora</button></form>
      <div class="row-btns"><button class="btn btn-ghost btn-sm" data-act="copy-week">Copiar este horario a lunes–sábado</button><button class="btn btn-ghost btn-sm" data-act="clear-week">Cerrar los ${DAYS_ES[ui.weekday].toLowerCase()}</button></div>
    </div>`;
}

/* ───────── Equipo ───────── */
function equipo() {
  const techs = store.get('techs');
  return `<div class="stack">${techs.map((t) => `
    <div class="card pad row">
      <div class="grow"><input class="inp" data-change="tech-name" data-id="${t.id}" value="${esc(t.name)}" aria-label="Nombre"><input class="inp inp-sm" data-change="tech-spec" data-id="${t.id}" value="${esc(t.spec)}" aria-label="Especialidad"></div>
      <label class="switch"><input type="checkbox" data-change="tech-active" data-id="${t.id}" ${t.active !== false ? 'checked' : ''}><span>Activa</span></label>
      <button class="icon-btn" data-act="del-tech" data-id="${t.id}" aria-label="Eliminar">${icon('trash', 16)}</button>
    </div>`).join('') || '<p class="empty">Aún no hay especialistas. Sin especialistas activas no se puede reservar.</p>'}
    <form class="card pad row" data-form="add-tech"><input class="inp" name="name" placeholder="Nombre de la nail tech" required><input class="inp" name="spec" placeholder="Especialidad (opcional)"><button class="btn btn-gold" type="submit" aria-label="Agregar">${icon('plus', 16)}</button></form></div>`;
}

/* ───────── Servicios ───────── */
function servicios() {
  const svcs = store.get('svcs');
  return `<div class="stack">${svcs.map((s) => `
    <div class="card pad svc-edit">
      <input class="inp" data-change="svc-name" data-id="${s.id}" value="${esc(s.name)}" aria-label="Nombre">
      <input class="inp inp-sm" data-change="svc-desc" data-id="${s.id}" value="${esc(s.desc)}" aria-label="Descripción">
      <div class="row">
        <label class="lbl">₡<input type="number" min="0" step="500" class="inp inp-sm" data-change="svc-price" data-id="${s.id}" value="${s.price}" aria-label="Precio"></label>
        <label class="lbl"><input type="number" min="15" step="15" class="inp inp-sm" data-change="svc-min" data-id="${s.id}" value="${s.min}" aria-label="Minutos"> min</label>
        <label class="switch"><input type="checkbox" data-change="svc-active" data-id="${s.id}" ${s.active !== false ? 'checked' : ''}><span>Visible</span></label>
        <button class="icon-btn" data-act="del-svc" data-id="${s.id}" aria-label="Eliminar">${icon('trash', 16)}</button>
      </div>
    </div>`).join('')}
    <form class="card pad svc-edit" data-form="add-svc">
      <input class="inp" name="name" placeholder="Nuevo servicio" required>
      <input class="inp inp-sm" name="desc" placeholder="Descripción">
      <div class="row"><label class="lbl">₡<input class="inp inp-sm" name="price" type="number" min="0" step="500" value="10000"></label><label class="lbl"><input class="inp inp-sm" name="min" type="number" min="15" step="15" value="60"> min</label><button class="btn btn-gold" type="submit">${icon('plus', 16)} Agregar</button></div>
    </form></div>`;
}

/* ───────── Avisos ───────── */
function avisos() {
  const list = store.get('notices');
  return `<form class="card pad stack" data-form="add-notice">
      <input class="inp" name="title" placeholder="Título" required>
      <textarea class="inp" name="body" rows="3" placeholder="¡Nuevos tonos de temporada! Agenda tu cita ✨"></textarea>
      <button class="btn btn-gold" type="submit">Publicar aviso</button>
      <p class="muted sm">En el demo el aviso aparece en la vista clienta. El push real requiere un backend (Supabase + VAPID).</p>
    </form>
    ${list.map((n, i) => `<div class="card pad row"><div class="grow"><b>${esc(n.title)}</b><p class="muted">${esc(n.body)}</p></div><button class="icon-btn" data-act="del-notice" data-i="${i}" aria-label="Eliminar aviso">${icon('trash', 16)}</button></div>`).join('')}`;
}

/* ───────── Ajustes ───────── */
function ajustes() {
  const s = store.get('settings');
  return `<form class="card pad stack" data-form="settings">
      <label>WhatsApp del salón (formato internacional, sin +)<input class="inp" name="whatsapp" value="${esc(s.whatsapp)}" inputmode="numeric"></label>
      <label>Dirección (para Waze y Google Maps)<input class="inp" name="address" value="${esc(s.address)}"></label>
      <label>Horario (texto del pie de página)<input class="inp" name="hours" value="${esc(s.hours)}"></label>
      <label>PIN de acceso al panel<input class="inp" name="pin" value="${esc(s.pin)}" inputmode="numeric" minlength="4" required></label>
      <button class="btn btn-gold" type="submit">Guardar ajustes</button>
    </form>
    <div class="card pad stack">
      <h3>Herramientas de demo</h3>
      <p class="muted">Los datos viven en este navegador. Útil para mostrar la app a las dueñas.</p>
      <div class="row-btns"><button class="btn btn-ghost" data-act="seed">Cargar citas de ejemplo</button><button class="btn btn-ghost danger" data-act="reset">Restablecer todo</button></div>
    </div>`;
}

/* ───────── Eventos ───────── */
function setSlots(date, fn) {
  store.update('avail', (a) => { const cur = slotsFor(date); a.overrides[date] = fn(cur).sort(); });
}
const toggle = (arr, t) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]);

function onClick(e, draw) {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, id = el.dataset.id, v = el.dataset.v;
  const days = [1, 2, 3, 4, 5, 6, 0];
  switch (a) {
    case 'tab': ui.tab = v; draw(); break;
    case 'filter': ui.filter = v; draw(); break;
    case 'logout': setUnlocked(false); draw(); break;
    case 'del-appt': if (confirm('¿Eliminar esta cita definitivamente?')) store.update('appts', (l) => l.filter((x) => x.id !== id)); break;
    case 'month': ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() + +v, 1); draw(); break;
    case 'pick-day': ui.sel = el.dataset.d; draw(); break;
    case 'weekday': ui.weekday = +v; draw(); break;
    case 'tog-day-time': setSlots(ui.sel, (c) => toggle(c, el.dataset.t)); break;
    case 'close-day': setSlots(ui.sel, () => []); toast('Día cerrado'); break;
    case 'open-day': store.update('avail', (x) => { delete x.overrides[ui.sel]; x.overrides[ui.sel] = [...(x.weekly[parseYmd(ui.sel).getDay()] || [])]; }); break;
    case 'reset-day': store.update('avail', (x) => { delete x.overrides[ui.sel]; }); break;
    case 'tog-week-time': store.update('avail', (x) => { x.weekly[ui.weekday] = toggle(x.weekly[ui.weekday] || [], el.dataset.t).sort(); }); break;
    case 'clear-week': store.update('avail', (x) => { x.weekly[ui.weekday] = []; }); break;
    case 'copy-week': store.update('avail', (x) => { days.slice(0, 6).forEach((d) => { x.weekly[d] = [...(x.weekly[ui.weekday] || [])]; }); }); toast('Horario copiado a lunes–sábado'); break;
    case 'del-tech': if (confirm('¿Eliminar esta especialista? Sus citas existentes se conservan.')) store.update('techs', (l) => l.filter((x) => x.id !== id)); break;
    case 'del-svc': if (confirm('¿Eliminar este servicio?')) store.update('svcs', (l) => l.filter((x) => x.id !== id)); break;
    case 'del-notice': store.update('notices', (l) => l.filter((_, i) => i !== +el.dataset.i)); break;
    case 'seed': seed(); break;
    case 'reset': if (confirm('Esto borra citas, horarios, equipo y servicios de este navegador. ¿Continuar?')) { store.resetAll(); toast('Datos restablecidos'); } break;
    default:
  }
}

function onChange(e) {
  const el = e.target;
  const k = el.dataset.change;
  if (!k) return;
  const id = el.dataset.id;
  const edit = (key, fn) => store.update(key, (l) => { const x = l.find((y) => y.id === id); if (x) fn(x); });
  switch (k) {
    case 'status': edit('appts', (x) => { x.status = el.value; }); break;
    case 'tech-name': edit('techs', (x) => { x.name = el.value.trim() || x.name; }); break;
    case 'tech-spec': edit('techs', (x) => { x.spec = el.value.trim(); }); break;
    case 'tech-active': edit('techs', (x) => { x.active = el.checked; }); break;
    case 'svc-name': edit('svcs', (x) => { x.name = el.value.trim() || x.name; }); break;
    case 'svc-desc': edit('svcs', (x) => { x.desc = el.value.trim(); }); break;
    case 'svc-price': edit('svcs', (x) => { x.price = Math.max(0, +el.value || 0); }); break;
    case 'svc-min': edit('svcs', (x) => { x.min = Math.max(15, +el.value || 60); }); break;
    case 'svc-active': edit('svcs', (x) => { x.active = el.checked; }); break;
    default:
  }
}

function onSubmit(e, draw) {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  switch (f.dataset.form) {
    case 'pin':
      if (d.pin === store.get('settings').pin) { setUnlocked(true); draw(); }
      else { const er = document.getElementById('pin-err'); er.hidden = false; f.pin.value = ''; f.pin.focus(); }
      break;
    case 'add-day-time': if (d.t) setSlots(ui.sel, (c) => [...new Set([...c, normTime(d.t)])]); break;
    case 'add-week-time': if (d.t) store.update('avail', (x) => { x.weekly[ui.weekday] = [...new Set([...(x.weekly[ui.weekday] || []), normTime(d.t)])].sort(); }); break;
    case 'add-tech': store.update('techs', (l) => { l.push({ id: uid('t'), name: d.name.trim(), spec: (d.spec || '').trim() || 'Nueva especialista', active: true }); }); break;
    case 'add-svc': store.update('svcs', (l) => { l.push({ id: uid('s'), name: d.name.trim(), desc: (d.desc || '').trim(), price: Math.max(0, +d.price || 0), min: Math.max(15, +d.min || 60), active: true }); }); break;
    case 'add-notice':
      store.update('notices', (l) => { l.unshift({ title: d.title.trim(), body: (d.body || '').trim() }); });
      if ('Notification' in window && Notification.permission === 'granted') new Notification(d.title, { body: d.body });
      toast('Aviso publicado');
      break;
    case 'settings': {
      const pin = String(d.pin || '').trim();
      if (pin.length < 4) return toast('El PIN debe tener al menos 4 dígitos');
      store.set('settings', { whatsapp: cleanPhone(d.whatsapp), address: d.address.trim(), hours: d.hours.trim(), pin });
      toast('Ajustes guardados');
      break;
    }
    default:
  }
}

function seed() {
  const techs = store.get('techs');
  const svcs = store.get('svcs');
  if (!techs.length || !svcs.length) return toast('Agrega al menos un servicio y una especialista');
  const names = ['Andrea Mora', 'Priscilla Rojas', 'Karla Solís', 'María Vargas', 'Lucía Jiménez'];
  const drinks = ['Capuchino', 'Flat White', 'Té caliente', 'Latte Macchiato', 'Espresso'];
  const slots = ['10:00', '11:00', '13:00', '14:00', '15:00'];
  const list = names.map((n, i) => {
    const sv = svcs[i % svcs.length], t = techs[i % techs.length];
    return { id: uid('a'), created: Date.now(), svc: sv.id, svcName: sv.name, price: sv.price, min: sv.min, tech: t.id, techName: t.name,
      date: ymd(addDays(new Date(), i % 3 === 0 ? 0 : i)), time: slots[i], drink: drinks[i], name: n, phone: '8' + String(7000000 + i * 111111), status: i === 3 ? 'En proceso' : 'Confirmada' };
  });
  store.update('appts', (l) => { l.push(...list); });
  toast('Citas de ejemplo cargadas');
}
