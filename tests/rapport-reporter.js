// Egen Playwright-reporter som skapar en lättläst testrapport i Elkoll-stil:
// rapport/index.html med status, trend över tid, alla tester per enhet och skärmdumpar.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const MAX_HISTORIK = 30;

class RapportReporter {
  constructor(opts = {}) {
    this.dir = path.resolve(opts.outputDir || 'rapport');
    this.tester = new Map();
    this.start = Date.now();
  }

  onBegin(config, suite) {
    this.projekt = config.projects.map((p) => p.name);
    fs.mkdirSync(path.join(this.dir, 'bilder'), { recursive: true });
    for (const f of fs.readdirSync(path.join(this.dir, 'bilder'))) fs.rmSync(path.join(this.dir, 'bilder', f));
  }

  onTestEnd(test, result) {
    const projekt = test.parent.project() ? test.parent.project().name : '';
    const titel = test.titlePath().slice(3); // [describe, test] – utan rot, projekt och fil
    const grupp = titel.length > 1 ? titel[0] : path.basename(test.location.file, '.spec.js');
    const namn = titel[titel.length - 1];
    const nyckel = grupp + '›' + namn;

    if (!this.tester.has(nyckel)) {
      const tc = (test.annotations.find((a) => a.type === 'testfall') || {}).description || '';
      this.tester.set(nyckel, { grupp, namn, tc, fil: path.relative(process.cwd(), test.location.file) + ':' + test.location.line, perProjekt: {} });
    }
    const bilder = [];
    for (const a of result.attachments) {
      if (!a.contentType || !a.contentType.startsWith('image/')) continue;
      const data = a.body || (a.path && fs.existsSync(a.path) ? fs.readFileSync(a.path) : null);
      if (!data) continue;
      const fil = crypto.createHash('sha1').update(data).digest('hex').slice(0, 12) + '.png';
      fs.writeFileSync(path.join(this.dir, 'bilder', fil), data);
      bilder.push({ namn: a.name === 'screenshot' ? 'Skärmdump vid fel' : a.name, fil, fel: a.name === 'screenshot' });
    }
    this.tester.get(nyckel).perProjekt[projekt] = {
      status: test.outcome(),          // expected | unexpected | flaky | skipped
      tid: result.duration,
      forsok: result.retry + 1,
      fel: result.errors.map((e) => stripAnsi(e.message || e.value || '')).filter(Boolean),
      bilder
    };
  }

  onEnd(result) {
    const tester = [...this.tester.values()];
    const status = (t) => {
      const s = Object.values(t.perProjekt).map((p) => p.status);
      if (s.includes('unexpected')) return 'fel';
      if (s.includes('flaky')) return 'flaky';
      if (s.every((x) => x === 'skipped')) return 'hoppad';
      return 'ok';
    };
    tester.forEach((t) => { t.status = status(t); });

    const kor = Object.values(Object.fromEntries(tester.flatMap((t) => Object.entries(t.perProjekt).map(([p, r]) => [t.grupp + t.namn + p, r]))));
    const summa = {
      totalt: kor.length,
      ok: kor.filter((r) => r.status === 'expected').length,
      fel: kor.filter((r) => r.status === 'unexpected').length,
      flaky: kor.filter((r) => r.status === 'flaky').length,
      hoppade: kor.filter((r) => r.status === 'skipped').length,
      tid: Date.now() - this.start
    };

    const meta = gitMeta();
    const historik = lasHistorik(this.dir);
    historik.push({ sha: meta.sha, tid: new Date().toISOString(), ok: summa.ok, fel: summa.fel, flaky: summa.flaky, totalt: summa.totalt, url: meta.korUrl });
    const hist = historik.slice(-MAX_HISTORIK);
    fs.writeFileSync(path.join(this.dir, 'historik.json'), JSON.stringify(hist, null, 2));
    fs.writeFileSync(path.join(this.dir, 'resultat.json'), JSON.stringify({ meta, summa, tester }, null, 2));
    fs.writeFileSync(path.join(this.dir, 'index.html'), html({ meta, summa, tester, hist, projekt: this.projekt }));

    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown({ meta, summa, tester }));
    }
    console.log('\n  Testrapport: ' + path.relative(process.cwd(), path.join(this.dir, 'index.html')) + '\n');
  }

  printsToStdio() { return false; }
}

