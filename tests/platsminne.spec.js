const { test, expect, bild } = require('./hjalp');
const { dag, M } = require('./mock');

function besok(api, extra) {
  return Object.assign({ team_id: api.db.elkoll_team[0].id, fran: M.kalle, tilldelad: M.maria, tid: '09:00', kund: 'Anna Lindqvist', telefon: null, portkod: null, material: [], saknas: [], fritext: null, status: 'klar' }, extra);
}

test.describe('Platsminne', () => {
  test('visar tidigare besök på samma adress med anteckningar', { annotation: { type: 'testfall', description: 'TC-MIN-01' } }, async ({ idag: page, api }) => {
    // Skrivet utan mellanslag och med postnummer – ska ändå räknas som samma adress
    api.db.elkoll_uppdrag.push(besok(api, { id: 'gammal', datum: dag(-120), adress: 'storgatan12, 852 30 Sundsvall', lat: 59.0, lon: 15.0, uppgift: 'Felsöka säkringar', kommentar: 'Elcentralen sitter i hallgarderoben.' }));
    // Samma gata i en annan ort ska inte räknas
    api.db.elkoll_uppdrag.push(besok(api, { id: 'annan-ort', datum: dag(-30), adress: 'Storgatan 12, Härnösand', lat: 62.6323, lon: 17.9379, uppgift: 'Byta uttag', kommentar: null }));
    await page.locator('.job').filter({ hasText: 'Byta elcentral' }).click();
    const minne = page.locator('#platsminne details');
    await expect(minne.locator('summary')).toHaveText('Varit här förut: 1 besök');
    await minne.locator('summary').click();
    await expect(minne.locator('li')).toHaveCount(1);
    await expect(minne).toContainText('Felsöka säkringar');
    await expect(minne).toContainText('Maria Sjö · Klar');
    await expect(minne).toContainText('Elcentralen sitter i hallgarderoben.');
    await bild(page, 'Platsminne');
  });

  test('öppna ett gammalt besök från platsminnet', { annotation: { type: 'testfall', description: 'TC-MIN-02' } }, async ({ idag: page, api }) => {
    api.db.elkoll_uppdrag.push(besok(api, { id: 'gammal', datum: dag(-120), adress: 'Storgatan 12, Sundsvall', lat: null, lon: null, uppgift: 'Felsöka säkringar', kommentar: 'Elcentralen sitter i hallgarderoben.' }));
    await page.locator('.job').filter({ hasText: 'Byta elcentral' }).click();
    await page.locator('#platsminne summary').click();
    await page.locator('#platsminne li a').click();
    await expect(page.getByRole('heading', { name: 'Felsöka säkringar' })).toBeVisible();
    await expect(page.getByLabel('Anteckningar')).toHaveValue('Elcentralen sitter i hallgarderoben.');
    await expect(page.locator('#platsminne summary')).toHaveText('1 annat besök på adressen');
  });

  test('inget platsminne första gången på en adress', { annotation: { type: 'testfall', description: 'TC-MIN-03' } }, async ({ idag: page }) => {
    await page.locator('.job').filter({ hasText: 'Byta elcentral' }).click();
    await expect(page.locator('#dokumentation')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.locator('#platsminne details')).toHaveCount(0);
  });
});
