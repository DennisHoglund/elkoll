// Fakturering: klara uppdrag som ska faktureras, grupperade per kund med tid per person och material.
// Elkoll gör inga fakturor – det här är underlaget, och "Markera fakturerad" gör att inget glöms eller dubbleras.
window.ElkollFaktura = (function () {
  'use strict';

  const U = window.ElkollUtil;
  const T = window.ElkollTeam;
  const { $, esc } = U;
  const FLIK_KEY = 'elkoll-faktura-flik';

  let sb = null;
  let flik = U.store.get(FLIK_KEY) === 'fakturerade' ? 'fakturerade' : 'att';
  let uppdrag = [];
  let tider = [];

  function setup(client) {
    sb = client;
    $('fak-att').addEventListener('click', () => satFlik('att'));
    $('fak-klara').addEventListener('click', () => satFlik('fakturerade'));
    $('fak-lista').addEventListener('click', klick);
  }

  function satFlik(f) {
    flik = f;
    U.store.set(FLIK_KEY, f);
    render();
  }

  const minuter = (r) => r.slut ? Math.max(0, Math.round((new Date(r.slut) - new Date(r.start)) / 60000)) : 0;
  function langd(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return h ? h + ' h' + (m ? ' ' + m + ' min' : '') : m + ' min';
  }
  const attFakturera = (r) => r.status === 'klar' && r.debiteras !== false && !r.fakturerad_at;
  const fakturerad = (r) => !!r.fakturerad_at;
  const dag = (iso) => U.kortDag(U.isoDag(new Date(iso)));

  async function visa() {
    const team = T.state.team;
    $('fak-lista').innerHTML = '<p class="muted">Hämtar…</p>';
    let server = [];
    try {
      const res = await sb.from('elkoll_uppdrag').select('*').eq('team_id', team.id).eq('status', 'klar').order('datum', { ascending: false }).limit(500);
      if (res.error) throw res.error;
      server = res.data || [];
    } catch (e) {
      if (!U.isNetworkError(e)) { $('fak-lista').innerHTML = '<p class="msg error">Kunde inte hämta uppdrag: ' + esc(e.message || '') + '</p>'; return; }
    }
    // Lokala ändringar (t.ex. nyss markerad som fakturerad utan täckning) går före serverns
    const lokala = new Map(window.ElkollUppdrag.lista.map((r) => [r.id, r]));
    uppdrag = server.map((r) => lokala.get(r.id) || r)
      .concat([...lokala.values()].filter((r) => r.status === 'klar' && !server.some((s) => s.id === r.id)));
    tider = [];
    const ids = uppdrag.map((r) => r.id);
    if (ids.length && navigator.onLine) {
      try {
        const res = await sb.from('elkoll_tid').select('uppdrag_id, medlem_id, start, slut').eq('team_id', team.id).in('uppdrag_id', ids);
        if (!res.error) tider = res.data || [];
      } catch (e) { /* utan tider */ }
    }
    render();
  }

  function tidFor(id) {
    const perPerson = new Map();
    tider.filter((t) => t.uppdrag_id === id).forEach((t) => perPerson.set(t.medlem_id, (perPerson.get(t.medlem_id) || 0) + minuter(t)));
    const summa = [...perPerson.values()].reduce((s, m) => s + m, 0);
    return { summa, perPerson };
  }

  function render() {
    const att = uppdrag.filter(attFakturera);
    const klara = uppdrag.filter(fakturerad).sort((a, b) => String(b.fakturerad_at).localeCompare(String(a.fakturerad_at)));
    $('fak-att').textContent = 'Att fakturera (' + att.length + ')';
    $('fak-klara').textContent = 'Fakturerade';
    $('fak-att').setAttribute('aria-pressed', String(flik === 'att'));
    $('fak-klara').setAttribute('aria-pressed', String(flik === 'fakturerade'));
    const lista = flik === 'att' ? att : klara;
    if (!lista.length) {
      $('fak-lista').innerHTML = '<div class="empty"><p><strong>' + (flik === 'att' ? 'Inget att fakturera just nu.' : 'Inga fakturerade uppdrag än.') + '</strong></p>' +
        (flik === 'att' ? '<p class="muted">Uppdrag hamnar här när de markeras som Klar.</p>' : '') + '</div>';
      return;
    }
    // Gruppera per kund (namn, annars adress)
    const grupper = new Map();
    lista.forEach((r) => {
      const k = (r.kund || r.adress || 'Okänd kund').trim();
      if (!grupper.has(k)) grupper.set(k, []);
      grupper.get(k).push(r);
    });
    $('fak-lista').innerHTML = [...grupper.entries()].map(([kund, rs]) => {
      const total = rs.reduce((s, r) => s + tidFor(r.id).summa, 0);
      return '<section class="card fak-kund"><div class="row-between"><h2>' + esc(kund) + '</h2>' +
        (total ? '<span class="tid-totalt">' + esc(langd(total)) + '</span>' : '') + '</div>' +
        rs.map((r) => {
          const t = tidFor(r.id);
          const personer = [...t.perPerson.entries()].map(([m, min]) => (T.namn(m) || 'Okänd').split(' ')[0] + ' ' + langd(min)).join(', ');
          return '<div class="fak-uppdrag">' +
            '<strong>' + esc(r.uppgift) + '</strong>' +
            '<span class="muted small">' + esc(r.adress) + ' · ' + esc(U.kortDag(r.datum)) + '</span>' +
            '<span class="fak-tid">' + (t.summa ? esc(langd(t.summa)) + ' (' + esc(personer) + ')' : 'Ingen tid rapporterad') + '</span>' +
            (r.material && r.material.length ? '<span class="small">Material: ' + esc(r.material.join(', ')) + '</span>' : '') +
            (r.kommentar ? '<span class="small muted fak-not">' + esc(r.kommentar) + '</span>' : '') +
            (r.fakturerad_at ? '<span class="chip klar">Fakturerad ' + esc(dag(r.fakturerad_at)) + '</span>' : '') +
            '<div class="grid2">' +
              '<a class="btn ghost" href="#uppdrag/' + encodeURIComponent(r.id) + '">Öppna</a>' +
              (r.fakturerad_at
                ? '<button type="button" class="btn ghost" data-fak-angra="' + esc(r.id) + '">Ångra</button>'
                : '<button type="button" class="btn primary" data-fak-markera="' + esc(r.id) + '">Markera fakturerad</button>') +
            '</div></div>';
        }).join('') + '</section>';
    }).join('');
  }

  async function klick(e) {
    const m = e.target.closest('[data-fak-markera]');
    const a = e.target.closest('[data-fak-angra]');
    const id = m ? m.getAttribute('data-fak-markera') : a ? a.getAttribute('data-fak-angra') : null;
    if (!id) return;
    const r = uppdrag.find((x) => x.id === id);
    if (!r) return;
    const row = Object.assign({}, r, { fakturerad_at: m ? new Date().toISOString() : null, updated_at: new Date().toISOString() });
    delete row._vantar;
    const i = uppdrag.findIndex((x) => x.id === id);
    uppdrag[i] = row;
    render();
    await window.ElkollUppdrag.sparaUppdrag(row, true);
    U.toast(m ? 'Markerad som fakturerad' : 'Flyttad tillbaka till Att fakturera', 'ok', 2500);
  }

  return { setup, visa };
})();
