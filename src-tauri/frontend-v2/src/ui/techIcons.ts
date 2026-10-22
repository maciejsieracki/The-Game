/**
 * Ikony 32 technologii Antyku (Claude Design, Zlecenie 7 — TECH-IKONY-32).
 * UWAGA: katalog docs/ux/ zostal usuniety z repo (R-REPO-SPRZATANIE-SREDNIE-Q1,
 * 2026-08-26). Sciezka nizej jest HISTORYCZNA — tresc: git show 39ae5d17:<sciezka>.
 * Zrodlo: docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/eksport/
 *   icons/tech/tech-<slug>.svg + tech-icon-map.json (klucz=slug -> name PL).
 * Line-art, stroke="currentColor" (dziedziczy kolor z CSS — zloto w drzewku),
 * viewBox 24. Wygenerowane programowo — NIE edytowac recznie, tylko przez
 * regeneracje ze zrodla (patrz dyspozycja Design).
 * Plik wygenerowany, nie kopiuje SVG jako osobnych assetow — inline w TS.
 */

/** Surowy SVG (viewBox 0 0 24 24) kluczowany po polskiej nazwie technologii z gra/data/tech.json. */
const TECH_ICON_SVG_BY_NAME: Readonly<Record<string, string>> = {
  'Astronomia': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.6"></circle><ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(-18 12 12)"></ellipse><path d="M19.5 4.5v.01M4 18.5v.01"></path></svg>',
  'Brązownictwo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 4h9l-1.3 5.2a3.4 3.4 0 0 1-6.4 0L7.5 4Z"></path><path d="M5 6.5h2M17 6.5h2"></path><path d="M12 12.5v2.3"></path><path d="M8.5 18.5h7l1.2 2.5H7.3Z"></path></svg>',
  'Budownictwo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 5.5h9M8.5 3h7"></path><path d="M9.5 5.5V18M12 5.5V18M14.5 5.5V18"></path><path d="M7.5 18h9M6 21h12"></path></svg>',
  'Drogi brukowane': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 4 5.5 20M14.8 4l3.7 16"></path><path d="M12 5.5v2.2M12 11v2.8M12 17v3"></path></svg>',
  'Filozofia': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12.5h10l-.9 3.2c-.3 1-1.2 1.8-2.3 1.8h-3.6c-1.1 0-2-.8-2.3-1.8Z"></path><path d="M12 17.5v2M9.3 21h5.4"></path><path d="M12 10.5c1.2-1.1 1.5-2.4.8-3.9-.8.3-1.3.9-1.5 1.6-.3-.5-.4-1-.2-1.7-1.4 1.3-1.1 2.9.9 4Z"></path></svg>',
  'Garncarstwo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h6"></path><path d="M10.5 3v2M13.5 3v2"></path><path d="M9.5 5c-1.4 2.8-1.4 5.7 0 8.5.5 1 .4 2.2-.6 3.5h6.2c-1-1.3-1.1-2.5-.6-3.5 1.4-2.8 1.4-5.7 0-8.5"></path><path d="M9.1 7.3c-1.7.3-2.4 2.5-.5 3.2M14.9 7.3c1.7.3 2.4 2.5.5 3.2"></path></svg>',
  'Gospodarka wodna': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18"></path><path d="M4.5 15.5v-4a2.4 2.4 0 0 1 4.8 0v4M9.6 15.5v-4a2.4 2.4 0 0 1 4.8 0v4M14.7 15.5v-4a2.4 2.4 0 0 1 4.8 0v4"></path><path d="M3 15.5h18"></path><path d="M6 20c1.6-1.1 3.4-1.1 5 0s3.4 1.1 5 0"></path></svg>',
  'Handel': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 8.2C6.8 10 5.2 12.4 5.2 15c0 3.1 2.7 5.2 6.8 5.2s6.8-2.1 6.8-5.2c0-2.6-1.6-5-4-6.8"></path><path d="M9.2 8.2c-.3-1.6.4-2.9 1.3-3.7h3c.9.8 1.6 2.1 1.3 3.7Z"></path><path d="M12 11.5v5.5M10 13.2h4"></path></svg>',
  'Hutnictwo żelaza': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 20v-8.5a6.5 6.5 0 0 1 13 0V20"></path><path d="M9.8 20v-3.6a2.2 2.2 0 0 1 4.4 0V20"></path><path d="M3.5 20h17"></path><path d="M6.8 4.4 5.9 3.5M17.2 4.4l.9-.9"></path></svg>',
  'Inżynieria': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.4"></circle><path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M17.3 6.7l-1.4 1.4M8.1 15.9l-1.4 1.4"></path></svg>',
  'Jeździectwo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 18.5c.8-4.6 3.3-7.2 7.5-7.9l4.6-1.5 2.4-3.1.9 3.1-1.7 2.5v6.9"></path><path d="M7.3 20l1-2.8M15.5 20l.8-2.6"></path><path d="M13.5 11.5l3.3 3.2"></path></svg>',
  'Kodeks': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20.5v-14c0-1.7 1.3-3 3-3h6c1.7 0 3 1.3 3 3v14Z"></path><path d="M9 8h6M9 11.5h6M9 15h6M9 18h3.5"></path></svg>',
  'Koło': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="1.6"></circle><path d="M12 4v6.4M12 13.6V20M4 12h6.4M13.6 12H20M6.6 6.6l4.3 4.3M13.1 13.1l4.3 4.3M17.4 6.6l-4.3 4.3M10.9 13.1l-4.3 4.3"></path></svg>',
  'Łowiectwo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5 16.5 7.5"></path><path d="M14.6 5.4 19 4l-1.4 4.4-3-3Z"></path><circle cx="18.2" cy="17.8" r="1.6"></circle><path d="M15.4 14.6v.01M18.2 13.6v.01M21 14.6v.01"></path></svg>',
  'Łucznictwo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4c5.5 2.3 5.5 13.7 0 16"></path><path d="M7 4v16"></path><path d="M7 12h11.5"></path><path d="M18.5 12l-2.6-1.8M18.5 12l-2.6 1.8"></path></svg>',
  'Matematyka': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.5"></circle><path d="M12 2.2v1.3"></path><path d="M12 6.5 7 19M12 6.5l5 12.5"></path><path d="M7.8 16.5a8.6 8.6 0 0 0 8.4 0"></path></svg>',
  'Medycyna': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.5V21"></path><circle cx="12" cy="3.8" r="1.2"></circle><path d="M12 7.5c-2.7 0-2.7 3.4 0 3.4s2.7 3.4 0 3.4-2.7 3.4 0 3.4"></path></svg>',
  'Mistycyzm': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12.2c0-.9.7-1.6 1.6-1.6.9 0 1.7.7 1.7 1.7 0 1.7-1.5 3-3.3 3-2.6 0-4.7-2.1-4.7-4.7C7.3 7.3 10 5 13.2 5c4 0 6.8 3 6.8 6.8"></path><path d="M4.5 6v.01M6 17.5v.01M18.5 18v.01"></path></svg>',
  'Murarstwo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6.5" width="18" height="11" rx="1"></rect><path d="M3 10.2h18M3 13.8h18M9 6.5v3.7M15 6.5v3.7M6.5 10.2v3.6M12.5 10.2v3.6M18 10.2v3.6M9 13.8v3.7M15 13.8v3.7"></path></svg>',
  'Oblężnictwo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="18" r="2.1"></circle><circle cx="15.5" cy="18" r="2.1"></circle><path d="M4 15.5h16.5"></path><path d="M8.5 15.5 17 5.5"></path><path d="M17 5.5a2.3 2.3 0 1 0 2.6 3.4"></path><path d="M20.5 3.5v.01"></path></svg>',
  'Obróbka drewna': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6 5 15.5"></path><path d="M13.5 4.2l5.2 5.2-3.1 1.4-3.5-3.5Z"></path><path d="M4 19.5h7M6 17.3h3.5"></path></svg>',
  'Obróbka żelaza': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h15.5c-1 2.3-3.2 3.6-6.2 3.8v3l2.6 2.4v2H8.1v-2l2.6-2.4v-3C7.6 11 5.2 9.7 4 7.5Z"></path><path d="M19.5 4.5v.01M21 6v.01"></path></svg>',
  'Oswojenie zwierząt': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 5c.8 3.4 3.2 5.2 6 5.2h3c2.8 0 5.2-1.8 6-5.2"></path><path d="M9.3 10.2c-.6 2-.2 4 1.2 5.6L12 17.5l1.5-1.7c1.4-1.6 1.8-3.6 1.2-5.6"></path><path d="M10.4 13.6v.01M13.6 13.6v.01"></path></svg>',
  'Pismo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="3.5" width="11" height="17" rx="1.2"></rect><path d="M8.5 7.5h4M8.5 11h5.5M8.5 14.5h4.5"></path><path d="M15.5 20.5 21 15l-1.8-1.8-5.5 5.5-.5 2.3Z"></path></svg>',
  'Prawo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5v3"></path><path d="M5.5 7.5h13"></path><path d="M5.5 7.5 3.2 12.5h4.6Z"></path><path d="M3.2 12.5a2.3 2.3 0 0 0 4.6 0"></path><path d="M18.5 7.5l-2.3 5h4.6Z"></path><path d="M16.2 12.5a2.3 2.3 0 0 0 4.6 0"></path><path d="M12 7.5V19M8.8 19h6.4"></path></svg>',
  'Religia': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5 12 4l8 5.5"></path><path d="M5 9.5h14"></path><path d="M6.5 9.5V18M10.2 9.5V18M13.8 9.5V18M17.5 9.5V18"></path><path d="M4.5 18h15M3.5 20.5h17"></path></svg>',
  'Rolnictwo': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V6.5"></path><path d="M12 10.5C9.8 10 8.3 8.6 8 6.3c2.3.4 3.7 1.8 4 4.2ZM12 10.5c2.2-.5 3.7-1.9 4-4.2-2.3.4-3.7 1.8-4 4.2ZM12 15c-2.2-.5-3.7-1.9-4-4.2 2.3.4 3.7 1.8 4 4.2ZM12 15c2.2-.5 3.7-1.9 4-4.2-2.3.4-3.7 1.8-4 4.2Z"></path><path d="M12 6.5c-.7-.9-.9-2-.4-3.2.9.4 1.3 1.2 1.3 2.2"></path></svg>',
  'Sztuka wojenna': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20.5v-8.3a5 5 0 0 1 10 0v8.3"></path><path d="M9.4 12.2h1.7M12.9 12.2h1.7M12 12.2v4.3"></path><path d="M7.6 8.2C8.6 4.9 10.1 3.2 12 3.2s3.4 1.7 4.4 5"></path></svg>',
  'Waluta': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="12.5" r="6"></circle><path d="M9.5 9.7v5.6"></path><path d="M13.6 6.8a6 6 0 0 1 6.9 8.5 6 6 0 0 1-3 3.1"></path></svg>',
  'Wojskowość': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3.8v4.9c0 4.2-2.9 6.9-7 9.3-4.1-2.4-7-5.1-7-9.3V6.8Z"></path><path d="M12 7v7M9.8 9.2h4.4"></path></svg>',
  'Wymiana': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 9h12.5l-3-3"></path><path d="M19.5 15H7l3 3"></path></svg>',
  'Żegluga': '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 15h17l-2.8 4H6.3Z"></path><path d="M12 15V4"></path><path d="M12 4.5c3.8 1.8 5 4.6 5 8h-5"></path><path d="M12 7.5c-2.3 1.2-3.3 2.9-3.5 5h3.5"></path></svg>',
};

