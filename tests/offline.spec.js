const { test, expect, bild, flik } = require('./hjalp');
const { dag } = require('./mock');

test.describe('Offline', () => {
  test('uppdrag sparas i telefonen utan täckning och skickas sedan', { annotation: { type: 'testfall', description: 'TC-OFF-01' } }, async ({ idag: page, api, context }) => {
    await context.setOffline(true);
    api.nere = true;
    await page.getByRole('link', { name: 'Nytt uppdrag' }).click();
    await page.locator('#u-adress').fill('Källargatan 1, Sundsvall');
    await page.locator('#u-uppgift').fill('Dra ny kabel i källare');
    await page.getByRole('button', { name: 'Spara uppdrag' }).click();
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect(page.locator('#toast')).toHaveText('Sparat i telefonen – skickas när du har täckning');
    await expect(page.locator('#queue-badge')).toHaveText('1 väntar');
    await expect(page.locator('.job').filter({ hasText: 'Dra ny kabel' })).toContainText('Väntar på täckning');
    await bild(page, 'Sparat utan täckning');

    api.nere = false;
    await context.setOffline(false);
    await expect(page.locator('#queue-badge')).toBeHidden();
    await expect.poll(() => api.db.elkoll_uppdrag.some((u) => u.uppgift === 'Dra ny kabel i källare' && u.datum === dag(0))).toBe(true);
  });

  test('visar senast hämtade uppdrag utan täckning', { annotation: { type: 'testfall', description: 'TC-OFF-02' } }, async ({ idag: page, api, context }) => {
    api.nere = true;
    await page.reload();
    await expect(page.locator('#screen-idag')).toBeVisible();
    await expect(page.locator('.job')).toHaveCount(2);
    await flik(page, 'Mer');
    await expect(page.locator('#mer-avatar')).toHaveText('DH');
  });
});
