(function () {
  'use strict';

  const U = window.ElkollUtil;
  const { $, store } = U;
  const THEME_KEY = 'elkoll-theme';

  // ---------- Tema ----------
  const THEMES = ['auto', 'light', 'dark'];
  const THEME_LABELS = { auto: 'Auto', light: 'Ljust', dark: 'Mörkt' };
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    const t = store.get(THEME_KEY);
    return THEMES.includes(t) ? t : 'auto';
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $('theme-label').textContent = THEME_LABELS[theme];
    const dark = theme === 'dark' || (theme === 'auto' && darkQuery.matches);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#141517' : '#F4F4F2');
  }
  $('btn-theme').addEventListener('click', () => {
    const next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
    if (next === 'auto') store.del(THEME_KEY); else store.set(THEME_KEY, next);
    applyTheme(next);
  });
  darkQuery.addEventListener('change', () => applyTheme(currentTheme()));
  applyTheme(currentTheme());

  // ---------- Vyer ----------
  function show(view) {
    ['loading', 'login', 'app'].forEach((v) => { $('view-' + v).hidden = v !== view; });
  }
  function screen(name) {
    ['start', 'idag', 'nytt', 'uppdrag', 'team', 'karta', 'tid', 'faktura'].forEach((s) => { $('screen-' + s).hidden = s !== name; });
    window.scrollTo(0, 0);
  }
  function setMsg(text, kind) {
    const el = $('login-msg');
    el.textContent = text || '';
    el.className = 'msg' + (kind ? ' ' + kind : '');
  }

  $('app-version').textContent = 'Elkoll version ' + ((window.ELKOLL_CONFIG || {}).version || '?');

  // ---------- Supabase ----------
  const cfg = window.ELKOLL_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl) {
    show('login');
    $('form-login').hidden = true;
    setMsg('Kunde inte ladda Supabase. Kontrollera nätet och försök igen.', 'error');
    return;
  }
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  window.sb = sb; // för felsökning i konsolen

  // ---------- Inloggning / nytt konto ----------
  let skapaKonto = false;
  function friendlyError(err) {
    const m = (err && err.message || '').toLowerCase();
    if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Fel e-post eller lösenord.';
    if (m.includes('email not confirmed')) return 'Bekräfta din e-post först – kolla inkorgen.';
    if (m.includes('already registered') || m.includes('already exists')) return 'Det finns redan ett konto med den e-posten. Logga in i stället.';
    if (m.includes('password') && (m.includes('least') || m.includes('short') || m.includes('weak'))) return 'Lösenordet är för kort eller för enkelt (minst 8 tecken).';
    if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'Nya konton är avstängda i Supabase.';
    if ((err && err.status === 429) || m.includes('rate limit')) return 'För många försök. Vänta en stund och prova igen.';
    if (m.includes('fetch') || m.includes('network')) return 'Ingen kontakt med servern. Kontrollera nätet.';
    return 'Något gick fel: ' + (err && err.message || 'okänt fel');
  }

  $('btn-toggle-signup').addEventListener('click', () => {
    skapaKonto = !skapaKonto;
    $('btn-login').textContent = skapaKonto ? 'Skapa konto' : 'Logga in';
    $('btn-toggle-signup').textContent = skapaKonto ? 'Har du konto? Logga in' : 'Ny här? Skapa konto';
    $('password').setAttribute('autocomplete', skapaKonto ? 'new-password' : 'current-password');
    setMsg(skapaKonto ? 'Använd e-posten som kollegan lade till i teamet.' : '');
  });

  $('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('email').value.trim().toLowerCase();
    const password = $('password').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg('Ange en giltig e-postadress.', 'error'); return; }
    if (!password) { setMsg('Ange ditt lösenord.', 'error'); return; }
    if (skapaKonto && password.length < 8) { setMsg('Välj ett lösenord med minst 8 tecken.', 'error'); return; }

    const btn = $('btn-login');
    btn.disabled = true;
    setMsg(skapaKonto ? 'Skapar konto…' : 'Loggar in…');
    const res = skapaKonto
      ? await sb.auth.signUp({ email, password })
      : await sb.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    if (res.error) { setMsg(friendlyError(res.error), 'error'); return; }
    if (skapaKonto && !res.data.session) {
      setMsg('Kontot är skapat. Öppna mejlet från Supabase och bekräfta, logga sedan in här.', 'ok');
      $('btn-toggle-signup').click();
      return;
    }
    $('password').value = '';
    setMsg('');
  });

  document.querySelectorAll('[data-logout]').forEach((b) => b.addEventListener('click', () => sb.auth.signOut()));

  // ---------- Synk ----------
  let userId = null;
  let email = '';

  function updateBadge(n) {
    const el = $('queue-badge');
    el.hidden = !n;
    el.textContent = n + ' väntar';
  }

  async function synka() {
    if (!userId) return null;
    const ko = await window.ElkollKo.forUser(userId).catch(() => []);
    if (!ko.length) { updateBadge(0); return { sent: 0, left: 0 }; }
    if (!navigator.onLine) { updateBadge(ko.length); return { sent: 0, left: ko.length, offline: true }; }
    const res = await window.ElkollKo.sync(sb, userId);
    updateBadge(res.left);
    if (res.error && !res.offline) U.toast('Kunde inte skicka: ' + (res.error.message || 'okänt fel'), 'error', 6000);
    if (res.sent) await window.ElkollUppdrag.load();
    return res;
  }
  // Skicka det egna och hämta kollegornas ändringar: när nätet kommer tillbaka, när appen
  // öppnas igen och var 30:e sekund medan den syns.
  let hamtar = false;
  async function uppdateraAllt() {
    if (!userId || hamtar) return;
    hamtar = true;
    try {
      await synka();
      if (navigator.onLine) {
        await window.ElkollTeam.load(email);
        await window.ElkollTid.laddaPagaende();
        await window.ElkollUppdrag.load();
      }
    } finally { hamtar = false; }
  }
  window.addEventListener('online', uppdateraAllt);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') uppdateraAllt(); });
  window.addEventListener('pageshow', (e) => { if (e.persisted) uppdateraAllt(); });
  setInterval(() => { if (document.visibilityState === 'visible') uppdateraAllt(); }, 30000);
  $('queue-badge').addEventListener('click', async () => {
    if (!navigator.onLine) { U.toast('Ingen täckning just nu – försöker igen automatiskt.', 'ok', 3000); return; }
    await synka();
  });

  window.ElkollTeam.setup(sb, () => { route(); window.ElkollUppdrag.load(); });
  window.ElkollUppdrag.setup(sb, { synka });
  window.ElkollFoto.setup(sb, { synka });
  window.ElkollKunder.setup(sb);
  window.ElkollTid.setup(sb, { synka });
  window.ElkollFaktura.setup(sb);

  // ---------- Navigering (#idag, #nytt, #nytt/ID, #uppdrag/ID, #team) ----------
  // Senast visade vy. Formulär och uppdragskort byggs inte om när samma vy redan visas –
  // annars kunde t.ex. en ifylld text eller ett nytt foto försvinna när data laddats klart.
  let visadVy = '';
  function route() {
    if (!window.ElkollTeam.state.team) { visadVy = ''; screen('start'); return; }
    const nyckel = location.hash || '#idag';
    const [vy, id] = (location.hash.replace(/^#/, '') || 'idag').split('/');
    if (nyckel === visadVy && (vy === 'nytt' || vy === 'uppdrag') && !$('screen-' + vy).hidden) return;
    visadVy = nyckel;
    const rid = id ? decodeURIComponent(id) : null;
    if (vy !== 'uppdrag') { window.ElkollFoto.lamna(); window.ElkollTid.lamna(); }
    if (vy !== 'karta') window.ElkollKarta.lamna();
    if (vy === 'nytt') { window.ElkollUppdrag.openNytt(rid); screen('nytt'); }
    else if (vy === 'uppdrag' && rid) { window.ElkollUppdrag.openKort(rid); screen('uppdrag'); }
    else if (vy === 'team') { window.ElkollTeam.render(); screen('team'); }
    else if (vy === 'karta') { screen('karta'); window.ElkollUppdrag.visaKarta(); }
    else if (vy === 'tid') { screen('tid'); window.ElkollTid.visaRapport(); }
    else if (vy === 'faktura') { screen('faktura'); window.ElkollFaktura.visa(); }
    else { window.ElkollUppdrag.render(); screen('idag'); }
  }
  window.addEventListener('hashchange', route);

  $('btn-start-retry').addEventListener('click', async () => {
    const res = await window.ElkollTeam.load(email);
    if (!window.ElkollTeam.state.team) U.toast(res.ok ? 'Du finns inte i något team än.' : 'Ingen kontakt med servern.', 'error', 3500);
    else { await window.ElkollUppdrag.load(); route(); }
  });

  // ---------- Sessionsstyrning ----------
  async function render(session) {
    if (!(session && session.user)) { userId = null; visadVy = ''; show('login'); return; }
    if (userId === session.user.id) return;
    userId = session.user.id;
    email = (session.user.email || '').toLowerCase();
    $('user-email').textContent = 'Inloggad som ' + email;
    $('start-email').textContent = 'Inloggad som ' + email;
    window.ElkollUppdrag.setUser(userId);
    window.ElkollFoto.setUser(userId);
    window.ElkollTid.setUser(userId);
    show('app');
    const teamRes = await window.ElkollTeam.load(email);
    if (!teamRes.ok && !teamRes.offline) {
      const saknas = teamRes.error && (teamRes.error.code === '42P01' || /does not exist/i.test(teamRes.error.message || ''));
      U.toast(saknas ? 'Tabellerna saknas – kör supabase/schema.sql.' : 'Kunde inte hämta teamet: ' + teamRes.error.message, 'error', 6000);
    }
    await window.ElkollTid.laddaPagaende();
    const res = await window.ElkollUppdrag.load();
    route();
    if (teamRes.offline || res.offline) U.toast('Ingen täckning – visar sparade uppdrag', 'ok', 3000);
    synka();
  }

  sb.auth.onAuthStateChange((_event, session) => { if (!session) userId = null; render(session); });
  sb.auth.getSession().then(({ data }) => render(data.session));

  // ---------- Service worker ----------
  if ('serviceWorker' in navigator) {
    let reloaded = false;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloaded) { reloaded = true; location.reload(); }
    });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => reg.update()).catch(() => {});
    });
  }
})();
