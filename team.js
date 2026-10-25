// Teamet: företaget och dess medlemmar (namn, mobil, e-post).
// Medlemskap avgörs av e-posten i inloggningen – se supabase/schema.sql.
window.ElkollTeam = (function () {
  'use strict';

  const U = window.ElkollUtil;
  const { $, esc } = U;
  const CACHE = 'elkoll-team-cache';

  let sb = null;
  let email = '';
  let onChange = () => {};
  const state = { team: null, medlemmar: [], jag: null };

  const IKON_RING = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';
  const IKON_SOPOR = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>';

  function setup(client, changeFn) {
    sb = client;
    onChange = changeFn || onChange;
    $('form-team').addEventListener('submit', skapaTeam);
    $('form-medlem').addEventListener('submit', laggTill);
    $('medlemmar').addEventListener('click', klickMedlem);
  }

  function satt(team, medlemmar) {
    state.team = team;
    state.medlemmar = (medlemmar || []).slice().sort((a, b) => a.namn.localeCompare(b.namn, 'sv'));
    state.jag = state.medlemmar.find((m) => m.epost === email) || null;
  }

  // Hämtar teamet. Returnerar { ok, offline, error }.
  async function load(userEmail) {
    email = (userEmail || '').toLowerCase();
    try {
      const mRes = await sb.from('elkoll_medlem').select('id, team_id, namn, telefon, epost').order('namn');
      if (mRes.error) throw mRes.error;
      const egen = (mRes.data || []).find((m) => m.epost === email);
      if (!egen) { satt(null, []); U.store.del(CACHE); return { ok: true }; }
      const tRes = await sb.from('elkoll_team').select('id, namn').eq('id', egen.team_id).maybeSingle();
      if (tRes.error) throw tRes.error;
      const medlemmar = mRes.data.filter((m) => m.team_id === egen.team_id);
      satt(tRes.data || { id: egen.team_id, namn: '' }, medlemmar);
      U.store.setJson(CACHE, { email, team: state.team, medlemmar });
      render();
      return { ok: true };
    } catch (error) {
      const c = U.store.json(CACHE, null);
      if (c && c.email === email) { satt(c.team, c.medlemmar); render(); }
      return { ok: false, offline: U.isNetworkError(error), error };
    }
  }

  function render() {
    $('team-namn-visning').textContent = state.team ? state.team.namn : '';
    $('medlemmar').innerHTML = state.medlemmar.map((m) => {
      const jag = state.jag && m.id === state.jag.id;
      const tel = U.telLank(m.telefon);
      return '<li class="member" data-id="' + esc(m.id) + '">' +
        '<span class="avatar ' + (jag ? '' : 'light') + '" aria-hidden="true">' + esc(U.initialer(m.namn)) + '</span>' +
        '<span class="member-text"><strong>' + esc(m.namn) + (jag ? ' (du)' : '') + '</strong>' +
        '<span class="muted small">' + esc(m.telefon || 'Inget nummer') + '</span>' +
        '<span class="muted small">' + esc(m.epost) + '</span></span>' +
        (tel && !jag ? '<a class="icon-btn dark" href="tel:' + esc(tel) + '" aria-label="Ring ' + esc(m.namn) + '">' + IKON_RING + '</a>' : '') +
        (jag ? '' : '<button class="icon-btn" type="button" data-ta-bort="' + esc(m.id) + '" aria-label="Ta bort ' + esc(m.namn) + '">' + IKON_SOPOR + '</button>') +
        '</li>';
    }).join('');
    const av = $('btn-team');
    if (av) av.textContent = state.jag ? U.initialer(state.jag.namn) : '?';
  }

  function msg(id, text, kind) {
    const el = $(id);
    el.textContent = text || '';
    el.className = 'msg' + (kind ? ' ' + kind : '');
  }

  function felText(error) {
    if (U.isNetworkError(error)) return 'Ingen täckning. Försök igen när du har nät.';
    if (error && error.code === '23505') return 'Den e-posten finns redan i teamet.';
    if (error && (error.code === '42P01' || /does not exist/i.test(error.message || ''))) return 'Tabellerna saknas – kör supabase/schema.sql.';
    return 'Något gick fel: ' + ((error && error.message) || 'okänt fel');
  }

  async function skapaTeam(e) {
    e.preventDefault();
    const namn = $('team-namn').value.trim();
    const mittNamn = $('team-mitt-namn').value.trim();
    const tel = $('team-mitt-tel').value.trim();
    if (!namn) { msg('team-msg', 'Skriv företagets namn.', 'error'); return; }
    if (!mittNamn) { msg('team-msg', 'Skriv ditt namn.', 'error'); return; }
    msg('team-msg', 'Skapar…');
    const id = U.uuid();
    const t = await sb.from('elkoll_team').insert({ id, namn });
    if (t.error) { msg('team-msg', felText(t.error), 'error'); return; }
    const m = await sb.from('elkoll_medlem').insert({ team_id: id, namn: mittNamn, telefon: tel || null, epost: email });
    if (m.error) { msg('team-msg', felText(m.error), 'error'); return; }
    msg('team-msg', '');
    await load(email);
    onChange();
  }

  async function laggTill(e) {
    e.preventDefault();
    const namn = $('m-namn').value.trim();
    const telefon = $('m-tel').value.trim();
    const epost = $('m-epost').value.trim().toLowerCase();
    if (!namn) { msg('medlem-msg', 'Skriv kollegans namn.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost)) { msg('medlem-msg', 'Ange en giltig e-postadress.', 'error'); return; }
    if (state.medlemmar.some((m) => m.epost === epost)) { msg('medlem-msg', 'Den e-posten finns redan i teamet.', 'error'); return; }
    msg('medlem-msg', 'Lägger till…');
    const { error } = await sb.from('elkoll_medlem').insert({ team_id: state.team.id, namn, telefon: telefon || null, epost });
    if (error) { msg('medlem-msg', felText(error), 'error'); return; }
    $('form-medlem').reset();
    msg('medlem-msg', namn + ' är tillagd.', 'ok');
    await load(email);
    onChange();
  }

  // Ta bort kräver två tryck så att man inte råkar ta bort någon
  async function klickMedlem(e) {
    const btn = e.target.closest('[data-ta-bort]');
    if (!btn) return;
    const id = btn.getAttribute('data-ta-bort');
    const m = state.medlemmar.find((x) => x.id === id);
    if (!m) return;
    if (!btn.classList.contains('confirm')) {
      btn.classList.add('confirm');
      btn.textContent = 'Ta bort?';
      setTimeout(() => { if (btn.isConnected) render(); }, 4000);
      return;
    }
    btn.disabled = true;
    const { error } = await sb.from('elkoll_medlem').delete().eq('id', id);
    if (error) { U.toast(felText(error), 'error', 5000); render(); return; }
    U.toast(m.namn + ' är borttagen. Hens uppdrag blev otilldelade.', 'ok', 4000);
    await load(email);
    onChange();
  }

  function namn(id) {
    const m = state.medlemmar.find((x) => x.id === id);
    return m ? m.namn : '';
  }
  function medlem(id) { return state.medlemmar.find((x) => x.id === id) || null; }

  return { setup, load, render, state, namn, medlem };
})();
