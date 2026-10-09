// Shared theme tokens + SVG helpers. Every card is rendered once per theme.

export const themes = {
  dark: {
    name: 'dark',
    card: '#11141d',
    inner: '#161a25',
    border: '#ffffff14',
    text: '#e8eaf2',
    muted: '#8a90a6',
    faint: '#ffffff0d',
    a1: '#a78bfa',
    a2: '#22d3ee',
    a3: '#f472b6',
    ok: '#4ade80',
    term: '#090b11',
    termText: '#d6d9e6',
    termMuted: '#8a90a6',
    heat: ['#1b2030', '#33296e', '#5440bd', '#8170ff', '#5ee0ff'],
    blob: 0.32,
    diff: { Easy: '#34d399', Medium: '#fbbf24', Hard: '#fb7185' },
  },
  light: {
    name: 'light',
    card: '#fbfbfe',
    inner: '#f2f3f9',
    border: '#0f172a17',
    text: '#12142a',
    muted: '#5d6280',
    faint: '#0f172a0a',
    a1: '#7c3aed',
    a2: '#0891b2',
    a3: '#db2777',
    ok: '#16a34a',
    term: '#12141f',
    termText: '#e4e6f0',
    termMuted: '#8d93ab',
    heat: ['#eceef5', '#d9d0ff', '#a993fb', '#7c3aed', '#4c1d95'],
    blob: 0.18,
    diff: { Easy: '#059669', Medium: '#d97706', Hard: '#e11d48' },
  },
};

export const SANS = `'Inter','Segoe UI',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif`;
export const MONO = `'JetBrains Mono','SFMono-Regular',ui-monospace,Menlo,Consolas,'Liberation Mono',monospace`;

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Rough text widths — no font metrics available, so stay conservative.
export const monoWidth = (s, size) => [...String(s)].length * size * 0.61;
export const sansWidth = (s, size) => [...String(s)].length * size * 0.56;

export const round = (n, p = 2) => Number(n.toFixed(p));

export function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

export function gradientDefs(t, id = 'g') {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0.3">
    <stop offset="0" stop-color="${t.a1}"/><stop offset="1" stop-color="${t.a2}"/>
  </linearGradient>`;
}

// Small section label, e.g. "◆ activity"
export const label = (t, x, y, text, anchor = 'start') =>
  `<text x="${x}" y="${y}" class="mono" font-size="11" fill="${t.muted}" letter-spacing="1.2" text-anchor="${anchor}">${esc(text)}</text>`;

export function chip(t, x, y, text, { filled = false, size = 11 } = {}) {
  const w = round(monoWidth(text, size) + 20);
  const h = 24;
  const bg = filled
    ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="url(#g)"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${t.faint}" stroke="${t.border}"/>`;
  const fg = filled ? (t.name === 'dark' ? '#0b0d14' : '#ffffff') : t.text;
  return {
    w,
    svg: `${bg}<text x="${round(x + w / 2)}" y="${y + 16}" class="mono" font-size="${size}" fill="${fg}" text-anchor="middle"${filled ? ' font-weight="700"' : ''}>${esc(text)}</text>`,
  };
}

export function card(t, { w, h, title, desc, defs = '', css = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title>
<desc id="desc">${esc(desc)}</desc>
<defs>
${gradientDefs(t)}
<clipPath id="cardclip"><rect width="${w}" height="${h}" rx="18"/></clipPath>
${defs}
</defs>
<style>
  .sans { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
  .fade { animation: fade .6s ease both; }
  .rise { animation: rise .7s cubic-bezier(.2,.7,.2,1) both; }
  @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes rise { from { transform: translateY(6px) } to { transform: none } }
  ${css}
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
    .motion-only { display: none; }
  }
</style>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="18" fill="${t.card}" stroke="${t.border}"/>
<g clip-path="url(#cardclip)">
${body}
</g>
</svg>
`;
}
