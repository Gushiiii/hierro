'use strict';
/* Hierro · registro de entrenamiento de gimnasio.
   Todo vive en el teléfono: IndexedDB como almacenamiento principal y localStorage como copia. */

const VERSION = '1.0.0';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round2 = v => Math.round(v * 100) / 100;
const DAY = 864e5;
const LB = 2.2046226218;
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pid = n => 'p-' + slug(n);
const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();

/* ---------- Iconos ---------- */
const ICONS = {
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
  calendar: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  chart: 'M4 4v16h16M8 15l4-5 3 3 5-6',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5a2 2 0 1 0 0 4a2 2 0 1 0 0-4M9 15a2 2 0 1 0 0 4a2 2 0 1 0 0-4',
  plus: 'M12 5v14M5 12h14',
  play: 'M8 5.5v13l11-6.5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  x: 'M6 6l12 12M18 6L6 18',
  down: 'M6 9l6 6 6-6',
  up: 'M6 15l6-6 6 6',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2M9 2h6',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4v3h-4z',
  flame: 'M12 3c.5 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.6 1 2.6 2 3 0-3-.5-5.5.5-8.5z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 10l5-5 5 5M5 20h14',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  scale: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 10a3.5 3.5 0 0 1 7 0zM12 10l1.2-2',
  note: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h3',
  swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  share: 'M12 15V3M7 8l5-5 5 5M5 12v8h14v-8',
  disc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  calc: 'M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  arrowDown: 'M12 5v14M6 13l6 6 6-6',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

/* ---------- Datos base ---------- */
const MUSCLES = {
  pecho: { n: 'Pecho', c: '#e5484d' },
  espalda: { n: 'Espalda', c: '#3e7bfa' },
  hombros: { n: 'Hombros', c: '#e9a21f' },
  biceps: { n: 'Bíceps', c: '#2fbf71' },
  triceps: { n: 'Tríceps', c: '#14b3a3' },
  cuads: { n: 'Cuádriceps', c: '#9b6cf0' },
  femoral: { n: 'Femoral', c: '#e56aaa' },
  gluteos: { n: 'Glúteos', c: '#ee8436' },
  pantorrillas: { n: 'Pantorrillas', c: '#7f93b3' },
  abdomen: { n: 'Abdomen', c: '#b8c23f' },
  otro: { n: 'Otro', c: '#8f97a5' },
};
const PRESET = {
  pecho: ['Press de banca con barra', 'Press inclinado con barra', 'Press de banca con mancuernas', 'Press inclinado con mancuernas', 'Press declinado', 'Aperturas con mancuernas', 'Cruce de poleas', 'Pec deck', 'Press de pecho en máquina', 'Fondos en paralelas', 'Flexiones'],
  espalda: ['Dominadas', 'Jalón al pecho', 'Remo con barra', 'Remo con mancuerna', 'Remo en polea baja', 'Remo en máquina', 'Peso muerto', 'Pullover en polea', 'Encogimientos', 'Hiperextensiones'],
  hombros: ['Press militar con barra', 'Press de hombros con mancuernas', 'Press de hombros en máquina', 'Elevaciones laterales', 'Elevaciones laterales en polea', 'Elevaciones frontales', 'Pájaros', 'Face pull', 'Remo al mentón'],
  biceps: ['Curl con barra', 'Curl con mancuernas', 'Curl martillo', 'Curl predicador', 'Curl en polea', 'Curl concentrado'],
  triceps: ['Extensión de tríceps en polea', 'Press francés', 'Extensión sobre la cabeza', 'Press cerrado', 'Patada de tríceps', 'Fondos en banco'],
  cuads: ['Sentadilla con barra', 'Sentadilla frontal', 'Sentadilla hack', 'Prensa de piernas', 'Extensión de cuádriceps', 'Zancadas', 'Sentadilla búlgara', 'Sentadilla goblet'],
  femoral: ['Peso muerto rumano', 'Curl femoral tumbado', 'Curl femoral sentado', 'Buenos días'],
  gluteos: ['Hip thrust', 'Puente de glúteo', 'Patada de glúteo en polea', 'Abducción en máquina'],
  pantorrillas: ['Elevación de talones de pie', 'Elevación de talones sentado'],
  abdomen: ['Crunch', 'Crunch en polea', 'Elevación de piernas colgado', 'Rueda abdominal', 'Plancha', 'Russian twist'],
};
const ROUTINE_COLORS = ['#e5484d', '#3e7bfa', '#e9a21f', '#2fbf71', '#9b6cf0', '#ee8436'];
const SET_TYPES = { n: { l: 'Normal', s: '' }, w: { l: 'Calentamiento', s: 'C' }, d: { l: 'Drop set', s: 'D' }, f: { l: 'Al fallo', s: 'F' } };
const REST_OPTS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
const LOG_KINDS = { entreno: 'Entrenos', serie: 'Series', rutina: 'Rutinas', ejercicio: 'Ejercicios', peso: 'Peso corporal', datos: 'Datos', ajustes: 'Ajustes' };
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function defaultExercises() {
  return Object.entries(PRESET).flatMap(([m, list]) => list.map(n => ({ id: pid(n), name: n, muscle: m })));
}
function seedRoutines() {
  const mk = (name, color, list) => ({
    id: uid(), name, color, note: '', created: Date.now(), updated: Date.now(),
    items: list.map(([n, sets, reps, rest]) => ({ id: uid(), ex: pid(n), sets, reps, rest })),
  });
  return [
    mk('Empuje', '#e5484d', [['Press de banca con barra', 4, '6-8', 150], ['Press inclinado con mancuernas', 3, '8-10', 120], ['Press militar con barra', 3, '8-10', 120], ['Elevaciones laterales', 3, '12-15', 60], ['Extensión de tríceps en polea', 3, '10-12', 60]]),
    mk('Tirón', '#3e7bfa', [['Dominadas', 4, '6-10', 150], ['Remo con barra', 3, '8-10', 120], ['Jalón al pecho', 3, '10-12', 90], ['Face pull', 3, '15', 60], ['Curl con barra', 3, '8-12', 60], ['Curl martillo', 2, '10-12', 60]]),
    mk('Pierna', '#2fbf71', [['Sentadilla con barra', 4, '5-8', 180], ['Peso muerto rumano', 3, '8-10', 150], ['Prensa de piernas', 3, '10-12', 120], ['Curl femoral tumbado', 3, '10-12', 75], ['Elevación de talones de pie', 4, '12-15', 60]]),
  ];
}
function freshState() {
  return {
    v: 1, savedAt: 0, created: Date.now(),
    settings: { unit: 'kg', rest: 90, sound: true, wake: true, suggest: true, theme: 'auto', weekGoal: 3, barKg: 20, barLb: 45, lastBackup: 0, installHidden: false, welcomeHidden: false },
    exercises: defaultExercises(), routines: seedRoutines(), sessions: [], active: null, body: [], log: [],
  };
}
function normalize(st) {
  const base = freshState();
  if (!st || typeof st !== 'object') return base;
  const out = { ...base, ...st };
  delete out.app; delete out.exported; delete out.version;
  out.settings = { ...base.settings, ...(st.settings || {}) };
  for (const k of ['exercises', 'routines', 'sessions', 'body', 'log']) if (!Array.isArray(out[k])) out[k] = base[k];
  const ids = new Set(out.exercises.map(e => e.id));
  for (const e of base.exercises) if (!ids.has(e.id)) out.exercises.push(e);
  out.sessions.sort((a, b) => a.start - b.start);
  out.body.sort((a, b) => a.t - b.t);
  if (out.active && !Array.isArray(out.active.items)) out.active = null;
  return out;
}

/* ---------- Almacenamiento ---------- */
const DB = {
  idb: null,
  async init() {
    try {
      this.idb = await new Promise((res, rej) => {
        const r = indexedDB.open('hierro', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.onblocked = () => rej(new Error('blocked'));
      });
    } catch (e) { this.idb = null; }
  },
  idbGet(k) {
    if (!this.idb) return Promise.resolve(null);
    return new Promise(res => {
      try { const r = this.idb.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result ?? null); r.onerror = () => res(null); }
      catch (e) { res(null); }
    });
  },
  idbSet(k, v) {
    if (!this.idb) return Promise.resolve(false);
    return new Promise(res => {
      try {
        const tx = this.idb.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(v, k);
        tx.oncomplete = () => res(true); tx.onerror = () => res(false); tx.onabort = () => res(false);
      } catch (e) { res(false); }
    });
  },
  lsGet(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
  lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  async load() {
    const a = await this.idbGet('state'), b = this.lsGet('hierro.state');
    if (a && b) return (b.savedAt || 0) > (a.savedAt || 0) ? b : a;
    return a || b;
  },
  async save(st) {
    st.savedAt = Date.now();
    const snap = clone(st);
    // localStorage primero: es síncrono y sobrevive aunque iOS cierre la app justo después.
    const ok2 = this.lsSet('hierro.state', snap);
    const ok1 = await this.idbSet('state', snap);
    return ok1 || ok2;
  },
};

let S = null;
let saveTimer = null, saveFailed = false, persisted = false;
function persist(now) {
  clearTimeout(saveTimer);
  if (now) return flush();
  saveTimer = setTimeout(flush, 150);
}
async function flush() {
  clearTimeout(saveTimer); saveTimer = null;
  if (!S) return;
  const ok = await DB.save(S);
  if (!ok && !saveFailed) toast('No se pudo guardar en el teléfono. Exporta un respaldo desde Ajustes.', 'bad');
  saveFailed = !ok;
}
function logEv(k, m) {
  S.log.push({ t: Date.now(), k, m });
  if (S.log.length > 5000) S.log.splice(0, S.log.length - 5000);
}

/* ---------- Unidades y formato ---------- */
const U = () => S.settings.unit;
const toDisp = kg => (U() === 'lb' ? kg * LB : kg);
const fromDisp = v => (U() === 'lb' ? v / LB : v);
const nf = (v, d = 1) => Number(v).toLocaleString('es', { maximumFractionDigits: d });
const fmtW = kg => nf(round2(toDisp(kg || 0)), 2);
const fmtWU = kg => `${fmtW(kg)} ${U()}`;
const fmt1RM = kg => `${nf(toDisp(kg || 0), 1)} ${U()}`;
const numStr = kg => (kg == null || kg === '' ? '' : String(round2(toDisp(kg))).replace('.', ','));
const parseNum = s => { const v = parseFloat(String(s ?? '').replace(',', '.')); return Number.isFinite(v) ? v : null; };
const compact = v => (v >= 1e6 ? nf(v / 1e6, 1) + 'M' : v >= 1000 ? nf(v / 1000, v >= 1e5 ? 0 : 1) + 'k' : nf(v, 0));
const fmtVol = kg => `${nf(Math.round(toDisp(kg)), 0)} ${U()}`;
const pad = n => String(n).padStart(2, '0');
function fmtClock(ms, countdown) {
  let s = countdown ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  s = Math.max(0, s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
}
function fmtDur(ms) {
  const m = Math.max(1, Math.round(ms / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${pad(m % 60)} min`;
}
const fmtRest = s => (s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)}:${pad(s % 60)} min` : `${s / 60} min`);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fmtDateLong = t => cap(new Date(t).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }));
const fmtDate = t => {
  const d = new Date(t);
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }).replace('.', '');
};
const fmtTime = t => new Date(t).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayKey = t => isoDate(new Date(t));
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const weekStart = t => { const x = new Date(t); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
function rel(t) {
  const d = Math.round((startOfDay(Date.now()) - startOfDay(t)) / DAY);
  if (d <= 0) return 'hoy';
  if (d === 1) return 'ayer';
  if (d < 7) return `hace ${d} días`;
  if (d < 14) return 'hace 1 semana';
  if (d < 60) return `hace ${Math.floor(d / 7)} semanas`;
  return 'el ' + fmtDate(t);
}
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const repsTop = s => { const n = String(s || '').match(/\d+/g); return n ? Math.max(...n.map(Number)) : 0; };

/* ---------- Cálculos ---------- */
const exById = id => S.exercises.find(e => e.id === id) || { id, name: 'Ejercicio eliminado', muscle: 'otro' };
const exName = id => exById(id).name;
const muscleOf = id => MUSCLES[exById(id).muscle] || MUSCLES.otro;
const e1rm = (w, r) => (!w || !r ? 0 : r === 1 ? w : w * (1 + r / 30));
const isWork = s => s.type !== 'w';
function sessVolume(sess) {
  let v = 0;
  for (const it of sess.items) for (const s of it.sets) if (s.done !== false && isWork(s)) v += (s.w || 0) * (s.r || 0);
  return v;
}
const sessSets = sess => sess.items.reduce((n, it) => n + it.sets.filter(s => s.done !== false).length, 0);
function prevSets(exId, beforeT = Infinity) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const s = S.sessions[i];
    if (s.start >= beforeT) continue;
    const it = s.items.find(x => x.ex === exId);
    if (it && it.sets.length) return it.sets;
  }
  return null;
}
function lastDone(exId) {
  for (let i = S.sessions.length - 1; i >= 0; i--) if (S.sessions[i].items.some(x => x.ex === exId)) return S.sessions[i];
  return null;
}
function bestWeight(exId, excludeId) {
  let b = 0;
  for (const s of S.sessions) if (s.id !== excludeId) for (const it of s.items) if (it.ex === exId) for (const x of it.sets) if (isWork(x)) b = Math.max(b, x.w || 0);
  return b;
}
function sessionPRs(sess) {
  const out = [];
  const before = S.sessions.filter(s => s.start < sess.start && s.id !== sess.id);
  for (const ex of [...new Set(sess.items.map(i => i.ex))]) {
    const old = before.flatMap(s => s.items.filter(i => i.ex === ex).flatMap(i => i.sets)).filter(isWork);
    const cur = sess.items.filter(i => i.ex === ex).flatMap(i => i.sets).filter(x => isWork(x) && x.done !== false);
    if (!old.length || !cur.length) continue;
    const pW = Math.max(...old.map(x => x.w || 0)), cW = Math.max(...cur.map(x => x.w || 0));
    const pE = Math.max(...old.map(x => e1rm(x.w, x.r))), cE = Math.max(...cur.map(x => e1rm(x.w, x.r)));
    if (cW > pW) out.push({ ex, kind: 'Peso máximo', v: cW, prev: pW });
    else if (cE > pE + 0.05) out.push({ ex, kind: '1RM estimado', v: cE, prev: pE });
    else if (!cW && !pW) {
      const pR = Math.max(...old.map(x => x.r || 0)), cR = Math.max(...cur.map(x => x.r || 0));
      if (cR > pR) out.push({ ex, kind: 'Reps máximas', v: cR, prev: pR, reps: true });
    }
  }
  return out;
}
function exSeries(exId) {
  const out = [];
  for (const s of S.sessions) {
    const sets = s.items.filter(i => i.ex === exId).flatMap(i => i.sets).filter(isWork);
    if (!sets.length) continue;
    out.push({
      t: s.start, sess: s, sets,
      maxW: Math.max(...sets.map(x => x.w || 0)),
      e1: Math.max(...sets.map(x => e1rm(x.w, x.r))),
      vol: sets.reduce((a, x) => a + (x.w || 0) * (x.r || 0), 0),
      maxR: Math.max(...sets.map(x => x.r || 0)),
    });
  }
  return out;
}
function weekStreak() {
  const weeks = new Set(S.sessions.map(s => weekStart(s.start).getTime()));
  let w = weekStart(Date.now());
  if (!weeks.has(w.getTime())) w = addDays(w, -7);
  let n = 0;
  while (weeks.has(w.getTime())) { n++; w = addDays(w, -7); }
  return n;
}
const routineMinutes = r => Math.max(5, Math.round(r.items.reduce((m, it) => m + it.sets * (40 + (it.rest || 90)), 0) / 60 / 5) * 5);

