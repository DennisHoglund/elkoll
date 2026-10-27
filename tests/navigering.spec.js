const { test, expect, bild, flik } = require('./hjalp');
const { M, TEAM, inloggad, dag } = require('./mock');

test.describe('Navigering och ägare', () => {
  test('flikraden byter mellan Uppdrag, Karta, Tid och Mer', { annotation: { type: 'testfall', description: 'TC-NAV-01' } }, async ({ idag: page }) => {
    const rad = page.locator('#flikrad');
    await expect(rad).toBeVisible();
    await expect(rad.getByRole('link', { name: 'Uppdrag', exact: true })).toHaveAttribute('aria-current', 'page');
    await flik(page, 'Karta');
    await expect(page.locator('#screen-karta')).toBeVisible();
    await flik(page, 'Tid');
    await expect(page.locator('#screen-mintid')).toBeVisible();
    await flik(page, 'Mer');
    await expect(page.locator('#screen-mer')).toBeVisible();
    await expect(page.locator('#mer-namn')).toHaveText('Dennis Höglund');
    await expect(page.locator('#mer-team')).toHaveText('Sundsvalls El AB');
    await bild(page, 'Mer', { hela: false });
    // Flikraden döljs i formuläret och på uppdragskortet
    await flik(page, 'Uppdrag');
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await expect(rad).toBeHidden();
  });

  test('bara ägare ser Fakturering', { annotation: { type: 'testfall', description: 'TC-NAV-02' } }, async ({ page, api }) => {
    api.db.elkoll_medlem.find((m) => m.id === M.dennis).agare = false;
    api.db.elkoll_medlem.find((m) => m.id === M.kalle).agare = true;
    await inloggad(page);
    await page.goto('./#mer');
    await expect(page.locator('#screen-mer')).toBeVisible();
    await expect(page.locator('#screen-mer').getByRole('link', { name: /Teamet/ })).toBeVisible();
    await expect(page.locator('#mer-faktura')).toBeHidden();
    await page.goto('./#faktura');
    await expect(page.locator('#screen-mer')).toBeVisible();   // skickas tillbaka
  });

  test('ägare kan göra en kollega till ägare', { annotation: { type: 'testfall', description: 'TC-NAV-03' } }, async ({ page, api }) => {
    await inloggad(page);
    await page.goto('./#team');
    const kalle = page.locator('.member').filter({ hasText: 'Kalle Lind' });
    await kalle.getByRole('button', { name: 'Gör till ägare' }).click();
    await expect.poll(() => api.db.elkoll_medlem.find((m) => m.id === M.kalle).agare).toBe(true);
    await expect(kalle).toContainText('Ägare');
    await expect(kalle.getByRole('button', { name: 'Ta bort som ägare' })).toBeVisible();
  });

  test('Tid-fliken visar pågående tid och min vecka', { annotation: { type: 'testfall', description: 'TC-NAV-04' } }, async ({ idag: page, api }) => {
    const kl = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
    api.db.elkoll_tid.push({ id: 't0', team_id: TEAM, uppdrag_id: 'u2', medlem_id: M.dennis, start: kl(6, 0), slut: kl(7, 0) });
    await page.locator('.job').filter({ hasText: 'Byta elcentral' }).click();
    await page.getByRole('button', { name: 'Starta tid' }).click();
    await page.getByRole('link', { name: 'Uppdrag', exact: true }).click();
    await expect(page.locator('#flik-tid-prick')).toBeVisible();
    await flik(page, 'Tid');
    await expect(page.locator('.pagar-kort')).toContainText('Byta elcentral');
    await expect(page.locator('.vecka-total')).toHaveText(/^1 h/);
    await bild(page, 'Tid-fliken', { hela: false });
    await page.locator('.pagar-kort').getByRole('button', { name: 'Stoppa' }).click();
    await expect(page.locator('.pagar-kort')).toHaveCount(0);
    await expect(page.locator('#flik-tid-prick')).toBeHidden();
    await expect.poll(() => api.db.elkoll_tid.filter((t) => t.slut == null).length).toBe(0);
  });

  test('ej klara uppdrag från tidigare dagar visas överst idag', { annotation: { type: 'testfall', description: 'TC-NAV-05' } }, async ({ page, api }) => {
    api.db.elkoll_uppdrag.push(
      { id: 'gammal-kvar', team_id: TEAM, fran: M.kalle, tilldelad: M.dennis, datum: dag(-2), tid: '08:00', adress: 'Nygatan 1, Sundsvall', kund: null, telefon: null, portkod: null, uppgift: 'Dra kabel – fortsättning', material: [], saknas: [], fritext: null, status: 'aterbesok', kommentar: null },
      { id: 'gammal-klar', team_id: TEAM, fran: M.kalle, tilldelad: M.dennis, datum: dag(-2), tid: '13:00', adress: 'Nygatan 3, Sundsvall', kund: null, telefon: null, portkod: null, uppgift: 'Klart jobb', material: [], saknas: [], fritext: null, status: 'klar', kommentar: null }
    );
    await inloggad(page);
    await page.goto('./');
    await expect(page.locator('.lista-rubrik').first()).toHaveText('Ej klart sedan tidigare (1)');
    await expect(page.locator('.job.kvar')).toHaveCount(1);
    await expect(page.locator('.job.kvar')).toContainText('Dra kabel – fortsättning');
    await expect(page.locator('#lista')).not.toContainText('Klart jobb');
    await expect(page.locator('.job:not(.kvar)')).toHaveCount(2);
    await bild(page, 'Ej klart sedan tidigare');
    await page.locator('[data-dag="' + dag(1) + '"]').click();
    await expect(page.locator('.job.kvar')).toHaveCount(0);
  });
});
