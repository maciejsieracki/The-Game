'use strict';
// R-WEB-TEST-DEBT-Q12: wspolny wybor binarki Chromium dla testow live (Playwright executablePath).
// Kolejnosc: CHROME_PATH -> CHROMIUM_PATH -> /usr/bin/google-chrome -> /usr/bin/chromium.
// Brak kandydata = undefined (Playwright uzywa domyslnej przegladarki swojej instalacji).
const fs = require('fs');

function resolveChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.CHROMIUM_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  return candidates.find((p) => p && fs.existsSync(p)) || undefined;
}

module.exports = { resolveChromePath };
