// Vice Coast cover engine: draws the multi-panel GTA-poster-style cover onto any
// 2D canvas at any export size. Everything drawn here is original: procedural sunset
// gradients, a slit sun, palm and skyline silhouettes, grain and vignette, with the
// user's own photos in the panels and Anton / Pacifico lettering (SIL OFL fonts
// vendored under app/fonts/). No Rockstar logo, artwork or font is used anywhere.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const LAYOUTS = [
  { id: 'hero-split', name: 'Hero Split', panels: [
    { x: 0, y: 0, w: 0.62, h: 1 }, { x: 0.62, y: 0, w: 0.38, h: 0.34 },
    { x: 0.62, y: 0.34, w: 0.38, h: 0.33 }, { x: 0.62, y: 0.67, w: 0.38, h: 0.33 } ] },
  { id: 'grid-four', name: 'Four Grid', panels: [
    { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } ] },
  { id: 'triple-strip', name: 'Triple Strip', panels: [
    { x: 0, y: 0, w: 0.333, h: 1 }, { x: 0.333, y: 0, w: 0.334, h: 1 },
    { x: 0.667, y: 0, w: 0.333, h: 1 } ] },
  { id: 'comic-strip', name: 'Comic Strip', panels: [
    { x: 0, y: 0, w: 1, h: 0.56 }, { x: 0, y: 0.56, w: 0.333, h: 0.44 },
    { x: 0.333, y: 0.56, w: 0.334, h: 0.44 }, { x: 0.667, y: 0.56, w: 0.333, h: 0.44 } ] },
  { id: 'tilted-snaps', name: 'Tilted Snaps', panels: [
    { x: 0.015, y: 0.07, w: 0.32, h: 0.86, rot: -5 }, { x: 0.34, y: 0.015, w: 0.32, h: 0.94, rot: 2 },
    { x: 0.665, y: 0.07, w: 0.32, h: 0.86, rot: -2 } ] },
  { id: 'duo-plus', name: 'Duo Plus', panels: [
    { x: 0, y: 0, w: 1, h: 0.6 }, { x: 0, y: 0.6, w: 0.5, h: 0.4 },
    { x: 0.5, y: 0.6, w: 0.5, h: 0.4 } ] },
];

export const GRADES = [
  { id: 'vice-sunset', name: 'Vice Sunset', filter: 'saturate(1.25) contrast(1.08)',
    top: 'rgba(255,110,60,0.10)', bottom: 'rgba(214,40,140,0.34)', glow: '#ff7a3d' },
  { id: 'neon-nights', name: 'Neon Nights', filter: 'saturate(1.3) contrast(1.12) brightness(0.96)',
    top: 'rgba(0,229,255,0.16)', bottom: 'rgba(255,0,128,0.30)', glow: '#00e5ff' },
  { id: 'golden-hour', name: 'Golden Hour', filter: 'saturate(1.15) contrast(1.05) brightness(1.04)',
    top: 'rgba(255,190,80,0.16)', bottom: 'rgba(255,90,40,0.22)', glow: '#ffc46b' },
  { id: 'palm-noir', name: 'Palm Noir', filter: 'grayscale(1) contrast(1.3) brightness(1.02)',
    top: 'rgba(255,255,255,0.05)', bottom: 'rgba(255,45,149,0.22)', glow: '#ff2d95' },
  { id: 'pastel-palm', name: 'Pastel Palm', filter: 'saturate(0.85) contrast(0.94) brightness(1.08)',
    top: 'rgba(255,210,220,0.18)', bottom: 'rgba(120,200,255,0.16)', glow: '#ffb3c8' },
];

export function defaultState() {
  return {
    layout: 'hero-split', grade: 'vice-sunset', size: 'portrait',
    title: 'BOULEVARD QUEEN', subtitle: 'Vice City nights', tagline: 'VICE COAST • EST. 2026',
    onePhoto: true, frame: 'white', grain: true, vignette: true, sun: true,
    selected: 0,
    panels: [
      { photo: 0, zoom: 1, panX: 0.5, panY: 0.35, flip: false },
      { photo: 0, zoom: 1.1, panX: 0.5, panY: 0.3, flip: false },
      { photo: 0, zoom: 1.1, panX: 0.5, panY: 0.3, flip: false },
      { photo: 0, zoom: 1.1, panX: 0.5, panY: 0.3, flip: false },
      { photo: 0, zoom: 1.1, panX: 0.5, panY: 0.3, flip: false },
      { photo: 0, zoom: 1.1, panX: 0.5, panY: 0.3, flip: false },
    ],
  };
}

export function layoutOf(state) {
  return LAYOUTS.find((l) => l.id === state.layout) || LAYOUTS[0];
}

export function gradeOf(state) {
  return GRADES.find((g) => g.id === state.grade) || GRADES[0];
}

