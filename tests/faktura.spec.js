const { test, expect, bild } = require('./hjalp');
const { M, TEAM, inloggad, dag } = require('./mock');

function forbered(api) {
  const u = (id) => api.db.elkoll_uppdrag.find((x) => x.id === id);
  u('u1').status = 'klar';
  u('u3').status = 'klar';
  u('u1').kommentar = 'Bytt central och två jordfelsbrytare.';
  const kl = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
  api.db.elkoll_tid.push(
    { id: 't1', team_id: TEAM, uppdrag_id: 'u1', medlem_id: M.dennis, start: kl(7, 30), slut: kl(9, 0) },
    { id: 't2', team_id: TEAM, uppdrag_id: 'u1', medlem_id: M.maria, start: kl(8, 0), slut: kl(8, 45) },
    { id: 't3', team_id: TEAM, uppdrag_id: 'u3', medlem_id: M.maria, start: kl(10, 0), slut: kl(12, 0) }
  );
}

async function oppna(page) {
  await inloggad(page);
  await page.goto('./#mer');
  await page.locator('#screen-mer').getByRole('link', { name: /Fakturering/ }).click();
  await expect(page.locator('#screen-faktura')).toBeVisible();
}

test.describe('Fakturering', () => {
  test('klara uppdrag per kund med tid per person och material', { annotation: { type: 'testfall', description: 'TC-FAK-01' } }, async ({ page, api }) => {
    forbered(api);
    await oppna(page);
    await expect(page.locator('#fak-att')).toHaveText('Att fakturera (2)');
    const kunder = page.locator('.fak-kund');
    await expect(kunder).toHaveCount(2);
    const anna = kunder.filter({ hasText: 'Anna Lindqvist' });
    await expect(anna.locator('.tid-totalt')).toHaveText('2 h 15 min');
    await expect(anna).toContainText('Byta elcentral');
    await expect(anna).toContainText('2 h 15 min (Dennis 1 h 30 min, Maria 45 min)');
    await expect(anna).toContainText('Material: Elcentral 12 moduler, Jordfelsbrytare × 2');
    await expect(anna).toContainText('Bytt central och två jordfelsbrytare.');
    await expect(page.locator('#fak-lista')).not.toContainText('Montera 4 uttag');   // inte klar
    await bild(page, 'Fakturering');
  });

  test('markera fakturerad och ångra', { annotation: { type: 'testfall', description: 'TC-FAK-02' } }, async ({ page, api }) => {
    forbered(api);
    await oppna(page);
    await page.locator('.fak-kund').filter({ hasText: 'Anna Lindqvist' }).getByRole('button', { name: 'Markera fakturerad' }).click();
    await expect(page.locator('#fak-att')).toHaveText('Att fakturera (1)');
    await expect.poll(() => api.db.elkoll_uppdrag.find((u) => u.id === 'u1').fakturerad_at).not.toBeNull();
    await page.locator('#fak-klara').click();
    await expect(page.locator('.fak-kund')).toHaveCount(1);
    await expect(page.locator('.fak-kund')).toContainText('Fakturerad');
    await page.getByRole('button', { name: 'Ångra' }).click();
    await expect(page.locator('#fak-att')).toHaveText('Att fakturera (2)');
    await expect.poll(() => api.db.elkoll_uppdrag.find((u) => u.id === 'u1').fakturerad_at).toBeNull();
  });

  test('debiteras inte tar bort uppdraget från listan', { annotation: { type: 'testfall', description: 'TC-FAK-03' } }, async ({ page, api }) => {
    forbered(api);
    await inloggad(page);
    await page.goto('./#uppdrag/u3');
    await page.getByLabel(/Debiteras inte/).check();
    await expect.poll(() => api.db.elkoll_uppdrag.find((u) => u.id === 'u3').debiteras).toBe(false);
    await page.goto('./#faktura');
    await expect(page.locator('#fak-att')).toHaveText('Att fakturera (1)');
    await expect(page.locator('#fak-lista')).not.toContainText('Felsöka jordfel');
  });

  test('uppdragskortet visar att uppdraget är fakturerat', { annotation: { type: 'testfall', description: 'TC-FAK-04' } }, async ({ page, api }) => {
    forbered(api);
    api.db.elkoll_uppdrag.find((u) => u.id === 'u1').fakturerad_at = new Date().toISOString();
    await inloggad(page);
    await page.goto('./#uppdrag/u1');
    await expect(page.locator('.fak-badge')).toHaveText(/^Fakturerad /);
  });
});
