// Karta per datum: dagens uppdrag som numrerade nålar, egen position och geokodning av adresser.
window.ElkollKarta = (function () {
  'use strict';

  const U = window.ElkollUtil;
  const { $, esc } = U;
  const LAYER_KEY = 'elkoll-karta-lager';
  const GEO_KEY = 'elkoll-geo-cache';
  const START = { lat: 62.39, lng: 17.31, zoom: 12 };   // Sundsvall tills vi vet var uppdragen är

  let map = null;
  let pinLayer = null;
  let posMarker = null;
  let watchId = null;
  let lastPos = null;
  let rader = [];
  let valt = null;
  let anpassad = '';          // vilken dag/filter vyn senast anpassades till

  // ---------- Geokodning (OpenStreetMap Nominatim, max 1 anrop/s) ----------
  let senasteGeo = 0;
  async function geokoda(adress) {
    const nyckel = String(adress || '').trim().toLowerCase();
    if (!nyckel) return null;
    const cache = U.store.json(GEO_KEY, {});
    if (nyckel in cache) return cache[nyckel];
    if (!navigator.onLine) return undefined;     // okänt – försök igen senare
    const vanta = 1100 - (Date.now() - senasteGeo);
    if (vanta > 0) await new Promise((r) => setTimeout(r, vanta));
    senasteGeo = Date.now();
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=se&accept-language=sv&q=' + encodeURIComponent(adress);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      clearTimeout(t);
      if (!res.ok) return undefined;
      const data = await res.json();
      const hit = data && data[0] ? { lat: Number(data[0].lat), lon: Number(data[0].lon) } : null;
      cache[nyckel] = hit;
      U.store.setJson(GEO_KEY, cache);
      return hit;
    } catch (e) {
      return undefined;
    }
  }

  // ---------- Karta ----------
  function lager() {
    return {
      'Karta': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxNativeZoom: 19, maxZoom: 20, attribution: '© OpenStreetMap'
      }),
      'Satellit': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxNativeZoom: 19, maxZoom: 20, attribution: 'Esri, Maxar, Earthstar Geographics'
      }),
      'Terräng': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        subdomains: 'abc', maxNativeZoom: 17, maxZoom: 20, attribution: '© OpenStreetMap · OpenTopoMap'
      })
    };
  }

  function init() {
    if (map) { map.invalidateSize(); return; }
    if (!window.L) { $('karta-msg').textContent = 'Kartan kunde inte laddas. Kontrollera nätet.'; return; }
    map = L.map('karta', { zoomControl: false, keyboard: false, maxZoom: 20 }).setView([START.lat, START.lng], START.zoom);
    const l = lager();
    const start = l[U.store.get(LAYER_KEY)] ? U.store.get(LAYER_KEY) : 'Karta';
    l[start].addTo(map);
    $('karta').classList.toggle('sat', start === 'Satellit');
    L.control.layers(l, {}, { position: 'topright' }).addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    map.on('baselayerchange', (e) => { U.store.set(LAYER_KEY, e.name); $('karta').classList.toggle('sat', e.name === 'Satellit'); });
    map.on('click', () => valj(null));
    pinLayer = L.layerGroup().addTo(map);
    $('btn-min-plats').addEventListener('click', () => {
      if (lastPos) map.setView([lastPos.lat, lastPos.lng], Math.max(map.getZoom(), 15));
      else startaPosition(true);
    });
    $('karta-kort').addEventListener('click', (e) => { if (e.target.closest('[data-stang-kort]')) valj(null); });
  }

  function startaPosition(centrera) {
    if (!('geolocation' in navigator) || watchId !== null) return;
    watchId = navigator.geolocation.watchPosition((p) => {
      const forsta = !lastPos;
      lastPos = { lat: p.coords.latitude, lng: p.coords.longitude };
      if (!posMarker) posMarker = L.circleMarker([lastPos.lat, lastPos.lng], { radius: 8, className: 'pos-dot', interactive: false }).addTo(map);
      else posMarker.setLatLng([lastPos.lat, lastPos.lng]);
      if (forsta && (centrera || !rader.some((r) => r.lat != null))) map.setView([lastPos.lat, lastPos.lng], 14);
    }, () => {}, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
  }

  function stoppaPosition() {
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
  }

  // Visar dagens uppdrag. lista = sorterad som i listvyn, nyckel = dag+filter
  function visa(lista, nyckel) {
    init();
    if (!map) return;
    rader = lista;
    pinLayer.clearLayers();
    const medPlats = [];
    lista.forEach((r, i) => {
      if (r.lat == null || r.lon == null) return;
      const ikon = L.divIcon({
        className: 'pin-wrap',
        html: '<span class="pin' + (r.status === 'klar' ? ' done' : '') + (valt === r.id ? ' vald' : '') + '" data-pin="' + esc(r.id) + '">' + (i + 1) + '</span>',
        iconSize: [40, 40], iconAnchor: [20, 20]
      });
      const m = L.marker([r.lat, r.lon], { icon: ikon, title: (i + 1) + '. ' + r.uppgift, keyboard: false }).addTo(pinLayer);
      m.on('click', (e) => { L.DomEvent.stopPropagation(e); valj(r.id); });
      medPlats.push([r.lat, r.lon]);
    });
    const utan = lista.filter((r) => r.lat == null || r.lon == null);
    $('karta-msg').textContent = !lista.length ? 'Inga uppdrag den här dagen.'
      : utan.length ? utan.length + (utan.length === 1 ? ' uppdrag saknar plats på kartan: ' : ' uppdrag saknar plats på kartan: ') + utan.map((r) => r.adress).join(', ')
      : '';
    $('karta-msg').hidden = !$('karta-msg').textContent;
    if (nyckel !== anpassad && medPlats.length) {
      anpassad = nyckel;
      if (medPlats.length === 1) map.setView(medPlats[0], 15);
      else map.fitBounds(medPlats, { paddingTopLeft: [40, 140], paddingBottomRight: [40, 80], maxZoom: 15 });
    }
    if (valt && !lista.some((r) => r.id === valt)) valj(null); else visaKort();
    startaPosition(false);
    setTimeout(() => map.invalidateSize(), 50);
  }

  function valj(id) {
    valt = id;
    document.querySelectorAll('.pin').forEach((p) => p.classList.toggle('vald', p.getAttribute('data-pin') === id));
    visaKort();
  }

  function kartLank(adress) {
    const q = encodeURIComponent(adress);
    return /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? 'https://maps.apple.com/?daddr=' + q : 'https://www.google.com/maps/dir/?api=1&destination=' + q;
  }

  function visaKort() {
    const el = $('karta-kort');
    const i = rader.findIndex((r) => r.id === valt);
    if (i < 0) { el.hidden = true; return; }
    const r = rader[i];
    el.hidden = false;
    el.innerHTML =
      '<div class="kk-rad"><span class="job-nr" aria-hidden="true">' + (i + 1) + '</span>' +
      '<div class="kk-text"><span class="job-tid">' + esc(r.tid || 'Ingen tid') + '</span>' +
      '<strong class="kk-titel">' + esc(r.adress) + '</strong>' +
      '<span class="job-adress">' + esc(r.uppgift) + (r.kund ? ' · ' + esc(r.kund) : '') + '</span></div>' +
      '<button type="button" class="icon-btn" data-stang-kort aria-label="Stäng"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="grid2">' +
      '<a class="btn primary" href="' + esc(kartLank(r.adress)) + '" target="_blank" rel="noopener">Navigera</a>' +
      '<a class="btn ghost" href="#uppdrag/' + encodeURIComponent(r.id) + '">Öppna</a></div>';
  }

  function lamna() { stoppaPosition(); }

  return { visa, lamna, geokoda };
})();
