import { MONO, esc, gradientDefs, monoWidth, round } from '../svg.mjs';

// Standalone pill per link — each needs its own <a> in the README.
export function link(t, text) {
  const h = 34, tw = monoWidth(text, 12), w = round(tw + 60);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(text)}">
<defs>${gradientDefs(t)}</defs>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${h / 2}" fill="${t.card}" stroke="${t.border}"/>
<circle cx="18" cy="${h / 2}" r="4" fill="url(#g)"/>
<text x="30" y="${h / 2 + 4}" font-family="${MONO.replace(/'/g, '&apos;')}" font-size="12" fill="${t.text}">${esc(text)}</text>
<text x="${round(30 + tw + 10)}" y="${h / 2 + 4}" font-family="${MONO.replace(/'/g, '&apos;')}" font-size="12" fill="${t.muted}">↗</text>
</svg>
`;
}
