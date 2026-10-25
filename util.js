// Små hjälpfunktioner som delas av modulerna.
window.ElkollUtil = (function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    json(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    setJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // Datum som 'YYYY-MM-DD' i telefonens tidszon
  function isoDag(d) {
    const x = d || new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function fran(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 12); }
  function plusDagar(iso, n) { const d = fran(iso); d.setDate(d.getDate() + n); return isoDag(d); }

  const VECKODAG = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  function dagText(iso) {
    const s = fran(iso).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function kortDag(iso) {
    const d = fran(iso);
    return VECKODAG[d.getDay()] + ' ' + d.getDate() + ' ' + d.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '');
  }

  function initialer(namn) {
    const delar = String(namn || '?').trim().split(/\s+/).filter(Boolean);
    return ((delar[0] || '?')[0] + (delar.length > 1 ? delar[delar.length - 1][0] : (delar[0] || '')[1] || '')).toUpperCase();
  }

  // Telefonnummer till tel:-länk (bara siffror och +)
  const telLank = (nr) => String(nr || '').replace(/[^\d+]/g, '');

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  let toastTimer = null;
  function toast(text, kind, ms) {
    const el = $('toast');
    if (!el) return;
    el.textContent = text;
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms || 3000);
  }

  function isNetworkError(err) {
    const m = (err && (err.message || String(err))) || '';
    return !navigator.onLine || /fetch|network|load failed|timed? ?out|abort/i.test(m);
  }

  return { $, esc, store, isoDag, plusDagar, dagText, kortDag, initialer, telLank, uuid, toast, isNetworkError };
})();
