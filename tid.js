// Tidrapport: Starta/Stoppa tid på uppdragskortet, lägga till tid i efterhand och en veckorapport per person.
// Tider sparas först i telefonen (kön i ko.js) och skickas till elkoll_tid när det finns täckning.
window.ElkollTid = (function () {
  'use strict';

  const U = window.ElkollUtil;
  const T = window.ElkollTeam;
  const { $, esc } = U;
  const PAGAR_KEY = 'elkoll-tid-pagar';
  const CACHE = 'elkoll-tid-uppdrag-';

  let sb = null;
  let userId = null;
  let synka = async () => {};
  let aktuellt = null;       // { uppdrag, el }
  let rader = [];            // tider för aktuellt uppdrag
  let ticker = null;
  let veckaStart = mandag(U.isoDag());

  function setup(client, opts) {
    sb = client;
    synka = opts.synka;
    document.addEventListener('click', klick);
    $('tid-prev').addEventListener('click', () => { veckaStart = U.plusDagar(veckaStart, -7); visaRapport(); });
    $('tid-next').addEventListener('click', () => { veckaStart = U.plusDagar(veckaStart, 7); visaRapport(); });
  }
  function setUser(id) { userId = id; }

  // ---------- Hjälp ----------
  function mandag(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d, 12);
    const dag = (dt.getDay() + 6) % 7;
    return U.plusDagar(iso, -dag);
  }
  function veckonummer(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const dag = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - dag);
    const arStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    return Math.ceil(((dt - arStart) / 86400000 + 1) / 7);
  }
  const minuter = (r, nu) => Math.max(0, Math.round(((r.slut ? new Date(r.slut) : (nu || new Date())) - new Date(r.start)) / 60000));
  function langd(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return h ? h + ' h ' + (m ? m + ' min' : '') : m + ' min';
  }
  function klocka(min) { return Math.floor(min / 60) + ':' + String(min % 60).padStart(2, '0'); }
  const hhmm = (iso) => { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  function pagar() { return U.store.json(PAGAR_KEY, null); }
  function pagarId() { const p = pagar(); return p && p.medlem_id === (T.state.jag && T.state.jag.id) ? p.uppdrag_id : null; }

  async function spara(row, op) {
    await window.ElkollKo.put({ id: row.id, userId, op: op || 'tid', row, created: Date.now() });
    return synka();
  }

  // ---------- Pågående tid (hämtas från servern om den startats på en annan enhet) ----------
  async function laddaPagaende() {
    const jag = T.state.jag;
    if (!jag || !navigator.onLine) return;
    try {
      const { data, error } = await sb.from('elkoll_tid').select('*').eq('medlem_id', jag.id).is('slut', null).limit(1);
      if (error) return;
      const ko = userId ? await window.ElkollKo.forUser(userId).catch(() => []) : [];
      if (ko.some((i) => i.op === 'tid')) return;   // lokala ändringar väntar – lita på dem
      if (data && data[0]) U.store.setJson(PAGAR_KEY, data[0]); else U.store.del(PAGAR_KEY);
    } catch (e) { /* behåll lokalt */ }
  }

  // ---------- Starta / stoppa ----------
  async function starta(uppdrag) {
    const jag = T.state.jag;
    if (!jag) return;
    const p = pagar();
    if (p && p.uppdrag_id === uppdrag.id) return;
    if (p) {
      const namn = (window.ElkollUppdrag.lista.find((u) => u.id === p.uppdrag_id) || {}).uppgift || 'förra uppdraget';
      await stoppa(true);
      U.toast('Stoppade tiden på ' + namn, 'ok', 3000);
    }
    const row = { id: U.uuid(), team_id: uppdrag.team_id, uppdrag_id: uppdrag.id, medlem_id: jag.id, start: new Date().toISOString(), slut: null };
    U.store.setJson(PAGAR_KEY, row);
    rader.push(row);
    render();
    window.ElkollUppdrag.render();
    await spara(row);
  }

  async function stoppa(tyst) {
    const p = pagar();
    if (!p) return;
    const row = Object.assign({}, p, { slut: new Date().toISOString() });
    U.store.del(PAGAR_KEY);
    const i = rader.findIndex((r) => r.id === row.id);
    if (i >= 0) rader[i] = row;
    render();
    window.ElkollUppdrag.render();
    await spara(row);
    if (!tyst) U.toast('Tiden är sparad: ' + langd(minuter(row)), 'ok', 2500);
  }

  // ---------- Uppdragskortet ----------
  async function visa(uppdrag, el) {
    aktuellt = { uppdrag, el };
    rader = U.store.json(CACHE + uppdrag.id, []);
    await slaIhop();
    render();
    starta_ticker();
    if (!navigator.onLine) return;
    try {
      const { data, error } = await sb.from('elkoll_tid').select('*').eq('uppdrag_id', uppdrag.id).order('start');
      if (error || !aktuellt || aktuellt.uppdrag.id !== uppdrag.id) return;
      U.store.setJson(CACHE + uppdrag.id, data || []);
      rader = data || [];
      await slaIhop();
      render();
    } catch (e) { /* visar det lokala */ }
  }

  async function slaIhop() {
    if (!aktuellt || !userId) return;
    const ko = await window.ElkollKo.forUser(userId).catch(() => []);
    const bort = new Set(ko.filter((i) => i.op === 'tid-delete').map((i) => i.id));
    const egna = ko.filter((i) => i.op === 'tid' && i.row.uppdrag_id === aktuellt.uppdrag.id).map((i) => i.row);
    rader = rader.filter((r) => !bort.has(r.id) && !egna.some((e) => e.id === r.id)).concat(egna);
    const p = pagar();
    if (p && p.uppdrag_id === aktuellt.uppdrag.id && !rader.some((r) => r.id === p.id)) rader.push(p);
    rader.sort((a, b) => a.start.localeCompare(b.start));
  }

  function starta_ticker() {
    clearInterval(ticker);
    // Uppdaterar bara texterna (klocka, pågående pass, totalt) – inte hela kortet, så att ett
    // halvifyllt "Lägg till tid i efterhand" inte nollställs
    ticker = setInterval(() => {
      const p = pagar();
      if (!p) return;
      const el = document.getElementById('tid-klocka');
      if (el) el.textContent = klocka(minuter(p));
      const rad = document.querySelector('[data-pagar-langd="' + p.id + '"]');
      if (rad) rad.textContent = langd(minuter(p));
      const tot = document.querySelector('#tid-yta .tid-totalt');
      if (tot) tot.textContent = 'Totalt ' + langd(rader.reduce((sum, r) => sum + minuter(r.id === p.id ? p : r), 0));
    }, 15000);
  }

  function render() {
    if (!aktuellt || !aktuellt.el.isConnected) return;
    const jag = T.state.jag;
    const p = pagar();
    const minPagar = p && aktuellt && p.uppdrag_id === aktuellt.uppdrag.id && jag && p.medlem_id === jag.id;
    const totalt = rader.reduce((s, r) => s + minuter(r), 0);
    aktuellt.el.innerHTML =
      '<div class="row-between"><h2>Tid</h2>' + (rader.length ? '<span class="tid-totalt">Totalt ' + esc(langd(totalt)) + '</span>' : '') + '</div>' +
      (minPagar
        ? '<button type="button" class="btn dark big tid-knapp" data-tid-stoppa><span class="tid-puls" aria-hidden="true"></span>Stoppa · <span id="tid-klocka">' + klocka(minuter(p)) + '</span></button>'
        : '<button type="button" class="btn primary big tid-knapp" data-tid-starta>' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>Starta tid</button>') +
      (rader.length ? '<ul class="tid-lista">' + rader.map((r) => {
        const egen = jag && r.medlem_id === jag.id;
        return '<li><span class="tid-vem">' + esc(T.namn(r.medlem_id) || 'Okänd') + '</span>' +
          '<span class="muted small">' + esc(U.kortDag(U.isoDag(new Date(r.start)))) + ' · ' + hhmm(r.start) + '–' + (r.slut ? hhmm(r.slut) : 'pågår') + '</span>' +
          '<span class="tid-langd"' + (r.slut ? '' : ' data-pagar-langd="' + esc(r.id) + '"') + '>' + esc(langd(minuter(r))) + '</span>' +
          (egen && r.slut ? '<button type="button" class="icon-btn" data-tid-radera="' + esc(r.id) + '" aria-label="Ta bort tid ' + hhmm(r.start) + '">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>' : '') +
          '</li>';
      }).join('') + '</ul>' : '') +
      '<details class="tid-manuell"><summary>Lägg till tid i efterhand</summary>' +
        '<div class="grid2"><div class="field"><label for="tid-fran">Från</label><input id="tid-fran" type="time"></div>' +
        '<div class="field"><label for="tid-till">Till</label><input id="tid-till" type="time"></div></div>' +
        '<div class="field"><label for="tid-datum">Datum</label><input id="tid-datum" type="date" value="' + esc(aktuellt.uppdrag.datum) + '"></div>' +
        '<p class="msg" id="tid-msg" role="status" aria-live="polite"></p>' +
        '<button type="button" class="btn ghost" data-tid-lagg-till>Lägg till</button>' +
      '</details>';
  }

  async function laggTill() {
    const jag = T.state.jag;
    const fran = $('tid-fran').value, till = $('tid-till').value, datum = $('tid-datum').value;
    const msg = (t) => { $('tid-msg').textContent = t; $('tid-msg').className = 'msg error'; };
    if (!fran || !till || !datum) { msg('Fyll i från, till och datum.'); return; }
    const start = new Date(datum + 'T' + fran);
    const slut = new Date(datum + 'T' + till);
    if (slut <= start) { msg('Till måste vara senare än från.'); return; }
    const row = { id: U.uuid(), team_id: aktuellt.uppdrag.team_id, uppdrag_id: aktuellt.uppdrag.id, medlem_id: jag.id, start: start.toISOString(), slut: slut.toISOString() };
    rader.push(row);
    rader.sort((a, b) => a.start.localeCompare(b.start));
    render();
    await spara(row);
    U.toast('Tiden är tillagd: ' + langd(minuter(row)), 'ok', 2500);
  }

  async function taBort(btn) {
    if (!btn.classList.contains('confirm')) { btn.classList.add('confirm'); btn.textContent = 'Ta bort?'; btn.setAttribute('aria-label', 'Bekräfta: ta bort tiden'); return; }
    const id = btn.getAttribute('data-tid-radera');
    rader = rader.filter((r) => r.id !== id);
    if (aktuellt) U.store.setJson(CACHE + aktuellt.uppdrag.id, U.store.json(CACHE + aktuellt.uppdrag.id, []).filter((r) => r.id !== id));
    render();
    await spara({ id }, 'tid-delete');
    U.toast('Tiden är borttagen', 'ok', 2000);
  }

  function klick(e) {
    if (e.target.closest('[data-tid-starta]') && aktuellt) { starta(aktuellt.uppdrag); return; }
    if (e.target.closest('[data-tid-stoppa]')) { stoppa(); return; }
    if (e.target.closest('[data-tid-lagg-till]')) { laggTill(); return; }
    const del = e.target.closest('[data-tid-radera]');
    if (del) taBort(del);
  }

  function lamna() { aktuellt = null; clearInterval(ticker); }

  // ---------- Veckorapport ----------
  async function visaRapport() {
    const team = T.state.team;
    const slutVecka = U.plusDagar(veckaStart, 7);
    $('tid-vecka').textContent = 'Vecka ' + veckonummer(veckaStart);
    $('tid-period').textContent = U.kortDag(veckaStart) + ' – ' + U.kortDag(U.plusDagar(veckaStart, 6));
    $('tid-rapport').innerHTML = '<p class="muted">Hämtar…</p>';
    let tider = [];
    try {
      const { data, error } = await sb.from('elkoll_tid').select('*').eq('team_id', team.id)
        .gte('start', new Date(veckaStart + 'T00:00').toISOString()).lt('start', new Date(slutVecka + 'T00:00').toISOString()).order('start');
      if (error) throw error;
      tider = data || [];
    } catch (e) {
      $('tid-rapport').innerHTML = '<p class="msg error">' + (U.isNetworkError(e) ? 'Tidrapporten kräver täckning.' : 'Kunde inte hämta tider: ' + esc(e.message || '')) + '</p>';
      return;
    }
    const uppdrag = new Map(window.ElkollUppdrag.lista.map((u) => [u.id, u]));
    const perPerson = new Map();
    tider.forEach((r) => {
      const k = r.medlem_id || 'okand';
      if (!perPerson.has(k)) perPerson.set(k, []);
      perPerson.get(k).push(r);
    });
    if (!perPerson.size) { $('tid-rapport').innerHTML = '<div class="empty"><p><strong>Ingen tid rapporterad den här veckan.</strong></p></div>'; return; }
    const personer = [...perPerson.entries()].sort((a, b) => (T.namn(a[0]) || '').localeCompare(T.namn(b[0]) || '', 'sv'));
    $('tid-rapport').innerHTML = personer.map(([medlem, lista]) => {
      const summa = lista.reduce((s, r) => s + minuter(r), 0);
      const dagar = new Map();
      lista.forEach((r) => { const d = U.isoDag(new Date(r.start)); if (!dagar.has(d)) dagar.set(d, []); dagar.get(d).push(r); });
      return '<section class="card tid-person"><div class="row-between"><h2>' + esc(T.namn(medlem) || 'Borttagen medlem') + '</h2><span class="tid-totalt">' + esc(langd(summa)) + '</span></div>' +
        [...dagar.entries()].map(([d, rs]) =>
          '<div class="tid-dag"><div class="row-between"><strong>' + esc(U.kortDag(d)) + '</strong><span>' + esc(langd(rs.reduce((s, r) => s + minuter(r), 0))) + '</span></div>' +
          rs.map((r) => {
            const u = uppdrag.get(r.uppdrag_id);
            return '<a class="tid-rad" href="#uppdrag/' + encodeURIComponent(r.uppdrag_id) + '"><span>' + hhmm(r.start) + '–' + (r.slut ? hhmm(r.slut) : 'pågår') + '</span>' +
              '<span class="tid-rad-text">' + esc(u ? u.uppgift + ' · ' + u.adress : 'Uppdrag') + '</span><span>' + esc(langd(minuter(r))) + '</span></a>';
          }).join('') + '</div>').join('') +
        '</section>';
    }).join('');
  }

  return { setup, setUser, visa, lamna, starta, stoppa, pagarId, laddaPagaende, visaRapport };
})();
