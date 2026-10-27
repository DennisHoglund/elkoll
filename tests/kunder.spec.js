const { test, expect, bild } = require('./hjalp');

test.describe('Kundregister', () => {
  test('kundens namn föreslår och fyller i adress, telefon och portkod', { annotation: { type: 'testfall', description: 'TC-KUND-01' } }, async ({ idag: page }) => {
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await page.locator('#u-kund').fill('anna');
    const lista = page.locator('#forslag-kund');
    await expect(lista).toBeVisible();
    await expect(lista.locator('li')).toHaveCount(1);
    await expect(lista).toContainText('Anna Lindqvist');
    await expect(lista).toContainText('Storgatan 12, Sundsvall · 070-123 45 67');
    await lista.scrollIntoViewIfNeeded();
    await bild(page, 'Kundförslag', { hela: false });
    await lista.getByRole('button').click();
    await expect(page.locator('#u-adress')).toHaveValue('Storgatan 12, Sundsvall');
    await expect(page.locator('#u-kund')).toHaveValue('Anna Lindqvist');
    await expect(page.locator('#u-telefon')).toHaveValue('070-123 45 67');
    await expect(page.locator('#u-portkod')).toHaveValue('1234');
    await expect(lista).toBeHidden();
  });

  test('adressfältet föreslår tidigare adresser', { annotation: { type: 'testfall', description: 'TC-KUND-02' } }, async ({ idag: page }) => {
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await page.locator('#u-adress').fill('bergsg');
    const lista = page.locator('#forslag-adress');
    await expect(lista.locator('li')).toHaveCount(1);
    await expect(lista).toContainText('Bo');
    await lista.getByRole('button').click();
    await expect(page.locator('#u-adress')).toHaveValue('Bergsgatan 4, Sundsvall');
    await expect(page.locator('#u-kund')).toHaveValue('Bo');
    await expect(page.locator('#u-telefon')).toHaveValue('070-555 55 55');
  });

  test('inga förslag för okänd kund eller för kort text', { annotation: { type: 'testfall', description: 'TC-KUND-03' } }, async ({ idag: page }) => {
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await page.locator('#u-kund').fill('a');
    await expect(page.locator('#forslag-kund')).toBeHidden();
    await page.locator('#u-kund').fill('Zlatan');
    await expect(page.locator('#forslag-kund')).toBeHidden();
  });
});
