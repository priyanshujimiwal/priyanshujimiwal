import { card, chip, esc, label, round } from '../svg.mjs';

const W = 840, H = 300, PAD = 24;

function donut(t, langs, top, weighting) {
  const total = langs.reduce((a, l) => a + l.size, 0) || 1;
  const shown = langs.slice(0, top);
  const rest = langs.slice(top).reduce((a, l) => a + l.size, 0);
  if (rest > 0) shown.push({ name: 'Other', color: t.muted, size: rest });

  const cx = 104, cy = 168, r = 64, sw = 18;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const segs = shown.map((l, i) => {
    const frac = l.size / total;
    const len = Math.max(0, frac * C - 2); // 2px gap between segments
    const s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${l.color}" stroke-width="${sw}"
      stroke-dasharray="${round(len)} ${round(C)}" stroke-dashoffset="${round(-acc * C)}"
      transform="rotate(-90 ${cx} ${cy})" class="seg" style="animation-delay:${round(0.2 + i * 0.12)}s"/>`;
    acc += frac;
    return s;
  });

  const lead = shown[0];
  const leadPct = lead ? Math.round((lead.size / total) * 100) : 0;
  const legend = shown.map((l, i) => {
    const y = 104 + i * 27;
    return `<g class="rise" style="animation-delay:${round(0.2 + i * 0.08)}s">
      <circle cx="206" cy="${y - 4}" r="5" fill="${l.color}"/>
      <text x="220" y="${y}" class="sans" font-size="13" fill="${t.text}">${esc(l.name)}</text>
      <text x="336" y="${y}" class="mono" font-size="12" fill="${t.muted}" text-anchor="end">${((l.size / total) * 100).toFixed(1)}%</text>
    </g>`;
  });

  return `
  ${label(t, PAD, 38, '◆ LANGUAGES')}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.faint}" stroke-width="${sw}"/>
  ${segs.join('\n')}
  <text x="${cx}" y="${cy + 2}" class="sans" font-size="26" font-weight="800" fill="url(#g)" text-anchor="middle">${leadPct}%</text>
  <text x="${cx}" y="${cy + 20}" class="mono" font-size="10.5" fill="${t.muted}" text-anchor="middle">${esc(lead?.name ?? '')}</text>
  ${legend.join('\n')}
  <text x="${PAD}" y="${H - 22}" class="mono" font-size="10" fill="${t.muted}">${weighting === 'repo' ? 'weighted per repo' : 'by bytes'} · all owned repos</text>`;
}

function stack(t, groups) {
  const x0 = 386, labelW = 104, right = W - PAD;
  const out = [label(t, x0, 38, '◆ TOOLKIT')];
  let y = 66;
  groups.forEach((g, gi) => {
    out.push(`<g class="rise" style="animation-delay:${round(0.1 + gi * 0.07)}s">`);
    out.push(`<text x="${x0}" y="${y + 16}" class="mono" font-size="10.5" fill="${t.muted}">${esc(g.group)}</text>`);
    let x = x0 + labelW;
    for (const item of g.items) {
      const c = chip(t, x, y, item, { filled: item === g.primary });
      if (x + c.w > right && x > x0 + labelW) {
        x = x0 + labelW;
        y += 32;
        const c2 = chip(t, x, y, item, { filled: item === g.primary });
        out.push(c2.svg);
        x += c2.w + 8;
      } else {
        out.push(c.svg);
        x += c.w + 8;
      }
    }
    out.push('</g>');
    y += 42;
  });
  return out.join('\n');
}

export function toolkit(t, data, config) {
  const body = `
  ${donut(t, data.languages, config.languages?.top ?? 5, config.languages?.weighting ?? 'repo')}
  <line x1="362" y1="24" x2="362" y2="${H - 24}" stroke="${t.border}"/>
  ${stack(t, config.stack)}`;

  const css = `
  .seg { animation: fade .8s ease both; }`;

  return card(t, {
    w: W, h: H, css, body,
    title: 'Languages and toolkit',
    desc: `Top languages: ${data.languages.slice(0, 3).map((l) => l.name).join(', ')}. Toolkit: ${config.stack.flatMap((g) => g.items).join(', ')}.`,
  });
}
