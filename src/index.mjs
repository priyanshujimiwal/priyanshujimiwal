import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAll } from './github.mjs';
import { themes } from './svg.mjs';
import { hero } from './cards/hero.mjs';
import { activity } from './cards/activity.mjs';
import { toolkit } from './cards/toolkit.mjs';
import { projects } from './cards/projects.mjs';
import { dsa } from './cards/dsa.mjs';
import { link } from './cards/link.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// CI passes GH_TOKEN; locally fall back to the first value in .env (KEY=value or KEY: value).
function token() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  const envFile = join(root, '.env');
  if (existsSync(envFile)) {
    const line = readFileSync(envFile, 'utf8').split('\n').find((l) => /^\s*[\w.-]+\s*[:=]\s*\S/.test(l));
    if (line) return line.replace(/^\s*[\w.-]+\s*[:=]\s*/, '').trim().replace(/^["']|["']$/g, '');
  }
  throw new Error('No token: set GH_TOKEN or add one to .env');
}

const config = JSON.parse(readFileSync(join(root, 'config.json'), 'utf8'));
const data = await fetchAll(token(), config);

const cards = {
  hero: (t) => hero(t, config),
  activity: (t) => activity(t, data),
  toolkit: (t) => toolkit(t, data, config),
  projects: (t) => projects(t, data, config),
  ...(data.dsa?.solved ? { dsa: (t) => dsa(t, data, config) } : {}),
  ...Object.fromEntries((config.links ?? []).map((l) => [`link-${l.label.toLowerCase()}`, (t) => link(t, l.label)])),
};

const out = join(root, 'metrics');
mkdirSync(out, { recursive: true });
for (const [name, render] of Object.entries(cards)) {
  for (const t of Object.values(themes)) {
    const file = join(out, `${name}-${t.name}.svg`);
    writeFileSync(file, render(t));
    console.log(`wrote ${file.replace(root + '/', '')}`);
  }
}