// ---------------------------------------------------------------------------

function stripAnsi(s) { return String(s).replace(/\u001b\[[0-9;]*m/g, ''); }

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function sh(cmd) { try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return ''; } }

function gitMeta() {
  const repo = process.env.GITHUB_REPOSITORY || '';
  const server = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const sha = process.env.GITHUB_SHA || sh('git rev-parse HEAD');
  return {
    sha,
    kort: sha.slice(0, 7),
    meddelande: sh('git log -1 --pretty=%s') || '',
    forfattare: sh('git log -1 --pretty=%an') || '',
    gren: process.env.GITHUB_REF_NAME || sh('git rev-parse --abbrev-ref HEAD'),
    commitUrl: repo ? server + '/' + repo + '/commit/' + sha : '',
    korUrl: repo && process.env.GITHUB_RUN_ID ? server + '/' + repo + '/actions/runs/' + process.env.GITHUB_RUN_ID : '',
    ci: !!process.env.CI,
    tid: new Date().toISOString()
  };
}

function lasHistorik(dir) {
  try {
    const h = JSON.parse(fs.readFileSync(path.join(dir, 'historik.json'), 'utf8'));
    return Array.isArray(h) ? h : [];
  } catch (e) { return []; }
}

function sek(ms) {
  if (ms < 1000) return ms + ' ms';
  const s = ms / 1000;
  return s < 60 ? s.toFixed(1).replace('.', ',') + ' s' : Math.floor(s / 60) + ' min ' + Math.round(s % 60) + ' s';
}

