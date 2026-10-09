import { card, esc, label, round } from '../svg.mjs';

const W = 840, H = 340, PAD = 24;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const WEEKDAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function sparkline(t, weeks, x, y, w, h) {
  const vals = weeks.slice(-16).map((wk) => wk.reduce((a, d) => a + d.contributionCount, 0));
  const max = Math.max(1, ...vals);
  const pts = vals.map((v, i) => [x + (i / (vals.length - 1)) * w, y + h - (v / max) * h]);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${round(px)},${round(py)}`).join(' ');
  return `
    <path d="${line} L${x + w},${y + h} L${x},${y + h} Z" fill="url(#g)" opacity=".14"/>
    <path d="${line}" fill="none" stroke="url(#g)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" pathLength="1" class="draw"/>`;
}

function tile(t, i, { k, v, unit = '', sub, extra = '' }) {
  const tw = (W - PAD * 2 - 12 * 3) / 4;
  const x = round(PAD + i * (tw + 12)), y = 56;
  return `
  <g class="rise" style="animation-delay:${i * 0.07}s">
    <rect x="${x}" y="${y}" width="${round(tw)}" height="100" rx="14" fill="${t.inner}" stroke="${t.border}"/>
    ${label(t, x + 16, y + 26, k)}
    <text x="${x + 16}" y="${y + 66}" class="sans" font-size="32" font-weight="800" letter-spacing="-1" fill="url(#g)">${esc(v)}<tspan font-size="15" font-weight="600" fill="${t.muted}" dx="3">${esc(unit)}</tspan></text>
    <text x="${x + 16}" y="${y + 86}" class="sans" font-size="12" fill="${t.muted}">${esc(sub)}</text>
    ${extra}
  </g>`;
}

function heatmap(t, weeks, y0) {
  const gap = 3;
  const cols = weeks.length;
  const cell = round((W - PAD * 2 - gap * (cols - 1)) / cols, 2);
  const max = Math.max(1, ...weeks.flat().map((d) => d.contributionCount));
  const level = (c) => (c === 0 ? 0 : Math.min(4, Math.ceil((c / max) * 4)));
  const out = [];
  let lastMonth = -1;
  weeks.forEach((week, ci) => {
    const x = round(PAD + ci * (cell + gap));
    const m = new Date(week[0].date).getUTCMonth();
    if (m !== lastMonth && ci < cols - 2) {
      out.push(`<text x="${x}" y="${y0}" class="mono" font-size="10" fill="${t.muted}">${MONTHS[m]}</text>`);
      lastMonth = m;
    }
    const cells = week
      .map((d) => {
        const lv = level(d.contributionCount);
        return `<rect x="${x}" y="${round(y0 + 10 + d.weekday * (cell + gap))}" width="${cell}" height="${cell}" class="l${lv}"/>`;
      })
      .join('');
    out.push(`<g class="pop" style="animation-delay:${round(0.25 + ci * 0.012)}s">${cells}</g>`);
  });
  const ly = round(y0 + 10 + 7 * (cell + gap) + 18);
  const legend = t.heat
    .map((c, i) => `<rect x="${W - PAD - 150 + 40 + i * 15}" y="${ly - 9}" width="11" height="11" rx="2.5" fill="${c}"/>`)
    .join('');
  return { svg: out.join('\n'), ly, legend };
}

export function activity(t, data) {
  const { streak } = data;
  const since = new Date(data.createdAt);
  const { svg: heat, ly, legend } = heatmap(t, data.weeks, 186);
  const updated = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  const tw = (W - PAD * 2 - 36) / 4;
  const body = `
  ${label(t, PAD, 38, '◆ ACTIVITY')}
  <text x="${W - PAD}" y="38" class="mono" font-size="10.5" fill="${t.muted}" text-anchor="end">updated ${updated}</text>
  ${tile(t, 0, {
    k: 'CONTRIBUTIONS', v: data.totalContributions, sub: 'last 12 months',
    extra: sparkline(t, data.weeks, round(PAD + tw - 78), 78, 60, 30),
  })}
  ${tile(t, 1, { k: 'COMMITS', v: data.commits, sub: `${plural(data.prs, 'PR')} · ${plural(data.issues, 'issue')}` })}
  ${tile(t, 2, { k: 'STREAK', v: streak.current, unit: streak.current === 1 ? 'day' : 'days', sub: `best run · ${streak.longest} days` })}
  ${tile(t, 3, { k: 'ACTIVE DAYS', v: data.activeDays, sub: `most active on ${WEEKDAYS[data.busiestWeekday]}` })}
  ${heat}
  <text x="${PAD}" y="${ly}" class="mono" font-size="10.5" fill="${t.muted}">coding since ${MONTHS[since.getUTCMonth()]} ${since.getUTCFullYear()} · ${data.repoCount} repos</text>
  <text x="${W - PAD - 150 + 32}" y="${ly}" class="mono" font-size="10" fill="${t.muted}" text-anchor="end">less</text>
  ${legend}
  <text x="${W - PAD}" y="${ly}" class="mono" font-size="10" fill="${t.muted}" text-anchor="end">more</text>`;

  const css = `
  .draw { stroke-dasharray: 1; animation: draw 1.6s ease .4s both; }
  @keyframes draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
  .pop { animation: fade .5s ease both; }
  .pop rect { rx: 2.5px; }
  ${t.heat.map((c, i) => `.l${i} { fill: ${c}; }`).join(' ')}
  .l0 { stroke: ${t.border}; stroke-width: .5; }`;

  return card(t, {
    w: W, h: H, css, body,
    title: 'GitHub activity',
    desc: `${data.totalContributions} contributions in the last year, ${data.commits} commits, current streak ${streak.current} days, longest ${streak.longest} days.`,
  });
}
