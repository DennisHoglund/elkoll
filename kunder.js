// Kundregister med autofyll: kunder och adresser från teamets tidigare uppdrag föreslås
// när man skriver i Kund eller Adress. Ett tryck fyller i adress, kund, telefon och portkod.
window.ElkollKunder = (function () {
  'use strict';

  const U = window.ElkollUtil;
  const { $, esc } = U;
  const CACHE = 'elkoll-kunder-';
  const MAX = 5;

  let sb = null;
  let kunder = [];
  let hamtat = '';

  const gata = (a) => String(a || '').split(',')[0].replace(/\s+/g, ' ').trim();

  function setup(client) {
    sb = client;
    koppla('u-kund', 'forslag-kund');
    koppla('u-adress', 'forslag-adress');
  }

  // En kund per namn + gata, senaste uppgifterna vinner
  function bygg(rader) {
    const map = new Map();
    rader.slice().sort((a, b) => String(b.datum).localeCompare(String(a.datum))).forEach((r) => {
      if (!r.adress && !r.kund) return;
      const nyckel = String(r.kund || '').trim().toLowerCase() + '|' + gata(r.adress).toLowerCase().replace(/\s/g, '');
      const k = map.get(nyckel);
      if (!k) map.set(nyckel, { kund: r.kund || '', adress: r.adress || '', telefon: r.telefon || '', portkod: r.portkod || '', antal: 1, senast: r.datum });
      else {
        k.antal++;
        if (!k.telefon && r.telefon) k.telefon = r.telefon;
        if (!k.portkod && r.portkod) k.portkod = r.portkod;
      }
    });
    return [...map.values()];
  }

  // Hämtar teamets historik (en gång per team och session) med cache för användning utan täckning
  async function ladda(team, lokala) {
    if (!team) return;
    const cache = U.store.json(CACHE + team.id, []);
    kunder = bygg(cache.concat(lokala || []));
    if (hamtat === team.id || !navigator.onLine) return;
    try {
      const { data, error } = await sb.from('elkoll_uppdrag')
        .select('kund, adress, telefon, portkod, datum')
        .eq('team_id', team.id).order('datum', { ascending: false }).limit(1000);
      if (error || !data) return;
      hamtat = team.id;
      U.store.setJson(CACHE + team.id, data);
      kunder = bygg(data.concat(lokala || []));
    } catch (e) { /* cachen räcker */ }
  }

  function sok(text) {
    const q = String(text || '').trim().toLowerCase();
    if (q.length < 2) return [];
    const ord = q.split(/\s+/);
    return kunder
      .filter((k) => { const hay = (k.kund + ' ' + k.adress).toLowerCase(); return ord.every((o) => hay.includes(o)); })
      .sort((a, b) => (b.antal - a.antal) || String(b.senast).localeCompare(String(a.senast)))
      .slice(0, MAX);
  }

  function koppla(inputId, listId) {
    const input = $(inputId);
    const lista = $(listId);
    if (!input || !lista) return;
    let traffar = [];
    const visa = () => {
      traffar = sok(input.value);
      // Visa inte förslaget om det är exakt det som redan står
      if (traffar.length === 1 && [traffar[0].kund, traffar[0].adress].includes(input.value.trim())) traffar = [];
      lista.hidden = !traffar.length;
      input.setAttribute('aria-expanded', String(!!traffar.length));
      lista.innerHTML = traffar.map((k, i) =>
        '<li role="option"><button type="button" data-kund-forslag="' + i + '">' +
        '<strong>' + esc(k.kund || k.adress) + '</strong>' +
        '<span>' + esc([k.kund ? k.adress : '', k.telefon].filter(Boolean).join(' · ')) + '</span>' +
        (k.antal > 1 ? '<span class="forslag-antal">' + k.antal + ' besök</span>' : '') +
        '</button></li>').join('');
      if (traffar.length) lista.scrollIntoView({ block: 'nearest' });
    };
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-expanded', 'false');
    input.addEventListener('input', visa);
    input.addEventListener('focus', visa);
    input.addEventListener('blur', () => setTimeout(() => { lista.hidden = true; input.setAttribute('aria-expanded', 'false'); }, 150));
    // pointerdown i stället för click: annars hinner fältet tappa fokus och listan stängas på iPhone
    lista.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-kund-forslag]');
      if (!b) return;
      e.preventDefault();
      fyll(traffar[Number(b.getAttribute('data-kund-forslag'))]);
      lista.hidden = true;
      input.setAttribute('aria-expanded', 'false');
    });
    lista.addEventListener('click', (e) => {
      const b = e.target.closest('[data-kund-forslag]');
      if (!b || lista.hidden) return;
      fyll(traffar[Number(b.getAttribute('data-kund-forslag'))]);
      lista.hidden = true;
    });
  }

  function fyll(k) {
    if (!k) return;
    $('u-adress').value = k.adress;
    $('u-kund').value = k.kund;
    if (k.telefon) $('u-telefon').value = k.telefon;
    if (k.portkod) $('u-portkod').value = k.portkod;
    ['u-adress', 'u-kund', 'u-telefon', 'u-portkod'].forEach((id) => $(id).dispatchEvent(new Event('input')));
    $('forslag-kund').hidden = true;
    $('forslag-adress').hidden = true;
    U.toast('Ifyllt från tidigare uppdrag', 'ok', 1800);
  }

  return { setup, ladda, sok };
})();
