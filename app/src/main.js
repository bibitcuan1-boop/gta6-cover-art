// Vice Coast Cover Studio wiring: photos in, caption in, cover out. Photos are read
// on the user's own machine (FileReader / object URLs) and never uploaded anywhere.
// State lives in one object; every committed change pushes an undo snapshot.
import { drawCover, renderCover, defaultState, layoutOf, gradeOf, panelRects, SIZES, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const status = $('status');

let state = defaultState();
let photos = [null, null, null, null]; // up to four user photos, as <img> elements
let history = [];
let future = [];
let dragging = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function snapshot() {
  return JSON.stringify(state);
}

function commit() {
  history.push(snapshot());
  if (history.length > 60) history.shift();
  future = [];
  renderAll();
}

function restore(json) {
  state = JSON.parse(json);
  syncControls();
  renderAll();
}

function undo() {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  status.textContent = 'Undid that change.';
}

function redo() {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  status.textContent = 'Redid that change.';
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w; canvas.height = size.h;
  }
  drawCover(canvas, state, photos);
}

function renderAll() {
  redraw();
  document.querySelectorAll('[data-layout]').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) =>
    b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) =>
    b.classList.toggle('active', b.dataset.size === state.size));
  $('onePhoto').checked = state.onePhoto;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
  $('sun').checked = state.sun;
  $('frameWhite').checked = state.frame === 'white';
  $('frameBlack').checked = state.frame === 'black';
  const panel = state.panels[state.selected] || state.panels[0];
  $('zoom').value = panel.zoom;
  $('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('flip').checked = panel.flip;
  $('panelLabel').textContent = `Panel ${state.selected + 1} of ${layoutOf(state).panels.length} — ${layoutOf(state).name}`;
  $('assignPhoto').value = String(state.onePhoto ? 0 : panel.photo);
  $('assignPhoto').disabled = state.onePhoto;
  $('undo').disabled = !history.length;
  $('redo').disabled = !future.length;
  document.querySelectorAll('.slot').forEach((slot, i) => {
    slot.classList.toggle('filled', !!photos[i]);
    slot.querySelector('.slot-name').textContent = photos[i] ? (photos[i].dataset.name || `Photo ${i + 1}`) : `Photo ${i + 1} — empty`;
  });
}

function syncControls() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('tagline').value = state.tagline;
}

/** Loads a photo into slot `i` from a File, then points the selected panel at it. */
async function addPhotoFile(i, file) {
  const img = await loadImage(URL.createObjectURL(file));
  img.dataset.name = file.name;
  photos[i] = img;
  if (state.onePhoto) { state.panels.forEach((p) => { p.photo = 0; }); }
  state.panels[state.selected].photo = i;
  commit();
  status.textContent = `${file.name} loaded into photo slot ${i + 1}.`;
}

async function addSample(i, sample, name) {
  const img = await loadImage(`samples/${sample}.jpg`);
  img.dataset.name = name;
  photos[i] = img;
  state.panels[state.selected].photo = i;
  commit();
  status.textContent = `Sample ${name} loaded into photo slot ${i + 1}.`;
}

// ---- photo slots ----
document.querySelectorAll('.slot input[type=file]').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) await addPhotoFile(Number(input.dataset.slot), file);
    input.value = '';
  });
});
document.querySelectorAll('.slot [data-sample]').forEach((btn) => {
  btn.addEventListener('click', () => addSample(
    Number(btn.dataset.slot), btn.dataset.sample,
    btn.dataset.sample === 'pier' ? 'Pier — fishing' : 'Boulevard — sunset'));
});

// ---- layout, grade, size ----
document.querySelectorAll('[data-layout]').forEach((b) =>
  b.addEventListener('click', () => { state.layout = b.dataset.layout; state.selected = 0; commit(); }));
document.querySelectorAll('[data-grade]').forEach((b) =>
  b.addEventListener('click', () => { state.grade = b.dataset.grade; commit(); }));
document.querySelectorAll('[data-size]').forEach((b) =>
  b.addEventListener('click', () => { state.size = b.dataset.size; commit(); }));

