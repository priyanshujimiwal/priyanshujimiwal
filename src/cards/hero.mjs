import { card, esc, label, monoWidth, round } from '../svg.mjs';

const W = 840, H = 260;

function degreeProgress({ start, end }) {
  const s = Date.parse(start), e = Date.parse(end), n = Date.now();
  return Math.min(1, Math.max(0, (n - s) / (e - s)));
}

function terminal(t, lines) {
  const x = 500, y = 24, w = 316, h = 212;
  const tx = x + 18;
  const out = [];
  let delay = 0.4;
  let ly = y + 58;
  for (const { cmd, out: result, ok } of lines) {
    const cw = round(monoWidth(cmd, 12) + 4);
    const typing = Math.max(0.5, cmd.length * 0.045);
    out.push(`<text x="${tx}" y="${ly}" class="mono" font-size="12" fill="${t.a2}">❯</text>`);
    out.push(`<text x="${tx + 16}" y="${ly}" class="mono" font-size="12" fill="${t.termText}">${esc(cmd)}</text>`);
    // A cover in the terminal's colour slides right in steps → typewriter reveal.
    out.push(`<rect class="cover motion-only" x="${tx + 14}" y="${ly - 13}" width="${cw}" height="17" fill="${t.term}"
      style="--w:${cw}px; animation: type ${typing}s steps(${cmd.length}) ${delay}s both"/>`);
    delay += typing + 0.15;
    ly += 21;
    out.push(`<text x="${tx + 16}" y="${ly}" class="mono fade" font-size="12" fill="${ok ? t.ok : t.termMuted}" style="animation-delay:${delay}s">${esc(result)}</text>`);
    delay += 0.35;
    ly += 27;
  }
  out.push(`<text x="${tx}" y="${ly}" class="mono fade" font-size="12" fill="${t.a2}" style="animation-delay:${delay}s">❯</text>`);
  out.push(`<rect x="${tx + 16}" y="${ly - 11}" width="7" height="14" fill="${t.termText}" class="cursor"/>`);

  return `
  <g class="rise" style="animation-delay:.15s">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${t.term}" stroke="${t.border}"/>
    <circle cx="${x + 18}" cy="${y + 18}" r="5" fill="#ff5f57"/>
    <circle cx="${x + 34}" cy="${y + 18}" r="5" fill="#febc2e"/>
    <circle cx="${x + 50}" cy="${y + 18}" r="5" fill="#28c840"/>
    <text x="${x + w / 2}" y="${y + 22}" class="mono" font-size="10.5" fill="${t.termMuted}" text-anchor="middle">~/pj — zsh</text>
    <line x1="${x}" y1="${y + 34}" x2="${x + w}" y2="${y + 34}" stroke="#ffffff10"/>
    ${out.join('\n    ')}
  </g>`;
}

export function hero(t, config) {
  const p = degreeProgress(config.degree);
  const pct = Math.round(p * 100);
  const startY = new Date(config.degree.start).getFullYear();
  const endY = new Date(config.degree.end).getFullYear();
  const barW = 400;
  const pillW = round(monoWidth(config.status, 11) + 40);

  const body = `
  <circle class="blob b1" cx="110" cy="30" r="130" fill="${t.a1}" opacity="${t.blob}" filter="url(#blur)"/>
  <circle class="blob b2" cx="420" cy="250" r="120" fill="${t.a2}" opacity="${t.blob * 0.8}" filter="url(#blur)"/>
  <circle class="blob b3" cx="760" cy="40" r="90" fill="${t.a3}" opacity="${t.blob * 0.6}" filter="url(#blur)"/>
  <rect width="480" height="${H}" fill="url(#dots)"/>

  <g class="rise">
    <rect x="32" y="30" width="${pillW}" height="26" rx="13" fill="${t.ok}" fill-opacity=".1" stroke="${t.ok}" stroke-opacity=".35"/>
    <circle cx="48" cy="43" r="4" fill="${t.ok}"/>
    <circle cx="48" cy="43" r="4" fill="none" stroke="${t.ok}" class="pulse"/>
    <text x="60" y="47" class="mono" font-size="11" fill="${t.text}">${esc(config.status)}</text>
  </g>

  <g class="rise" style="animation-delay:.05s">
    <text x="30" y="108" class="sans" font-size="40" font-weight="800" letter-spacing="-1" fill="url(#g)">${esc(config.name)}</text>
    <text x="32" y="138" class="sans" font-size="16" font-weight="600" fill="${t.text}">${esc(config.degree.title)}</text>
    <text x="32" y="160" class="sans" font-size="14" fill="${t.muted}">${esc(config.degree.school)} · ${startY} – ${endY}</text>
  </g>

  <g class="rise" style="animation-delay:.1s">
    ${label(t, 32, 196, 'degree.progress')}
    <text x="${32 + barW}" y="196" class="mono" font-size="11" fill="${t.text}" text-anchor="end">${pct}%</text>
    <rect x="32" y="205" width="${barW}" height="8" rx="4" fill="${t.faint}" stroke="${t.border}"/>
    <rect x="32" y="205" width="${round(barW * p)}" height="8" rx="4" fill="url(#g)" class="grow"/>
    <text x="32" y="236" class="mono" font-size="11" fill="${t.muted}">currently → <tspan fill="${t.text}">${esc(config.currently)}</tspan></text>
  </g>
  ${terminal(t, config.terminal)}`;

  const defs = `
  <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="45"/></filter>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${t.text}" opacity=".07"/></pattern>`;

  const css = `
  .blob { transform-box: fill-box; transform-origin: center; animation: drift 14s ease-in-out infinite alternate; }
  .b2 { animation-duration: 18s; animation-direction: alternate-reverse; }
  .b3 { animation-duration: 11s; }
  @keyframes drift { from { transform: translate(0,0) scale(1) } to { transform: translate(40px,18px) scale(1.12) } }
  .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2s ease-out infinite; }
  @keyframes pulse { from { transform: scale(1); opacity: .9 } to { transform: scale(2.6); opacity: 0 } }
  .grow { transform-box: fill-box; transform-origin: left; animation: grow 1.4s cubic-bezier(.2,.7,.2,1) .3s both; }
  @keyframes grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
  @keyframes type { from { transform: translateX(0) } to { transform: translateX(var(--w)) } }
  .cursor { animation: blink 1s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0 } }`;

  return card(t, {
    w: W, h: H, defs, css, body,
    title: `${config.name} — ${config.degree.title}`,
    desc: `${config.degree.title} at ${config.degree.school}, ${pct}% through the degree. ${config.status}.`,
  });
}
