// Offline-kö: uppdrag sparas först i telefonen (IndexedDB) och skickas till
// Supabase så fort det finns täckning. Inget uppdrag tappas bort.
window.ElkollKo = (function () {
  'use strict';

  const DB_NAME = 'elkoll';
  const STORE = 'ko';
  let dbPromise = null;
  let syncing = null;

  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function tx(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(STORE, mode);
      const result = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  // item: { id, userId, op: 'upsert' | 'delete' | 'foto' | 'foto-delete', row, data?, created }
  // Foton ligger som ArrayBuffer (data), aldrig Blob – Safari klarar inte Blob i IndexedDB överallt.
  const put = (item) => tx('readwrite', (s) => s.put(item));
  const del = (id) => tx('readwrite', (s) => s.delete(id));
  const all = () => tx('readonly', (s) => s.getAll()).then((r) => r || []);
  const forUser = async (userId) => (await all()).filter((i) => i.userId === userId);

  // Skicka allt i kön. Returnerar { sent, left, error, offline }.
  function sync(sb, userId) {
    if (syncing) return syncing;
    syncing = (async () => {
      let sent = 0;
      let error = null;
      try {
        const items = (await forUser(userId)).sort((a, b) => a.created - b.created);
        for (const item of items) {
          if (!navigator.onLine) break;
          let res;
          if (item.op === 'foto') {
            // Foto: ladda upp filen först, sedan raden. upsert gör att ett avbrutet försök kan göras om.
            const blob = new Blob([item.data], { type: 'image/jpeg' });
            const up = await sb.storage.from('elkoll-foton').upload(item.row.path, blob, { contentType: 'image/jpeg', upsert: true });
            if (up.error) throw up.error;
            res = await sb.from('elkoll_foto').upsert(item.row, { onConflict: 'id' });
          } else if (item.op === 'foto-delete') {
            res = await sb.from('elkoll_foto').delete().eq('id', item.id);
            if (!res.error) {
              const rm = await sb.storage.from('elkoll-foton').remove([item.row.path]);
              if (rm.error) throw rm.error;
            }
          } else if (item.op === 'delete') res = await sb.from('elkoll_uppdrag').delete().eq('id', item.id);
          // upsert: samma uppdrag kan skickas igen utan dubbletter om förra försöket bröts
          else {
            res = await sb.from('elkoll_uppdrag').upsert(item.row, { onConflict: 'id' });
            // Om schema.sql inte körts än saknas kolumnerna lat/lon – spara utan plats hellre än inte alls
            if (res.error && /'(lat|lon)' column|column .*(lat|lon)/i.test(res.error.message || '')) {
              const utan = Object.assign({}, item.row);
              delete utan.lat; delete utan.lon;
              res = await sb.from('elkoll_uppdrag').upsert(utan, { onConflict: 'id' });
            }
          }
          if (res.error) throw res.error;
          await del(item.id);
          sent++;
        }
      } catch (err) {
        error = err;
      }
      const left = (await forUser(userId)).length;
      return { sent, left, error, offline: error ? window.ElkollUtil.isNetworkError(error) : false };
    })().finally(() => { syncing = null; });
    return syncing;
  }

  return { put, del, all, forUser, sync };
})();
