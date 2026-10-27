const { test, expect, bild, flik } = require('./hjalp');
const { dag } = require('./mock');

async function oppnaKarta(page) {
  await flik(page, 'Karta');
  await expect(page.locator('#screen-karta')).toBeVisible();
  await expect(page.locator('#karta .leaflet-tile-loaded').first()).toBeVisible();
}

test.describe('Karta', () => {
  test('visar mina uppdrag idag som numrerade nålar', { annotation: { type: 'testfall', description: 'TC-KAR-01' } }, async ({ idag: page }) => {
    await oppnaKarta(page);
    await expect(page.locator('#karta-dag')).toHaveText('Idag');
    await expect(page.locator('.pin')).toHaveCount(2);
    await expect(page.locator('.pin')).toHaveText(['1', '2']);
    await expect(page.locator('#karta .pos-dot')).toHaveCount(1);
    await bild(page, 'Karta – dagens uppdrag');
  });

  test('Alla och byte av dag ändrar nålarna', { annotation: { type: 'testfall', description: 'TC-KAR-02' } }, async ({ idag: page }) => {
    await oppnaKarta(page);
    await page.locator('#karta-alla').click();
    await expect(page.locator('.pin')).toHaveCount(3);
    await page.locator('#karta-next').click();
    await expect(page.locator('#karta-dag')).not.toHaveText('Idag');
    await expect(page.locator('.pin')).toHaveCount(1);   // u4 geokodas när dagen visas
    await flik(page, 'Uppdrag');
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Alla' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-dag="' + dag(1) + '"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('tryck på nål visar kort med Navigera och Öppna', { annotation: { type: 'testfall', description: 'TC-KAR-03' } }, async ({ idag: page }) => {
    await oppnaKarta(page);
    await page.locator('.pin').first().click();
    const kort = page.locator('#karta-kort');
    await expect(kort).toBeVisible();
    await expect(kort).toContainText('Storgatan 12, Sundsvall');
    await expect(kort.getByRole('link', { name: 'Navigera' })).toHaveAttribute('href', /Storgatan%2012/);
    await bild(page, 'Karta – valt uppdrag');
    await kort.getByRole('link', { name: 'Öppna' }).click();
    await expect(page.locator('#screen-uppdrag')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Byta elcentral' })).toBeVisible();
  });

  test('nytt uppdrag får plats på kartan när det sparas', { annotation: { type: 'testfall', description: 'TC-KAR-04' } }, async ({ idag: page, api }) => {
    api.geo['kyrkogatan 7, sundsvall'] = { lat: 62.3901, lon: 17.3102 };
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await page.locator('#u-adress').fill('Kyrkogatan 7, Sundsvall');
    await page.locator('#u-uppgift').fill('Byta dimmer');
    await page.getByRole('button', { name: 'Spara uppdrag' }).click();
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect.poll(() => api.db.elkoll_uppdrag.find((u) => u.uppgift === 'Byta dimmer')).toMatchObject({ lat: 62.3901, lon: 17.3102 });
    await oppnaKarta(page);
    await expect(page.locator('.pin')).toHaveCount(3);
  });

  test('adress som inte hittas visas som saknar plats', { annotation: { type: 'testfall', description: 'TC-KAR-05' } }, async ({ idag: page, api }) => {
    api.db.elkoll_uppdrag.push({ id: 'u9', team_id: api.db.elkoll_team[0].id, fran: 'm-kalle', tilldelad: 'm-dennis', datum: dag(0), tid: '15:00', adress: 'Okänd väg 99', kund: null, telefon: null, portkod: null, uppgift: 'Kolla belysning', material: [], saknas: [], fritext: null, status: 'planerad', kommentar: null });
    await page.reload();
    await oppnaKarta(page);
    await expect(page.locator('.pin')).toHaveCount(2);
    await expect(page.locator('#karta-msg')).toHaveText('1 uppdrag saknar plats på kartan: Okänd väg 99');
  });
});
