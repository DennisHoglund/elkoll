const { test, expect, bild } = require('./hjalp');
const { inloggad, M } = require('./mock');

test.describe('Teamet', () => {
  test('ny användare utan team kan skapa ett team', { annotation: { type: 'testfall', description: 'TC-TEAM-01' } }, async ({ page, api }) => {
    api.db.elkoll_team = [];
    api.db.elkoll_medlem = [];
    api.db.elkoll_uppdrag = [];
    await inloggad(page);
    await page.goto('./');
    await expect(page.locator('#screen-start')).toBeVisible();
    await page.getByRole('button', { name: 'Skapa team' }).click();
    await expect(page.locator('#team-msg')).toHaveText('Skriv företagets namn.');
    await page.getByLabel('Företagets namn').fill('Sundsvalls El AB');
    await page.getByLabel('Ditt namn').fill('Dennis Höglund');
    await page.getByLabel('Ditt mobilnummer').fill('070-000 00 01');
    await page.getByRole('button', { name: 'Skapa team' }).click();
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect(page.locator('#btn-team')).toHaveText('DH');
    expect(api.db.elkoll_team).toHaveLength(1);
    expect(api.db.elkoll_medlem[0]).toMatchObject({ namn: 'Dennis Höglund', epost: 'dennis@elkoll.se', telefon: '070-000 00 01' });
  });

  test('visar medlemmar med telefon och ringknapp', { annotation: { type: 'testfall', description: 'TC-TEAM-02' } }, async ({ idag: page }) => {
    await page.locator('#btn-team').click();
    await expect(page.locator('#screen-team')).toBeVisible();
    await expect(page.locator('.member')).toHaveCount(3);
    await expect(page.locator('.member').filter({ hasText: 'Dennis Höglund (du)' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ring Kalle Lind' })).toHaveAttribute('href', 'tel:0700000002');
    await expect(page.getByRole('button', { name: 'Ta bort Dennis Höglund' })).toHaveCount(0);
    await bild(page, 'Teamet');
  });

  test('lägga till en kollega', { annotation: { type: 'testfall', description: 'TC-TEAM-03' } }, async ({ idag: page, api }) => {
    await page.locator('#btn-team').click();
    await page.locator('#form-medlem').getByLabel('Namn', { exact: true }).fill('Sara Berg');
    await page.locator('#form-medlem').getByLabel('Mobilnummer').fill('070-000 00 09');
    await page.locator('#form-medlem').getByLabel('E-post').fill('Sara@Elkoll.se');
    await page.getByRole('button', { name: 'Lägg till' }).click();
    await expect(page.locator('#medlem-msg')).toHaveText('Sara Berg är tillagd. Tryck Skicka inbjudan för att meddela hen.');
    await expect(page.locator('.member')).toHaveCount(4);
    expect(api.db.elkoll_medlem.find((m) => m.namn === 'Sara Berg')).toMatchObject({ epost: 'sara@elkoll.se', telefon: '070-000 00 09' });
  });

  test('samma e-post kan inte läggas till två gånger', { annotation: { type: 'testfall', description: 'TC-TEAM-04' } }, async ({ idag: page, api }) => {
    await page.locator('#btn-team').click();
    await page.locator('#form-medlem').getByLabel('Namn', { exact: true }).fill('Kalle igen');
    await page.locator('#form-medlem').getByLabel('E-post').fill('kalle@elkoll.se');
    await page.getByRole('button', { name: 'Lägg till' }).click();
    await expect(page.locator('#medlem-msg')).toHaveText('Den e-posten finns redan i teamet.');
    expect(api.db.elkoll_medlem).toHaveLength(3);
  });

  test('ta bort kräver två tryck och gör kollegans uppdrag otilldelade', { annotation: { type: 'testfall', description: 'TC-TEAM-05' } }, async ({ idag: page, api }) => {
    await page.locator('#btn-team').click();
    const knapp = page.getByRole('button', { name: 'Ta bort Maria Sjö' });
    await knapp.click();
    expect(api.db.elkoll_medlem).toHaveLength(3);
    await expect(page.locator('.member').filter({ hasText: 'Maria' }).locator('button.confirm')).toHaveText('Ta bort?');
    await page.locator('.member').filter({ hasText: 'Maria' }).locator('button.confirm').click();
    await expect(page.locator('.member')).toHaveCount(2);
    expect(api.db.elkoll_uppdrag.find((u) => u.id === 'u3').tilldelad).toBeNull();
    await page.getByRole('link', { name: 'Uppdrag' }).click();
    await page.getByRole('button', { name: 'Alla' }).click();
    await expect(page.locator('.job').filter({ hasText: 'Felsöka jordfel' })).toContainText('Otilldelad');
  });

  test('skicka inbjudan öppnar sms med länk och rätt e-post', { annotation: { type: 'testfall', description: 'TC-TEAM-07' } }, async ({ idag: page }) => {
    await page.locator('#btn-team').click();
    const kalle = page.locator('.member').filter({ hasText: 'Kalle Lind' }).getByRole('link', { name: 'Skicka inbjudan' });
    const href = decodeURIComponent(await kalle.getAttribute('href'));
    expect(href.startsWith('sms:0700000002?&body=')).toBe(true);
    expect(href).toContain('Hej Kalle! Du är tillagd i Sundsvalls El AB i Elkoll');
    expect(href).toContain('http://127.0.0.1:4173/');
    expect(href).toContain('använd e-posten kalle@elkoll.se');
    expect(href).toContain('/Dennis');
    await expect(page.locator('.member').filter({ hasText: '(du)' }).getByRole('link', { name: 'Skicka inbjudan' })).toHaveCount(0);
  });
});