/* ---------- UI: estado y utilidades ---------- */
const ui = { tab: 'home', view: null, edit: null, cal: null, progEx: null, progMetric: 'e1rm', histLimit: 40 };

function toast(msg, kind = '') {
  const box = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = (kind === 'pr' ? ic('trophy') : kind === 'good' ? ic('check') : '') + `<span>${esc(msg)}</span>`;
  box.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, kind === 'pr' ? 3600 : 2600);
}

const layers = [];
function openSheet(html, { acts = {}, onClose, center = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'layer' + (center ? ' layer-center' : '');
  wrap.innerHTML = `<div class="backdrop" data-act="close-layer"></div><div class="sheet${center ? ' dialog' : ''}" role="dialog" aria-modal="true">${center ? '' : '<div class="grab" aria-hidden="true"></div>'}<div class="sheet-body">${html}</div></div>`;
  wrap._acts = acts; wrap._onClose = onClose;
  document.body.appendChild(wrap);
  layers.push(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  document.body.classList.add('locked');
  return wrap;
}
function closeLayer(wrap = layers[layers.length - 1]) {
  if (!wrap || wrap._closing) return;
  wrap._closing = true;
  const i = layers.indexOf(wrap);
  if (i >= 0) layers.splice(i, 1);
  wrap.classList.remove('open');
  setTimeout(() => wrap.remove(), 240);
  if (!layers.length) document.body.classList.remove('locked');
  if (wrap._onClose) wrap._onClose();
}
const setSheet = (wrap, html) => { $('.sheet-body', wrap).innerHTML = html; };
function confirmBox({ title, text = '', ok = 'Aceptar', cancel = 'Cancelar', danger = false }) {
  return new Promise(res => {
    openSheet(`<h3 class="dlg-title">${esc(title)}</h3>${text ? `<p class="dlg-text">${esc(text)}</p>` : ''}
      <div class="dlg-btns"><button class="btn btn-soft" data-act="no">${esc(cancel)}</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="yes">${esc(ok)}</button></div>`, {
      center: true,
      acts: { yes: (el, e, l) => { res(true); closeLayer(l); }, no: (el, e, l) => { res(false); closeLayer(l); } },
      onClose: () => res(false),
    });
  });
}
const menuItem = (act, icon, label, danger) => `<button class="menu-item${danger ? ' danger' : ''}" data-act="${act}">${ic(icon)}<span>${label}</span></button>`;
const mtag = exId => { const m = muscleOf(exId); return `<span class="mtag"><i style="background:${m.c}"></i>${m.n}</span>`; };

/* ---------- Audio, vibración y pantalla ---------- */
let actx = null;
function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { /* sin audio */ }
}
function beep() {
  if (!S.settings.sound || !actx) return;
  try {
    const t0 = actx.currentTime;
    [0, 0.2, 0.4].forEach((d, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.5, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + (i === 2 ? 0.35 : 0.15));
      o.connect(g).connect(actx.destination);
      o.start(t0 + d); o.stop(t0 + d + 0.4);
    });
  } catch (e) { /* sin audio */ }
}
const haptic = (p = 12) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* no soportado */ } };
let wake = null;
async function requestWake() {
  if (!S || !S.active || !S.settings.wake || ui.view !== 'workout' || wake || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } catch (e) { wake = null; }
}
function releaseWake() { try { if (wake) wake.release(); } catch (e) { /* ya liberado */ } wake = null; }

