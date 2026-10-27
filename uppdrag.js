// Uppdrag: lista per dag (Mina/Alla), nytt uppdrag med tolkning, uppdragskort.
window.ElkollUppdrag = (function () {
  'use strict';

  const U = window.ElkollUtil;
  const T = window.ElkollTeam;
  const { $, esc } = U;
  const CACHE = 'elkoll-uppdrag-cache';
  const FILTER_KEY = 'elkoll-filter';
  const FALT = ['datum', 'tid', 'adress', 'kund', 'telefon', 'portkod', 'uppgift'];
  const FALT_NAMN = { datum: 'Datum', tid: 'Tid', adress: 'Adress', kund: 'Kund', telefon: 'Telefon', portkod: 'Portkod', uppgift: 'Uppgift' };
  const STATUS = { planerad: 'Planerad', klar: 'Klar', aterbesok: 'Återbesök' };

  let sb = null;
  let userId = null;
  let synka = async () => {};
  let lista = [];
  let valdDag = U.isoDag();
  let filter = U.store.get(FILTER_KEY) === 'alla' ? 'alla' : 'mina';
  let redigerar = null;        // uppdrag som ändras (null = nytt)
  let saknas = [];             // fält som tolkningen inte hittade
  let till = null;             // vald medlem i formuläret

  const IKON = {
    varn: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    nav: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 22 2l-9 19-2-8-8-2z"/></svg>',
    ring: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    sms: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
  };

  function setup(client, opts) {
    sb = client;
    synka = opts.synka;
    $('filter-mina').addEventListener('click', () => satFilter('mina'));
    $('filter-alla').addEventListener('click', () => satFilter('alla'));
    $('days').addEventListener('click', (e) => {
      const b = e.target.closest('[data-dag]');
      if (b) { valdDag = b.getAttribute('data-dag'); render(); }
    });
    $('btn-tolka').addEventListener('click', tolka);
    $('form-uppdrag').addEventListener('submit', spara);
    $('u-till').addEventListener('click', (e) => {
      const b = e.target.closest('[data-till]');
      if (b) { till = b.getAttribute('data-till') || null; renderTill(); }
    });
    FALT.forEach((f) => $('u-' + f).addEventListener('input', () => markeraSaknas()));
    $('karta-prev').addEventListener('click', () => { valdDag = U.plusDagar(valdDag, -1); uppdatera(); });
    $('karta-next').addEventListener('click', () => { valdDag = U.plusDagar(valdDag, 1); uppdatera(); });
    $('karta-mina').addEventListener('click', () => satFilter('mina'));
    $('karta-alla').addEventListener('click', () => satFilter('alla'));
    $('kort').addEventListener('click', klickKort);
    satFilter(filter, true);
  }

  function setUser(id) { userId = id; }

  function satFilter(f, tyst) {
    filter = f;
    U.store.set(FILTER_KEY, f);
    ['filter', 'karta'].forEach((p) => {
      $(p + '-mina').setAttribute('aria-pressed', String(f === 'mina'));
      $(p + '-alla').setAttribute('aria-pressed', String(f === 'alla'));
    });
    if (!tyst) uppdatera();
  }

  // Ritar om listan, och kartan om den visas
  function uppdatera() {
    render();
    if (!$('screen-karta').hidden) visaKarta();
  }

  // ---------- Karta ----------
  function visaKarta() {
    $('karta-dag').textContent = valdDag === U.isoDag() ? 'Idag' : U.kortDag(valdDag);
    const dagens = sorterade(synliga().filter((r) => r.datum === valdDag));
    window.ElkollKarta.visa(dagens, valdDag + filter);
    geokodaSaknade(dagens);
  }

  // Uppdrag utan koordinater (t.ex. sparade utan täckning) får plats när kartan visas
  let geoPagar = false;
  const geoMiss = new Set();
  async function geokodaSaknade(dagens) {
    if (geoPagar || !navigator.onLine) return;
    const saknar = dagens.filter((r) => r.lat == null && r.adress && !geoMiss.has(r.adress));
    if (!saknar.length) return;
    geoPagar = true;
    let andrat = false;
    for (const r of saknar) {
      const g = await window.ElkollKarta.geokoda(r.adress);
      if (g) {
        const row = Object.assign({}, r, { lat: g.lat, lon: g.lon });
        delete row._vantar;
        await sparaRad(row, 'upsert', true);
        andrat = true;
      } else if (g === null) geoMiss.add(r.adress);
    }
    geoPagar = false;
    if (andrat && !$('screen-karta').hidden) visaKarta();
  }

  // ---------- Hämta ----------
  async function load() {
    const team = T.state.team;
    if (!team) return { ok: false };
    let server = null;
    let error = null;
    try {
      const res = await sb.from('elkoll_uppdrag').select('*')
        .eq('team_id', team.id)
        .gte('datum', U.plusDagar(U.isoDag(), -60))
        .order('datum').order('tid', { nullsFirst: false });
      server = res.data;
      error = res.error;
    } catch (e) { error = e; }

    if (error) {
      const c = U.store.json(CACHE, null);
      server = c && c.team === team.id ? c.rader : [];
    } else {
      U.store.setJson(CACHE, { team: team.id, rader: server || [] });
    }

    const ko = userId ? await window.ElkollKo.forUser(userId).catch(() => []) : [];
    const bort = new Set(ko.filter((i) => i.op === 'delete').map((i) => i.id));
    const vantar = new Map(ko.filter((i) => i.op !== 'delete').map((i) => [i.id, i.row]));
    lista = (server || []).filter((r) => !bort.has(r.id) && !vantar.has(r.id))
      .concat([...vantar.values()].map((r) => Object.assign({}, r, { _vantar: true })));
    for (const [id, r] of aldre) if (!bort.has(id) && !lista.some((x) => x.id === id)) lista.push(r);
    uppdatera();
    return { ok: !error, offline: error ? U.isNetworkError(error) : false, error, antal: lista.length };
  }

  // ---------- Lista ----------
  function synliga() {
    const jag = T.state.jag;
    return lista.filter((r) => filter === 'alla' || (jag && r.tilldelad === jag.id));
  }

  function sorterade(rader) {
    return rader.slice().sort((a, b) => (a.tid || '99:99').localeCompare(b.tid || '99:99') || a.uppgift.localeCompare(b.uppgift, 'sv'));
  }

  function render() {
    const idag = U.isoDag();
    $('idag-datum').textContent = U.dagText(valdDag);
    const mina = lista.filter((r) => T.state.jag && r.tilldelad === T.state.jag.id).length;
    $('filter-mina').textContent = 'Mina';
    $('filter-alla').textContent = 'Alla';

    // Dagväljare: idag + sex dagar framåt (plus vald dag om den ligger utanför)
    const dagar = [];
    for (let i = 0; i < 7; i++) dagar.push(U.plusDagar(idag, i));
    if (!dagar.includes(valdDag)) dagar.push(valdDag);
    dagar.sort();
    const vis = synliga();
    $('days').innerHTML = dagar.map((d) => {
      const n = vis.filter((r) => r.datum === d).length;
      const [vd, dt] = U.kortDag(d).split(' ');
      return '<button type="button" class="day' + (d === valdDag ? ' on' : '') + '" data-dag="' + d + '" aria-pressed="' + (d === valdDag) + '"' +
        ' aria-label="' + esc(U.dagText(d)) + (n ? ', ' + n + ' uppdrag' : '') + '">' +
        '<span class="day-wd">' + (d === idag ? 'Idag' : vd) + '</span><span class="day-n">' + dt + '</span>' +
        '<span class="day-dot' + (n ? ' has' : '') + '" aria-hidden="true"></span></button>';
    }).join('');

    const dagens = sorterade(vis.filter((r) => r.datum === valdDag));
    if (!dagens.length) {
      $('lista').innerHTML = '<div class="empty"><p><strong>Inga uppdrag ' + (valdDag === idag ? 'idag' : 'den här dagen') + '.</strong></p>' +
        '<p class="muted">' + (filter === 'mina' && mina === 0 && lista.length ? 'Tryck på Alla för att se teamets uppdrag.' : 'Tryck på Nytt uppdrag för att lägga in ett.') + '</p></div>';
      return;
    }
    $('lista').innerHTML = dagens.map((r, i) => kortRad(r, i + 1)).join('');
  }

  function saknasNu(r) {
    return (r.saknas || []).filter((f) => !String(r[f] || '').trim());
  }

  function kortRad(r, nr) {
    const fran = T.namn(r.fran);
    const tillNamn = r.tilldelad ? T.namn(r.tilldelad) : '';
    const rad3 = [fran ? 'Från ' + fran : '', r.kund ? 'Kund: ' + r.kund : ''].filter(Boolean).join(' · ');
    const chips = [];
    if (r.status !== 'planerad') chips.push('<span class="chip ' + r.status + '">' + STATUS[r.status] + '</span>');
    if (filter === 'alla') chips.push('<span class="chip">' + (tillNamn ? 'Till ' + esc(tillNamn) : 'Otilldelad') + '</span>');
    saknasNu(r).forEach((f) => chips.push('<span class="chip warn">' + IKON.varn + FALT_NAMN[f] + ' saknas</span>'));
    if (r._vantar) chips.push('<span class="chip">Väntar på täckning</span>');
    return '<a class="job' + (r.status === 'klar' ? ' done' : '') + '" href="#uppdrag/' + encodeURIComponent(r.id) + '">' +
      '<span class="job-nr" aria-hidden="true">' + nr + '</span>' +
      '<span class="job-text">' +
        '<span class="job-tid">' + esc(r.tid || 'Ingen tid') + '</span>' +
        '<span class="job-titel">' + esc(r.uppgift) + '</span>' +
        '<span class="job-adress">' + esc(r.adress) + '</span>' +
        (rad3 ? '<span class="job-meta">' + esc(rad3) + '</span>' : '') +
        (chips.length ? '<span class="chips">' + chips.join('') + '</span>' : '') +
      '</span></a>';
  }

  // ---------- Formulär ----------
  function openNytt(id) {
    const r = id ? lista.find((x) => x.id === id) : null;
    redigerar = r || null;
    $('form-uppdrag').reset();
    $('nytt-titel').textContent = r ? 'Ändra uppdrag' : 'Nytt uppdrag';
    $('nytt-avbryt').setAttribute('href', r ? '#uppdrag/' + encodeURIComponent(r.id) : '#idag');
    $('u-fritext').value = r ? (r.fritext || '') : '';
    $('u-datum').value = r ? r.datum : valdDag;
    $('u-tid').value = r ? (r.tid || '') : '';
    ['adress', 'kund', 'telefon', 'portkod', 'uppgift'].forEach((f) => { $('u-' + f).value = r ? (r[f] || '') : ''; });
    $('u-material').value = r ? (r.material || []).join('\n') : '';
    saknas = r ? (r.saknas || []).slice() : [];
    till = r ? r.tilldelad : (T.state.jag ? T.state.jag.id : null);
    meddela('tolka-msg', '');
    meddela('uppdrag-msg', '');
    markeraSaknas();
    renderTill();
  }

  function renderTill() {
    const knappar = T.state.medlemmar.map((m) =>
      '<button type="button" class="person" data-till="' + esc(m.id) + '" aria-pressed="' + (m.id === till) + '">' +
      '<span class="person-in">' + esc(U.initialer(m.namn)) + '</span><span class="person-namn">' + esc(m.namn.split(' ')[0]) + '</span></button>');
    knappar.push('<button type="button" class="person" data-till="" aria-pressed="' + (!till) + '"><span class="person-in">–</span><span class="person-namn">Ingen</span></button>');
    $('u-till').innerHTML = knappar.join('');
  }

  function markeraSaknas() {
    FALT.forEach((f) => {
      const input = $('u-' + f);
      const lbl = document.querySelector('label[for="u-' + f + '"]');
      const markera = saknas.includes(f) && !input.value.trim();
      input.classList.toggle('saknas', markera);
      if (lbl) lbl.textContent = FALT_NAMN[f] + (markera ? ' · saknas' : '');
      if (lbl) lbl.classList.toggle('warn', markera);
    });
  }

  function meddela(id, text, kind) {
    const el = $(id);
    el.textContent = text || '';
    el.className = 'msg' + (kind ? ' ' + kind : '');
  }

  async function tolka() {
    const text = $('u-fritext').value.trim();
    if (text.length < 3) { meddela('tolka-msg', 'Skriv eller diktera först vad som ska göras.', 'error'); return; }
    if (!navigator.onLine) { meddela('tolka-msg', 'Tolkningen kräver täckning. Fyll i fälten själv eller spara texten och tolka senare.', 'error'); return; }
    const btn = $('btn-tolka');
    btn.disabled = true;
    meddela('tolka-msg', 'Tolkar…');
    let data = null;
    let error = null;
    try {
      // Tidsgräns så att knappen aldrig hänger om Google är segt
      const grans = window.ELKOLL_CONFIG.tolkaTimeoutMs || 40000;
      const res = await Promise.race([
        sb.functions.invoke(window.ELKOLL_CONFIG.tolkaFunktion, { body: { text, idag: U.isoDag() } }),
        new Promise((resolve) => setTimeout(() => resolve({ data: null, error: Object.assign(new Error('Tolkningen tog för lång tid. Försök igen eller fyll i fälten själv.'), { status: 408 }) }), grans))
      ]);
      data = res.data;
      error = res.error;
      if (error && error.context && typeof error.context.json === 'function') {
        const body = await error.context.json().catch(() => null);
        if (body && body.error) error = Object.assign(new Error(body.error), { status: error.context.status });
        else error.status = error.context.status;
      }
    } catch (e) { error = e; }
    btn.disabled = false;

    if (error || !data) {
      const status = error && error.status;
      if (status === 404) meddela('tolka-msg', 'Tolkningen är inte igång än – fyll i fälten själv.', 'error');
      else if (U.isNetworkError(error)) meddela('tolka-msg', 'Ingen kontakt med tolkningen. Fyll i fälten själv.', 'error');
      else meddela('tolka-msg', (error && error.message) || 'Tolkningen misslyckades.', 'error');
      return;
    }

    if (data.datum) $('u-datum').value = data.datum;
    if (data.tid) $('u-tid').value = data.tid;
    ['adress', 'kund', 'telefon', 'portkod', 'uppgift'].forEach((f) => { if (data[f]) $('u-' + f).value = data[f]; });
    if (data.material && data.material.length) $('u-material').value = data.material.join('\n');
    saknas = (data.saknas || []).filter((f) => FALT.includes(f));
    markeraSaknas();
    const fattas = saknas.filter((f) => !$('u-' + f).value.trim());
    meddela('tolka-msg', fattas.length ? 'Klart. Saknas: ' + fattas.map((f) => FALT_NAMN[f].toLowerCase()).join(', ') + '.' : 'Klart. Kontrollera fälten nedan.', 'ok');
  }

  async function spara(e) {
    e.preventDefault();
    const datum = $('u-datum').value;
    const adress = $('u-adress').value.trim();
    const uppgift = $('u-uppgift').value.trim();
    if (!datum) { meddela('uppdrag-msg', 'Välj datum.', 'error'); return; }
    if (!adress) { meddela('uppdrag-msg', 'Fyll i adressen.', 'error'); return; }
    if (!uppgift) { meddela('uppdrag-msg', 'Fyll i vad som ska göras.', 'error'); return; }
    const team = T.state.team;
    const jag = T.state.jag;
    const val = (f) => $('u-' + f).value.trim() || null;
    const row = {
      id: redigerar ? redigerar.id : U.uuid(),
      team_id: team.id,
      fran: redigerar ? redigerar.fran : (jag ? jag.id : null),
      tilldelad: till || null,
      datum,
      tid: val('tid'),
      adress,
      kund: val('kund'),
      telefon: val('telefon'),
      portkod: val('portkod'),
      uppgift,
      material: $('u-material').value.split('\n').map((s) => s.trim()).filter(Boolean),
      saknas: saknas.filter((f) => !$('u-' + f).value.trim()),
      fritext: $('u-fritext').value.trim() || null,
      status: redigerar ? redigerar.status : 'planerad',
      kommentar: redigerar ? (redigerar.kommentar || null) : null,
      updated_at: new Date().toISOString()
    };
    // Plats på kartan: behåll gamla koordinater om adressen inte ändrats, annars slå upp (max 4 s)
    if (redigerar && redigerar.adress === adress && redigerar.lat != null) { row.lat = redigerar.lat; row.lon = redigerar.lon; }
    else if (navigator.onLine) {
      const g = await Promise.race([window.ElkollKarta.geokoda(adress), new Promise((r) => setTimeout(() => r(undefined), 4000))]);
      if (g) { row.lat = g.lat; row.lon = g.lon; }
    }
    await sparaRad(row);
    valdDag = datum;
    location.hash = '#idag';
  }

  // Spara lokalt först, skicka sedan
  async function sparaRad(row, op, tyst) {
    await window.ElkollKo.put({ id: row.id, userId, op: op || 'upsert', row, created: Date.now() });
    const i = lista.findIndex((x) => x.id === row.id);
    if (op === 'delete') { if (i >= 0) lista.splice(i, 1); }
    else if (i >= 0) lista[i] = Object.assign({}, row, { _vantar: true });
    else lista.push(Object.assign({}, row, { _vantar: true }));
    render();
    const res = await synka();
    if (tyst) return;
    if (res && res.left) U.toast('Sparat i telefonen – skickas när du har täckning', 'ok', 3500);
    else U.toast(op === 'delete' ? 'Uppdraget är borttaget' : 'Sparat', 'ok', 2000);
  }

  // ---------- Uppdragskort ----------
  function kartLank(adress) {
    const q = encodeURIComponent(adress);
    return /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? 'https://maps.apple.com/?daddr=' + q : 'https://www.google.com/maps/dir/?api=1&destination=' + q;
  }

  function bockat(id) { return U.store.json('elkoll-bockat-' + id, []); }

  // Äldre uppdrag (utanför de senaste 60 dagarna) hämtas när de öppnas, t.ex. från platsminnet
  const aldre = new Map();
  async function hamtaUppdrag(id) {
    try {
      const { data } = await sb.from('elkoll_uppdrag').select('*').eq('id', id).maybeSingle();
      return data || null;
    } catch (e) { return null; }
  }

  function openKort(id) {
    const r = lista.find((x) => x.id === id);
    if (!r) {
      $('kort-status').textContent = '';
      $('kort').innerHTML = '<div class="empty"><p><strong>Hämtar uppdraget…</strong></p></div>';
      hamtaUppdrag(id).then((rad) => {
        if (decodeURIComponent(location.hash.split('/')[1] || '') !== id) return;
        if (rad) { aldre.set(rad.id, rad); lista.push(rad); openKort(id); return; }
        $('kort').innerHTML = '<div class="empty"><p><strong>Uppdraget finns inte längre.</strong></p><p><a href="#idag">Till listan</a></p></div>';
      });
      return;
    }
    const jag = T.state.jag;
    const fran = T.medlem(r.fran);
    const tillNamn = r.tilldelad ? T.namn(r.tilldelad) : 'Ingen';
    const tel = U.telLank(r.telefon);
    const franTel = fran && (!jag || fran.id !== jag.id) ? U.telLank(fran.telefon) : '';
    const smsText = encodeURIComponent('Hej! Jag är på väg till dig nu.' + (jag ? ' /' + jag.namn.split(' ')[0] : ''));
    const b = bockat(r.id);
    $('kort-status').textContent = STATUS[r.status];
    $('kort-status').className = 'status-chip ' + r.status;

    const rad = (k, v, extra) => '<div class="info-row"><span class="muted">' + k + '</span><span class="info-v">' + v + '</span>' + (extra || '') + '</div>';
    const saknasLista = saknasNu(r);

    $('kort').innerHTML =
      '<div class="kort-head">' +
        '<p class="kicker">' + esc(U.dagText(r.datum)) + (r.tid ? ' · ' + esc(r.tid) : '') + '</p>' +
        '<h1>' + esc(r.uppgift) + '</h1>' +
        '<p class="kort-adress">' + esc(r.adress) + '</p>' +
      '</div>' +
      '<div class="actions3">' +
        '<a class="action primary" href="' + esc(kartLank(r.adress)) + '" target="_blank" rel="noopener">' + IKON.nav + 'Navigera</a>' +
        (tel ? '<a class="action" href="tel:' + esc(tel) + '">' + IKON.ring + 'Ring kund</a>' : '<span class="action disabled" aria-disabled="true">' + IKON.ring + 'Inget nummer</span>') +
        (tel ? '<a class="action" href="sms:' + esc(tel) + '?&body=' + smsText + '">' + IKON.sms + 'På väg-sms</a>' : '<span class="action disabled" aria-disabled="true">' + IKON.sms + 'På väg-sms</span>') +
      '</div>' +
      (saknasLista.length ? '<p class="warnbox">' + IKON.varn + ' Saknas: ' + saknasLista.map((f) => FALT_NAMN[f].toLowerCase()).join(', ') + '</p>' : '') +
      '<div class="card info">' +
        rad('Kund', esc(r.kund || '–')) +
        rad('Telefon', esc(r.telefon || '–')) +
        rad('Portkod', r.portkod ? '<span class="kod">' + esc(r.portkod) + '</span>' : '–') +
        rad('Till', esc(tillNamn)) +
        rad('Från', esc(fran ? fran.namn : '–'), franTel ? '<a class="ring-liten" href="tel:' + esc(franTel) + '" aria-label="Ring ' + esc(fran.namn) + '">' + IKON.ring.replace(/24/g, '18') + 'Ring</a>' : '') +
      '</div>' +
      '<div id="platsminne"></div>' +
      (r.fritext ? '<div class="card stack"><h2>' + esc(fran ? fran.namn.split(' ')[0] + 's meddelande' : 'Meddelande') + '</h2><p class="fritext">' + esc(r.fritext) + '</p></div>' : '') +
      (r.material && r.material.length ? '<div class="card"><h2>Material att ta med</h2><div class="checks">' +
        r.material.map((m, i) => '<label class="check"><input type="checkbox" data-bock="' + i + '"' + (b.includes(i) ? ' checked' : '') + '> ' + esc(m) + '</label>').join('') +
        '</div></div>' : '') +
      '<div class="card form stack" id="dokumentation"><h2>Dokumentation</h2>' +
        '<div id="foto-yta"></div>' +
        '<label for="kort-anteckning">Anteckningar</label>' +
        '<textarea id="kort-anteckning" rows="4" placeholder="Diktera vad som gjordes och vad som återstår">' + esc(r.kommentar || '') + '</textarea>' +
        '<button type="button" class="btn ghost" data-spara-anteckning>Spara anteckning</button>' +
      '</div>' +
      '<div class="card stack"><h2>Status</h2><div class="seg3">' +
        ['planerad', 'klar', 'aterbesok'].map((s) => '<button type="button" data-status="' + s + '" aria-pressed="' + (r.status === s) + '">' + STATUS[s] + '</button>').join('') +
      '</div></div>' +
      '<div class="grid2">' +
        '<a class="btn ghost" href="#nytt/' + encodeURIComponent(r.id) + '">Ändra</a>' +
        '<button class="btn ghost danger" type="button" data-radera>Ta bort</button>' +
      '</div>';
    window.ElkollFoto.visa(r, $('foto-yta'));
    visaPlatsminne(r);
  }

  // ---------- Platsminne: andra besök på samma adress ----------
  function gata(adress) { return String(adress || '').split(',')[0].replace(/\s+/g, ' ').trim(); }
  function avstandM(a, b) {
    const R = 6371000, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  // Ort = det efter första kommatecknet, utan postnummer ("852 30 Sundsvall" → "sundsvall")
  function ort(adress) {
    const delar = String(adress || '').split(',');
    return delar.length > 1 ? delar.slice(1).join(' ').replace(/\d/g, '').replace(/\s+/g, ' ').trim().toLowerCase() : '';
  }
  // Samma gata och nummer. Står orten med på båda måste den också stämma (samma gatunamn finns i flera orter).
  // Koordinaterna används inte – en adress utan ort kan ha slagits upp till fel stad.
  function sammaPlats(a, b) {
    if (gata(a.adress).toLowerCase().replace(/\s/g, '') !== gata(b.adress).toLowerCase().replace(/\s/g, '')) return false;
    const oa = ort(a.adress), ob = ort(b.adress);
    return !oa || !ob || oa === ob;
  }

  async function tidigareBesok(r) {
    const g = gata(r.adress);
    if (!g) return [];
    let rader = lista;
    if (navigator.onLine) {
      try {
        // Hämta på gatunamnet (utan nummer) och jämför exakt här – "Storgatan 12" och "Storgatan12" ska räknas lika
        const namn = g.replace(/\s*\d.*$/, '') || g;
        const monster = namn.replace(/[%_\\]/g, (c) => '\\' + c) + '%';
        const { data, error } = await sb.from('elkoll_uppdrag')
          .select('id, datum, tid, adress, lat, lon, uppgift, status, kommentar, tilldelad')
          .eq('team_id', r.team_id).neq('id', r.id).ilike('adress', monster)
          .order('datum', { ascending: false }).limit(100);
        if (!error && data) rader = data.concat(lista.filter((x) => !data.some((d) => d.id === x.id)));
      } catch (e) { /* använd det som finns lokalt */ }
    }
    return rader.filter((x) => x.id !== r.id && sammaPlats(r, x))
      .sort((a, b) => b.datum.localeCompare(a.datum));
  }

  async function visaPlatsminne(r) {
    const besok = await tidigareBesok(r);
    const el = $('platsminne');
    if (!el || decodeURIComponent(location.hash.split('/')[1] || '') !== r.id) return;
    if (!besok.length) { el.innerHTML = ''; return; }
    const idag = U.isoDag();
    const forut = besok.filter((b) => b.datum <= r.datum).length;
    const rubrik = forut ? 'Varit här förut: ' + forut + (forut === 1 ? ' besök' : ' besök') : besok.length + (besok.length === 1 ? ' annat besök' : ' andra besök') + ' på adressen';
    el.innerHTML = '<details class="card minne"><summary>' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' +
      '<span>' + esc(rubrik) + '</span></summary><ul class="minne-lista">' +
      besok.map((b) => '<li><a href="#uppdrag/' + encodeURIComponent(b.id) + '">' +
        '<span class="minne-datum">' + esc(U.kortDag(b.datum)) + (b.datum > idag ? ' · kommande' : '') + '</span>' +
        '<strong>' + esc(b.uppgift) + '</strong>' +
        '<span class="muted small">' + esc([b.tilldelad ? T.namn(b.tilldelad) : '', STATUS[b.status] || ''].filter(Boolean).join(' · ')) + '</span>' +
        (b.kommentar ? '<span class="minne-not">' + esc(b.kommentar) + '</span>' : '') +
        '</a></li>').join('') +
      '</ul></details>';
  }

  async function klickKort(e) {
    const id = decodeURIComponent((location.hash.split('/')[1] || ''));
    const r = lista.find((x) => x.id === id);
    if (!r) return;
    const bock = e.target.closest('[data-bock]');
    if (bock) {
      const i = Number(bock.getAttribute('data-bock'));
      const set = new Set(bockat(id));
      if (bock.checked) set.add(i); else set.delete(i);
      U.store.setJson('elkoll-bockat-' + id, [...set]);
      return;
    }
    const st = e.target.closest('[data-status]');
    if (st) {
      const status = st.getAttribute('data-status');
      if (status === r.status) return;
      const row = Object.assign({}, r, { status, updated_at: new Date().toISOString() });
      delete row._vantar;
      await sparaRad(row);
      openKort(id);
      return;
    }
    if (e.target.closest('[data-spara-anteckning]')) {
      const kommentar = $('kort-anteckning').value.trim() || null;
      const row = Object.assign({}, r, { kommentar, updated_at: new Date().toISOString() });
      delete row._vantar;
      await sparaRad(row);
      return;
    }
    const rad = e.target.closest('[data-radera]');
    if (rad) {
      if (!rad.classList.contains('confirm')) {
        rad.classList.add('confirm');
        rad.textContent = 'Tryck igen för att ta bort';
        setTimeout(() => { if (rad.isConnected) { rad.classList.remove('confirm'); rad.textContent = 'Ta bort'; } }, 4000);
        return;
      }
      await window.ElkollFoto.taBortAlla(r.id);
      await sparaRad({ id: r.id }, 'delete');
      U.store.del('elkoll-bockat-' + id);
      location.hash = '#idag';
    }
  }

  return { setup, setUser, load, render, openNytt, openKort, visaKarta, get lista() { return lista; } };
})();
