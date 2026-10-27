const { test, expect, bild } = require('./hjalp');
const { M, TEAM, inloggad } = require('./mock');

async function oppnaKort(page, namn = 'Byta elcentral') {
  await page.locator('.job').filter({ hasText: namn }).click();
  await expect(page.locator('#tid-yta')).toBeVisible();
}

test.describe('Tidrapport', () => {
  test('starta och stoppa tid på ett uppdrag', { annotation: { type: 'testfall', description: 'TC-TID-01' } }, async ({ idag: page, api }) => {
    await page.clock.install();
    await oppnaKort(page);
    await page.getByRole('button', { name: 'Starta tid' }).click();
    await expect(page.getByRole('button', { name: /Stoppa · 0:00/ })).toBeVisible();
    await expect.poll(() => api.db.elkoll_tid.length).toBe(1);
    expect(api.db.elkoll_tid[0]).toMatchObject({ uppdrag_id: 'u1', medlem_id: M.dennis, team_id: TEAM, slut: null });
    await page.clock.runFor(42 * 60 * 1000);
    await expect(page.locator('#tid-klocka')).toHaveText('0:42');
    await expect(page.locator('[data-pagar-langd]')).toHaveText('42 min');
    await expect(page.locator('.tid-totalt')).toHaveText('Totalt 42 min');
    await bild(page, 'Tid pågår', { hela: false });
    await page.getByRole('link', { name: 'Uppdrag', exact: true }).click();
    await expect(page.locator('.job').filter({ hasText: 'Byta elcentral' })).toContainText('Tid pågår');
    await oppnaKort(page);
    await page.getByRole('button', { name: /Stoppa/ }).click();
    await expect(page.locator('#toast')).toHaveText('Tiden är sparad: 42 min');
    await expect.poll(() => api.db.elkoll_tid[0].slut).not.toBeNull();
    await expect(page.locator('.tid-totalt')).toHaveText('Totalt 42 min');
  });

  test('starta tid på nytt uppdrag stoppar den förra', { annotation: { type: 'testfall', description: 'TC-TID-02' } }, async ({ idag: page, api }) => {
    await oppnaKort(page);
    await page.getByRole('button', { name: 'Starta tid' }).click();
    await page.getByRole('link', { name: 'Uppdrag', exact: true }).click();
    await oppnaKort(page, 'Montera 4 uttag');
    await page.getByRole('button', { name: 'Starta tid' }).click();
    await expect(page.locator('#toast')).toHaveText('Stoppade tiden på Byta elcentral');
    await expect.poll(() => api.db.elkoll_tid.length).toBe(2);
    await expect.poll(() => api.db.elkoll_tid.filter((t) => t.slut == null).map((t) => t.uppdrag_id)).toEqual(['u2']);
  });

  test('markera klar stoppar tiden', { annotation: { type: 'testfall', description: 'TC-TID-03' } }, async ({ idag: page, api }) => {
    await oppnaKort(page);
    await page.getByRole('button', { name: 'Starta tid' }).click();
    await page.getByRole('button', { name: 'Klar', exact: true }).click();
    await expect.poll(() => api.db.elkoll_tid[0] && api.db.elkoll_tid[0].slut).not.toBeNull();
    await expect(page.getByRole('button', { name: 'Starta tid' })).toBeVisible();
  });

  test('lägga till och ta bort tid i efterhand', { annotation: { type: 'testfall', description: 'TC-TID-04' } }, async ({ idag: page, api }) => {
    await oppnaKort(page);
    await page.getByText('Lägg till tid i efterhand').click();
    await page.locator('#tid-fran').fill('08:00');
    await page.locator('#tid-till').fill('07:00');
    await page.getByRole('button', { name: 'Lägg till' }).click();
    await expect(page.locator('#tid-msg')).toHaveText('Till måste vara senare än från.');
    await page.locator('#tid-till').fill('10:15');
    await page.getByRole('button', { name: 'Lägg till' }).click();
    await expect(page.locator('#toast')).toHaveText('Tiden är tillagd: 2 h 15 min');
    await expect.poll(() => api.db.elkoll_tid.length).toBe(1);
    await page.getByRole('button', { name: 'Ta bort tid 08:00' }).click();
    await page.getByRole('button', { name: 'Bekräfta: ta bort tiden' }).click();
    await expect.poll(() => api.db.elkoll_tid.length).toBe(0);
  });

  test('veckorapport per person och dag', { annotation: { type: 'testfall', description: 'TC-TID-05' } }, async ({ page, api }) => {
    const idag = new Date();
    const kl = (h, m) => { const d = new Date(idag); d.setHours(h, m, 0, 0); return d.toISOString(); };
    api.db.elkoll_tid.push(
      { id: 't1', team_id: TEAM, uppdrag_id: 'u1', medlem_id: M.dennis, start: kl(7, 30), slut: kl(9, 0) },
      { id: 't2', team_id: TEAM, uppdrag_id: 'u2', medlem_id: M.dennis, start: kl(13, 30), slut: kl(14, 15) },
      { id: 't3', team_id: TEAM, uppdrag_id: 'u3', medlem_id: M.maria, start: kl(10, 0), slut: kl(12, 0) }
    );
    await inloggad(page);
    await page.goto('./#team');
    await page.getByRole('link', { name: /Tidrapport/ }).click();
    await expect(page.locator('#tid-vecka')).toHaveText(/^Vecka \d+$/);
    const personer = page.locator('.tid-person');
    await expect(personer).toHaveCount(2);
    await expect(personer.nth(0)).toContainText('Dennis Höglund');
    await expect(personer.nth(0).locator('.tid-totalt')).toHaveText('2 h 15 min');
    await expect(personer.nth(0)).toContainText('Byta elcentral · Storgatan 12, Sundsvall');
    await expect(personer.nth(1).locator('.tid-totalt')).toHaveText('2 h');
    await bild(page, 'Veckorapport');
    await page.getByRole('button', { name: 'Föregående vecka' }).click();
    await expect(page.locator('#tid-rapport')).toContainText('Ingen tid rapporterad den här veckan.');
  });
});