/** Pixel rects of the layout panels inside the panel area, for hit-testing. */
export function panelRects(state, w, h) {
  const band = titleBandHeight(w, h);
  const areaH = h - band;
  const g = Math.max(4, Math.round(w * 0.011));
  return layoutOf(state).panels.map((p) => ({
    x: p.x * w + g, y: p.y * areaH + g,
    w: p.w * w - g * 2, h: p.h * areaH - g * 2, rot: p.rot || 0,
  }));
}

export function titleBandHeight(w, h) {
  return Math.round(h * (w > h ? 0.28 : 0.21));
}

/** A small deterministic noise tile, reused as the grain pattern. */
let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 160; c.height = 160;
  const x = c.getContext('2d');
  const img = x.createImageData(160, 160);
  let s = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const v = s % 256;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 28;
  }
  x.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

/** Draws one palm silhouette: a curved trunk and five drooping fronds. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -55, 26, -96); ctx.stroke();
  ctx.lineWidth = 5;
  const fronds = [[-58, -108, -30, -128], [-20, -128, 4, -140], [30, -132, 62, -118],
    [58, -108, 78, -84], [-52, -96, -78, -76]];
  for (const [x1, y1, x2, y2] of fronds) {
    ctx.beginPath(); ctx.moveTo(26, -96);
    ctx.quadraticCurveTo((26 + x2) / 2 + x1 * 0.3, y1, x2, y2); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(26, -96, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function fitFont(ctx, text, family, startSize, maxWidth, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** Draws the cover described by `state` with `photos` (array of images) onto `canvas`. */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const band = titleBandHeight(w, h);
  const areaH = h - band;
  const grade = gradeOf(state);
  const rects = panelRects(state, w, h);

  // Sunset sky behind everything: gutters and title band show it through.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1b0b2e'); sky.addColorStop(0.42, '#7b1e5e');
  sky.addColorStop(0.68, '#ff5e3a'); sky.addColorStop(0.85, '#ffb347');
  sky.addColorStop(1, '#2a0a33');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

  // Panels: photo, grade, frame.
  rects.forEach((r, i) => {
    const p = state.panels[i] || defaultState().panels[0];
    const photo = state.onePhoto ? photos[0] : photos[p.photo];
    ctx.save();
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    ctx.translate(cx, cy);
    if (r.rot) ctx.rotate((r.rot * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    if (photo) {
      const iw = photo.naturalWidth || photo.width, ih = photo.naturalHeight || photo.height;
      const base = Math.max(r.w / iw, r.h / ih) * p.zoom;
      const dw = iw * base, dh = ih * base;
      // Pan moves the photo inside the panel; clamp so it always covers the panel.
      let dx = r.x + r.w / 2 - dw * p.panX;
      let dy = r.y + r.h / 2 - dh * p.panY;
      dx = Math.min(dx, r.x); dx = Math.max(dx, r.x + r.w - dw);
      dy = Math.min(dy, r.y); dy = Math.max(dy, r.y + r.h - dh);
      ctx.save();
      if (p.flip) { ctx.translate(r.x + r.w / 2, 0); ctx.scale(-1, 1); ctx.translate(-(r.x + r.w / 2), 0); }
      ctx.filter = grade.filter;
      ctx.drawImage(photo, dx, dy, dw, dh);
      ctx.restore();
    } else {
      const ph = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      ph.addColorStop(0, '#3a1550'); ph.addColorStop(1, '#ff7a3d');
      ctx.fillStyle = ph; ctx.fillRect(r.x, r.y, r.w, r.h);
      drawPalm(ctx, r.x + r.w / 2, r.y + r.h * 0.72, Math.min(r.w, r.h) / 260, 'rgba(20,6,30,0.55)');
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `bold ${Math.max(14, r.w * 0.045)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('YOUR PHOTO HERE', r.x + r.w / 2, r.y + r.h * 0.9);
    }
    // Grade wash, clipped to the panel.
    const wash = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    wash.addColorStop(0, grade.top); wash.addColorStop(1, grade.bottom);
    ctx.fillStyle = wash; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();
    // Frame: white border with a thin dark outer line, GTA-poster style.
    const bw = Math.max(3, Math.round(w * 0.005));
    ctx.save();
    ctx.translate(cx, cy);
    if (r.rot) ctx.rotate((r.rot * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    ctx.lineWidth = bw;
    ctx.strokeStyle = state.frame === 'black' ? '#14061e' : '#ffffff';
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.lineWidth = Math.max(1, bw * 0.3);
    ctx.strokeStyle = 'rgba(20,6,30,0.9)';
    ctx.strokeRect(r.x - bw * 0.7, r.y - bw * 0.7, r.w + bw * 1.4, r.h + bw * 1.4);
    ctx.restore();
  });

  // Title band: dark fade at its top so the lettering reads over any panel.
  const fade = ctx.createLinearGradient(0, areaH - h * 0.02, 0, h);
  fade.addColorStop(0, 'rgba(26,8,40,0)'); fade.addColorStop(0.25, 'rgba(26,8,40,0.72)');
  fade.addColorStop(1, 'rgba(26,8,40,0.94)');
  ctx.fillStyle = fade; ctx.fillRect(0, areaH - h * 0.02, w, band + h * 0.02);

  // Retro slit sun, low in the title band on the right.
  if (state.sun) {
    const sr = band * 0.52;
    const sx = w - sr * 1.25, sy = areaH + band * 0.58;
    ctx.save();
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.clip();
    const sg = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
    sg.addColorStop(0, '#ffe259'); sg.addColorStop(0.55, '#ff7a3d'); sg.addColorStop(1, '#ff2d95');
    ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    ctx.fillStyle = '#2a0a33';
    for (let i = 0; i < 4; i++) {
      const yy = sy + sr * (0.08 + i * 0.2);
      ctx.fillRect(sx - sr, yy, sr * 2, sr * (0.03 + i * 0.022));
    }
    ctx.restore();
  }

  // Palm silhouettes framing the title band.
  const palmS = band / 150;
  drawPalm(ctx, w * 0.035, areaH + band * 0.96, palmS * 0.9, 'rgba(16,4,26,0.85)');
  drawPalm(ctx, w * 0.10, areaH + band * 0.99, palmS * 0.6, 'rgba(16,4,26,0.7)');

  // Heat-meter stars + tagline, top of the title band.
  const pad = w * 0.045;
  const starY = areaH + band * 0.17;
  ctx.font = `${Math.round(band * 0.13)}px system-ui, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffd166';
  ctx.shadowColor = 'rgba(255,180,60,0.9)'; ctx.shadowBlur = band * 0.08;
  ctx.fillText('★★★★★', pad, starY);
  ctx.shadowBlur = 0;
  const tag = (state.tagline || '').toUpperCase();
  if (tag) {
    ctx.font = `bold ${Math.round(band * 0.115)}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const tw = ctx.measureText('★★★★★  ').width;
    ctx.fillText(tag, pad + tw, starY);
  }

  // Main title: Anton, sunset-gradient fill, dark outline, hard shadow. It stops
  // short of the retro sun so the two never collide.
  const title = (state.title || 'VICE COAST').trim().toUpperCase();
  if (title) {
    const sunReserve = state.sun ? band * 0.52 * 2.4 : 0;
    const maxW = w - pad * 2 - sunReserve;
    const size = fitFont(ctx, title, 'Anton, "Arial Black", sans-serif', band * 0.52, maxW);
    const ty = areaH + band * 0.70;
    const tg = ctx.createLinearGradient(0, ty - size, 0, ty + size * 0.15);
    tg.addColorStop(0, '#fff7ae'); tg.addColorStop(0.45, '#ffb347');
    tg.addColorStop(0.75, '#ff5e3a'); tg.addColorStop(1, '#ff2d95');
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
    ctx.shadowColor = 'rgba(10,2,18,0.85)'; ctx.shadowBlur = 0;
    ctx.shadowOffsetX = size * 0.045; ctx.shadowOffsetY = size * 0.05;
    ctx.strokeStyle = '#160423'; ctx.lineWidth = Math.max(3, size * 0.085);
    ctx.strokeText(title, pad, ty);
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = tg; ctx.fillText(title, pad, ty);
    // Thin white inner highlight line under the title.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(pad, ty + size * 0.16, Math.min(maxW, ctx.measureText(title).width), Math.max(2, size * 0.02));
  }

  // Subtitle in neon script, tucked under the title.
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const size = fitFont(ctx, sub, 'Pacifico, cursive', band * 0.21, w * 0.62);
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.textAlign = 'left';
    ctx.fillStyle = grade.glow;
    ctx.shadowColor = grade.glow; ctx.shadowBlur = band * 0.12;
    ctx.fillText(sub, pad, areaH + band * 0.95);
    ctx.shadowBlur = 0;
  }

  // Corner ribbon, top-left of the whole cover.
  const rib = `VICE COAST`;
  ctx.save();
  ctx.translate(w * 0.02, h * 0.02);
  ctx.rotate(-0.06);
  ctx.fillStyle = '#ff2d95';
  ctx.fillRect(0, 0, w * 0.155, band * 0.16);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(band * 0.11)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(rib, w * 0.0775, band * 0.115);
  ctx.restore();

  // Grain + vignette finish.
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ctx.createPattern(getNoiseTile(), 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.vignette) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(10,2,18,0)'); v.addColorStop(1, 'rgba(10,2,18,0.42)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  }
}

/** Renders the cover at an export size and returns the fresh canvas. */
export function renderCover(state, photos, sizeId) {
  const s = SIZES[sizeId] || SIZES.portrait;
  const canvas = document.createElement('canvas');
  canvas.width = s.w; canvas.height = s.h;
  drawCover(canvas, state, photos);
  return canvas;
}
