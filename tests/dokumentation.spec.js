const { test, expect, bild } = require('./hjalp');
const { FOTO_FIL, TEAM } = require('./mock');

async function oppnaKort(page) {
  await page.locator('.job').filter({ hasText: 'Byta elcentral' }).click();
  await expect(page.locator('#dokumentation')).toBeVisible();
}

test.describe('Dokumentation', () => {
  test('ta foto före laddar upp ett krympt foto', { annotation: { type: 'testfall', description: 'TC-DOK-01' } }, async ({ idag: page, api }) => {
    await oppnaKort(page);
    await page.getByLabel('Ta foto före').setInputFiles(FOTO_FIL);
    await expect(page.locator('#foto-yta .foto')).toHaveCount(1);
    await expect.poll(() => api.db.elkoll_foto.length).toBe(1);
    const f = api.db.elkoll_foto[0];
    expect(f).toMatchObject({ uppdrag_id: 'u1', team_id: TEAM, typ: 'fore' });
    expect(f.path).toBe(TEAM + '/u1/' + f.id + '.jpg');
    expect(api.uppladdade[0].path).toBe(f.path);
    expect(api.uppladdade[0].bytes).toBeLessThanOrEqual(250 * 1024);
    await expect(page.locator('#foto-yta .foto img')).toBeVisible();
    await bild(page, 'Dokumentation med foto');
  });

  test('sparade foton visas för hela teamet', { annotation: { type: 'testfall', description: 'TC-DOK-02' } }, async ({ page, api }) => {
    const { inloggad } = require('./mock');
    api.db.elkoll_foto.push(
      { id: 'f1', uppdrag_id: 'u1', team_id: TEAM, typ: 'fore', path: TEAM + '/u1/f1.jpg', created_at: '2026-10-26T07:40:00Z' },
      { id: 'f2', uppdrag_id: 'u1', team_id: TEAM, typ: 'efter', path: TEAM + '/u1/f2.jpg', created_at: '2026-10-26T09:10:00Z' }
    );
    await inloggad(page);
    await page.goto('./#uppdrag/u1');
    await expect(page.locator('.foto-grupp').filter({ hasText: 'Före' }).locator('.foto img')).toHaveCount(1);
    await expect(page.locator('.foto-grupp').filter({ hasText: 'Efter' }).locator('.foto img')).toHaveCount(1);
    await expect(page.locator('.foto-grupp').first().locator('img')).toHaveAttribute('src', /token=test/);
  });

  test('ta bort foto kräver två tryck', { annotation: { type: 'testfall', description: 'TC-DOK-03' } }, async ({ page, api }) => {
    const { inloggad } = require('./mock');
    api.db.elkoll_foto.push({ id: 'f1', uppdrag_id: 'u1', team_id: TEAM, typ: 'fore', path: TEAM + '/u1/f1.jpg', created_at: '2026-10-26T07:40:00Z' });
    await inloggad(page);
    await page.goto('./#uppdrag/u1');
    await page.locator('#foto-yta .foto').click();
    await expect(page.locator('#foto-visning img')).toBeVisible();
    await page.getByRole('button', { name: 'Ta bort foto' }).click();
    expect(api.db.elkoll_foto).toHaveLength(1);
    await page.getByRole('button', { name: 'Tryck igen för att ta bort' }).click();
    await expect(page.locator('#foto-visning')).toHaveCount(0);
    await expect(page.locator('#foto-yta .foto')).toHaveCount(0);
    await expect.poll(() => api.db.elkoll_foto.length).toBe(0);
    await expect.poll(() => api.borttagnaFoton).toContain(TEAM + '/u1/f1.jpg');
  });

  test('foto utan täckning sparas i telefonen och laddas upp sedan', { annotation: { type: 'testfall', description: 'TC-DOK-04' } }, async ({ idag: page, api, context }) => {
    await oppnaKort(page);
    await context.setOffline(true);
    api.nere = true;
    await page.getByLabel('Ta foto efter').setInputFiles(FOTO_FIL);
    await expect(page.locator('#toast')).toHaveText('Fotot är sparat i telefonen – laddas upp när du har täckning');
    await expect(page.locator('#foto-yta .foto-vantar')).toHaveText('Väntar');
    await expect(page.locator('#foto-yta .foto img')).toBeVisible();
    api.nere = false;
    await context.setOffline(false);
    await expect.poll(() => api.db.elkoll_foto.length).toBe(1);
    expect(api.db.elkoll_foto[0].typ).toBe('efter');
    expect(api.uppladdade).toHaveLength(1);
  });

  test('anteckning sparas på uppdraget', { annotation: { type: 'testfall', description: 'TC-DOK-05' } }, async ({ idag: page, api }) => {
    await oppnaKort(page);
    await page.getByLabel('Anteckningar').fill('Bytt central. Kabel i hallen bör ses över.');
    await page.getByRole('button', { name: 'Spara anteckning' }).click();
    await expect(page.locator('#toast')).toHaveText('Sparat');
    await expect.poll(() => api.db.elkoll_uppdrag.find((u) => u.id === 'u1').kommentar).toBe('Bytt central. Kabel i hallen bör ses över.');
    await page.reload();
    await expect(page.getByLabel('Anteckningar')).toHaveValue('Bytt central. Kabel i hallen bör ses över.');
  });

  test('ta bort uppdrag tar också bort dess foton', { annotation: { type: 'testfall', description: 'TC-DOK-06' } }, async ({ page, api }) => {
    const { inloggad } = require('./mock');
    api.db.elkoll_foto.push({ id: 'f1', uppdrag_id: 'u1', team_id: TEAM, typ: 'fore', path: TEAM + '/u1/f1.jpg', created_at: '2026-10-26T07:40:00Z' });
    await inloggad(page);
    await page.goto('./#uppdrag/u1');
    await expect(page.locator('#foto-yta .foto img')).toHaveCount(1);
    await page.getByRole('button', { name: 'Ta bort', exact: true }).click();
    await page.getByRole('button', { name: 'Tryck igen för att ta bort' }).click();
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect.poll(() => api.borttagnaFoton).toContain(TEAM + '/u1/f1.jpg');
    await expect.poll(() => api.db.elkoll_uppdrag.some((u) => u.id === 'u1')).toBe(false);
  });
});
