const { test, expect, bild } = require('./hjalp');
const { dag, M } = require('./mock');

test.describe('Dagens uppdrag', () => {
  test('Mina visar mina uppdrag idag i tidsordning', { annotation: { type: 'testfall', description: 'TC-UPP-01' } }, async ({ idag: page }) => {
    const jobb = page.locator('.job');
    await expect(jobb).toHaveCount(2);
    await expect(jobb.nth(0)).toContainText('07:30');
    await expect(jobb.nth(0)).toContainText('Byta elcentral');
    await expect(jobb.nth(0)).toContainText('Från Kalle Lind · Kund: Anna Lindqvist');
    await expect(jobb.nth(1)).toContainText('Portkod saknas');
    await bild(page, 'Dagens uppdrag – Mina');
  });

  test('Alla visar hela teamets uppdrag med mottagare', { annotation: { type: 'testfall', description: 'TC-UPP-02' } }, async ({ idag: page }) => {
    await page.getByRole('button', { name: 'Alla' }).click();
    await expect(page.locator('.job')).toHaveCount(3);
    await expect(page.locator('.job').nth(1)).toContainText('Till Maria Sjö');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Alla' })).toHaveAttribute('aria-pressed', 'true');
    await bild(page, 'Dagens uppdrag – Alla');
  });

  test('byta dag visar den dagens uppdrag', { annotation: { type: 'testfall', description: 'TC-UPP-03' } }, async ({ idag: page }) => {
    await page.locator('[data-dag="' + dag(1) + '"]').click();
    await expect(page.locator('.job')).toHaveCount(1);
    await expect(page.locator('.job')).toContainText('Byta armatur i trapphus');
    await page.locator('[data-dag="' + dag(3) + '"]').click();
    await expect(page.locator('.empty')).toContainText('Inga uppdrag den här dagen.');
  });
});

test.describe('Nytt uppdrag', () => {
  test('tolka fyller i fälten och markerar det som saknas', { annotation: { type: 'testfall', description: 'TC-UPP-04' } }, async ({ idag: page, api }) => {
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await expect(page.locator('#screen-nytt')).toBeVisible();
    await page.getByLabel('Beskriv uppdraget').fill('Imorgon halv åtta Storgatan 12 i Sundsvall, byta elcentral hos Anna Lindqvist 070 123 45 67');
    await page.getByRole('button', { name: 'Tolka' }).click();
    await expect(page.locator('#tolka-msg')).toHaveText('Klart. Saknas: portkod.');
    await expect(page.locator('#u-adress')).toHaveValue('Storgatan 12, Sundsvall');
    await expect(page.locator('#u-datum')).toHaveValue(dag(1));
    await expect(page.locator('#u-tid')).toHaveValue('07:30');
    await expect(page.locator('#u-material')).toHaveValue('Elcentral 12 moduler\nJordfelsbrytare × 2');
    await expect(page.locator('#u-portkod')).toHaveClass(/saknas/);
    await expect(page.locator('label[for="u-portkod"]')).toHaveText('Portkod · saknas');
    expect(api.tolkAnrop[0].idag).toBe(dag(0));
    await bild(page, 'Nytt uppdrag – tolkat');
    await page.locator('#u-portkod').fill('4321');
    await expect(page.locator('#u-portkod')).not.toHaveClass(/saknas/);
  });

  test('spara uppdrag till en kollega', { annotation: { type: 'testfall', description: 'TC-UPP-05' } }, async ({ idag: page, api }) => {
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await page.getByLabel('Beskriv uppdraget').fill('Imorgon Storgatan 12');
    await page.getByRole('button', { name: 'Tolka' }).click();
    await expect(page.locator('#u-adress')).toHaveValue('Storgatan 12, Sundsvall');
    await page.locator('[data-till="' + M.kalle + '"]').click();
    await page.getByRole('button', { name: 'Spara uppdrag' }).click();
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect(page.locator('#toast')).toHaveText('Sparat');
    const ny = api.db.elkoll_uppdrag.find((u) => u.adress === 'Storgatan 12, Sundsvall' && u.datum === dag(1));
    expect(ny).toMatchObject({ tilldelad: M.kalle, fran: M.dennis, uppgift: 'Byta elcentral', saknas: ['portkod'], status: 'planerad' });
    await page.getByRole('button', { name: 'Alla' }).click();
    await expect(page.locator('.job').filter({ hasText: 'Byta elcentral' })).toContainText('Till Kalle Lind');
  });

  test('adress och uppgift måste fyllas i', { annotation: { type: 'testfall', description: 'TC-UPP-06' } }, async ({ idag: page, api }) => {
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await page.getByRole('button', { name: 'Spara uppdrag' }).click();
    await expect(page.locator('#uppdrag-msg')).toHaveText('Fyll i adressen.');
    await page.locator('#u-adress').fill('Storgatan 1');
    await page.getByRole('button', { name: 'Spara uppdrag' }).click();
    await expect(page.locator('#uppdrag-msg')).toHaveText('Fyll i vad som ska göras.');
    expect(api.db.elkoll_uppdrag).toHaveLength(4);
  });

  test('tydligt besked när tolkningen inte är igång', { annotation: { type: 'testfall', description: 'TC-UPP-07' } }, async ({ idag: page, api }) => {
    api.tolkStatus = 404;
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await page.getByLabel('Beskriv uppdraget').fill('Imorgon Storgatan 12');
    await page.getByRole('button', { name: 'Tolka' }).click();
    await expect(page.locator('#tolka-msg')).toHaveText('Tolkningen är inte igång än – fyll i fälten själv.');
    await page.locator('#u-adress').fill('Storgatan 12');
    await page.locator('#u-uppgift').fill('Byta uttag');
    await page.getByRole('button', { name: 'Spara uppdrag' }).click();
    await expect(page.locator('#screen-idag')).toBeVisible();
    expect(api.db.elkoll_uppdrag).toHaveLength(5);
  });

  test('tolkningen hänger aldrig – tidsgräns ger besked', { annotation: { type: 'testfall', description: 'TC-UPP-14' } }, async ({ idag: page, api }) => {
    api.tolkFordrojning = 5000;
    await page.evaluate(() => { window.ELKOLL_CONFIG.tolkaTimeoutMs = 800; });
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await page.getByLabel('Beskriv uppdraget').fill('Imorgon Storgatan 12');
    await page.getByRole('button', { name: 'Tolka' }).click();
    await expect(page.locator('#tolka-msg')).toHaveText('Tolkningen tog för lång tid. Försök igen eller fyll i fälten själv.');
    await expect(page.getByRole('button', { name: 'Tolka' })).toBeEnabled();
  });
});

