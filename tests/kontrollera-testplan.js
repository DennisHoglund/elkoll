// Kontrollerar att testplanen och Playwright-testerna hänger ihop:
// - varje testfall-ID i en annotation finns som fil i testplan/testfall/
// - varje automatiserat testfall har ett Playwright-test
// - varje testfall finns med i testplan/index.md
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'testplan', 'testfall');
const index = fs.readFileSync(path.join(root, 'testplan', 'index.md'), 'utf8');
const filer = fs.readdirSync(dir).filter((f) => /^TC-[A-Z]+-\d+\.md$/.test(f)).map((f) => f.replace('.md', ''));

let antalFel = 0;
function fel(t) { antalFel++; console.error('  ✕ ' + t); }

const iTester = new Map();
for (const f of fs.readdirSync(__dirname).filter((f) => f.endsWith('.spec.js'))) {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  for (const m of src.matchAll(/type:\s*'testfall',\s*description:\s*'(TC-[A-Z]+-\d+)'/g)) {
    if (iTester.has(m[1])) fel('Testfall ' + m[1] + ' används av flera tester (' + iTester.get(m[1]) + ', ' + f + ')');
    iTester.set(m[1], f);
  }
}

for (const [id, f] of iTester) if (!filer.includes(id)) fel(id + ' i ' + f + ' saknar testplan/testfall/' + id + '.md');
for (const id of filer) {
  const md = fs.readFileSync(path.join(dir, id + '.md'), 'utf8');
  if (md.includes('🤖 Automatiserad') && !iTester.has(id)) fel(id + ' är markerat som automatiserat men inget Playwright-test pekar på det');
  if (!index.includes('testfall/' + id + '.md')) fel(id + ' saknas i testplan/index.md');
}

if (antalFel) { console.error('\nTestplanen stämmer inte med testerna (' + antalFel + ' fel).'); process.exit(1); }
console.log('✓ Testplan OK: ' + filer.length + ' testfall, ' + iTester.size + ' automatiserade');
