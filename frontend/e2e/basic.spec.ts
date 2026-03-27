import { expect, test } from '@playwright/test';

test('input -> analyze -> score visible', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Metin Girişi').fill(
    'Bu sadece test amacli uzun bir metindir. En az yirmi karakter icermelidir.'
  );

  await page.getByRole('button', { name: 'Analiz Başlat' }).click();

  await expect(page.getByText('Güven Skoru')).toBeVisible();
});

