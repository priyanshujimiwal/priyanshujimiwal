import { card, esc, label, round } from '../svg.mjs';

const W = 840, H = 210, PAD = 24;

export function dsa(t, data, config) {
  const { solved, difficulty, topTopics } = data.dsa;
  const cx = 92, cy = 118, r = 50, sw = 9;
  const C = 2 * Math.PI * r;
  const known = difficulty.Easy + difficulty.Medium + difficulty.Hard || 1;

  let acc = 0;
  const ring = ['Easy', 'Medium', 'Hard'].map((d, i) => {
    const frac = difficulty[d] / known;
    const len = Math.max(0, frac * C - (frac > 0 ? 3 : 0));
    const s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.diff[d]}" stroke-width="${sw}" stroke-linecap="round"
      stroke-dasharray="${round(len)} ${round(C)}" stroke-dashoffset="${round(-acc * C)}" transform="rotate(-90 ${cx} ${cy})"
      class="fade" style="animation-delay:${0.2 + i * 0.15}s"/>`;
    acc += frac;
    return frac > 0 ? s : '';
  });

  const barX = 190, barW = 190;
  const maxD = Math.max(1, ...Object.values(difficulty));
  const bars = ['Easy', 'Medium', 'Hard'].map((d, i) => {
    const y = 80 + i * 40;
    return `<g class="rise" style="animation-delay:${0.1 + i * 0.08}s">
      <text x="${barX}" y="${y}" class="sans" font-size="13" fill="${t.text}">${d}</text>
      <text x="${barX + barW}" y="${y}" class="mono" font-size="12" fill="${t.muted}" text-anchor="end">${difficulty[d]}</text>
      <rect x="${barX}" y="${y + 8}" width="${barW}" height="6" rx="3" fill="${t.faint}"/>
      <rect x="${barX}" y="${y + 8}" width="${round(difficulty[d] ? Math.max(6, (difficulty[d] / maxD) * barW) : 0)}" height="6" rx="3" fill="${t.diff[d]}" class="grow" style="animation-delay:${0.3 + i * 0.1}s"/>
    </g>`;
  });

  const tx = 430, tw = W - PAD - tx;
  const maxT = Math.max(1, ...topTopics.map(([, n]) => n));
  const topics = topTopics.map(([name, n], i) => {
    const y = 72 + i * 25;
    const w = round((n / maxT) * (tw - 150));
    return `<g class="rise" style="animation-delay:${0.15 + i * 0.06}s">
      <text x="${tx}" y="${y + 9}" class="sans" font-size="12.5" fill="${t.text}">${esc(name)}</text>
      <rect x="${tx + 130}" y="${y}" width="${w}" height="12" rx="6" fill="url(#g)" opacity="${round(1 - i * 0.13)}" class="grow"/>
      <text x="${tx + 138 + w}" y="${y + 10}" class="mono" font-size="11" fill="${t.muted}">${n}</text>
    </g>`;
  });

  const body = `
  ${label(t, PAD, 38, '◆ DSA PRACTICE · LEETCODE')}
  <text x="${W - PAD}" y="38" class="mono" font-size="10.5" fill="${t.muted}" text-anchor="end">auto-synced via LeetHub</text>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.faint}" stroke-width="${sw}"/>
  ${ring.join('\n')}
  <text x="${cx}" y="${cy + 6}" class="sans" font-size="30" font-weight="800" fill="url(#g)" text-anchor="middle">${solved}</text>
  <text x="${cx}" y="${cy + 24}" class="mono" font-size="10" fill="${t.muted}" text-anchor="middle">solved</text>
  ${bars.join('\n')}
  <line x1="406" y1="58" x2="406" y2="${H - 30}" stroke="${t.border}"/>
  <text x="${tx}" y="58" class="mono" font-size="10.5" fill="${t.muted}">top topics</text>
  ${topics.join('\n')}`;

  const css = `
  .grow { transform-box: fill-box; transform-origin: left; animation: grow 1s cubic-bezier(.2,.7,.2,1) both; }
  @keyframes grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }`;

  return card(t, {
    w: W, h: H, css, body,
    title: 'LeetCode practice',
    desc: `${solved} LeetCode problems solved: ${difficulty.Easy} easy, ${difficulty.Medium} medium, ${difficulty.Hard} hard.`,
  });
}
