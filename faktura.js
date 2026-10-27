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
    document.querySelectorAll('#fak-export [data-period]').forEach((b) => b.addEventListener('click', () => satPeriod(b.getAttribute('data-period'))));
    $('btn-exportera').addEventListener('click', exportera);
    satPeriod('manad');
  }

  // ---------- Export till CSV ----------
  function satPeriod(p) {
    const idag = U.isoDag();
    const forsta = idag.slice(0, 8) + '01';
    let fran = forsta, till = idag;
    if (p === 'forra') {
      const [y, m] = forsta.split('-').map(Number);
      const d = new Date(y, m - 2, 1, 12);
      fran = U.isoDag(d);
      till = U.plusDagar(forsta, -1);
    }
    $('exp-fran').value = fran;
    $('exp-till').value = till;
    document.querySelectorAll('#fak-export [data-period]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-period') === p)));
  }

  // Svensk Excel: semikolon som avgränsare, decimalkomma och BOM så att å/ä/ö blir rätt
  const cell = (v) => {
    const s = String(v == null ? '' : v);
    return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const timmar = (min) => (min / 60).toFixed(2).replace('.', ',');

  async function exportera() {
    const fran = $('exp-fran').value, till = $('exp-till').value;
    const baraEj = $('exp-bara-ej').checked;
    const msg = (t, k) => { $('exp-msg').textContent = t; $('exp-msg').className = 'msg' + (k ? ' ' + k : ''); };
    if (!fran || !till || till < fran) { msg('Välj en period där Till är samma dag eller senare än Från.', 'error'); return; }
    if (!navigator.onLine) { msg('Exporten kräver täckning.', 'error'); return; }
    const team = T.state.team;
    const btn = $('btn-exportera');
    btn.disabled = true;
    msg('Hämtar…');
    try {
      const ures = await sb.from('elkoll_uppdrag').select('*').eq('team_id', team.id).eq('status', 'klar')
        .gte('datum', fran).lte('datum', till).order('datum');
      if (ures.error) throw ures.error;
      let rader = (ures.data || []).filter((r) => !baraEj || (r.debiteras !== false && !r.fakturerad_at));
      if (!rader.length) { msg('Inga klara uppdrag i perioden.', 'error'); return; }
      const tres = await sb.from('elkoll_tid').select('uppdrag_id, medlem_id, start, slut').eq('team_id', team.id).in('uppdrag_id', rader.map((r) => r.id));
      if (tres.error) throw tres.error;
      const allaTider = tres.data || [];

      const personer = T.state.medlemmar.slice();
      // Tid från borttagna medlemmar samlas i egen kolumn
      const okand = allaTider.some((t) => !personer.some((p) => p.id === t.medlem_id));
      const rubrik = ['Datum', 'Kund', 'Adress', 'Uppdrag', 'Fakturastatus', 'Timmar totalt']
        .concat(personer.map((p) => 'Timmar ' + p.namn)).concat(okand ? ['Timmar övriga'] : [])
        .concat(['Material', 'Anteckning', 'Fakturerad', 'Uppdrags-id']);
      const linjer = [rubrik.map(cell).join(';')];
      let totalMin = 0;
      rader.forEach((r) => {
        const tider = allaTider.filter((t) => t.uppdrag_id === r.id);
        const per = (id) => tider.filter((t) => t.medlem_id === id).reduce((s, t) => s + minuter(t), 0);
        const summa = tider.reduce((s, t) => s + minuter(t), 0);
        totalMin += summa;
        const status = r.debiteras === false ? 'Debiteras inte' : r.fakturerad_at ? 'Fakturerad' : 'Att fakturera';
        const kol = [r.datum, r.kund || '', r.adress, r.uppgift, status, timmar(summa)]
          .concat(personer.map((p) => { const m = per(p.id); return m ? timmar(m) : ''; }))
          .concat(okand ? [timmar(tider.filter((t) => !personer.some((p) => p.id === t.medlem_id)).reduce((s, t) => s + minuter(t), 0))] : [])
          .concat([(r.material || []).join(', '), r.kommentar || '', r.fakturerad_at ? U.isoDag(new Date(r.fakturerad_at)) : '', r.id]);
        linjer.push(kol.map(cell).join(';'));
      });
      const csv = '\ufeff' + linjer.join('\r\n') + '\r\n';
      const namn = 'elkoll-underlag-' + fran + '_' + till + '.csv';
      await dela(csv, namn);
      msg(rader.length + (rader.length === 1 ? ' uppdrag' : ' uppdrag') + ', ' + langd(totalMin) + ' exporterade.', 'ok');
    } catch (e) {
      msg(U.isNetworkError(e) ? 'Ingen kontakt med servern. Försök igen.' : 'Exporten misslyckades: ' + (e.message || 'okänt fel'), 'error');
    } finally {
      btn.disabled = false;
    }
  }

  // Dela-menyn på telefonen (Mail, Filer, AirDrop), annars nedladdning
  async function dela(text, namn) {
    const fil = new File([text], namn, { type: 'text/csv' });
    if (navigator.canShare && navigator.canShare({ files: [fil] })) {
      try {
        await navigator.share({ files: [fil], title: namn });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;   // användaren stängde Dela-menyn
      }
    }
    const url = URL.createObjectURL(fil);
    const a = document.createElement('a');
    a.href = url;
    a.download = namn;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
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
