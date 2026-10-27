// Mockar allt externt så att testerna är snabba, stabila och aldrig rör riktig data:
// Supabase (auth, databas, tolkningsfunktionen), CDN-bibliotek och typsnitt.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SUPABASE = 'https://sjdznlmnvubqscftdkoj.supabase.co';
const STORAGE_KEY = 'sb-sjdznlmnvubqscftdkoj-auth-token';
const FOTO = fs.readFileSync(path.join(__dirname, 'data', 'foto.jpg'));
const TILE = fs.readFileSync(path.join(__dirname, 'data', 'tile.png'));
const TILE_HOSTS = /tile\.openstreetmap\.org|opentopomap\.org|arcgisonline\.com/;

const ANVANDARE = {
  id: '11111111-2222-3333-4444-555555555555',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'dennis@elkoll.se',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z'
};
const LOSENORD = 'elcentral123';

// Datum i Stockholm, samma som appen räknar med
function dag(plus = 0) {
  const d = new Date(Date.now() + plus * 86400000);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' });
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function session(user = ANVANDARE) {
  const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
  const token = b64url({ alg: 'HS256', typ: 'JWT' }) + '.' +
    b64url({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', exp }) + '.signatur';
  return { access_token: token, token_type: 'bearer', expires_in: 3600 * 24, expires_at: exp, refresh_token: 'refresh', user };
}

const TEAM = 'aaaaaaaa-0000-4000-8000-000000000001';
const M = { dennis: 'm-dennis', kalle: 'm-kalle', maria: 'm-maria' };

function exempelData() {
  return {
    elkoll_team: [{ id: TEAM, namn: 'Sundsvalls El AB', skapad_av: ANVANDARE.id }],
    elkoll_medlem: [
      { id: M.dennis, team_id: TEAM, namn: 'Dennis Höglund', telefon: '070-000 00 01', epost: ANVANDARE.email, agare: true },
      { id: M.kalle, team_id: TEAM, namn: 'Kalle Lind', telefon: '070-000 00 02', epost: 'kalle@elkoll.se' },
      { id: M.maria, team_id: TEAM, namn: 'Maria Sjö', telefon: '070-000 00 03', epost: 'maria@elkoll.se' }
    ],
    elkoll_uppdrag: [
      { id: 'u1', team_id: TEAM, fran: M.kalle, tilldelad: M.dennis, datum: dag(0), tid: '07:30', adress: 'Storgatan 12, Sundsvall', kund: 'Anna Lindqvist', telefon: '070-123 45 67', portkod: '1234', lat: 62.3908, lon: 17.3069, uppgift: 'Byta elcentral', material: ['Elcentral 12 moduler', 'Jordfelsbrytare × 2'], saknas: [], fritext: 'Idag halv åtta Storgatan 12, byta elcentral hos Anna.', status: 'planerad', kommentar: null },
      { id: 'u2', team_id: TEAM, fran: M.kalle, tilldelad: M.dennis, datum: dag(0), tid: '13:30', adress: 'Södra vägen 21, Sundsvall', kund: 'Erik', telefon: null, portkod: null, lat: 62.3850, lon: 17.3200, uppgift: 'Montera 4 uttag i garage', material: [], saknas: ['portkod', 'telefon'], fritext: null, status: 'planerad', kommentar: null },
      { id: 'u3', team_id: TEAM, fran: M.dennis, tilldelad: M.maria, datum: dag(0), tid: '10:00', adress: 'Bergsgatan 4, Sundsvall', kund: 'Bo', telefon: '070-555 55 55', portkod: null, lat: 62.3950, lon: 17.2950, uppgift: 'Felsöka jordfel i kök', material: [], saknas: [], fritext: null, status: 'planerad', kommentar: null },
      { id: 'u4', team_id: TEAM, fran: M.kalle, tilldelad: M.dennis, datum: dag(1), tid: '08:00', adress: 'Kyrkogatan 3, Sundsvall', kund: null, telefon: null, portkod: null, uppgift: 'Byta armatur i trapphus', material: [], saknas: [], fritext: null, status: 'planerad', kommentar: null }
    ],
    elkoll_foto: [],
    elkoll_tid: []
  };
}

const TOLKNING = {
  datum: dag(1), tid: '07:30', adress: 'Storgatan 12, Sundsvall', kund: 'Anna Lindqvist', telefon: '070-123 45 67',
  portkod: '', lat: 62.3908, lon: 17.3069, uppgift: 'Byta elcentral', material: ['Elcentral 12 moduler', 'Jordfelsbrytare × 2'], saknas: ['portkod']
};

// PostgREST-filter: ?kolumn=eq.värde / gte.värde
function filtrera(rows, params) {
  let ut = rows;
  for (const [k, v] of params) {
    if (['select', 'order', 'on_conflict', 'columns', 'limit'].includes(k)) continue;
    const [op, ...rest] = v.split('.');
    const val = rest.join('.');
    if (op === 'eq') ut = ut.filter((r) => String(r[k]) === val);
    if (op === 'gte') ut = ut.filter((r) => String(r[k]) >= val);
    if (op === 'neq') ut = ut.filter((r) => String(r[k]) !== val);
    if (op === 'lt') ut = ut.filter((r) => String(r[k]) < val);
    if (op === 'lte') ut = ut.filter((r) => String(r[k]) <= val);
    if (op === 'in') {
      const varden = val.replace(/^\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, ''));
      ut = ut.filter((r) => varden.includes(String(r[k])));
    }
    if (op === 'is' && val === 'null') ut = ut.filter((r) => r[k] == null);
    if (op === 'ilike') {
      const re = new RegExp('^' + val.replace(/\\([%_\\])/g, '$1').replace(/[.+?^${}()|[\]]/g, '\\$&').replace(/[%*]/g, '.*') + '$', 'i');
      ut = ut.filter((r) => re.test(String(r[k] || '')));
    }
  }
  return ut;
}

async function mocka(page, { data = exempelData(), tolkning = TOLKNING } = {}) {
  const api = { db: data, tolkning, tolkStatus: 200, logoutStatus: 204, tolkFordrojning: 0, tolkAnrop: [], anrop: [], nere: false, signup: null, uppladdade: [], borttagnaFoton: [], geoAnrop: [],
    // Adress (gemener) → koordinater. Saknas adressen svarar "Nominatim" med en standardplats.
    geo: { 'okänd väg 99': null } };

  await page.route(/cdnjs\.cloudflare\.com/, (route) => {
    const url = route.request().url();
    const img = url.match(/leaflet\/[\d.]+\/images\/(.+\.png)/);
    if (img) return route.fulfill({ path: path.join(ROOT, 'node_modules/leaflet/dist/images', img[1]), contentType: 'image/png' });
    if (/leaflet\.min\.js/.test(url)) return route.fulfill({ path: path.join(ROOT, 'node_modules/leaflet/dist/leaflet.js'), contentType: 'application/javascript' });
    if (/leaflet\.min\.css/.test(url)) return route.fulfill({ path: path.join(ROOT, 'node_modules/leaflet/dist/leaflet.css'), contentType: 'text/css' });
    return route.abort();
  });
  await page.route(TILE_HOSTS, (route) => route.fulfill({ body: TILE, contentType: 'image/png' }));
  await page.route(/nominatim\.openstreetmap\.org/, (route) => {
    const q = (new URL(route.request().url()).searchParams.get('q') || '').toLowerCase();
    api.geoAnrop.push(q);
    if (api.nere) return route.abort('internetdisconnected');
    const hit = q in api.geo ? api.geo[q] : { lat: 62.40, lon: 17.30 };
    return route.fulfill({ json: hit ? [{ lat: String(hit.lat), lon: String(hit.lon), display_name: q }] : [], headers: cors() });
  });

  await page.route(/cdn\.jsdelivr\.net/, (route) => {
    if (/supabase-js/.test(route.request().url())) {
      return route.fulfill({ path: path.join(ROOT, 'node_modules/@supabase/supabase-js/dist/umd/supabase.js'), contentType: 'application/javascript' });
    }
    return route.abort();
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ body: '', contentType: 'text/css' }));

  await page.route(SUPABASE + '/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const m = req.method();
    api.anrop.push({ metod: m, sokvag: p + url.search });

    if (api.nere) return route.abort('internetdisconnected');
    if (m === 'OPTIONS') return route.fulfill({ status: 200, headers: cors() });

    // ---- Auth ----
    if (p === '/auth/v1/token') {
      const body = req.postDataJSON() || {};
      if (body.email === ANVANDARE.email && body.password === LOSENORD) return json(route, 200, session());
      return json(route, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    }
    if (p === '/auth/v1/signup') {
      const body = req.postDataJSON() || {};
      api.signup = body;
      if (body.email === ANVANDARE.email) return json(route, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
      const ny = { ...ANVANDARE, id: '99999999-2222-3333-4444-555555555555', email: body.email };
      return json(route, 200, session(ny));
    }
    if (p === '/auth/v1/user') return json(route, 200, ANVANDARE);
    if (p === '/auth/v1/logout') {
      if (api.logoutStatus !== 204) return json(route, api.logoutStatus, { code: api.logoutStatus, msg: 'Serverfel' });
      return route.fulfill({ status: 204, headers: cors() });
    }

    // ---- Tolkning ----
    if (p === '/functions/v1/elkoll-tolka') {
      api.tolkAnrop.push(req.postDataJSON());
      if (api.tolkFordrojning) await new Promise((r) => setTimeout(r, api.tolkFordrojning));
      if (api.tolkStatus !== 200) return json(route, api.tolkStatus, { error: 'Tolkningen misslyckades (' + api.tolkStatus + ')' });
      return json(route, 200, api.tolkning);
    }

    // ---- Foton ----
    if (p.startsWith('/storage/v1/object/sign/elkoll-foton') && m === 'POST') {
      const body = req.postDataJSON() || {};
      return json(route, 200, (body.paths || []).map((x) => ({ path: x, signedURL: '/object/sign/elkoll-foton/' + x + '?token=test', error: null })));
    }
    if (p.startsWith('/storage/v1/object/elkoll-foton/') && (m === 'POST' || m === 'PUT')) {
      const fil = decodeURIComponent(p.replace('/storage/v1/object/elkoll-foton/', ''));
      api.uppladdade.push({ path: fil, bytes: (req.postDataBuffer() || Buffer.alloc(0)).length });
      return json(route, 200, { Key: 'elkoll-foton/' + fil });
    }
    if (p === '/storage/v1/object/elkoll-foton' && m === 'DELETE') {
      api.borttagnaFoton.push(...((req.postDataJSON() || {}).prefixes || []));
      return json(route, 200, []);
    }
    if (p.startsWith('/storage/v1/object/')) return route.fulfill({ body: FOTO, contentType: 'image/jpeg', headers: cors() });

    // ---- Databas ----
    const tabell = p.replace('/rest/v1/', '');
    if (api.db[tabell]) {
      const rows = api.db[tabell];
      if (m === 'GET' || m === 'HEAD') {
        let ut = filtrera(rows, url.searchParams);
        const order = url.searchParams.get('order');
        if (order) {
          const nycklar = order.split(',').map((o) => o.split('.')[0]);
          ut = [...ut].sort((a, b) => { for (const k of nycklar) { const c = String(a[k] ?? '~').localeCompare(String(b[k] ?? '~')); if (c) return c; } return 0; });
        }
        if ((req.headers()['accept'] || '').includes('vnd.pgrst.object')) return json(route, 200, ut[0] || null);
        return json(route, 200, ut, { 'content-range': '0-' + (ut.length - 1) + '/' + ut.length });
      }
      if (m === 'POST') {
        const upsert = (req.headers()['prefer'] || '').includes('merge-duplicates');
        const nya = [].concat(req.postDataJSON());
        if (tabell === 'elkoll_medlem') {
          for (const r of nya) if (rows.some((x) => x.team_id === r.team_id && x.epost === r.epost)) {
            return json(route, 409, { code: '23505', message: 'duplicate key value violates unique constraint' });
          }
        }
        for (const r of nya) {
          const i = rows.findIndex((x) => x.id === r.id);
          if (i >= 0 && upsert) rows[i] = { ...rows[i], ...r };
          else rows.push({ id: r.id || 'id-' + Math.random().toString(36).slice(2), ...r });
        }
        return route.fulfill({ status: 201, headers: cors() });
      }
      if (m === 'PATCH') {
        filtrera(rows, url.searchParams).forEach((r) => Object.assign(r, req.postDataJSON()));
        return route.fulfill({ status: 204, headers: cors() });
      }
      if (m === 'DELETE') {
        const bort = new Set(filtrera(rows, url.searchParams).map((r) => r.id));
        api.db[tabell] = rows.filter((r) => !bort.has(r.id));
        // som i databasen: borttagen medlem → uppdragen blir otilldelade
        if (tabell === 'elkoll_uppdrag') {
          api.db.elkoll_foto = api.db.elkoll_foto.filter((f) => !bort.has(f.uppdrag_id));
          api.db.elkoll_tid = api.db.elkoll_tid.filter((t) => !bort.has(t.uppdrag_id));
        }
        if (tabell === 'elkoll_medlem') api.db.elkoll_uppdrag.forEach((u) => { if (bort.has(u.tilldelad)) u.tilldelad = null; if (bort.has(u.fran)) u.fran = null; });
        return route.fulfill({ status: 204, headers: cors() });
      }
    }

    return json(route, 404, { message: 'Ej mockat: ' + m + ' ' + p });
  });

  return api;
}

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS',
    'access-control-expose-headers': 'content-range'
  };
}

function json(route, status, body, extra) {
  return route.fulfill({ status, headers: { ...cors(), ...(extra || {}) }, contentType: 'application/json', body: typeof body === 'string' ? body : JSON.stringify(body) });
}

// Lägger in en inloggad session innan sidan laddas (snabbare än att logga in via formuläret)
async function inloggad(page, user) {
  const s = session(user);
  await page.addInitScript(([key, val]) => {
    try { if (!sessionStorage.getItem('elkoll-test-init')) { localStorage.setItem(key, val); sessionStorage.setItem('elkoll-test-init', '1'); } } catch (e) {}
  }, [STORAGE_KEY, JSON.stringify(s)]);
}

module.exports = { FOTO_FIL: path.join(__dirname, 'data', 'foto.jpg'), mocka, inloggad, ANVANDARE, LOSENORD, exempelData, TOLKNING, TEAM, M, dag };
