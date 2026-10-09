import { card, chip, esc, label, round, wrap } from '../svg.mjs';

const W = 840, H = 300, PAD = 24, GAP = 16;

// Deterministic PRNG so the art doesn't churn between runs.
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

// Mini chart: actual demand with a festival spike, a baseline that misses it,
// and the festival-regressor model that catches it.
function forecastArt(t, x, y, w, h) {
  const n = 64, spikeAt = 44, r = rng(7);
  const actual = [], base = [], tuned = [];
  for (let i = 0; i < n; i++) {
    const season = 0.38 + 0.08 * Math.sin(i / 5) + 0.05 * Math.sin(i / 1.7);
    const prox = Math.max(0, 1 - Math.abs(i - spikeAt) / 4); // ±4-day festival window
    actual.push(season + prox * 0.5 + (r() - 0.5) * 0.06);
    base.push(season + 0.02);
    tuned.push(season + prox * 0.46 + 0.01);
  }
  const px = (i) => round(x + 10 + (i / (n - 1)) * (w - 20));
  const py = (v) => round(y + h - 8 - v * (h - 22));
  const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${px(i)},${py(v)}`).join(' ');
  const sx = px(spikeAt);
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${t.inner}" stroke="${t.border}"/>
    <line x1="${sx}" y1="${y + 16}" x2="${sx}" y2="${y + h - 6}" stroke="${t.a3}" stroke-dasharray="3 3" opacity=".7"/>
    <text x="${sx + 5}" y="${y + h - 7}" class="mono" font-size="9" fill="${t.a3}">diwali</text>
    <path d="${path(actual)}" fill="none" stroke="${t.muted}" stroke-width="1.2" opacity=".55"/>
    <path d="${path(base)}" fill="none" stroke="${t.muted}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".8"/>
    <path d="${path(tuned)}" fill="none" stroke="url(#g)" stroke-width="2.4" stroke-linecap="round" pathLength="1" class="draw"/>
    <text x="${x + 10}" y="${y + 16}" class="mono" font-size="9" fill="${t.muted}">— actual  ┄ baseline  <tspan fill="${t.a2}">━ +festival regressor</tspan></text>`;
}