/**
 * SVG ikony technologii wg dokladnej polskiej nazwy (pole "Technologia" w tech.json).
 * @param nazwaTechnologii dokladna nazwa PL, np. "Bra\u017cownictwo", "Ob\u00f3bka drewna".
 * @param sizePx opcjonalny rozmiar (px) — ustawia width/height na elemencie <svg>.
 * @returns znacznik <svg> (string) albo null, gdy brak ikony dla danej nazwy.
 */
export function techIconSvg(nazwaTechnologii: string, sizePx?: number): string | null {
  const raw = TECH_ICON_SVG_BY_NAME[nazwaTechnologii];
  if (!raw) return null;
  if (sizePx == null) return raw;
  let out = raw;
  if (/\swidth="[^"]*"/.test(out)) {
    out = out.replace(/\swidth="[^"]*"/, ` width="${sizePx}"`);
  } else {
    out = out.replace('<svg ', `<svg width="${sizePx}" `);
  }
  if (/\sheight="[^"]*"/.test(out)) {
    out = out.replace(/\sheight="[^"]*"/, ` height="${sizePx}"`);
  } else {
    out = out.replace('<svg ', `<svg height="${sizePx}" `);
  }
  return out;
}

/** True, jesli istnieje ikona dla podanej nazwy technologii. */
export function hasTechIcon(nazwaTechnologii: string): boolean {
  return Object.prototype.hasOwnProperty.call(TECH_ICON_SVG_BY_NAME, nazwaTechnologii);
}

