'use strict';
// R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1: wspolne zamkniecie ekranu powitalnego (#civ-welcome-screen-root,
// dialog modalny z a3141e943) dla testow live. Ekran przechwytuje kliki w panele gry, wiec test bez
// jego zamkniecia nie moze kliknac kart stosu. Helper NIE zmienia logiki gry ani asercji: klika wylacznie
// przycisk „Zamknij” ekranu (data-cww="close") i czeka, az root zniknie. Zamkniecie moze otworzyc
// kolejny ekran pierwszego kontaktu (kolejna cywilizacja), dlatego petla sprawdza root ponownie.
const WELCOME_ROOT = '#civ-welcome-screen-root';

async function closeCivWelcome(page, maxRounds = 6) {
  let closed = 0;
  for (let i = 0; i < maxRounds; i += 1) {
    const open = await page.evaluate((sel) => !!document.querySelector(sel), WELCOME_ROOT);
    if (!open) return closed;
    await page.evaluate((sel) => {
      const b = document.querySelector(sel + ' [data-cww="close"]');
      if (b) b.click();
    }, WELCOME_ROOT);
    closed += 1;
    await page.waitForTimeout(150);
  }
  const stillOpen = await page.evaluate((sel) => !!document.querySelector(sel), WELCOME_ROOT);
  if (stillOpen) throw new Error('civ-welcome-screen nie zamknal sie po ' + maxRounds + ' probach');
  return closed;
}

module.exports = { closeCivWelcome, WELCOME_ROOT };
