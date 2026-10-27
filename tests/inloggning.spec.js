const { test, expect, bild, flik } = require('./hjalp');
const { ANVANDARE, LOSENORD } = require('./mock');

test.describe('Inloggning', () => {
  test('visar inloggningen när man inte är inloggad', { annotation: { type: 'testfall', description: 'TC-INL-01' } }, async ({ page, api }) => {
    await page.goto('./');
    await expect(page.locator('#view-login')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Elkoll' })).toBeVisible();
    await expect(page.locator('#view-app')).toBeHidden();
    await bild(page, 'Inloggningssidan');
  });

  test('fel lösenord ger ett tydligt felmeddelande', { annotation: { type: 'testfall', description: 'TC-INL-02' } }, async ({ page, api }) => {
    await page.goto('./');
    await page.locator('#email').fill(ANVANDARE.email);
    await page.locator('#password').fill('fel-losenord');
    await page.getByRole('button', { name: 'Logga in' }).click();
    await expect(page.locator('#login-msg')).toHaveText('Fel e-post eller lösenord.');
    await expect(page.locator('#login-msg')).toHaveClass(/error/);
  });

  test('ogiltig e-post stoppas innan något skickas', { annotation: { type: 'testfall', description: 'TC-INL-03' } }, async ({ page, api }) => {
    await page.goto('./');
    await page.locator('#email').fill('inte-en-adress');
    await page.locator('#password').fill(LOSENORD);
    await page.getByRole('button', { name: 'Logga in' }).click();
    await expect(page.locator('#login-msg')).toHaveText('Ange en giltig e-postadress.');
    expect(api.anrop.filter((a) => a.sokvag.startsWith('/auth/v1/token'))).toHaveLength(0);
  });

  test('rätt uppgifter loggar in och visar dagens uppdrag', { annotation: { type: 'testfall', description: 'TC-INL-04' } }, async ({ page, api }) => {
    await page.goto('./');
    await page.locator('#email').fill(ANVANDARE.email);
    await page.locator('#password').fill(LOSENORD);
    await page.getByRole('button', { name: 'Logga in' }).click();
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect(page.locator('.job')).toHaveCount(2);
    await flik(page, 'Mer');
    await expect(page.locator('#mer-avatar')).toHaveText('DH');
  });

  test('inloggningen finns kvar efter omladdning', { annotation: { type: 'testfall', description: 'TC-INL-05' } }, async ({ idag: page }) => {
    await page.reload();
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect(page.locator('#view-login')).toBeHidden();
  });

  test('logga ut tar en tillbaka till inloggningen', { annotation: { type: 'testfall', description: 'TC-INL-06' } }, async ({ idag: page }) => {
    await flik(page, 'Mer');
    await page.locator('#screen-mer').getByRole('button', { name: 'Logga ut' }).click();
    await expect(page.locator('#view-login')).toBeVisible();
  });

  test('ny kollega kan skapa konto och hamnar på välkomstsidan', { annotation: { type: 'testfall', description: 'TC-INL-07' } }, async ({ page, api }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Ny här? Skapa konto' }).click();
    await page.locator('#email').fill('sara@elkoll.se');
    await page.locator('#password').fill('kort');
    await page.getByRole('button', { name: 'Skapa konto' }).click();
    await expect(page.locator('#login-msg')).toHaveText('Välj ett lösenord med minst 8 tecken.');
    await page.locator('#password').fill('langtlosenord1');
    await page.getByRole('button', { name: 'Skapa konto' }).click();
    await expect(page.locator('#screen-start')).toBeVisible();
    await expect(page.locator('#start-email')).toContainText('sara@elkoll.se');
    expect(api.signup.email).toBe('sara@elkoll.se');
    await bild(page, 'Välkommen – inte med i något team än');
  });
});