/* ---------- Gráficos ---------- */
let chartN = 0;
function niceTicks(min, max, count = 4) {
  if (min === max) { const pad0 = Math.abs(min) * 0.1 || 1; min -= pad0; max += pad0; }
  const step0 = (max - min) / count, mag = 10 ** Math.floor(Math.log10(step0)), f = step0 / mag;
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, t = [];
  for (let v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(6));
  return t;
}
function lineChart(pts, { fmt = v => nf(v), h = 180, label = 'Gráfico' } = {}) {
  const W = 340, H = h, L = 42, R = 14, T = 22, B = 26, id = 'g' + (++chartN);
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  if (ticks[0] < 0 && Math.min(...ys) >= 0) ticks = ticks.filter(t => t >= 0);
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const X = x => L + (x1 === x0 ? 0.5 : (x - x0) / (x1 - x0)) * (W - L - R);
  const Y = y => T + (1 - (y - y0) / (y1 - y0 || 1)) * (H - T - B);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const area = `${path}L${X(pts[pts.length - 1].x).toFixed(1)},${H - B}L${X(pts[0].x).toFixed(1)},${H - B}Z`;
  const grid = ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" class="c-grid"/><text x="${L - 8}" y="${Y(t) + 4}" text-anchor="end" class="c-lab">${esc(compact(t))}</text>`).join('');
  const last = pts[pts.length - 1], lx = X(last.x), ly = Y(last.y);
  const prevBelow = Y(pts[pts.length - 2].y) >= ly;
  const dots = pts.length <= 24 ? pts.slice(0, -1).map(p => `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.5" class="c-dot"/>`).join('') : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".32"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    ${grid}<path d="${area}" fill="url(#${id})"/><path d="${path}" class="c-line"/>${dots}
    <circle cx="${lx}" cy="${ly}" r="5.5" class="c-end"/>
    <text x="${lx > W - 60 ? lx - 10 : lx}" y="${prevBelow ? Math.max(12, ly - 11) : Math.min(H - B - 6, ly + 20)}" text-anchor="${lx > W - 60 ? 'end' : 'middle'}" class="c-val">${esc(fmt(last.y))}</text>
    <text x="${L}" y="${H - 6}" class="c-lab">${esc(fmtDate(x0))}</text><text x="${W - R}" y="${H - 6}" text-anchor="end" class="c-lab">${esc(fmtDate(x1))}</text>
  </svg>`;
}
function barChart(bars, { h = 170, label = 'Gráfico' } = {}) {
  const W = 340, H = h, L = 42, R = 8, T = 14, B = 24;
  const max = Math.max(...bars.map(b => b.v));
  const ticks = niceTicks(0, max || 1).filter(t => t >= 0);
  const y1 = ticks[ticks.length - 1];
  const Y = v => T + (1 - v / y1) * (H - T - B);
  const bw = (W - L - R) / bars.length;
  const grid = ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" class="c-grid"/><text x="${L - 8}" y="${Y(t) + 4}" text-anchor="end" class="c-lab">${esc(compact(t))}</text>`).join('');
  const rects = bars.map((b, i) => {
    const x = L + i * bw + bw * 0.18, w = bw * 0.64, y = Y(b.v), hh = Math.max(0, H - B - y);
    const lab = (bars.length - 1 - i) % 2 === 0 ? `<text x="${x + w / 2}" y="${H - 7}" text-anchor="middle" class="c-lab">${esc(b.label)}</text>` : '';
    return `<rect x="${x.toFixed(1)}" y="${(hh ? y : H - B - 1).toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(hh, 1).toFixed(1)}" rx="3" class="${b.hl ? 'c-bar-hl' : 'c-bar'}"><title>${esc(b.title || '')}</title></rect>${lab}`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${grid}${rects}</svg>`;
}

/* ---------- Render principal ---------- */
function render(keepScroll) {
  const y = window.scrollY;
  let html;
  if (ui.view === 'workout' && S.active) html = vWorkout();
  else if (ui.view === 'routine' && ui.edit) html = vRoutineEdit();
  else { ui.view = null; html = ({ home: vHome, history: vHistory, progress: vProgress, settings: vSettings }[ui.tab] || vHome)(); }
  $('#view').innerHTML = html;
  document.body.dataset.view = ui.view || ui.tab;
  renderTabbar();
  renderFloating();
  if (keepScroll) window.scrollTo(0, y);
  if (ui.view === 'workout') requestWake(); else releaseWake();
}
function go(tab) { ui.tab = tab; ui.view = null; render(); window.scrollTo(0, 0); }
function renderTabbar() {
  const tb = $('#tabbar');
  const show = !ui.view;
  tb.hidden = !show;
  if (!show) return;
  const tabs = [['home', 'dumbbell', 'Entrenar'], ['history', 'calendar', 'Historial'], ['progress', 'chart', 'Progreso'], ['settings', 'sliders', 'Ajustes']];
  tb.innerHTML = `<div class="tab-in">${tabs.map(([t, i, l]) => `<button class="tab${ui.tab === t ? ' on' : ''}" data-act="tab" data-t="${t}" ${ui.tab === t ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span></button>`).join('')}</div>`;
}
function renderFloating() {
  const f = $('#float'), a = S.active;
  let html = '';
  const mini = !!(a && !ui.view);
  if (a && ui.view === 'workout' && a.rest) {
    const left = a.rest.end - Date.now();
    html = `<div class="restbar" role="timer" aria-label="Descanso">
      <div class="rest-fill" data-rest-bar style="transform:scaleX(${clamp(left / a.rest.total, 0, 1)})"></div>
      <div class="rest-in">
        <div class="rest-txt"><small>Descanso · ${esc(a.rest.label)}</small><b data-rest-left>${fmtClock(left, true)}</b></div>
        <div class="rest-btns"><button class="rb" data-act="rest-adj" data-d="-15" aria-label="Restar 15 segundos">−15</button><button class="rb" data-act="rest-adj" data-d="15" aria-label="Sumar 15 segundos">+15</button><button class="rb rb-skip" data-act="rest-skip">Saltar</button></div>
      </div></div>`;
  } else if (mini) {
    html = `<button class="minibar" data-act="wk-open">
      <span class="plate-dot sm" style="--c:${esc(a.color)}"></span>
      <span class="mb-txt"><b>${esc(a.name)}</b><small>En curso · <span data-elapsed>${fmtClock(Date.now() - a.start)}</span>${a.rest ? ` · descanso <span data-rest-left>${fmtClock(a.rest.end - Date.now(), true)}</span>` : ''}</small></span>
      <span class="mb-go">Continuar${ic('right')}</span></button>`;
  }
  f.innerHTML = html;
  document.body.classList.toggle('has-mini', mini);
  document.body.classList.toggle('has-rest', !!(a && ui.view === 'workout' && a.rest));
}
function tick() {
  const a = S && S.active;
  if (!a) return;
  const now = Date.now();
  $$('[data-elapsed]').forEach(el => { el.textContent = fmtClock(now - a.start); });
  if (a.rest) {
    const left = a.rest.end - now;
    if (left <= 0) {
      const fresh = left > -4000;
      a.rest = null; persist();
      if (fresh && document.visibilityState === 'visible') { beep(); haptic([60, 60, 120]); toast('Descanso terminado. ¡A la siguiente serie!', 'good'); }
      renderFloating();
      return;
    }
    $$('[data-rest-left]').forEach(el => { el.textContent = fmtClock(left, true); });
    $$('[data-rest-bar]').forEach(el => { el.style.transform = `scaleX(${clamp(left / a.rest.total, 0, 1)})`; });
  }
}
function startRest(sec, label) {
  if (!S.active || !sec) return;
  S.active.rest = { end: Date.now() + sec * 1000, total: sec * 1000, label };
}

/* ---------- Vista: Entrenar ---------- */
function vHome() {
  const now = new Date(), h = now.getHours();
  const greet = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  const ws = weekStart(now);
  const trained = new Set(S.sessions.map(s => dayKey(s.start)));
  const thisWeek = S.sessions.filter(s => s.start >= ws.getTime()).length;
  const goal = S.settings.weekGoal;
  const streak = weekStreak();
  const pct = clamp(thisWeek / goal, 0, 1), C = 2 * Math.PI * 26;
  const days = [...Array(7)].map((_, i) => {
    const d = addDays(ws, i), k = isoDate(d), today = k === isoDate(now);
    return `<div class="wd${today ? ' today' : ''}${trained.has(k) ? ' on' : ''}"><span>${DOW[i]}</span><i>${d.getDate()}</i></div>`;
  }).join('');
  const standalone = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const showInstall = ios && !standalone && !inFrame && !S.settings.installHidden;
  const showBackup = S.sessions.length >= 3 && Date.now() - (S.settings.lastBackup || 0) > 14 * DAY;
  const showWelcome = !S.settings.welcomeHidden && !S.sessions.length;
  return `
  <header class="page-head"><p class="eyebrow">${esc(fmtDateLong(now))}</p><h1>${greet}</h1></header>
  ${showInstall ? `<div class="notice"><div class="notice-ic">${ic('share')}</div><div><b>Instala Hierro en tu iPhone</b><p>Toca <b>Compartir</b> y luego <b>Agregar a pantalla de inicio</b>. Así funciona sin internet y tus datos quedan protegidos.</p></div><button class="icon-btn" data-act="hide-install" aria-label="Ocultar">${ic('x')}</button></div>` : ''}
  ${showWelcome ? `<div class="notice"><div class="notice-ic">${ic('info')}</div><div><b>Tienes 3 rutinas de ejemplo</b><p>Empuje, Tirón y Pierna. Edítalas, bórralas o crea las tuyas con <b>Nueva</b>. Toca <b>Iniciar</b> para empezar a registrar.</p></div><button class="icon-btn" data-act="hide-welcome" aria-label="Ocultar">${ic('x')}</button></div>` : ''}
  ${showBackup ? `<button class="notice notice-btn" data-act="open-exp"><div class="notice-ic">${ic('download')}</div><div><b>Haz un respaldo</b><p>${S.settings.lastBackup ? 'Tu último respaldo fue ' + rel(S.settings.lastBackup) : 'Aún no has guardado una copia de tus datos'}. Toma 10 segundos.</p></div>${ic('right')}</button>` : ''}
  <section class="card week">
    <div class="week-top">
      <div>
        <p class="label">Esta semana</p>
        <p class="week-big"><b>${thisWeek}</b> de ${goal} entrenamientos</p>
        <p class="muted small">${streak ? `${ic('flame', 'ic-sm ic-accent')} ${plural(streak, 'semana seguida', 'semanas seguidas')} entrenando` : 'Empieza tu racha esta semana'}</p>
      </div>
      <svg class="ring" viewBox="0 0 64 64" aria-label="${thisWeek} de ${goal}"><circle cx="32" cy="32" r="26" class="ring-bg"/><circle cx="32" cy="32" r="26" class="ring-fg"${pct ? '' : ' hidden'} stroke-dasharray="${(C * pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle">${Math.round(pct * 100)}%</text></svg>
    </div>
    <div class="week-strip">${days}</div>
  </section>
  <button class="btn btn-block btn-outline" data-act="start" data-id="">${ic('play', 'ic-fill')} Entrenamiento libre</button>
  <div class="sec-head"><h2>Mis rutinas</h2><button class="link-btn" data-act="routine-new">${ic('plus')} Nueva</button></div>
  <div class="routines">${S.routines.map(vRoutineCard).join('') || `<div class="empty"><p><b>Todavía no tienes rutinas</b></p><p class="muted">Crea una con los ejercicios que haces cada día de entrenamiento.</p><button class="btn btn-primary" data-act="routine-new">${ic('plus')} Crear rutina</button></div>`}</div>`;
}
function vRoutineCard(r) {
  const sets = r.items.reduce((n, i) => n + i.sets, 0);
  const last = [...S.sessions].reverse().find(s => s.routineId === r.id);
  return `<article class="card r-card">
    <div class="r-top">
      <span class="plate-dot" style="--c:${esc(r.color)}"></span>
      <div class="r-info"><h3>${esc(r.name)}</h3><p class="r-ex">${esc(r.items.map(i => exName(i.ex)).join(' · ') || 'Sin ejercicios')}</p></div>
      <button class="icon-btn" data-act="routine-menu" data-id="${r.id}" aria-label="Opciones de ${esc(r.name)}">${ic('dots')}</button>
    </div>
    <div class="r-meta"><span>${plural(r.items.length, 'ejercicio', 'ejercicios')}</span><span>${plural(sets, 'serie', 'series')}</span><span>~${routineMinutes(r)} min</span></div>
    <div class="r-bottom"><span class="muted small">${last ? 'Última vez ' + rel(last.start) : 'Aún sin entrenar'}</span><button class="btn btn-sm btn-primary" data-act="start" data-id="${r.id}">${ic('play', 'ic-fill')} Iniciar</button></div>
  </article>`;
}

/* ---------- Vista: entrenamiento en curso ---------- */
function vWorkout() {
  const a = S.active;
  const total = a.items.reduce((n, it) => n + it.sets.length, 0);
  const done = a.items.reduce((n, it) => n + it.sets.filter(s => s.done).length, 0);
  return `
  <header class="wk-top">
    <button class="icon-btn" data-act="wk-min" aria-label="Minimizar entrenamiento">${ic('down')}</button>
    <div class="wk-title">
      <input id="wk-name" class="wk-name" data-f="wk-name" value="${esc(a.name)}" aria-label="Nombre del entrenamiento" maxlength="40">
      <div class="wk-meta"><span class="wk-clock">${ic('timer', 'ic-sm')}<span data-elapsed>${fmtClock(Date.now() - a.start)}</span></span><span>${done}/${total} series</span><span>${fmtVol(sessVolume(a))}</span></div>
    </div>
    <button class="btn btn-sm btn-primary" data-act="wk-finish">Terminar</button>
  </header>
  <div class="wk-progress" aria-hidden="true"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>
  <div class="wk-list">${a.items.map((it, i) => vExCard(it, i)).join('') || `<div class="empty"><p><b>Entrenamiento libre</b></p><p class="muted">Agrega los ejercicios que vas a hacer hoy.</p></div>`}</div>
  <div class="wk-actions">
    <button class="btn btn-block btn-soft" data-act="wk-add-ex">${ic('plus')} Agregar ejercicio</button>
    <label class="flabel" for="wk-note">Notas del entrenamiento</label>
    <textarea id="wk-note" class="field" data-f="wk-note" rows="2" placeholder="Energía, sueño, molestias, cómo te sentiste…">${esc(a.note || '')}</textarea>
    <button class="btn btn-block btn-ghost-bad" data-act="wk-cancel">Descartar entrenamiento</button>
  </div>`;
}
function vExCard(it, idx) {
  const ex = exById(it.ex);
  const prev = prevSets(it.ex, S.active.start);
  const top = repsTop(it.reps);
  const prevWork = prev ? prev.filter(isWork) : [], prevWarm = prev ? prev.filter(x => !isWork(x)) : [];
  let n = 0, wu = 0, lastW = null, lastR = null;
  const rows = it.sets.map(s => {
    if (isWork(s)) n++; else wu++;
    const label = s.type === 'n' ? String(n) : SET_TYPES[s.type].s;
    const p = (isWork(s) ? prevWork[n - 1] : prevWarm[wu - 1]) || null;
    const phw = p ? p.w : lastW;
    const phr = p ? p.r : (lastR ?? (top || null));
    if (s.w != null) lastW = s.w; else if (phw != null) lastW = phw;
    if (s.r != null) lastR = s.r; else if (phr != null) lastR = phr;
    return `<div class="set-row${s.done ? ' done' : ''}" data-set="${s.id}" data-phw="${phw ?? ''}" data-phr="${phr ?? ''}">
      <button class="set-num t-${s.type}" data-act="set-menu" aria-label="Serie ${label}, opciones">${label}</button>
      <button class="set-prev" data-act="use-prev" ${p ? `data-w="${p.w}" data-r="${p.r}"` : 'disabled'}>${p ? `${fmtW(p.w)} × ${p.r}` : '—'}</button>
      <input id="w-${s.id}" class="set-in" data-f="w" inputmode="decimal" autocomplete="off" enterkeyhint="next" placeholder="${phw != null ? numStr(phw) : '0'}" value="${numStr(s.w)}" aria-label="Peso en ${U()}">
      <input id="r-${s.id}" class="set-in" data-f="r" inputmode="numeric" autocomplete="off" enterkeyhint="done" placeholder="${phr ?? ''}" value="${s.r ?? ''}" aria-label="Repeticiones">
      <button class="set-check" data-act="set-done" aria-label="${s.done ? 'Desmarcar serie' : 'Marcar serie como hecha'}" aria-pressed="${!!s.done}">${ic('check')}</button>
    </div>`;
  }).join('');
  return `<section class="card ex-card" data-it="${it.id}">
    <div class="ex-head">
      <div class="ex-title"><h3>${esc(ex.name)}</h3><div class="ex-tags">${mtag(it.ex)}${it.reps ? `<span class="target">Objetivo ${esc(it.reps)} reps</span>` : ''}</div></div>
      <button class="icon-btn" data-act="ex-menu" aria-label="Opciones de ${esc(ex.name)}">${ic('dots')}</button>
    </div>
    ${it.note ? `<p class="ex-note">${ic('note', 'ic-sm')}${esc(it.note)}</p>` : ''}
    ${suggestion(it, prev)}
    <div class="set-row set-head" aria-hidden="true"><span>Serie</span><span>Anterior</span><span>${U()}</span><span>Reps</span><span>${ic('check', 'ic-sm')}</span></div>
    ${rows}
    <div class="ex-foot"><button class="btn btn-sm btn-soft" data-act="set-add">${ic('plus')} Serie</button><button class="chip-btn" data-act="ex-rest">${ic('timer', 'ic-sm')} Descanso ${fmtRest(it.rest)}</button></div>
  </section>`;
}
function suggestion(it, prev) {
  if (!S.settings.suggest || !prev) return '';
  const work = prev.filter(s => isWork(s) && s.w > 0);
  const top = repsTop(it.reps);
  if (!work.length || !top) return '';
  const wMax = Math.max(...work.map(s => s.w));
  const atTop = work.filter(s => s.w === wMax);
  const inc = U() === 'lb' ? 5 / LB : 2.5;
  if (atTop.every(s => s.r >= top)) {
    const next = wMax + inc;
    return `<div class="sug">${ic('arrowUp', 'ic-sm')}<p>La última vez completaste ${top} reps con ${fmtWU(wMax)}. Prueba con <b>${fmtWU(next)}</b>.</p><button class="link-btn" data-act="sug-apply" data-w="${next}">Aplicar</button></div>`;
  }
  return `<div class="sug sug-quiet">${ic('info', 'ic-sm')}<p>Última vez: ${fmtWU(wMax)}. Mantén el peso hasta llegar a ${top} reps en todas las series.</p></div>`;
}

/* ---------- Vista: editor de rutinas ---------- */
function vRoutineEdit() {
  const e = ui.edit;
  return `
  <header class="sub-head"><button class="icon-btn" data-act="edit-cancel" aria-label="Volver">${ic('left')}</button><h2>${e.isNew ? 'Nueva rutina' : 'Editar rutina'}</h2><button class="btn btn-sm btn-primary" data-act="edit-save">Guardar</button></header>
  <div class="form">
    <label class="flabel" for="ed-name">Nombre</label>
    <input id="ed-name" class="field" data-f="ed-name" value="${esc(e.name)}" placeholder="Ej: Torso A, Pierna pesada…" maxlength="40">
    <p class="flabel">Color</p>
    <div class="swatches">${ROUTINE_COLORS.map(c => `<button class="swatch${e.color === c ? ' on' : ''}" style="--c:${c}" data-act="ed-color" data-c="${c}" aria-label="Color" aria-pressed="${e.color === c}"></button>`).join('')}</div>
    <label class="flabel" for="ed-note">Notas</label>
    <textarea id="ed-note" class="field" data-f="ed-note" rows="2" placeholder="Opcional: calentamiento, técnica, objetivo del día…">${esc(e.note || '')}</textarea>
  </div>
  <div class="sec-head"><h2>Ejercicios</h2><span class="muted small">${e.items.length} ejercicios · ${e.items.reduce((n, i) => n + i.sets, 0)} series</span></div>
  <div class="ed-list">${e.items.map((it, i) => `
    <div class="card ed-item" data-i="${i}">
      <div class="ed-row1">
        <span class="ed-n">${i + 1}</span>
        <div class="ed-name"><b>${esc(exName(it.ex))}</b>${mtag(it.ex)}</div>
        <div class="ed-move">
          <button class="icon-btn sm" data-act="ed-move" data-d="-1" ${i ? '' : 'disabled'} aria-label="Subir">${ic('up')}</button>
          <button class="icon-btn sm" data-act="ed-move" data-d="1" ${i < e.items.length - 1 ? '' : 'disabled'} aria-label="Bajar">${ic('down')}</button>
        </div>
        <button class="icon-btn sm" data-act="ed-del" aria-label="Quitar">${ic('trash')}</button>
      </div>
      <div class="ed-row2">
        <div class="fgroup"><span class="flabel-sm">Series</span><div class="stepper"><button data-act="ed-sets" data-d="-1" aria-label="Menos series">−</button><b>${it.sets}</b><button data-act="ed-sets" data-d="1" aria-label="Más series">+</button></div></div>
        <div class="fgroup"><label class="flabel-sm" for="ed-reps-${it.id}">Reps</label><input id="ed-reps-${it.id}" class="field field-sm" data-f="ed-reps" value="${esc(it.reps)}" placeholder="8-12" maxlength="9"></div>
        <div class="fgroup"><label class="flabel-sm" for="ed-rest-${it.id}">Descanso</label><select id="ed-rest-${it.id}" class="field field-sm" data-f="ed-rest">${REST_OPTS.map(o => `<option value="${o}"${o === it.rest ? ' selected' : ''}>${fmtRest(o)}</option>`).join('')}</select></div>
      </div>
    </div>`).join('') || `<div class="empty"><p class="muted">Agrega los ejercicios de esta rutina.</p></div>`}</div>
  <button class="btn btn-block btn-soft" data-act="ed-add">${ic('plus')} Agregar ejercicios</button>`;
}

/* ---------- Vista: historial ---------- */
function vHistory() {
  const ss = S.sessions;
  if (!ui.cal) { const d = new Date(); ui.cal = new Date(d.getFullYear(), d.getMonth(), 1); }
  const m0 = ui.cal, y = m0.getFullYear(), mo = m0.getMonth();
  const now = new Date(), isCur = y === now.getFullYear() && mo === now.getMonth();
  const byDay = {};
  for (const s of ss) (byDay[dayKey(s.start)] ||= []).push(s);
  const blanks = (m0.getDay() + 6) % 7, dim = new Date(y, mo + 1, 0).getDate();
  let cells = '<span></span>'.repeat(blanks);
  for (let d = 1; d <= dim; d++) {
    const k = isoDate(new Date(y, mo, d)), list = byDay[k], today = k === isoDate(now);
    cells += list
      ? `<button class="cd on${today ? ' today' : ''}" style="--c:${esc(list[0].color || 'var(--accent)')}" data-act="open-sess" data-id="${list[list.length - 1].id}" aria-label="${d}: ${esc(list.map(s => s.name).join(', '))}">${d}</button>`
      : `<span class="cd${today ? ' today' : ''}">${d}</span>`;
  }
  const inMonth = ss.filter(s => { const d = new Date(s.start); return d.getFullYear() === y && d.getMonth() === mo; });
  const monthVol = inMonth.reduce((v, s) => v + sessVolume(s), 0);
  const list = [...ss].reverse();
  let lastM = '';
  const items = list.slice(0, ui.histLimit).map(s => {
    const d = new Date(s.start);
    const mk = d.toLocaleDateString('es', { month: 'long', year: 'numeric' });
    const head = mk !== lastM ? `<h3 class="h-month">${esc(cap(mk))}</h3>` : '';
    lastM = mk;
    return `${head}<button class="h-item" data-act="open-sess" data-id="${s.id}">
      <span class="h-date" style="--c:${esc(s.color || 'var(--accent)')}"><b>${d.getDate()}</b><small>${esc(d.toLocaleDateString('es', { weekday: 'short' }).replace('.', ''))}</small></span>
      <span class="h-main"><b>${esc(s.name)}</b><small>${plural(s.items.length, 'ejercicio', 'ejercicios')} · ${plural(sessSets(s), 'serie', 'series')}${s.prs ? ` · <span class="pr-txt">${ic('trophy', 'ic-xs')}${s.prs} PR</span>` : ''}</small></span>
      <span class="h-side"><b>${fmtDur(s.end - s.start)}</b><small>${fmtVol(sessVolume(s))}</small></span>
    </button>`;
  }).join('');
  return `
  <header class="page-head"><p class="eyebrow">${ss.length} ${ss.length === 1 ? 'entrenamiento' : 'entrenamientos'} registrados</p><h1>Historial</h1></header>
  <section class="card cal">
    <div class="cal-head"><button class="icon-btn" data-act="cal" data-d="-1" aria-label="Mes anterior">${ic('left')}</button><h3>${esc(cap(m0.toLocaleDateString('es', { month: 'long', year: 'numeric' })))}</h3><button class="icon-btn" data-act="cal" data-d="1" ${isCur ? 'disabled' : ''} aria-label="Mes siguiente">${ic('right')}</button></div>
    <div class="cal-grid">${DOW.map(d => `<span class="cal-dow">${d}</span>`).join('')}${cells}</div>
    <p class="cal-foot"><b>${inMonth.length}</b> ${inMonth.length === 1 ? 'entrenamiento' : 'entrenamientos'} · <b>${fmtVol(monthVol)}</b> levantados</p>
  </section>
  <div class="h-list">${items || `<div class="empty"><p><b>Aquí verás cada entrenamiento</b></p><p class="muted">Cuando termines tu primera sesión aparecerá con su duración, volumen y récords.</p><button class="btn btn-primary" data-act="tab" data-t="home">${ic('play', 'ic-fill')} Ir a entrenar</button></div>`}</div>
  ${list.length > ui.histLimit ? `<button class="btn btn-block btn-soft" data-act="hist-more">Ver más</button>` : ''}`;
}

/* ---------- Vista: progreso ---------- */
function vProgress() {
  const ss = S.sessions, now = Date.now();
  const head = `<header class="page-head"><p class="eyebrow">Tus números</p><h1>Progreso</h1></header>`;
  const tools = `<div class="sec-head"><h2>Herramientas</h2></div>
    <div class="tools"><button class="card tool" data-act="open-plates">${ic('disc')}<b>Calculadora de discos</b><small>Qué discos poner en la barra</small></button><button class="card tool" data-act="open-1rm">${ic('calc')}<b>Calculadora de 1RM</b><small>Tu máximo estimado y porcentajes</small></button></div>`;
  if (!ss.length) {
    return `${head}<div class="empty card"><p><b>Tus gráficos aparecerán aquí</b></p><p class="muted">Después de tu primer entrenamiento verás tu volumen semanal, tus récords y la evolución de cada ejercicio.</p><button class="btn btn-primary" data-act="tab" data-t="home">${ic('play', 'ic-fill')} Empezar a entrenar</button></div>${vBody()}${tools}`;
  }
  const ws = weekStart(now).getTime();
  const thisWeek = ss.filter(s => s.start >= ws).length;
  const v7 = ss.filter(s => s.start >= now - 7 * DAY).reduce((v, s) => v + sessVolume(s), 0);
  const v14 = ss.filter(s => s.start >= now - 14 * DAY && s.start < now - 7 * DAY).reduce((v, s) => v + sessVolume(s), 0);
  const delta = v14 ? Math.round(((v7 - v14) / v14) * 100) : null;
  const hours = ss.reduce((h, s) => h + (s.end - s.start), 0) / 36e5;
  const streak = weekStreak();
  const tiles = `<div class="tiles">
    <div class="tile"><small>Esta semana</small><b>${thisWeek}<span>/${S.settings.weekGoal}</span></b><em>entrenamientos</em></div>
    <div class="tile"><small>Racha</small><b>${streak}</b><em>${streak === 1 ? 'semana seguida' : 'semanas seguidas'}</em></div>
    <div class="tile"><small>Volumen 7 días</small><b>${compact(toDisp(v7))}<span> ${U()}</span></b>${delta == null ? '<em>sin semana previa</em>' : `<em class="${delta >= 0 ? 'up' : 'down'}">${ic(delta >= 0 ? 'arrowUp' : 'arrowDown', 'ic-xs')}${Math.abs(delta)}% vs. 7 días anteriores</em>`}</div>
    <div class="tile"><small>Total</small><b>${ss.length}</b><em>sesiones · ${nf(hours, 1)} h</em></div>
  </div>`;
  const cw = weekStart(now);
  const bars = [...Array(12)].map((_, i) => {
    const a = addDays(cw, -7 * (11 - i)), b = addDays(a, 7);
    const list = ss.filter(s => s.start >= a.getTime() && s.start < b.getTime());
    const v = toDisp(list.reduce((x, s) => x + sessVolume(s), 0));
    return { v, hl: i === 11, label: `${a.getDate()}/${a.getMonth() + 1}`, title: `Semana del ${fmtDate(a)}: ${nf(Math.round(v), 0)} ${U()} en ${list.length} sesiones` };
  });
  const mc = {};
  for (const s of ss.filter(x => x.start >= now - 30 * DAY)) for (const it of s.items) { const m = exById(it.ex).muscle; mc[m] = (mc[m] || 0) + it.sets.filter(isWork).length; }
  const mList = Object.entries(mc).sort((a, b) => b[1] - a[1]);
  const mMax = mList.length ? mList[0][1] : 1;
  const muscles = mList.length ? mList.map(([m, n]) => `<div class="mbar"><span class="mbar-l">${esc((MUSCLES[m] || MUSCLES.otro).n)}</span><span class="mbar-t"><i style="width:${(n / mMax) * 100}%;background:${(MUSCLES[m] || MUSCLES.otro).c}"></i></span><b>${n}</b></div>`).join('') : '<p class="muted small">Sin entrenamientos en los últimos 30 días.</p>';
  return `${head}${tiles}
  <section class="card panel"><div class="panel-head"><h2>Volumen por semana</h2><span class="muted small">${U()} · 12 semanas</span></div>${barChart(bars, { label: 'Volumen semanal de las últimas 12 semanas' })}</section>
  ${vExProgress()}
  <section class="card panel"><div class="panel-head"><h2>Series por músculo</h2><span class="muted small">Últimos 30 días</span></div><div class="mbars">${muscles}</div></section>
  ${vBody()}${tools}`;
}
function vExProgress() {
  const counts = {};
  for (const s of S.sessions) for (const it of s.items) if (it.sets.some(isWork)) counts[it.ex] = (counts[it.ex] || 0) + 1;
  const exs = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  if (!exs.length) return '';
  if (!exs.includes(ui.progEx)) ui.progEx = exs[0];
  const ser = exSeries(ui.progEx);
  const bw = ser.every(p => !p.maxW);
  const metrics = bw ? [['reps', 'Reps máx.'], ['vol', 'Series']] : [['e1rm', '1RM est.'], ['max', 'Peso máx.'], ['vol', 'Volumen']];
  if (!metrics.some(m => m[0] === ui.progMetric)) ui.progMetric = metrics[0][0];
  const pick = { e1rm: p => toDisp(p.e1), max: p => toDisp(p.maxW), vol: p => (bw ? p.sets.length : toDisp(p.vol)), reps: p => p.maxR }[ui.progMetric];
  const unit = ui.progMetric === 'reps' ? ' reps' : ui.progMetric === 'vol' && bw ? ' series' : ' ' + U();
  const pts = ser.map(p => ({ x: p.t, y: round2(pick(p)) }));
  const chart = pts.length >= 2
    ? lineChart(pts, { fmt: v => nf(v, 1) + unit, label: `Progreso de ${exName(ui.progEx)}` })
    : `<p class="chart-empty">Registra este ejercicio en al menos 2 sesiones para ver la tendencia.</p>`;
  const bestW = ser.reduce((b, p) => (p.maxW > b.v ? { v: p.maxW, t: p.t } : b), { v: 0, t: 0 });
  const bestE = ser.reduce((b, p) => (p.e1 > b.v ? { v: p.e1, t: p.t } : b), { v: 0, t: 0 });
  const bestSet = ser.flatMap(p => p.sets.map(s => ({ ...s, t: p.t }))).reduce((b, s) => ((s.w || 0) * (s.r || 0) > (b ? (b.w || 0) * (b.r || 0) : -1) ? s : b), null);
  const maxR = ser.reduce((b, p) => (p.maxR > b.v ? { v: p.maxR, t: p.t } : b), { v: 0, t: 0 });
  const recs = bw
    ? `<div class="rec"><small>Reps máximas</small><b>${maxR.v}</b><em>${fmtDate(maxR.t)}</em></div><div class="rec"><small>Veces realizado</small><b>${ser.length}</b><em>${rel(ser[ser.length - 1].t)}</em></div>`
    : `<div class="rec"><small>Peso máximo</small><b>${fmtWU(bestW.v)}</b><em>${fmtDate(bestW.t)}</em></div>
       <div class="rec"><small>1RM estimado</small><b>${fmt1RM(bestE.v)}</b><em>${fmtDate(bestE.t)}</em></div>
       <div class="rec"><small>Mejor serie</small><b>${bestSet ? `${fmtW(bestSet.w)} × ${bestSet.r}` : '—'}</b><em>${bestSet ? fmtDate(bestSet.t) : ''}</em></div>
       <div class="rec"><small>Veces realizado</small><b>${ser.length}</b><em>Última: ${rel(ser[ser.length - 1].t)}</em></div>`;
  const recent = ser.slice(-5).reverse().map(p => `<li><span>${fmtDate(p.t)}</span><span class="rc-sets">${p.sets.map(s => `${fmtW(s.w)}×${s.r}`).join(' · ')}</span></li>`).join('');
  return `<section class="card panel">
    <div class="panel-head"><h2>Por ejercicio</h2></div>
    <label class="sr" for="pg-ex">Ejercicio</label>
    <select id="pg-ex" class="field" data-f="pg-ex">${exs.map(id => `<option value="${id}"${id === ui.progEx ? ' selected' : ''}>${esc(exName(id))} (${counts[id]})</option>`).join('')}</select>
    <div class="chips">${metrics.map(([k, l]) => `<button class="chip${ui.progMetric === k ? ' on' : ''}" data-act="pg-metric" data-m="${k}">${l}</button>`).join('')}</div>
    ${chart}
    <div class="recs">${recs}</div>
    <h3 class="mini-title">Últimas sesiones</h3><ul class="rc-list">${recent}</ul>
  </section>`;
}
function vBody() {
  const b = S.body;
  const last = b[b.length - 1];
  const first30 = b.find(x => x.t >= Date.now() - 30 * DAY);
  const d30 = last && first30 && first30 !== last ? last.w - first30.w : null;
  return `<section class="card panel">
    <div class="panel-head"><h2>Peso corporal</h2>${last ? `<span class="muted small">Último: <b class="fg">${fmtWU(last.w)}</b>${d30 != null ? ` · ${d30 > 0 ? '+' : ''}${fmtW(d30)} en 30 días` : ''}</span>` : ''}</div>
    <div class="bw-row"><label class="sr" for="bw-in">Peso corporal en ${U()}</label><input id="bw-in" class="field" inputmode="decimal" placeholder="${last ? numStr(last.w) : 'Ej: 78,5'}" autocomplete="off"><span class="bw-u">${U()}</span><button class="btn btn-primary" data-act="bw-add">Guardar</button></div>
    ${b.length >= 2 ? lineChart(b.map(x => ({ x: x.t, y: round2(toDisp(x.w)) })), { fmt: v => nf(v, 1) + ' ' + U(), label: 'Evolución del peso corporal' }) : '<p class="chart-empty">Anota tu peso de vez en cuando para ver su evolución.</p>'}
    ${b.length ? `<ul class="rc-list">${b.slice(-4).reverse().map(x => `<li><span>${fmtDate(x.t)}</span><span class="rc-sets">${fmtWU(x.w)}</span><button class="icon-btn sm" data-act="bw-del" data-id="${x.id}" aria-label="Eliminar registro">${ic('x')}</button></li>`).join('')}</ul>` : ''}
  </section>`;
}

/* ---------- Vista: ajustes ---------- */
function vSettings() {
  const st = S.settings;
  const tog = (k, label, desc) => `<div class="row"><div class="row-txt"><b>${label}</b>${desc ? `<small>${desc}</small>` : ''}</div><button class="switch" role="switch" aria-checked="${!!st[k]}" aria-label="${label}" data-act="set-toggle" data-k="${k}"><i></i></button></div>`;
  const link = (act, icon, title, sub, danger) => `<button class="row row-link${danger ? ' danger' : ''}" data-act="open-${act}">${ic(icon)}<span class="row-txt"><b>${title}</b><small>${sub}</small></span>${ic('right', 'ic-sm row-chev')}</button>`;
  const custom = S.exercises.filter(e => e.custom && !e.hidden).length;
  return `
  <header class="page-head"><p class="eyebrow">Hierro ${VERSION}</p><h1>Ajustes</h1></header>
  <section class="group"><h2 class="group-title">Entrenamiento</h2><div class="card list">
    <div class="row"><div class="row-txt"><b>Unidad de peso</b></div><div class="seg">${['kg', 'lb'].map(u => `<button data-act="set-unit" data-v="${u}" class="${st.unit === u ? 'on' : ''}" aria-pressed="${st.unit === u}">${u}</button>`).join('')}</div></div>
    <div class="row"><div class="row-txt"><label for="set-rest"><b>Descanso por defecto</b></label><small>Para ejercicios que agregues</small></div><select id="set-rest" class="field field-sm" data-f="set-rest">${REST_OPTS.map(o => `<option value="${o}"${o === st.rest ? ' selected' : ''}>${fmtRest(o)}</option>`).join('')}</select></div>
    <div class="row"><div class="row-txt"><b>Meta semanal</b><small>Entrenamientos por semana</small></div><div class="stepper"><button data-act="set-goal" data-d="-1" aria-label="Menos">−</button><b>${st.weekGoal}</b><button data-act="set-goal" data-d="1" aria-label="Más">+</button></div></div>
    ${tog('sound', 'Sonido al terminar el descanso', 'Si el iPhone está en silencio no sonará')}
    ${tog('wake', 'Pantalla encendida', 'Evita que se bloquee mientras entrenas')}
    ${tog('suggest', 'Sugerencias de progresión', 'Te propone subir peso cuando completas tus reps')}
  </div></section>
  <section class="group"><h2 class="group-title">Apariencia</h2><div class="card list">
    <div class="row"><div class="row-txt"><b>Tema</b></div><div class="seg">${[['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([v, l]) => `<button data-act="set-theme" data-v="${v}" class="${st.theme === v ? 'on' : ''}" aria-pressed="${st.theme === v}">${l}</button>`).join('')}</div></div>
  </div></section>
  <section class="group"><h2 class="group-title">Tus datos</h2>
    <p class="group-note">Todo se guarda en este teléfono y sigue ahí aunque cierres la app o la reinicies.${persisted ? ' El almacenamiento está protegido contra el borrado automático.' : ''} Exporta un respaldo de vez en cuando por si cambias de teléfono.</p>
    <div class="card list">
      ${link('exp', 'download', 'Exportar respaldo', st.lastBackup ? 'Último respaldo ' + rel(st.lastBackup) : 'Aún no has hecho ninguno')}
      ${link('imp', 'upload', 'Importar respaldo', 'Restaura tus datos desde un archivo')}
      ${link('log', 'list', 'Registro de actividad', `${nf(S.log.length, 0)} acciones registradas`)}
      ${link('exercises', 'dumbbell', 'Mis ejercicios', `${S.exercises.filter(e => !e.hidden).length} ejercicios · ${custom} creados por ti`)}
    </div></section>
  <section class="group"><h2 class="group-title">Ayuda</h2><div class="card list">
    ${link('install', 'share', 'Instalar en iPhone', 'Úsala como app, incluso sin internet')}
  </div></section>
  <section class="group"><div class="card list">${link('wipe', 'trash', 'Borrar todos los datos', 'Elimina rutinas, historial y registro', true)}</div></section>
  <p class="foot-note">Hecho para entrenar con constancia. Tus datos no salen de tu teléfono.</p>`;
}

/* ---------- Acciones ---------- */
function startWorkout(rid) {
  if (S.active) { ui.view = 'workout'; render(); window.scrollTo(0, 0); toast('Ya tienes un entrenamiento en curso'); return; }
  const r = rid ? S.routines.find(x => x.id === rid) : null;
  S.active = {
    id: uid(), routineId: r ? r.id : null, name: r ? r.name : 'Entrenamiento libre', color: r ? r.color : '#e9a21f',
    start: Date.now(), note: '', rest: null,
    items: r ? r.items.map(it => ({ id: uid(), ex: it.ex, rest: it.rest || S.settings.rest, reps: it.reps || '', note: '', sets: newSets(it.sets) })) : [],
  };
  logEv('entreno', `Entrenamiento iniciado: ${S.active.name}`);
  persist(true);
  ui.view = 'workout'; render(); window.scrollTo(0, 0);
  if (!r) addExercisesToWorkout();
}
const newSets = n => Array.from({ length: n }, () => ({ id: uid(), w: null, r: null, type: 'n', done: false }));
function addExercisesToWorkout() {
  openPicker({
    onDone: ids => {
      if (!ids.length) return;
      for (const ex of ids) {
        const last = lastDone(ex);
        const lastIt = last && last.items.find(i => i.ex === ex);
        S.active.items.push({ id: uid(), ex, rest: lastIt ? lastIt.rest : S.settings.rest, reps: lastIt ? lastIt.reps || '' : '', note: '', sets: newSets(lastIt ? Math.max(1, lastIt.sets.filter(isWork).length) : 3) });
        logEv('entreno', `Ejercicio agregado al entrenamiento: ${exName(ex)}`);
      }
      persist(); render(true);
    },
  });
}
function itemOf(el) { const c = el.closest('[data-it]'); return c && S.active.items.find(i => i.id === c.dataset.it); }
function setOf(el) { const it = itemOf(el), row = el.closest('[data-set]'); return { it, s: it && row && it.sets.find(x => x.id === row.dataset.set), row }; }

async function finishWorkout() {
  const a = S.active;
  const done = a.items.reduce((n, it) => n + it.sets.filter(s => s.done).length, 0);
  const pending = a.items.reduce((n, it) => n + it.sets.filter(s => !s.done).length, 0);
  if (!done) {
    if (await confirmBox({ title: 'No hay series completadas', text: 'Marca al menos una serie con ✓ para guardar el entrenamiento. ¿Quieres descartarlo?', ok: 'Descartar', cancel: 'Seguir entrenando', danger: true })) discardWorkout();
    return;
  }
  if (!await confirmBox({ title: '¿Terminar entrenamiento?', text: pending ? `Hay ${pending} ${pending === 1 ? 'serie sin marcar que no se guardará' : 'series sin marcar que no se guardarán'}.` : 'Se guardará en tu historial.', ok: 'Terminar', cancel: 'Seguir' })) return;
  const sess = {
    id: a.id, routineId: a.routineId, name: a.name.trim() || 'Entrenamiento', color: a.color, start: a.start, end: Date.now(), note: (a.note || '').trim(),
    items: a.items.map(it => ({ id: it.id, ex: it.ex, rest: it.rest, reps: it.reps, note: it.note, sets: it.sets.filter(s => s.done).map(({ id, w, r, type }) => ({ id, w: w || 0, r, type })) })).filter(it => it.sets.length),
  };
  const prs = sessionPRs(sess);
  sess.prs = prs.length;
  S.sessions.push(sess);
  S.sessions.sort((x, y) => x.start - y.start);
  S.active = null;
  logEv('entreno', `Entrenamiento terminado: ${sess.name} · ${fmtDur(sess.end - sess.start)} · ${sessSets(sess)} series · ${fmtVol(sessVolume(sess))}${prs.length ? ` · ${prs.length} récords` : ''}`);
  for (const p of prs) logEv('entreno', `Récord personal en ${exName(p.ex)}: ${p.kind} ${p.reps ? p.v + ' reps' : fmt1RM(p.v)}`);
  persist(true);
  if (!persisted && navigator.storage && navigator.storage.persist) navigator.storage.persist().then(p => { persisted = p; }).catch(() => {});
  ui.view = null; ui.tab = 'home'; render(); window.scrollTo(0, 0);
  openSummary(sess, prs);
}
function discardWorkout() {
  logEv('entreno', `Entrenamiento descartado: ${S.active.name}`);
  S.active = null; persist(true);
  ui.view = null; render(); window.scrollTo(0, 0);
  toast('Entrenamiento descartado');
}
function openSummary(sess, prs) {
  const r = sess.routineId && S.routines.find(x => x.id === sess.routineId);
  const sig = items => items.map(i => `${i.ex}:${i.sets}`).join('|');
  const newItems = sess.items.map(it => {
    const old = r && r.items.find(i => i.ex === it.ex);
    return { id: uid(), ex: it.ex, sets: Math.max(1, it.sets.filter(isWork).length), reps: (old && old.reps) || it.reps || '8-12', rest: it.rest || S.settings.rest };
  });
  const canUpdate = r && sig(r.items) !== sig(newItems);
  const stat = (l, v) => `<div class="stat"><small>${l}</small><b>${v}</b></div>`;
  openSheet(`
    <div class="sum-hero"><div class="sum-badge">${ic('check')}</div><h3>¡Entrenamiento completado!</h3><p class="muted">${esc(sess.name)} · ${esc(fmtDateLong(sess.start))}</p></div>
    <div class="stat-grid">${stat('Duración', fmtDur(sess.end - sess.start))}${stat('Volumen', fmtVol(sessVolume(sess)))}${stat('Series', sessSets(sess))}${stat('Ejercicios', sess.items.length)}</div>
    ${prs.length ? `<h4 class="sum-sub">${ic('trophy', 'ic-sm ic-accent')} ${prs.length === 1 ? 'Nuevo récord personal' : `${prs.length} récords personales`}</h4><ul class="pr-list">${prs.map(p => `<li><b>${esc(exName(p.ex))}</b><span>${p.kind}: <b>${p.reps ? p.v + ' reps' : p.kind === '1RM estimado' ? fmt1RM(p.v) : fmtWU(p.v)}</b> <small>antes ${p.reps ? p.prev : nf(toDisp(p.prev), 1)}</small></span></li>`).join('')}</ul>` : ''}
    ${canUpdate ? `<label class="check-row" for="sum-upd"><input type="checkbox" id="sum-upd"><span>Actualizar la rutina «${esc(r.name)}» con los ejercicios y series de hoy</span></label>` : ''}
    <button class="btn btn-primary btn-block" data-act="sum-ok">Listo</button>`, {
    acts: {
      'sum-ok': (el, e, l) => {
        const cb = $('#sum-upd', l);
        if (cb && cb.checked) { r.items = newItems; r.updated = Date.now(); logEv('rutina', `Rutina actualizada desde el entrenamiento: ${r.name}`); persist(); render(true); toast('Rutina actualizada', 'good'); }
        closeLayer(l);
      },
    },
  });
}

/* Selector de ejercicios */
function openPicker({ multi = true, title = 'Agregar ejercicios', onDone }) {
  const st = { q: '', m: 'all', sel: [] };
  const usage = {};
  S.sessions.slice(-40).forEach((s, i) => s.items.forEach(it => { usage[it.ex] = i + 1; }));
  const recent = Object.keys(usage).sort((a, b) => usage[b] - usage[a]).slice(0, 8);
  const w = openSheet(`
    <div class="sheet-top"><h3 class="sheet-title">${title}</h3><button class="icon-btn" data-act="close-layer" aria-label="Cerrar">${ic('x')}</button></div>
    <div class="search">${ic('search', 'ic-sm')}<input id="pk-q" data-f="pk-q" placeholder="Buscar ejercicio" autocomplete="off" aria-label="Buscar ejercicio"></div>
    <div class="chips chips-scroll">${[['all', 'Todos'], ...Object.entries(MUSCLES).filter(([k]) => k !== 'otro').map(([k, v]) => [k, v.n]), ['otro', 'Otro']].map(([k, l]) => `<button class="chip${k === 'all' ? ' on' : ''}" data-act="pk-m" data-m="${k}">${l}</button>`).join('')}</div>
    <div class="pk-list"></div><div class="pk-foot"></div>`, {
    acts: {
      'pk-m': el => { st.m = el.dataset.m; $$('[data-act="pk-m"]', w).forEach(c => c.classList.toggle('on', c.dataset.m === st.m)); drawList(); },
      'pk-tog': el => {
        const id = el.dataset.id;
        if (!multi) { closeLayer(w); onDone([id]); return; }
        const i = st.sel.indexOf(id);
        if (i >= 0) st.sel.splice(i, 1); else st.sel.push(id);
        drawList(); drawFoot();
      },
      'pk-done': () => { closeLayer(w); onDone(st.sel.slice()); },
      'pk-new': () => openExerciseForm({ name: st.q, onSave: ex => { if (multi) { st.sel.push(ex.id); drawList(); drawFoot(); } else { closeLayer(w); onDone([ex.id]); } } }),
      'input:pk-q': el => { st.q = el.value; drawList(); },
    },
  });
  function row(e) {
    const m = MUSCLES[e.muscle] || MUSCLES.otro, i = st.sel.indexOf(e.id);
    return `<button class="pk-item${i >= 0 ? ' sel' : ''}" data-act="pk-tog" data-id="${e.id}"><span class="mdot" style="background:${m.c}"></span><span class="pk-name">${esc(e.name)}<small>${m.n}${e.custom ? ' · creado por ti' : ''}</small></span><span class="pk-check">${i >= 0 ? (multi ? i + 1 : ic('check')) : ''}</span></button>`;
  }
  function drawList() {
    const q = norm(st.q.trim());
    const all = S.exercises.filter(e => !e.hidden && (st.m === 'all' || e.muscle === st.m) && (!q || norm(e.name).includes(q)));
    let html = '';
    if (!q && st.m === 'all' && recent.length) html += `<p class="pk-group">Recientes</p>${recent.map(exById).filter(e => !e.hidden).map(row).join('')}<p class="pk-group">Todos</p>`;
    html += all.sort((a, b) => a.name.localeCompare(b.name, 'es')).map(row).join('');
    if (!all.length) html += `<p class="muted pk-none">No hay ejercicios con ese nombre.</p>`;
    html += `<button class="pk-item pk-new" data-act="pk-new">${ic('plus')}<span class="pk-name">${st.q.trim() ? `Crear «${esc(st.q.trim())}»` : 'Crear ejercicio nuevo'}</span></button>`;
    $('.pk-list', w).innerHTML = html;
  }
  function drawFoot() {
    $('.pk-foot', w).innerHTML = multi && st.sel.length ? `<button class="btn btn-primary btn-block" data-act="pk-done">Agregar ${st.sel.length} ${st.sel.length === 1 ? 'ejercicio' : 'ejercicios'}</button>` : '';
  }
  drawList(); drawFoot();
}
function openExerciseForm({ name = '', existing = null, onSave }) {
  let m = existing ? existing.muscle : 'pecho';
  const w = openSheet(`
    <h3 class="sheet-title">${existing ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h3>
    <label class="flabel" for="nx-name">Nombre</label>
    <input id="nx-name" class="field" value="${esc(existing ? existing.name : name)}" maxlength="50" placeholder="Ej: Press Arnold" autocomplete="off">
    <p class="flabel">Grupo muscular</p>
    <div class="chips">${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip${k === m ? ' on' : ''}" data-act="nx-m" data-m="${k}">${v.n}</button>`).join('')}</div>
    <div class="dlg-btns">${existing ? `<button class="btn btn-ghost-bad" data-act="nx-del">Eliminar</button>` : ''}<button class="btn btn-primary" data-act="nx-save">Guardar</button></div>`, {
    acts: {
      'nx-m': el => { m = el.dataset.m; $$('[data-act="nx-m"]', w).forEach(c => c.classList.toggle('on', c.dataset.m === m)); },
      'nx-save': () => {
        const n = $('#nx-name', w).value.trim();
        if (!n) { toast('Escribe el nombre del ejercicio'); return; }
        const dup = S.exercises.find(e => !e.hidden && norm(e.name) === norm(n) && e !== existing);
        if (dup) { toast('Ya existe un ejercicio con ese nombre'); return; }
        let ex;
        if (existing) { const old = existing.name; existing.name = n; existing.muscle = m; ex = existing; logEv('ejercicio', `Ejercicio editado: ${old}${old !== n ? ' → ' + n : ''}`); }
        else { ex = { id: 'c-' + uid(), name: n, muscle: m, custom: true }; S.exercises.push(ex); logEv('ejercicio', `Ejercicio creado: ${n} (${MUSCLES[m].n})`); }
        persist(); closeLayer(w); onSave && onSave(ex);
      },
      'nx-del': async () => {
        if (!await confirmBox({ title: `¿Eliminar «${existing.name}»?`, text: 'Dejará de aparecer en la lista. Tu historial con este ejercicio se conserva.', ok: 'Eliminar', danger: true })) return;
        existing.hidden = true; logEv('ejercicio', `Ejercicio eliminado: ${existing.name}`); persist(); closeLayer(w); onSave && onSave(null);
      },
    },
  });
  setTimeout(() => { const i = $('#nx-name', w); if (i && !existing) i.focus(); }, 300);
}

/* Detalle de sesión del historial */
function openSession(id) {
  const sess = S.sessions.find(s => s.id === id);
  if (!sess) return;
  let mode = 'view', draft = null;
  const w = openSheet('', {
    acts: {
      'sd-edit': () => { mode = 'edit'; draft = clone(sess); draw(); },
      'sd-cancel': () => { mode = 'view'; draw(); },
      'sd-del-set': el => { const it = draft.items.find(i => i.id === el.dataset.it); it.sets = it.sets.filter(s => s.id !== el.dataset.set); draft.items = draft.items.filter(i => i.sets.length); draw(); },
      'sd-save': () => {
        if (!draft.items.length) { toast('El entrenamiento necesita al menos una serie'); return; }
        for (const it of draft.items) for (const s of it.sets) if (!s.r || s.r < 1) { toast('Revisa las repeticiones: no pueden quedar vacías'); return; }
        Object.assign(sess, draft);
        sess.prs = sessionPRs(sess).length;
        logEv('entreno', `Entrenamiento editado: ${sess.name} (${fmtDate(sess.start)})`);
        persist(); mode = 'view'; draw(); render(true); toast('Cambios guardados', 'good');
      },
      'sd-del': async () => {
        if (!await confirmBox({ title: '¿Eliminar este entrenamiento?', text: `${sess.name} del ${fmtDate(sess.start)}. No se puede deshacer.`, ok: 'Eliminar', danger: true })) return;
        S.sessions = S.sessions.filter(s => s !== sess);
        logEv('entreno', `Entrenamiento eliminado: ${sess.name} (${fmtDate(sess.start)})`);
        persist(); closeLayer(w); render(true); toast('Entrenamiento eliminado');
      },
      'sd-routine': () => {
        const r = { id: uid(), name: sess.name, color: sess.color || ROUTINE_COLORS[S.routines.length % 6], note: '', created: Date.now(), updated: Date.now(), items: sess.items.map(it => ({ id: uid(), ex: it.ex, sets: Math.max(1, it.sets.filter(isWork).length), reps: it.reps || '8-12', rest: it.rest || S.settings.rest })) };
        S.routines.push(r);
        logEv('rutina', `Rutina creada desde el historial: ${r.name}`);
        persist(); closeLayer(w); toast(`Rutina «${r.name}» creada`, 'good');
      },
      'input:sd-name': el => { draft.name = el.value; },
      'input:sd-note': el => { draft.note = el.value; },
      'input:sd-w': el => { const s = draftSet(el); const v = parseNum(el.value); s.w = v == null ? 0 : fromDisp(v); },
      'input:sd-r': el => { const s = draftSet(el); const v = parseNum(el.value); s.r = v == null ? null : Math.round(v); },
    },
  });
  const draftSet = el => draft.items.find(i => i.id === el.dataset.it).sets.find(s => s.id === el.dataset.set);
  function draw() {
    const s = mode === 'edit' ? draft : sess;
    const prs = mode === 'view' ? sessionPRs(sess) : [];
    const prEx = new Set(prs.map(p => p.ex));
    const ex = s.items.map(it => {
      let n = 0;
      const best = prEx.has(it.ex) ? Math.max(...it.sets.filter(isWork).map(x => x.w || 0)) : -1;
      return `<div class="sd-ex"><div class="sd-ex-head"><b>${esc(exName(it.ex))}</b>${mtag(it.ex)}${prEx.has(it.ex) ? `<span class="pr-pill">${ic('trophy', 'ic-xs')}PR</span>` : ''}</div>
        ${it.note ? `<p class="ex-note">${ic('note', 'ic-sm')}${esc(it.note)}</p>` : ''}
        <div class="sd-sets">${it.sets.map(x => {
          const lab = isWork(x) ? (x.type === 'n' ? ++n : (n++, SET_TYPES[x.type].s)) : 'C';
          if (mode === 'edit') return `<div class="sd-set edit"><span class="set-num t-${x.type}">${lab}</span><input id="sd-w-${x.id}" class="field field-sm" data-f="sd-w" data-it="${it.id}" data-set="${x.id}" inputmode="decimal" value="${numStr(x.w)}" aria-label="Peso"><span class="muted">${U()} ×</span><input id="sd-r-${x.id}" class="field field-sm" data-f="sd-r" data-it="${it.id}" data-set="${x.id}" inputmode="numeric" value="${x.r ?? ''}" aria-label="Repeticiones"><button class="icon-btn sm" data-act="sd-del-set" data-it="${it.id}" data-set="${x.id}" aria-label="Eliminar serie">${ic('trash')}</button></div>`;
          return `<div class="sd-set"><span class="set-num t-${x.type}">${lab}</span><span>${fmtW(x.w)} ${U()} × ${x.r}</span>${isWork(x) && x.w === best && best > 0 ? ic('trophy', 'ic-xs ic-accent') : ''}<span class="muted sd-1rm">${isWork(x) && x.w ? '1RM ≈ ' + nf(toDisp(e1rm(x.w, x.r)), 1) : ''}</span></div>`;
        }).join('')}</div></div>`;
    }).join('');
    setSheet(w, mode === 'edit' ? `
      <div class="sheet-top"><h3 class="sheet-title">Editar entrenamiento</h3></div>
      <label class="flabel" for="sd-name">Nombre</label><input id="sd-name" class="field" data-f="sd-name" value="${esc(s.name)}" maxlength="40">
      ${ex}
      <label class="flabel" for="sd-note">Notas</label><textarea id="sd-note" class="field" data-f="sd-note" rows="2">${esc(s.note || '')}</textarea>
      <div class="dlg-btns"><button class="btn btn-soft" data-act="sd-cancel">Cancelar</button><button class="btn btn-primary" data-act="sd-save">Guardar cambios</button></div>` : `
      <div class="sheet-top"><div><p class="eyebrow">${esc(fmtDateLong(s.start))} · ${fmtTime(s.start)}–${fmtTime(s.end)}</p><h3 class="sheet-title">${esc(s.name)}</h3></div><button class="icon-btn" data-act="close-layer" aria-label="Cerrar">${ic('x')}</button></div>
      <div class="stat-grid">${[['Duración', fmtDur(s.end - s.start)], ['Volumen', fmtVol(sessVolume(s))], ['Series', sessSets(s)], ['Récords', prs.length]].map(([l, v]) => `<div class="stat"><small>${l}</small><b>${v}</b></div>`).join('')}</div>
      ${s.note ? `<p class="sd-note">${ic('note', 'ic-sm')}${esc(s.note)}</p>` : ''}
      ${ex}
      <div class="menu">${menuItem('sd-edit', 'pencil', 'Editar pesos y repeticiones')}${menuItem('sd-routine', 'copy', 'Guardar como rutina')}${menuItem('sd-del', 'trash', 'Eliminar entrenamiento', true)}</div>`);
  }
  draw();
}

/* Respaldo */
function backupJSON() { return JSON.stringify({ app: 'hierro', version: VERSION, exported: Date.now(), ...S, active: null }); }
function markBackup(how) { S.settings.lastBackup = Date.now(); logEv('datos', `Respaldo exportado (${how})`); persist(); }
function openExport() {
  openSheet(`
    <h3 class="sheet-title">Exportar respaldo</h3>
    <p class="muted">Incluye rutinas, entrenamientos, peso corporal, tus ejercicios y el registro de actividad. Guárdalo en Archivos, iCloud Drive o envíatelo por correo.</p>
    <div class="stack"><button class="btn btn-primary btn-block" data-act="exp-file">${ic('download')} Guardar archivo</button><button class="btn btn-soft btn-block" data-act="exp-copy">${ic('copy')} Copiar como texto</button></div>`, {
    acts: {
      'exp-file': async (el, e, l) => {
        const name = `hierro-respaldo-${isoDate(new Date())}.json`;
        const blob = new Blob([backupJSON()], { type: 'application/json' });
        try {
          const file = new File([blob], name, { type: 'application/json' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Respaldo de Hierro' }); markBackup('archivo'); closeLayer(l); render(true); return; }
        } catch (err) { if (err && err.name === 'AbortError') return; }
        try {
          const url = URL.createObjectURL(blob), a = document.createElement('a');
          a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          markBackup('archivo'); closeLayer(l); render(true); toast('Respaldo descargado', 'good');
        } catch (err) { toast('No se pudo crear el archivo. Usa «Copiar como texto».', 'bad'); }
      },
      'exp-copy': (el, e, l) => {
        const txt = backupJSON();
        const fallback = () => { setSheet(l, `<h3 class="sheet-title">Copia este texto</h3><p class="muted">Mantén presionado, selecciona todo y copia. Pégalo en Notas o en un correo.</p><textarea id="exp-txt" class="field mono" rows="8" readonly>${esc(txt)}</textarea>`); const t = $('#exp-txt', l); t.focus(); t.select(); markBackup('texto'); };
        if (!navigator.clipboard) { fallback(); return; }
        navigator.clipboard.writeText(txt).then(() => { markBackup('texto'); closeLayer(l); render(true); toast('Respaldo copiado. Pégalo en Notas o en un correo.', 'good'); }, fallback);
      },
    },
  });
}
function openImport() {
  const w = openSheet(`
    <h3 class="sheet-title">Importar respaldo</h3>
    <p class="muted">Reemplaza los datos de esta app por los del respaldo.</p>
    <label class="btn btn-primary btn-block file-btn" for="imp-file">${ic('upload')} Elegir archivo .json</label>
    <input id="imp-file" type="file" accept="application/json,.json,text/plain" class="sr" data-f="imp-file">
    <label class="flabel" for="imp-txt">O pega el texto del respaldo</label>
    <textarea id="imp-txt" class="field mono" rows="4" placeholder='{"app":"hierro", …}'></textarea>
    <button class="btn btn-soft btn-block" data-act="imp-text">Importar texto</button>`, {
    acts: {
      'input:imp-file': el => { const f = el.files && el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => doImport(String(rd.result), w); rd.readAsText(f); },
      'imp-text': () => doImport($('#imp-txt', w).value, w),
    },
  });
}
async function doImport(txt, layer) {
  let obj;
  try { obj = JSON.parse(txt); } catch (e) { toast('Ese contenido no es un respaldo válido', 'bad'); return; }
  if (!obj || !Array.isArray(obj.sessions) || !Array.isArray(obj.routines)) { toast('Ese archivo no es un respaldo de Hierro', 'bad'); return; }
  if (!await confirmBox({ title: '¿Reemplazar tus datos?', text: `El respaldo tiene ${obj.routines.length} rutinas y ${obj.sessions.length} entrenamientos. Lo que tienes ahora en la app se perderá.`, ok: 'Importar', danger: true })) return;
  const keepActive = S.active;
  S = normalize(obj);
  if (keepActive && !S.active) S.active = keepActive;
  logEv('datos', `Respaldo importado: ${obj.routines.length} rutinas, ${obj.sessions.length} entrenamientos`);
  persist(true); applyTheme(); closeLayer(layer); render(); toast('Datos importados', 'good');
}

/* Registro de actividad */
function openLog() {
  let f = 'all', lim = 150;
  const w = openSheet('', { acts: { 'log-f': el => { f = el.dataset.k; lim = 150; draw(); }, 'log-more': () => { lim += 300; draw(); } } });
  function draw() {
    const items = S.log.filter(x => f === 'all' || x.k === f).slice().reverse();
    let last = '';
    const rows = items.slice(0, lim).map(x => {
      const k = dayKey(x.t), head = k !== last ? `<p class="log-day">${esc(cap(rel(x.t) === 'hoy' ? 'Hoy' : rel(x.t) === 'ayer' ? 'Ayer' : fmtDateLong(x.t)))}</p>` : '';
      last = k;
      return `${head}<div class="log-row"><time>${fmtTime(x.t)}</time><span class="log-k k-${x.k}">${esc(LOG_KINDS[x.k] || x.k)}</span><p>${esc(x.m)}</p></div>`;
    }).join('');
    setSheet(w, `
      <div class="sheet-top"><div><p class="eyebrow">${nf(S.log.length, 0)} acciones · desde ${esc(fmtDate(S.log.length ? S.log[0].t : Date.now()))}</p><h3 class="sheet-title">Registro de actividad</h3></div><button class="icon-btn" data-act="close-layer" aria-label="Cerrar">${ic('x')}</button></div>
      <div class="chips chips-scroll">${[['all', 'Todo'], ...Object.entries(LOG_KINDS)].map(([k, l]) => `<button class="chip${f === k ? ' on' : ''}" data-act="log-f" data-k="${k}">${l}</button>`).join('')}</div>
      <div class="log">${rows || '<p class="muted">Sin acciones en esta categoría.</p>'}</div>
      ${items.length > lim ? `<button class="btn btn-soft btn-block" data-act="log-more">Ver más (${items.length - lim})</button>` : ''}`);
  }
  draw();
}
function openExercises() {
  const w = openSheet('', {
    acts: {
      'ex-new': () => openExerciseForm({ onSave: () => draw() }),
      'ex-edit': el => openExerciseForm({ existing: exById(el.dataset.id), onSave: () => draw() }),
    },
  });
  function draw() {
    const groups = Object.entries(MUSCLES).map(([k, m]) => {
      const list = S.exercises.filter(e => !e.hidden && e.muscle === k).sort((a, b) => a.name.localeCompare(b.name, 'es'));
      if (!list.length) return '';
      return `<p class="pk-group"><span class="mdot" style="background:${m.c}"></span>${m.n} · ${list.length}</p>${list.map(e => e.custom
        ? `<button class="pk-item" data-act="ex-edit" data-id="${e.id}"><span class="pk-name">${esc(e.name)}<small>Creado por ti · tocar para editar</small></span>${ic('pencil', 'ic-sm')}</button>`
        : `<div class="pk-item static"><span class="pk-name">${esc(e.name)}</span></div>`).join('')}`;
    }).join('');
    setSheet(w, `<div class="sheet-top"><h3 class="sheet-title">Mis ejercicios</h3><button class="icon-btn" data-act="close-layer" aria-label="Cerrar">${ic('x')}</button></div>
      <button class="btn btn-primary btn-block" data-act="ex-new">${ic('plus')} Crear ejercicio</button>${groups}`);
    render(true);
  }
  draw();
}
function openInstall() {
  openSheet(`
    <h3 class="sheet-title">Instalar en iPhone</h3>
    <ol class="steps">
      <li><b>Abre esta página en Safari.</b> En Chrome u otras apps no aparece la opción.</li>
      <li>Toca el botón <b>Compartir</b> ${ic('share', 'ic-sm')} en la barra inferior.</li>
      <li>Desliza y elige <b>Agregar a pantalla de inicio</b>.</li>
      <li>Toca <b>Agregar</b>. Hierro aparecerá con su ícono, como cualquier app.</li>
    </ol>
    <p class="muted small">Ábrela siempre desde el ícono. Funciona sin internet y tus datos quedan guardados en el teléfono aunque la cierres. Para no perderlos si cambias de iPhone, usa <b>Exportar respaldo</b>.</p>
    <button class="btn btn-primary btn-block" data-act="close-layer">Entendido</button>`);
}
function openPlates() {
  const lb = U() === 'lb';
  const plates = lb ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25];
  const colors = lb ? { 45: '#3e7bfa', 35: '#e9a21f', 25: '#2fbf71', 10: '#eceef1', 5: '#e5484d', 2.5: '#3a3f47' } : { 25: '#e5484d', 20: '#3e7bfa', 15: '#e9a21f', 10: '#2fbf71', 5: '#eceef1', 2.5: '#3a3f47', 1.25: '#b9c0ca' };
  const heights = lb ? { 45: 100, 35: 88, 25: 76, 10: 58, 5: 46, 2.5: 38 } : { 25: 100, 20: 100, 15: 88, 10: 76, 5: 56, 2.5: 44, 1.25: 36 };
  const bars = lb ? [45, 35, 25] : [20, 15, 10];
  let bar = lb ? S.settings.barLb : S.settings.barKg, target = '';
  const w = openSheet(`
    <h3 class="sheet-title">Calculadora de discos</h3>
    <label class="flabel" for="pl-t">Peso total que quieres levantar (${U()})</label>
    <input id="pl-t" class="field big-in" data-f="pl-t" inputmode="decimal" placeholder="Ej: ${lb ? 225 : 100}" autocomplete="off">
    <p class="flabel">Barra</p><div class="chips pl-bars"></div>
    <div class="pl-out"></div>`, {
    acts: {
      'input:pl-t': el => { target = el.value; draw(); },
      'pl-bar': el => { bar = Number(el.dataset.v); if (lb) S.settings.barLb = bar; else S.settings.barKg = bar; persist(); draw(); },
    },
  });
  function draw() {
    $('.pl-bars', w).innerHTML = bars.map(b => `<button class="chip${b === bar ? ' on' : ''}" data-act="pl-bar" data-v="${b}">${b} ${U()}</button>`).join('');
    const t = parseNum(target), out = $('.pl-out', w);
    if (t == null) { out.innerHTML = '<p class="muted">Escribe un peso para ver los discos de cada lado.</p>'; return; }
    if (t < bar) { out.innerHTML = `<p class="muted">El peso es menor que la barra (${bar} ${U()}).</p>`; return; }
    let rem = (t - bar) / 2;
    const used = [];
    for (const p of plates) while (rem >= p - 1e-9) { used.push(p); rem = round2(rem - p); }
    const counts = used.reduce((m, p) => ((m[p] = (m[p] || 0) + 1), m), {});
    out.innerHTML = `
      <div class="pl-vis" aria-hidden="true"><span class="pl-sleeve"></span>${used.map(p => `<span class="pl-plate" style="--c:${colors[p]};height:${heights[p]}%"><em>${nf(p, 2)}</em></span>`).join('')}<span class="pl-collar"></span></div>
      <p class="pl-side">Por cada lado: <b>${used.length ? Object.entries(counts).sort((a, b) => b[0] - a[0]).map(([p, n]) => `${n} × ${nf(Number(p), 2)}`).join(' + ') : 'nada, solo la barra'}</b></p>
      ${rem > 0.01 ? `<p class="warn">Faltan ${nf(rem * 2, 2)} ${U()} para llegar exacto. Total posible: ${nf(t - rem * 2, 2)} ${U()}.</p>` : ''}`;
  }
  draw();
}
function open1RM() {
  let wv = '', rv = '';
  const w = openSheet(`
    <h3 class="sheet-title">Calculadora de 1RM</h3>
    <p class="muted small">Estima tu repetición máxima con la fórmula de Epley a partir de una serie reciente.</p>
    <div class="two"><div><label class="flabel" for="rm-w">Peso (${U()})</label><input id="rm-w" class="field big-in" data-f="rm-w" inputmode="decimal" placeholder="80"></div><div><label class="flabel" for="rm-r">Reps</label><input id="rm-r" class="field big-in" data-f="rm-r" inputmode="numeric" placeholder="6"></div></div>
    <div class="rm-out"></div>`, {
    acts: { 'input:rm-w': el => { wv = el.value; draw(); }, 'input:rm-r': el => { rv = el.value; draw(); } },
  });
  function draw() {
    const W = parseNum(wv), R = parseNum(rv), out = $('.rm-out', w);
    if (!W || !R) { out.innerHTML = ''; return; }
    const one = e1rm(W, Math.round(R));
    const rows = [100, 95, 90, 85, 80, 75, 70, 65, 60].map(p => `<tr><td>${p}%</td><td><b>${nf(round2((one * p) / 100), 1)} ${U()}</b></td><td>${p === 100 ? 1 : Math.max(1, Math.round(30 * (100 / p - 1)))} reps</td></tr>`).join('');
    out.innerHTML = `<div class="rm-big"><small>1RM estimado</small><b>${nf(round2(one), 1)} ${U()}</b></div>${R > 12 ? '<p class="warn">Con más de 12 reps la estimación es menos precisa.</p>' : ''}<table class="rm-table"><thead><tr><th>%</th><th>Peso</th><th>Reps aprox.</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
}

const ACT = {
  tab: el => go(el.dataset.t),
  'hide-install': () => { S.settings.installHidden = true; persist(); render(true); },
  'hide-welcome': () => { S.settings.welcomeHidden = true; persist(); render(true); },
  start: el => startWorkout(el.dataset.id || null),
  'routine-new': () => { ui.edit = { isNew: true, id: uid(), name: '', color: ROUTINE_COLORS[S.routines.length % ROUTINE_COLORS.length], note: '', items: [] }; ui.view = 'routine'; render(); window.scrollTo(0, 0); },
  'routine-menu': el => {
    const r = S.routines.find(x => x.id === el.dataset.id);
    openSheet(`<h3 class="sheet-title">${esc(r.name)}</h3><div class="menu">${menuItem('r-start', 'play', 'Iniciar entrenamiento')}${menuItem('r-edit', 'pencil', 'Editar rutina')}${menuItem('r-dup', 'copy', 'Duplicar')}${menuItem('r-del', 'trash', 'Eliminar rutina', true)}</div>`, {
      acts: {
        'r-start': (b, e, l) => { closeLayer(l); startWorkout(r.id); },
        'r-edit': (b, e, l) => { closeLayer(l); ui.edit = { ...clone(r), isNew: false }; ui.view = 'routine'; render(); window.scrollTo(0, 0); },
        'r-dup': (b, e, l) => { const c = { ...clone(r), id: uid(), name: r.name + ' (copia)', created: Date.now(), updated: Date.now() }; c.items.forEach(i => { i.id = uid(); }); S.routines.splice(S.routines.indexOf(r) + 1, 0, c); logEv('rutina', `Rutina duplicada: ${r.name}`); persist(); closeLayer(l); render(true); },
        'r-del': async (b, e, l) => { if (!await confirmBox({ title: `¿Eliminar «${r.name}»?`, text: 'Tu historial de entrenamientos con esta rutina se conserva.', ok: 'Eliminar', danger: true })) return; S.routines = S.routines.filter(x => x !== r); logEv('rutina', `Rutina eliminada: ${r.name}`); persist(); closeLayer(l); render(true); },
      },
    });
  },
  'ed-color': el => { ui.edit.color = el.dataset.c; render(true); },
  'ed-add': () => openPicker({ onDone: ids => { for (const ex of ids) ui.edit.items.push({ id: uid(), ex, sets: 3, reps: '8-12', rest: S.settings.rest }); render(true); } }),
  'ed-del': el => { ui.edit.items.splice(Number(el.closest('[data-i]').dataset.i), 1); render(true); },
  'ed-move': el => { const i = Number(el.closest('[data-i]').dataset.i), j = i + Number(el.dataset.d), a = ui.edit.items; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; render(true); },
  'ed-sets': el => { const it = ui.edit.items[Number(el.closest('[data-i]').dataset.i)]; it.sets = clamp(it.sets + Number(el.dataset.d), 1, 12); render(true); },
  'edit-cancel': () => { ui.edit = null; ui.view = null; render(); window.scrollTo(0, 0); },
  'edit-save': () => {
    const e = ui.edit;
    if (!e.name.trim()) { toast('Ponle un nombre a la rutina'); $('#ed-name').focus(); return; }
    if (!e.items.length) { toast('Agrega al menos un ejercicio'); return; }
    const data = { id: e.id, name: e.name.trim(), color: e.color, note: e.note || '', items: e.items, created: e.created || Date.now(), updated: Date.now() };
    const i = S.routines.findIndex(r => r.id === e.id);
    if (i >= 0) S.routines[i] = data; else S.routines.push(data);
    logEv('rutina', `${e.isNew ? 'Rutina creada' : 'Rutina editada'}: ${data.name} (${data.items.length} ejercicios)`);
    persist(); ui.edit = null; ui.view = null; render(); window.scrollTo(0, 0);
    toast(e.isNew ? 'Rutina creada' : 'Rutina guardada', 'good');
  },
  'wk-open': () => { ui.view = 'workout'; render(); window.scrollTo(0, 0); },
  'wk-min': () => { ui.view = null; render(); window.scrollTo(0, 0); },
  'wk-finish': () => finishWorkout(),
  'wk-cancel': async () => { if (await confirmBox({ title: '¿Descartar entrenamiento?', text: 'Se perderán las series de esta sesión. Quedará anotado en el registro de actividad.', ok: 'Descartar', danger: true })) discardWorkout(); },
  'wk-add-ex': () => addExercisesToWorkout(),
  'set-done': el => {
    const { it, s, row } = setOf(el);
    if (!s) return;
    if (s.done) { s.done = false; logEv('serie', `Serie desmarcada: ${exName(it.ex)}`); persist(); render(true); return; }
    const wIn = $('[data-f="w"]', row), rIn = $('[data-f="r"]', row);
    let w = parseNum(wIn.value), r = parseNum(rIn.value);
    w = w == null ? (row.dataset.phw !== '' ? Number(row.dataset.phw) : 0) : fromDisp(w);
    if (r == null && row.dataset.phr !== '') r = Number(row.dataset.phr);
    if (!r || r < 1) { rIn.focus(); row.classList.add('shake'); setTimeout(() => row.classList.remove('shake'), 450); toast('Escribe las repeticiones de la serie'); return; }
    const best = bestWeight(it.ex);
    s.w = w; s.r = Math.round(r); s.done = true; s.t = Date.now();
    logEv('serie', `${exName(it.ex)}: ${fmtWU(w)} × ${s.r}${s.type !== 'n' ? ` (${SET_TYPES[s.type].l.toLowerCase()})` : ''}`);
    haptic();
    if (isWork(s) && best > 0 && w > best) toast(`¡Nuevo récord en ${exName(it.ex)}: ${fmtWU(w)}!`, 'pr');
    startRest(s.type === 'w' ? Math.min(it.rest, 60) : it.rest, exName(it.ex));
    persist(); render(true);
  },
  'use-prev': el => {
    const { s } = setOf(el);
    if (!s || el.dataset.w == null) return;
    s.w = Number(el.dataset.w); s.r = Number(el.dataset.r); persist(); render(true);
  },
  'set-add': el => {
    const it = itemOf(el), last = it.sets[it.sets.length - 1];
    it.sets.push({ id: uid(), w: last ? last.w : null, r: last ? last.r : null, type: 'n', done: false });
    persist(); render(true);
  },
  'set-menu': el => {
    const { it, s } = setOf(el);
    openSheet(`<h3 class="sheet-title">Tipo de serie</h3><div class="menu">${Object.entries(SET_TYPES).map(([k, v]) => `<button class="menu-item${s.type === k ? ' on' : ''}" data-act="st" data-k="${k}"><span class="set-num t-${k}">${v.s || '1'}</span><span>${v.l}</span>${s.type === k ? ic('check', 'ic-sm ic-accent') : ''}</button>`).join('')}${menuItem('st-del', 'trash', 'Eliminar serie', true)}</div>`, {
      acts: {
        st: (b, e, l) => { s.type = b.dataset.k; persist(); closeLayer(l); render(true); },
        'st-del': (b, e, l) => { it.sets = it.sets.filter(x => x !== s); persist(); closeLayer(l); render(true); },
      },
    });
  },
  'sug-apply': el => {
    const it = itemOf(el), w = Number(el.dataset.w);
    it.sets.forEach(s => { if (isWork(s) && !s.done) s.w = w; });
    persist(); render(true); toast(`Peso actualizado a ${fmtWU(w)}`, 'good');
  },
  'ex-rest': el => openRestPicker(itemOf(el)),
  'ex-menu': el => {
    const it = itemOf(el), a = S.active, i = a.items.indexOf(it);
    openSheet(`<h3 class="sheet-title">${esc(exName(it.ex))}</h3><div class="menu">
      ${menuItem('m-note', 'note', it.note ? 'Editar nota' : 'Agregar nota')}
      ${menuItem('m-rest', 'timer', 'Descanso: ' + fmtRest(it.rest))}
      ${i > 0 ? menuItem('m-up', 'up', 'Mover arriba') : ''}${i < a.items.length - 1 ? menuItem('m-down', 'down', 'Mover abajo') : ''}
      ${menuItem('m-swap', 'swap', 'Reemplazar ejercicio')}
      ${menuItem('m-prog', 'chart', 'Ver progreso')}
      ${menuItem('m-del', 'trash', 'Quitar ejercicio', true)}</div>`, {
      acts: {
        'm-note': (b, e, l) => { closeLayer(l); openNote(it); },
        'm-rest': (b, e, l) => { closeLayer(l); openRestPicker(it); },
        'm-up': (b, e, l) => { a.items.splice(i, 1); a.items.splice(i - 1, 0, it); persist(); closeLayer(l); render(true); },
        'm-down': (b, e, l) => { a.items.splice(i, 1); a.items.splice(i + 1, 0, it); persist(); closeLayer(l); render(true); },
        'm-swap': (b, e, l) => { closeLayer(l); openPicker({ multi: false, title: 'Reemplazar ejercicio', onDone: ([id]) => { if (!id) return; logEv('entreno', `Ejercicio reemplazado: ${exName(it.ex)} → ${exName(id)}`); it.ex = id; persist(); render(true); } }); },
        'm-prog': (b, e, l) => { closeLayer(l); ui.progEx = it.ex; go('progress'); },
        'm-del': async (b, e, l) => {
          if (it.sets.some(s => s.done) && !await confirmBox({ title: '¿Quitar ejercicio?', text: 'Tiene series completadas que se perderán.', ok: 'Quitar', danger: true })) return;
          a.items = a.items.filter(x => x !== it); logEv('entreno', `Ejercicio quitado del entrenamiento: ${exName(it.ex)}`); persist(); closeLayer(l); render(true);
        },
      },
    });
  },
  'rest-adj': el => { const r = S.active.rest; if (!r) return; r.end += Number(el.dataset.d) * 1000; r.total = Math.max(r.total, r.end - Date.now()); if (r.end <= Date.now()) S.active.rest = null; persist(); renderFloating(); tick(); },
  'rest-skip': () => { S.active.rest = null; persist(); renderFloating(); },
  cal: el => { ui.cal = new Date(ui.cal.getFullYear(), ui.cal.getMonth() + Number(el.dataset.d), 1); render(true); },
  'open-sess': el => openSession(el.dataset.id),
  'hist-more': () => { ui.histLimit += 40; render(true); },
  'pg-metric': el => { ui.progMetric = el.dataset.m; render(true); },
  'bw-add': () => {
    const v = parseNum($('#bw-in').value);
    if (!v || v < 20 || v > 700) { toast('Escribe un peso válido'); return; }
    const kg = fromDisp(v);
    S.body.push({ id: uid(), t: Date.now(), w: kg }); S.body.sort((a, b) => a.t - b.t);
    logEv('peso', `Peso corporal registrado: ${fmtWU(kg)}`); persist(); render(true); toast('Peso guardado', 'good');
  },
  'bw-del': el => { const x = S.body.find(b => b.id === el.dataset.id); S.body = S.body.filter(b => b !== x); logEv('peso', `Registro de peso eliminado: ${fmtWU(x.w)} (${fmtDate(x.t)})`); persist(); render(true); },
  'open-plates': () => openPlates(),
  'open-1rm': () => open1RM(),
  'set-unit': el => { if (S.settings.unit === el.dataset.v) return; S.settings.unit = el.dataset.v; logEv('ajustes', `Unidad cambiada a ${el.dataset.v}`); persist(); render(true); },
  'set-theme': el => { S.settings.theme = el.dataset.v; applyTheme(); logEv('ajustes', `Tema: ${el.textContent}`); persist(); render(true); },
  'set-goal': el => { S.settings.weekGoal = clamp(S.settings.weekGoal + Number(el.dataset.d), 1, 7); logEv('ajustes', `Meta semanal: ${S.settings.weekGoal} entrenamientos`); persist(); render(true); },
  'set-toggle': el => {
    const k = el.dataset.k; S.settings[k] = !S.settings[k];
    logEv('ajustes', `${el.getAttribute('aria-label')}: ${S.settings[k] ? 'activado' : 'desactivado'}`);
    if (k === 'sound' && S.settings.sound) { unlockAudio(); beep(); }
    persist(); render(true);
  },
  'open-exp': () => openExport(),
  'open-imp': () => openImport(),
  'open-log': () => openLog(),
  'open-exercises': () => openExercises(),
  'open-install': () => openInstall(),
  'open-wipe': async () => {
    if (!await confirmBox({ title: '¿Borrar todos los datos?', text: 'Se eliminarán rutinas, historial, peso corporal y el registro de actividad. Te recomendamos exportar un respaldo antes. No se puede deshacer.', ok: 'Borrar todo', danger: true })) return;
    S = freshState(); logEv('datos', 'Se borraron todos los datos y se restauraron las rutinas de ejemplo');
    persist(true); applyTheme(); go('home'); toast('Datos borrados');
  },
};
function openNote(it) {
  const w = openSheet(`<h3 class="sheet-title">Nota · ${esc(exName(it.ex))}</h3><label class="sr" for="note-in">Nota</label><textarea id="note-in" class="field" rows="3" placeholder="Agarre, asiento en posición 4, molestia en el hombro…">${esc(it.note || '')}</textarea><button class="btn btn-primary btn-block" data-act="note-ok">Guardar nota</button>`, {
    acts: { 'note-ok': () => { it.note = $('#note-in', w).value.trim(); persist(); closeLayer(w); render(true); } },
  });
  setTimeout(() => $('#note-in', w) && $('#note-in', w).focus(), 300);
}
function openRestPicker(it) {
  openSheet(`<h3 class="sheet-title">Descanso · ${esc(exName(it.ex))}</h3><div class="chips rest-chips">${REST_OPTS.map(o => `<button class="chip${o === it.rest ? ' on' : ''}" data-act="rest-pick" data-v="${o}">${fmtRest(o)}</button>`).join('')}</div>`, {
    acts: { 'rest-pick': (el, e, l) => { it.rest = Number(el.dataset.v); persist(); closeLayer(l); render(true); toast(`Descanso: ${fmtRest(it.rest)}`); } },
  });
}

const INPUT = {
  'wk-name': el => { S.active.name = el.value; persist(); },
  'wk-note': el => { S.active.note = el.value; persist(); },
  w: el => { const { s } = setOf(el); if (!s) return; const v = parseNum(el.value); s.w = v == null ? null : fromDisp(v); persist(); },
  r: el => { const { s } = setOf(el); if (!s) return; const v = parseNum(el.value); s.r = v == null ? null : Math.round(v); persist(); },
  'ed-name': el => { ui.edit.name = el.value; },
  'ed-note': el => { ui.edit.note = el.value; },
  'ed-reps': el => { ui.edit.items[Number(el.closest('[data-i]').dataset.i)].reps = el.value.trim(); },
  'ed-rest': el => { ui.edit.items[Number(el.closest('[data-i]').dataset.i)].rest = Number(el.value); },
  'pg-ex': el => { ui.progEx = el.value; render(true); },
  'set-rest': el => { S.settings.rest = Number(el.value); logEv('ajustes', `Descanso por defecto: ${fmtRest(S.settings.rest)}`); persist(); },
};

/* ---------- Eventos ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const act = el.dataset.act, layer = el.closest('.layer');
  if (act === 'close-layer') { closeLayer(layer || undefined); return; }
  if (layer && layer._acts[act]) { layer._acts[act](el, e, layer); return; }
  if (ACT[act]) ACT[act](el, e);
});
function onInput(e) {
  const el = e.target, f = el.dataset && el.dataset.f;
  if (!f) return;
  const onChange = el.type === 'file' || el.tagName === 'SELECT';
  if ((e.type === 'change') !== onChange) return;
  const layer = el.closest('.layer');
  if (layer && layer._acts['input:' + f]) { layer._acts['input:' + f](el, e, layer); return; }
  if (INPUT[f]) INPUT[f](el, e);
}
document.addEventListener('input', onInput);
document.addEventListener('change', onInput);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && layers.length) closeLayer();
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('set-in')) {
    e.preventDefault();
    const ins = $$('.set-row:not(.done) .set-in'), i = ins.indexOf(e.target);
    if (e.target.dataset.f === 'r') { const btn = $('[data-act="set-done"]', e.target.closest('.set-row')); e.target.blur(); btn.click(); }
    else if (ins[i + 1]) ins[i + 1].focus();
  }
});
document.addEventListener('pointerdown', unlockAudio, { passive: true });
document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('set-in')) setTimeout(() => e.target.select && e.target.select(), 0); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
  else { tick(); requestWake(); }
});
window.addEventListener('pagehide', () => { flush(); });

let themeTouched = false;
function applyTheme() {
  const t = S.settings.theme, root = document.documentElement;
  if (t === 'auto') { if (themeTouched) root.removeAttribute('data-theme'); }
  else { root.dataset.theme = t; themeTouched = true; }
  const m = $('meta[name="theme-color"]');
  if (m) m.content = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#101216';
}

async function init() {
  await DB.init();
  const loaded = await DB.load();
  if (loaded) S = normalize(loaded);
  else { S = freshState(); logEv('datos', 'Hierro instalado. Se crearon 3 rutinas de ejemplo: Empuje, Tirón y Pierna.'); persist(true); }
  applyTheme();
  if (S.active) ui.view = 'workout';
  render();
  if (S.active) toast('Retomamos tu entrenamiento en curso');
  setInterval(tick, 250);
  try {
    if (navigator.storage && navigator.storage.persisted) {
      persisted = await navigator.storage.persisted();
      if (!persisted && navigator.storage.persist && (window.navigator.standalone || S.sessions.length)) persisted = await navigator.storage.persist();
    }
  } catch (e) { /* no disponible */ }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !inFrame) navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();