function datum(iso) {
  return new Date(iso).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const TESTPLAN = 'https://github.com/DennisHoglund/elkoll/blob/main/testplan/testfall/';
const KORT = { 'iPhone (WebKit)': 'iPhone', 'Android (Chromium)': 'Android' };
const IKON = { ok: '✓', fel: '✕', flaky: '!', hoppad: '–', expected: '✓', unexpected: '✕', skipped: '–' };

// ---------------------------------------------------------------------------

function html({ meta, summa, tester, hist, projekt }) {
  const gront = summa.fel === 0;
  const rubrik = gront ? (summa.flaky ? 'Godkänt med ostadiga tester' : 'Alla tester gröna') : summa.fel + (summa.fel === 1 ? ' test misslyckades' : ' tester misslyckades');
  const andel = summa.totalt ? Math.round((summa.ok + summa.flaky) / summa.totalt * 100) : 0;

  const grupper = [];
  tester.forEach((t) => {
    let g = grupper.find((x) => x.namn === t.grupp);
    if (!g) grupper.push(g = { namn: t.grupp, tester: [] });
    g.tester.push(t);
  });
  grupper.forEach((g) => g.tester.sort((a, b) => (a.status === 'fel' ? -1 : 0) - (b.status === 'fel' ? -1 : 0)));

  // Skärmdumpar (ej felbilder), en per namn – iPhone i första hand
  const galleri = [];
  const sedda = new Set();
  for (const p of [projekt.find((x) => /iphone/i.test(x)), ...projekt].filter(Boolean)) {
    tester.forEach((t) => (t.perProjekt[p] ? t.perProjekt[p].bilder : []).filter((b) => !b.fel).forEach((b) => {
      if (sedda.has(b.namn)) return;
      sedda.add(b.namn);
      galleri.push({ ...b, enhet: KORT[p] || p });
    }));
  }

  const trendMax = hist.length;
  const trend = hist.map((h, i) => {
    const ok = h.totalt ? (h.ok + (h.flaky || 0)) / h.totalt : 0;
    const titel = datum(h.tid) + ' · ' + (h.sha || '').slice(0, 7) + ' · ' + (h.fel ? h.fel + ' fel' : 'alla gröna');
    const stapel = '<span class="bar ' + (h.fel ? 'bar-fel' : 'bar-ok') + (i === trendMax - 1 ? ' bar-nu' : '') + '" style="height:' + Math.max(12, Math.round(ok * 100)) + '%" title="' + esc(titel) + '"></span>';
    return h.url ? '<a href="' + esc(h.url) + '" aria-label="' + esc(titel) + '">' + stapel + '</a>' : stapel;
  }).join('');

  const testRad = (t) => {
    const chips = projekt.map((p) => {
      const r = t.perProjekt[p];
      if (!r) return '';
      return '<span class="chip chip-' + r.status + '" title="' + esc(p) + '">' + IKON[r.status] + ' ' + esc(KORT[p] || p) + ' <small>' + sek(r.tid) + (r.forsok > 1 ? ' · försök ' + r.forsok : '') + '</small></span>';
    }).join('');
    const fel = projekt.flatMap((p) => (t.perProjekt[p] ? t.perProjekt[p].fel.map((f) => ({ p, f })) : []));
    const bilder = projekt.flatMap((p) => (t.perProjekt[p] ? t.perProjekt[p].bilder.map((b) => ({ ...b, p })) : []));
    const harDetaljer = fel.length || bilder.length;
    const tcLank = t.tc ? '<a class="tc" href="' + TESTPLAN + esc(t.tc) + '.md" onclick="event.stopPropagation()">' + esc(t.tc) + '</a>' : '';
    const inre = '<div class="rad-topp"><span class="ikon ikon-' + t.status + '">' + IKON[t.status] + '</span><span class="namn">' + tcLank + esc(t.namn) + '</span></div><div class="chips">' + chips + '</div>';
    if (!harDetaljer) return '<div class="rad">' + inre + '</div>';
    return '<details class="rad"' + (t.status === 'fel' ? ' open' : '') + '><summary>' + inre + '</summary><div class="detaljer">' +
      fel.map(({ p, f }) => '<p class="fel-rubrik">' + esc(KORT[p] || p) + '</p><pre>' + esc(f) + '</pre>').join('') +
      (bilder.length ? '<div class="tumnaglar">' + bilder.map((b) => '<a href="bilder/' + b.fil + '" target="_blank"><img loading="lazy" src="bilder/' + b.fil + '" alt="' + esc(b.namn) + '"><span>' + esc(b.namn) + ' · ' + esc(KORT[b.p] || b.p) + '</span></a>').join('') + '</div>' : '') +
      '<p class="fil">' + esc(t.fil) + '</p></div></details>';
  };

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Testrapport · Elkoll</title>
<link rel="icon" href="../icons/icon.svg" type="image/svg+xml">
<style>
:root{--bg:#F4F4F2;--yta:#FFFFFF;--yta2:#E9EAE6;--kant:#E3E4E0;--text:#17191C;--text2:#5B6068;--accent:#F76707;--ok:#3B7D23;--ok-bg:#E6F2DA;--fel:#B3261E;--fel-bg:#FBE4E1;--flaky:#9A6200;--flaky-bg:#FFF1CC;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#141517;--yta:#1F2124;--yta2:#2A2D31;--kant:#34373C;--text:#F1F1EF;--text2:#A3A7AE;--accent:#FF7A1A;--ok:#97C459;--ok-bg:#24331A;--fel:#F2B8B5;--fel-bg:#4A1F1C;--flaky:#F5C04F;--flaky-bg:#3D3014;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:860px;margin:0 auto;padding:24px 16px 48px}
header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
header img{width:40px;height:40px;border-radius:10px}
header h1{font-size:1.1rem;margin:0;font-weight:700}
header p{margin:0;color:var(--text2);font-size:.9rem}
.hero{border-radius:18px;padding:22px 20px;margin-bottom:16px;border:1px solid var(--kant);background:var(--yta);display:flex;gap:18px;align-items:center}
.hero.ok{background:var(--ok-bg);border-color:transparent}
.hero.fel{background:var(--fel-bg);border-color:transparent}
.ring{--p:${andel};flex:none;width:84px;height:84px;border-radius:50%;background:conic-gradient(var(--ring) calc(var(--p)*1%),color-mix(in srgb,var(--ring) 18%,transparent) 0);display:grid;place-items:center}
.hero.ok .ring{--ring:var(--ok)}.hero.fel .ring{--ring:var(--fel)}
.ring span{width:66px;height:66px;border-radius:50%;background:var(--yta);display:grid;place-items:center;font-weight:800;font-size:1.15rem}
.hero h2{margin:0 0 4px;font-size:1.45rem;line-height:1.2}
.hero.ok h2{color:var(--ok)}.hero.fel h2{color:var(--fel)}
.hero .meta{color:var(--text2);font-size:.92rem}
.hero .meta a{text-decoration:none;border-bottom:1px solid var(--kant)}
code{font:600 .85em ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--yta2);padding:1px 6px;border-radius:6px}
.siffror{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
.siffra{background:var(--yta);border:1px solid var(--kant);border-radius:14px;padding:12px 14px}
.siffra small{display:block;color:var(--text2);font-size:.8rem}
.siffra b{font-size:1.5rem;line-height:1.2}
.siffra.ok b{color:var(--ok)}.siffra.fel b{color:var(--fel)}
.kort{background:var(--yta);border:1px solid var(--kant);border-radius:16px;padding:16px;margin-bottom:16px}
.kort h3{margin:0 0 12px;font-size:1rem;display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.kort h3 small{font-weight:400;color:var(--text2);font-size:.85rem}
.trend{display:flex;align-items:flex-end;gap:4px;height:64px}
.trend a,.trend>span{flex:1;height:100%;display:flex;align-items:flex-end;max-width:22px}
.bar{display:block;width:100%;border-radius:4px 4px 2px 2px}
.bar-ok{background:var(--ok);opacity:.55}.bar-fel{background:var(--fel)}.bar-nu{opacity:1;outline:2px solid var(--accent);outline-offset:1px}
.galleri{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.galleri a{text-decoration:none;display:block}
.galleri img{width:100%;aspect-ratio:9/16;object-fit:cover;object-position:top;border-radius:12px;border:1px solid var(--kant);display:block;background:var(--yta2)}
.galleri span{display:block;font-size:.85rem;margin-top:6px}
.galleri small{color:var(--text2)}
.grupp h3{margin-bottom:4px}
.rad{border-top:1px solid var(--kant);padding:10px 0}
.rad:first-of-type{border-top:0}
summary{list-style:none;cursor:pointer}
summary::-webkit-details-marker{display:none}
.rad-topp{display:flex;gap:10px;align-items:flex-start}
details>summary .namn::after{content:"›";margin-left:6px;color:var(--text2);display:inline-block;transition:transform .15s}
details[open]>summary .namn::after{transform:rotate(90deg)}
.ikon{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:.75rem;font-weight:800;margin-top:1px}
.ikon-ok{background:var(--ok-bg);color:var(--ok)}.ikon-fel{background:var(--fel);color:#fff}.ikon-flaky{background:var(--flaky-bg);color:var(--flaky)}.ikon-hoppad{background:var(--yta2);color:var(--text2)}
.namn{font-weight:500}
.tc{display:inline-block;font:700 .72rem ui-monospace,Menlo,monospace;padding:1px 7px;margin-right:8px;border-radius:6px;background:var(--yta2);color:var(--text2);text-decoration:none;vertical-align:1px}
.tc:hover{color:var(--text)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 0 32px}
.chip{font-size:.78rem;padding:2px 9px;border-radius:999px;background:var(--yta2);color:var(--text2);white-space:nowrap}
.chip small{opacity:.8}
.chip-expected{background:var(--ok-bg);color:var(--ok)}.chip-unexpected{background:var(--fel-bg);color:var(--fel);font-weight:600}.chip-flaky{background:var(--flaky-bg);color:var(--flaky)}
.detaljer{margin:10px 0 4px 32px}
.fel-rubrik{margin:8px 0 4px;font-size:.8rem;font-weight:700;color:var(--fel)}
pre{margin:0 0 8px;padding:10px 12px;background:var(--fel-bg);color:var(--text);border-radius:10px;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word;max-height:320px;overflow:auto}
.tumnaglar{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px}
.tumnaglar a{flex:none;width:110px;text-decoration:none;font-size:.75rem;color:var(--text2)}
.tumnaglar img{width:110px;height:196px;object-fit:cover;object-position:top;border-radius:10px;border:1px solid var(--kant);display:block;margin-bottom:4px}
.fil{margin:6px 0 0;font:12px ui-monospace,Menlo,monospace;color:var(--text2)}
.knapp{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;background:var(--accent);color:#17191C;font-weight:700;text-decoration:none}
footer{text-align:center;color:var(--text2);font-size:.85rem;margin-top:24px}
@media (max-width:560px){.siffror{grid-template-columns:repeat(2,1fr)}.hero{flex-direction:column;align-items:flex-start}.galleri{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <img src="../icons/icon.svg" alt="">
    <div><h1>Elkoll · Testrapport</h1><p>${esc(datum(meta.tid))} · ${projekt.map((p) => esc(KORT[p] || p)).join(' och ')}</p></div>
  </header>

  <section class="hero ${gront ? 'ok' : 'fel'}">
    <div class="ring"><span>${andel}%</span></div>
    <div>
      <h2>${esc(rubrik)}</h2>
      <div class="meta">
        ${meta.meddelande ? '<div>' + esc(meta.meddelande) + '</div>' : ''}
        <div>${meta.commitUrl ? '<a href="' + esc(meta.commitUrl) + '"><code>' + esc(meta.kort) + '</code></a>' : '<code>' + esc(meta.kort || 'lokal') + '</code>'} på <code>${esc(meta.gren || '–')}</code>${meta.korUrl ? ' · <a href="' + esc(meta.korUrl) + '">Visa körningen</a>' : ''}</div>
      </div>
    </div>
  </section>

  <section class="siffror">
    <div class="siffra"><small>Tester</small><b>${summa.totalt}</b></div>
    <div class="siffra ok"><small>Godkända</small><b>${summa.ok}</b></div>
    <div class="siffra ${summa.fel ? 'fel' : ''}"><small>Misslyckade</small><b>${summa.fel}</b></div>
    <div class="siffra"><small>Tid</small><b>${sek(summa.tid)}</b></div>
  </section>

  ${hist.length > 1 ? `<section class="kort"><h3>Senaste körningarna <small>${hist.length} st · nyast till höger</small></h3><div class="trend">${trend}</div></section>` : ''}

  ${galleri.length ? `<section class="kort"><h3>Så ser appen ut <small>skärmdumpar från testerna</small></h3><div class="galleri">${galleri.map((b) => '<a href="bilder/' + b.fil + '" target="_blank"><img loading="lazy" src="bilder/' + b.fil + '" alt="' + esc(b.namn) + '"><span>' + esc(b.namn) + ' <small>· ' + esc(b.enhet) + '</small></span></a>').join('')}</div></section>` : ''}

  ${grupper.map((g) => {
    const fel = g.tester.filter((t) => t.status === 'fel').length;
    return `<section class="kort grupp"><h3>${esc(g.namn)} <small>${fel ? fel + ' fel av ' : ''}${g.tester.length} tester</small></h3>${g.tester.map(testRad).join('')}</section>`;
  }).join('')}

  <p style="text-align:center;margin-top:24px"><a class="knapp" href="playwright/index.html">Detaljerad rapport med spårning →</a></p>
  <p style="text-align:center"><a href="https://github.com/DennisHoglund/elkoll/blob/main/testplan/index.md">Testplan med alla testfall</a></p>
  <footer>Genererad av Playwright ${esc(require('@playwright/test/package.json').version)} · <a href="../">Öppna Elkoll</a></footer>
</div>
</body>
</html>`;
}

function markdown({ meta, summa, tester }) {
  const rad = tester.map((t) => '| ' + IKON[t.status] + ' | ' + (t.tc ? '[' + t.tc + '](' + TESTPLAN + t.tc + '.md)' : '') + ' | ' + t.grupp + ' | ' + t.namn + ' |').join('\n');
  return '## ' + (summa.fel ? '❌ ' + summa.fel + ' tester misslyckades' : '✅ Alla ' + summa.totalt + ' tester gröna') + '\n\n' +
    '**' + summa.ok + '** godkända · **' + summa.fel + '** misslyckade · **' + summa.flaky + '** ostadiga · ' + sek(summa.tid) + '\n\n' +
    '📊 [Öppna testrapporten](https://dennishoglund.github.io/elkoll/rapport/)\n\n' +
    '| | Testfall | Grupp | Test |\n|---|---|---|---|\n' + rad + '\n';
}

module.exports = RapportReporter;