// ---- caption ----
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('title').addEventListener('change', commit);
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('subtitle').addEventListener('change', commit);
$('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
$('tagline').addEventListener('change', commit);

// ---- finish toggles ----
$('onePhoto').addEventListener('change', (e) => { state.onePhoto = e.target.checked; commit(); });
$('grain').addEventListener('change', (e) => { state.grain = e.target.checked; commit(); });
$('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; commit(); });
$('sun').addEventListener('change', (e) => { state.sun = e.target.checked; commit(); });
document.querySelectorAll('[name=frame]').forEach((r) =>
  r.addEventListener('change', () => { state.frame = $('frameBlack').checked ? 'black' : 'white'; commit(); }));

// ---- selected panel tools ----
$('zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = Number(e.target.value);
  $('zoomVal').textContent = `${Math.round(state.panels[state.selected].zoom * 100)}%`;
  redraw();
});
$('zoom').addEventListener('change', commit);
$('flip').addEventListener('change', (e) => { state.panels[state.selected].flip = e.target.checked; commit(); });
$('assignPhoto').addEventListener('change', (e) => {
  state.panels[state.selected].photo = Number(e.target.value);
  commit();
});
$('resetPanel').addEventListener('click', () => {
  state.panels[state.selected] = { photo: 0, zoom: 1, panX: 0.5, panY: 0.35, flip: false };
  commit();
  status.textContent = 'Panel reset.';
});
$('fillAll').addEventListener('click', () => {
  const src = state.panels[state.selected];
  state.panels.forEach((p) => { p.photo = src.photo; p.zoom = src.zoom; p.panX = src.panX; p.panY = src.panY; });
  commit();
  status.textContent = 'This photo now fills every panel.';
});

$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
});

// ---- canvas: click a panel to select it, drag it to pan the photo ----
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

function panelAt(pt) {
  const rects = panelRects(state, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) return i;
  }
  return -1;
}

canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(canvasPoint(e));
  if (i < 0) return;
  canvas.setPointerCapture(e.pointerId);
  if (i !== state.selected) { state.selected = i; renderAll(); }
  dragging = { start: canvasPoint(e), panX: state.panels[i].panX, panY: state.panels[i].panY };
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const pt = canvasPoint(e);
  const rects = panelRects(state, canvas.width, canvas.height);
  const r = rects[state.selected];
  const p = state.panels[state.selected];
  p.panX = Math.min(1, Math.max(0, dragging.panX - (pt.x - dragging.start.x) / r.w));
  p.panY = Math.min(1, Math.max(0, dragging.panY - (pt.y - dragging.start.y) / r.h));
  redraw();
});

canvas.addEventListener('pointerup', () => {
  if (dragging) { dragging = null; commit(); }
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[state.selected];
  p.zoom = Math.min(3, Math.max(1, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  $('zoom').value = p.zoom;
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
  redraw();
}, { passive: false });

// ---- export ----
function downloadCanvas(c, filename) {
  c.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

function exportSize(sizeId) {
  const c = renderCover(state, photos, sizeId);
  const s = SIZES[sizeId];
  downloadCanvas(c, `vice-coast-${s.w}x${s.h}.png`);
  status.textContent = `Exported vice-coast-${s.w}x${s.h}.png — check your downloads.`;
}

$('export').addEventListener('click', () => exportSize(state.size));
$('exportAll').addEventListener('click', () => {
  Object.keys(SIZES).forEach((id, i) => setTimeout(() => exportSize(id), i * 350));
  status.textContent = 'Exporting all three sizes…';
});

// ---- presets: one tap to a finished look ----
document.querySelectorAll('[data-preset]').forEach((b) => {
  b.addEventListener('click', () => {
    const p = b.dataset.preset;
    if (p === 'sunset-queen') {
      Object.assign(state, { layout: 'hero-split', grade: 'vice-sunset', title: 'BOULEVARD QUEEN', subtitle: 'Vice City nights', onePhoto: true });
    } else if (p === 'neon-nights') {
      Object.assign(state, { layout: 'triple-strip', grade: 'neon-nights', title: 'NEON NIGHTS', subtitle: 'downtown after dark', onePhoto: false });
    } else if (p === 'pier-pressure') {
      Object.assign(state, { layout: 'comic-strip', grade: 'golden-hour', title: 'PIER PRESSURE', subtitle: 'gone fishing', onePhoto: true });
    }
    syncControls();
    commit();
    status.textContent = `Preset “${b.textContent.trim()}” applied — tweak it or export.`;
  });
});

// ---- boot ----
const shot = new URLSearchParams(location.search).get('shot');
async function boot() {
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.ready,
    ]);
  } catch { /* fonts fall back to system sans; the cover still draws */ }
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), { state, photos, addSample, redraw, renderAll, syncControls });
  } else {
    redraw();
  }
  renderAll();
}
boot();
