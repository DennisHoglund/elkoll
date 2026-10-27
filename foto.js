// Dokumentation på plats: foton före/efter per uppdrag.
// Foton krymps till ≤ 250 kB JPEG, sparas först i telefonen (IndexedDB som ArrayBuffer)
// och laddas sedan upp till den privata bucketen elkoll-foton under <team>/<uppdrag>/<foto>.jpg.
window.ElkollFoto = (function () {
  'use strict';

  const U = window.ElkollUtil;
  const { esc } = U;
  const BUCKET = 'elkoll-foton';
  const MAX_SIDE = 1280;
  const MAL_KB = 250;
  const CACHE = 'elkoll-foton-cache-';

  let sb = null;
  let userId = null;
  let synka = async () => {};
  let aktuellt = null;          // { uppdrag, el }
  let rader = [];               // foton för aktuellt uppdrag (server + köade)
  const urls = new Map();       // path -> signerad URL eller blob-URL

  function setup(client, opts) {
    sb = client;
    synka = opts.synka;
    document.addEventListener('click', klick);
  }
  function setUser(id) { userId = id; }

  // ---------- Krympa ----------
  // Avkoda bilden: createImageBitmap med rätt orientering, utan alternativ, och sist <img> (klarar HEIC i Safari)
  async function decode(file) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* prova nästa */ }
    try { return await createImageBitmap(file); } catch (e) { /* prova nästa */ }
    {
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        await img.decode();
        return img;
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
  }
  function toJpeg(src, side, quality) {
    const sw = src.naturalWidth || src.width;
    const sh = src.naturalHeight || src.height;
    const scale = Math.min(1, side / Math.max(sw, sh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    canvas.getContext('2d').drawImage(src, 0, 0, canvas.width, canvas.height);
    return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', quality));
  }
  async function shrink(file) {
    const src = await decode(file);
    const steg = [[MAX_SIDE, 0.72], [MAX_SIDE, 0.6], [1024, 0.6], [900, 0.55], [800, 0.5]];
    let blob = null;
    for (const [side, q] of steg) {
      blob = await toJpeg(src, side, q);
      if (blob.size <= MAL_KB * 1024) break;
    }
    if (src.close) src.close();
    return blob;
  }

  // ---------- Visa ----------
  async function visa(uppdrag, el) {
    if (!aktuellt || aktuellt.el !== el) senastHtml = '';
    aktuellt = { uppdrag, el };
    rader = U.store.json(CACHE + uppdrag.id, []);
    await slaIhop();
    render();
    if (!navigator.onLine) return;
    try {
      const res = await sb.from('elkoll_foto').select('id, uppdrag_id, team_id, typ, path, created_at').eq('uppdrag_id', uppdrag.id).order('created_at');
      if (res.error) throw res.error;
      if (!aktuellt || aktuellt.uppdrag.id !== uppdrag.id) return;
      U.store.setJson(CACHE + uppdrag.id, res.data || []);
      rader = res.data || [];
      await slaIhop();
      await signera();
      render();
    } catch (e) { /* visar det som finns lokalt */ }
  }

  // Lägg till köade foton och ta bort köade borttagningar
  async function slaIhop() {
    if (!aktuellt || !userId) return;
    const ko = await window.ElkollKo.forUser(userId).catch(() => []);
    const bort = new Set(ko.filter((i) => i.op === 'foto-delete').map((i) => i.id));
    const nya = ko.filter((i) => i.op === 'foto' && i.row.uppdrag_id === aktuellt.uppdrag.id);
    rader = rader.filter((r) => !bort.has(r.id) && !nya.some((n) => n.id === r.id));
    for (const n of nya) {
      if (!urls.has(n.row.path) && n.data) urls.set(n.row.path, URL.createObjectURL(new Blob([n.data], { type: 'image/jpeg' })));
      rader.push(Object.assign({}, n.row, { _vantar: true }));
    }
  }

  async function signera() {
    const saknas = rader.filter((r) => !r._vantar && !urls.has(r.path)).map((r) => r.path);
    if (!saknas.length) return;
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(saknas, 3600);
    if (error || !data) return;
    data.forEach((d) => { if (d.signedUrl) urls.set(d.path, d.signedUrl); });
  }

  function grupp(typ, rubrik) {
    const lista = rader.filter((r) => r.typ === typ);
    return '<div class="foto-grupp"><h3>' + rubrik + (lista.length ? ' <span class="muted">(' + lista.length + ')</span>' : '') + '</h3>' +
      '<div class="foto-grid">' +
      lista.map((r) => {
        const url = urls.get(r.path);
        return '<button type="button" class="foto" data-foto="' + esc(r.id) + '" aria-label="Visa foto ' + rubrik.toLowerCase() + '">' +
          (url ? '<img src="' + esc(url) + '" alt="">' : '<span class="foto-tom">Foto</span>') +
          (r._vantar ? '<span class="foto-vantar">Väntar</span>' : '') + '</button>';
      }).join('') +
      '<label class="foto-ny"><input type="file" accept="image/*" class="file-input" data-foto-typ="' + typ + '" aria-label="Ta foto ' + rubrik.toLowerCase() + '">' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' +
      '<span>Ta foto</span></label>' +
      '</div></div>';
  }

  // Ritar bara om när innehållet ändrats. Lyssnaren sitter direkt på varje filfält, så att ett foto
  // inte tappas om listan ändå ritas om medan kameran är öppen (då kopplas fältet loss från sidan).
  let senastHtml = '';
  function render() {
    if (!aktuellt || !aktuellt.el.isConnected) return;
    const html = grupp('fore', 'Före') + grupp('efter', 'Efter');
    if (html === senastHtml && aktuellt.el.innerHTML) return;
    senastHtml = html;
    aktuellt.el.innerHTML = html;
    aktuellt.el.querySelectorAll('input[data-foto-typ]').forEach((input) => input.addEventListener('change', () => onFil(input)));
  }

  // ---------- Lägga till ----------
  async function onFil(input) {
    const file = input.files && input.files[0];
    const typ = input.getAttribute('data-foto-typ');
    input.value = '';
    if (!file || !aktuellt) return;
    const u = aktuellt.uppdrag;
    const el = aktuellt.el;
    U.toast('Förbereder foto…', 'ok', 1500);
    let blob;
    try { blob = await shrink(file); } catch (e) {
      // Ladda aldrig upp originalet – be om ett annat foto i stället
      U.toast('Kunde inte läsa fotot – prova ett annat', 'error', 4000);
      return;
    }
    const id = U.uuid();
    const row = { id, uppdrag_id: u.id, team_id: u.team_id, typ, path: u.team_id + '/' + u.id + '/' + id + '.jpg' };
    const data = await blob.arrayBuffer();   // ArrayBuffer – Safari klarar inte Blob i IndexedDB överallt
    await window.ElkollKo.put({ id, userId, op: 'foto', row, data, created: Date.now() });
    urls.set(row.path, URL.createObjectURL(blob));
    if (aktuellt && aktuellt.uppdrag.id === u.id) { rader.push(Object.assign({}, row, { _vantar: true })); render(); }
    const res = await synka();
    if (res && res.left) U.toast('Fotot är sparat i telefonen – laddas upp när du har täckning', 'ok', 3500);
    else {
      U.toast('Fotot är sparat', 'ok', 2000);
      if (aktuellt && aktuellt.uppdrag.id === u.id) await visa(u, aktuellt.el.isConnected ? aktuellt.el : el);
    }
  }

  // ---------- Visa stort / ta bort ----------
  function klick(e) {
    const t = e.target.closest('[data-foto]');
    if (t) { oppna(t.getAttribute('data-foto')); return; }
    if (e.target.closest('[data-foto-stang]') || e.target.id === 'foto-visning') { stang(); return; }
    const del = e.target.closest('[data-foto-radera]');
    if (del) taBort(del);
  }

  function oppna(id) {
    const r = rader.find((x) => x.id === id);
    if (!r) return;
    stang();
    const div = document.createElement('div');
    div.id = 'foto-visning';
    div.className = 'foto-visning';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-label', 'Foto');
    div.innerHTML = (urls.get(r.path) ? '<img src="' + esc(urls.get(r.path)) + '" alt="Foto ' + (r.typ === 'fore' ? 'före' : 'efter') + '">' : '<p>Fotot visas när du har täckning.</p>') +
      '<div class="foto-knappar">' +
      '<button type="button" class="btn ghost" data-foto-radera="' + esc(r.id) + '">Ta bort foto</button>' +
      '<button type="button" class="btn primary" data-foto-stang>Stäng</button></div>';
    document.body.appendChild(div);
  }
  function stang() { const d = document.getElementById('foto-visning'); if (d) d.remove(); }

  async function taBort(btn) {
    if (!btn.classList.contains('confirm')) {
      btn.classList.add('confirm');
      btn.textContent = 'Tryck igen för att ta bort';
      return;
    }
    const id = btn.getAttribute('data-foto-radera');
    const r = rader.find((x) => x.id === id);
    stang();
    if (!r) return;
    await window.ElkollKo.put({ id, userId, op: 'foto-delete', row: { id, path: r.path }, created: Date.now() });
    rader = rader.filter((x) => x.id !== id);
    if (aktuellt) U.store.setJson(CACHE + aktuellt.uppdrag.id, rader.filter((x) => !x._vantar));
    render();
    await synka();
    U.toast('Fotot är borttaget', 'ok', 2000);
  }

  // Köa borttagning av alla foton på ett uppdrag (när uppdraget tas bort)
  async function taBortAlla(uppdragId) {
    const lista = U.store.json(CACHE + uppdragId, []).concat(rader.filter((r) => r.uppdrag_id === uppdragId));
    const set = new Map(lista.map((r) => [r.id, r]));
    for (const r of set.values()) await window.ElkollKo.put({ id: r.id, userId, op: 'foto-delete', row: { id: r.id, path: r.path }, created: Date.now() });
    U.store.del(CACHE + uppdragId);
  }

  function lamna() { aktuellt = null; stang(); }

  return { setup, setUser, visa, lamna, taBortAlla, BUCKET };
})();