test.describe('Uppdragskort', () => {
  test('visar uppgifter, portkod och knappar för navigera, ring och sms', { annotation: { type: 'testfall', description: 'TC-UPP-08' } }, async ({ idag: page }) => {
    await page.locator('.job').filter({ hasText: 'Byta elcentral' }).click();
    await expect(page.locator('#screen-uppdrag')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Byta elcentral' })).toBeVisible();
    await expect(page.locator('.kod')).toHaveText('1234');
    await expect(page.getByRole('link', { name: 'Navigera' })).toHaveAttribute('href', /Storgatan%2012/);
    await expect(page.getByRole('link', { name: 'Ring kund' })).toHaveAttribute('href', 'tel:0701234567');
    await expect(page.getByRole('link', { name: 'På väg-sms' })).toHaveAttribute('href', /^sms:0701234567/);
    await expect(page.getByRole('link', { name: 'Ring Kalle Lind' })).toHaveAttribute('href', 'tel:0700000002');
    await page.getByLabel('Jordfelsbrytare × 2').check();
    await page.reload();
    await expect(page.getByLabel('Jordfelsbrytare × 2')).toBeChecked();
    await bild(page, 'Uppdragskort');
  });

  test('markera som klar sparas och syns i listan', { annotation: { type: 'testfall', description: 'TC-UPP-09' } }, async ({ idag: page, api }) => {
    await page.locator('.job').filter({ hasText: 'Byta elcentral' }).click();
    await page.getByRole('button', { name: 'Klar', exact: true }).click();
    await expect(page.locator('#kort-status')).toHaveText('Klar');
    await expect.poll(() => api.db.elkoll_uppdrag.find((u) => u.id === 'u1').status).toBe('klar');
    await page.getByRole('link', { name: 'Uppdrag' }).click();
    await expect(page.locator('.job').filter({ hasText: 'Byta elcentral' })).toHaveClass(/done/);
  });

  test('ändra ett uppdrag', { annotation: { type: 'testfall', description: 'TC-UPP-10' } }, async ({ idag: page, api }) => {
    await page.locator('.job').filter({ hasText: 'Byta elcentral' }).click();
    await page.getByRole('link', { name: 'Ändra' }).click();
    await expect(page.locator('#nytt-titel')).toHaveText('Ändra uppdrag');
    await expect(page.locator('#u-adress')).toHaveValue('Storgatan 12, Sundsvall');
    await page.locator('#u-tid').fill('09:15');
    await page.getByRole('button', { name: 'Spara uppdrag' }).click();
    await expect(page.locator('.job').nth(0)).toContainText('09:15');
    await expect.poll(() => api.db.elkoll_uppdrag.find((u) => u.id === 'u1').tid).toBe('09:15');
    expect(api.db.elkoll_uppdrag).toHaveLength(4);
  });

  test('ta bort ett uppdrag kräver två tryck', { annotation: { type: 'testfall', description: 'TC-UPP-11' } }, async ({ idag: page, api }) => {
    await page.locator('.job').filter({ hasText: 'Montera 4 uttag' }).click();
    await page.getByRole('button', { name: 'Ta bort' }).click();
    expect(api.db.elkoll_uppdrag).toHaveLength(4);
    await page.getByRole('button', { name: 'Tryck igen för att ta bort' }).click();
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect(page.locator('.job')).toHaveCount(1);
    await expect.poll(() => api.db.elkoll_uppdrag.length).toBe(3);
  });
});
