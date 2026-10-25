const { test, expect, bild } = require('./hjalp');

test.describe('Tema', () => {
  test('temaknappen växlar Auto → Ljust → Mörkt och kommer ihåg valet', { annotation: { type: 'testfall', description: 'TC-TEM-01' } }, async ({ idag: page }) => {
    await page.locator('#btn-team').click();
    const knapp = page.locator('#btn-theme');
    await expect(knapp).toHaveText('Auto');
    await knapp.click();
    await expect(knapp).toHaveText('Ljust');
    await knapp.click();
    await expect(knapp).toHaveText('Mörkt');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.goto('./#idag');
    await expect(page.locator('.job').first()).toBeVisible();
    await bild(page, 'Mörkt läge');
  });
});
