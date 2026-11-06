/**
 * The extension pages carry English text in the HTML as a fallback. These tests prove that
 * the text actually displayed comes from _locales/<language>/messages.json, by opening the
 * welcome page with a browser whose interface is not English.
 */

import path from 'node:path';
import { chromium, expect, test } from '@playwright/test';

const EXTENSION_DIR = path.join(import.meta.dirname, '..', 'build', 'chrome');

/** Opens the welcome page in a browser whose interface language is `lang`. */
async function openInLanguage(lang) {
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    locale: lang,
    args: [`--lang=${lang}`, `--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`]
  });
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const id = worker.url().split('/')[2];
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/welcome/welcome.html`);
  await page.locator('body[data-ready="true"]').waitFor();
  return { context, page };
}

test('French: every text of the page comes from the locale files', async () => {
  const { context, page } = await openInLanguage('fr');

  await expect(page.locator('html')).toHaveAttribute('lang', /^fr/);
  await expect(page).toHaveTitle('Comment fonctionne Tabs Pin');
  await expect(page.locator('.welcome-title')).toHaveText('Comment fonctionne Tabs Pin');
  await expect(page.locator('.welcome-intro')).toHaveText(
    'Enregistrez les sites que vous gardez toujours ouverts. Rouvrez-les en un clic, sans doublons.');
  await expect(page.locator('.step-title-text')).toHaveText([
    'Enregistrer une page',
    'Les rouvrir quand vous voulez',
    'Les garder séparés'
  ]);
  await expect(page.locator('.step-text')).toHaveText([
    "Ouvrez le popup de Tabs Pin et cliquez sur « Épingler l'onglet actuel ».",
    'Un clic les ramène en onglets épinglés, même après un redémarrage du navigateur.',
    'Une catégorie par projet, chacune avec son icône et ses onglets.'
  ]);
  await expect(page.locator('.welcome-privacy span')).toHaveText(
    'Tout reste dans votre navigateur : pas de compte, pas de serveur, pas de suivi.');
  await expect(page.locator('#openOptionsBtn')).toHaveText("Ouvrir la page d'options");
  await expect(page.locator('#closeBtn')).toHaveText("J'ai compris");

  await context.close();
});

test('Arabic: the same page is written right to left', async () => {
  const { context, page } = await openInLanguage('ar');

  await expect(page.locator('html')).toHaveAttribute('lang', /^ar/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.welcome-title')).toHaveText('كيف يعمل Tabs Pin');
  await expect(page.locator('.step-title-text')).toHaveText([
    'احفظ صفحة',
    'أعد فتحها وقتما شئت',
    'أبقِها منفصلة'
  ]);
  await expect(page.locator('#closeBtn')).toHaveText('فهمت');

  await context.close();
});