// A real BFS on a small grid: visited cells appear by distance, then the path lights up.
function pathfindingArt(t, x, y, w, h) {
  const cs = 13, gap = 2, cols = Math.floor((w - 12) / (cs + gap)), rows = Math.floor((h - 12) / (cs + gap));
  const ox = round(x + (w - cols * (cs + gap) + gap) / 2), oy = round(y + (h - rows * (cs + gap) + gap) / 2);
  const r = rng(42);
  const start = [1, Math.floor(rows / 2)], goal = [cols - 2, Math.floor(rows / 2)];
  const wall = new Set();
  for (let c = 4; c < cols - 3; c += 4) {
    const hole = Math.floor(r() * rows);
    for (let rr = 0; rr < rows; rr++) if (Math.abs(rr - hole) > 0) wall.add(`${c},${rr}`);
  }
  const key = (c, rr) => `${c},${rr}`;
  const dist = new Map([[key(...start), 0]]), prev = new Map(), q = [start];
  while (q.length) {
    const [c, rr] = q.shift();
    if (c === goal[0] && rr === goal[1]) break;
    for (const [dc, dr] of [[1, 0], [0, 1], [0, -1], [-1, 0]]) {
      const nc = c + dc, nr = rr + dr, k = key(nc, nr);
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || wall.has(k) || dist.has(k)) continue;
      dist.set(k, dist.get(key(c, rr)) + 1);
      prev.set(k, key(c, rr));
      q.push([nc, nr]);
    }
  }
  const path = new Set();
  for (let k = key(...goal); k && prev.has(k); k = prev.get(k)) path.add(k);
  const maxD = Math.max(...dist.values());
  const step = 1.6 / maxD;

  const cells = [];
  for (let c = 0; c < cols; c++) {
    for (let rr = 0; rr < rows; rr++) {
      const k = key(c, rr), cx = ox + c * (cs + gap), cy = oy + rr * (cs + gap);
      let fill = t.faint, cls = '', d = 0, extra = '';
      if (wall.has(k)) fill = t.text, extra = ' opacity=".55"';
      else if (k === key(...start) || k === key(...goal)) fill = t.a3;
      else if (path.has(k)) fill = 'url(#g)', cls = 'pathc', d = round(1.9 + dist.get(k) * 0.03);
      else if (dist.has(k)) fill = t.a1, cls = 'visit', d = round(0.3 + dist.get(k) * step), extra = ' fill-opacity=".35"';
      if (cls && !path.has(k) && dist.has(k)) {
        // underlay so unvisited state shows before the animation reaches it
        cells.push(`<rect x="${cx}" y="${cy}" width="${cs}" height="${cs}" rx="3" fill="${t.faint}"/>`);
      }
      cells.push(`<rect x="${cx}" y="${cy}" width="${cs}" height="${cs}" rx="3" fill="${fill}"${extra}${cls ? ` class="${cls}" style="animation-delay:${d}s"` : ''}/>`);
    }
  }
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${t.inner}" stroke="${t.border}"/>
    ${cells.join('')}`;
}

function relTime(iso) {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 864e5);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function project(t, p, i, data) {
  const cw = (W - PAD * 2 - GAP) / 2, x = round(PAD + i * (cw + GAP)), y = 52, ch = 226;
  const ax = x + 14, ay = y + 14, aw = round(cw - 28), ah = 92;
  const art = p.art === 'forecast' ? forecastArt(t, ax, ay, aw, ah) : p.art === 'pathfinding' ? pathfindingArt(t, ax, ay, aw, ah) : '';
  const repo = p.repo && data.repos[p.repo];
  const meta = repo ? `★ ${repo.stars} · updated ${relTime(repo.pushedAt)}` : '';
  const all = wrap(p.description, 58), lines = all.slice(0, 2);
  if (all.length > 2) lines[1] = lines[1].replace(/[\s,.;:]*\S*$/, '') + '…';
  let cx = x + 16;
  const tags = p.tags.map((tag) => {
    const c = chip(t, cx, y + ch - 38, tag, { size: 10.5 });
    cx += c.w + 6;
    return c.svg;
  });
  return `
  <g class="rise" style="animation-delay:${i * 0.1}s">
    <rect x="${x}" y="${y}" width="${round(cw)}" height="${ch}" rx="14" fill="${t.card}" stroke="${t.border}"/>
    ${art}
    <text x="${x + 16}" y="${y + 132}" class="sans" font-size="16" font-weight="700" fill="${t.text}">${esc(p.title)}</text>
    <text x="${round(x + cw - 16)}" y="${y + 132}" class="mono" font-size="10" fill="${t.muted}" text-anchor="end">${esc(meta)}</text>
    ${lines.map((l, li) => `<text x="${x + 16}" y="${y + 154 + li * 18}" class="sans" font-size="12.5" fill="${t.muted}">${esc(l)}</text>`).join('\n')}
    ${tags.join('\n')}
  </g>`;
}

export function projects(t, data, config) {
  const body = `
  <rect width="${W}" height="${H}" fill="${t.inner}" opacity=".35"/>
  ${label(t, PAD, 36, '◆ FEATURED PROJECTS')}
  ${config.projects.slice(0, 2).map((p, i) => project(t, p, i, data)).join('\n')}`;

  const css = `
  .draw { stroke-dasharray: 1; animation: draw 2s ease .3s both; }
  @keyframes draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
  .visit, .pathc { animation: fade .25s ease both; }`;

  return card(t, {
    w: W, h: H, css, body,
    title: 'Featured projects',
    desc: config.projects.map((p) => `${p.title}: ${p.description}`).join(' '),
  });
}
