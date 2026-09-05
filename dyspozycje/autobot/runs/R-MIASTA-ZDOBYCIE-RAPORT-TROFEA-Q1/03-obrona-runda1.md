# R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — Obrona Operatora, runda 1 (druga faza rundy 1)

STATUS: DECISION_REQUIRED (zarzuty 2 i 3 naprawione w tej samej rundzie; zarzut 1 nienaprawialny w allowliście)
DOMAIN: GAME
TEMAT: R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1
GOAL: zgodny z 00-dispatch.md (GOAL 1–5).
MODEL+EFFORT: Opus 5, effort high.
BAZA: a09218ec; HEAD przed obroną d5c60057.

## OBRONA

**Zarzut 1 (regres `tools/eliminacja-lup-kwoty-test.cjs`) → PRZYJMUJĘ co do faktu,
ale naprawa jest poza moim mandatem — DO DECYZJI CZŁOWIEKA.**
Dowód, że regres jest realny: `node tools/eliminacja-lup-kwoty-test.cjs` → 6 FAIL (1a–1f)
i `ReferenceError: eliminatedDetails is not defined`, exit 1.
Dowód, że jest NIENAPRAWIALNY w tej rundzie: bramka szuka w `main.ts` literału
`` `${skarbiecText}${naukaText} ${outcome.techSkopiowane.length} tech(y) przejęte. Zdobycze Power: +${lostPower}.` ``
(`tools/eliminacja-lup-kwoty-test.cjs:74`) i asercjonuje go dosłownie (2a–2c, linie 105–130).
To DOKŁADNIE ten tekst, którego usunięcia żądają GOAL 2 pkt 2 i GOAL 5 pkt 4 dispatchu
(E3 „tech(y)", E4 „Power"). Przywrócenie literału = zielona stara bramka i FAIL GOAL 2;
przepisanie asercji = zmiana pliku POZA allowlistą. Sprzeczność jest w dispatchu, nie w wytworze —
rozstrzyga ją właściciel: (a) dopisać ten plik do allowlisty w rundzie 2, albo (b) świadomie
wycofać bramkę (jej sens — konkretne kwoty zamiast ogólników — niosą asercje 1b, 3c, 3f, 3g,
9-0c nowej bramki).

**Zarzut 2 (raport ofiary pokazuje stratę jako zieloną zdobycz) → PRZYJMUJĘ, poprawione.**
Zarzut był trafny: `main.ts` (przed poprawką linia 8164) brał `args.rows` (perspektywa zdobywcy, `+`/`gain`) także dla
`oldOwner === 0`. Poprawka: nowa czysta funkcja `mirrorCaptureReportRowsForVictim`
(`main.ts:1468-1472`, w BLOKU CZYSTYM) odwraca WYŁĄCZNIE prezentację — `gain`/`+N` → `loss`/`−N`;
pozycje już stratne i informacyjne bez zmian. `recordCityCaptureEvent` liczy `viewRows`
(`main.ts:8198-8200`) i podaje je i karcie, i mapie szczegółów; nagłówek listy to
`'Bilans zdobycia' | 'Bilans straty'` (`main.ts:8221`), przepuszczony do
`reportRowsHtml(opts.rows, opts.rowsTitle)` (`cityCaptureNotice.ts`).
Dowód z żywego Chromium (`dowody/05-modal-strata-ofiara.png`): „MIASTO UTRACONE / Gniezno /
Przejęte przez Rzym / BILANS STRATY / Ludność −4 / Budynki −3 / Złoto ze skarbca −1234",
wszystkie cztery wiersze w klasie `civ-ccn-row-loss`. Kontrola strony zdobywcy bez zmian:
`dowody/06-modal-zdobycie-kontrola.png` („BILANS ZDOBYCIA", +4/+3/+1234). Ekonomia nietknięta —
odwracany jest opis, nie liczby (asercja 11h: etykiety i kolejność identyczne).

**Zarzut 3 (drugie przejęcie w tej samej turze ginie) → PRZYJMUJĘ, poprawione.**
Klucz dedupu niesie teraz PARĘ WŁAŚCICIELI: `capture-<turn>-<cityId>-<oldOwner>-<newOwner>`
(`main.ts:8189-8190`). Trzy lejki jednego przejęcia podają identyczną parę (sprawdzone:
`applyCityCaptureToMap` woła `runCapitalCapturePlunder(city, oldOwner, atkOwner)` i rejestrator
z `newOwner: atkOwner`; `resolveSiegeSurrender` — ta sama para w obu wywołaniach), więc no-op
„pierwszy wygrywa" działa jak dotąd; odbicie w tej samej turze ma parę odwrotną i dostaje własny
wpis. Asercje 12b–12g.

## TESTY (po poprawkach, komplet z kryteriów końca)

- `tsc --noEmit` — 0 błędów.
- `tools/miasto-zdobycie-raport-test.cjs` — **95/95** (było 74; +21 asercji: sekcje 11 i 12).
- Nietautologiczność (trzy WŁASNE mutacje + przywrócenie, `git status` czysty po każdej):
  (a) klucz dedupu z powrotem bez pary właścicieli → 1 FAIL (12a);
  (b) `viewRows = args.rows` (bez lustra) → 1 FAIL (11k);
  (c) ciało lustra na `rows.map(r => ({...r}))` → **5 FAIL** (11b, 11c, 11d, 11e, 11j).
- Referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
- Rodzina capture/siege/elim: capital-capture 86/86, elimination-toast-merge 54/54,
  ai-city-capture 14, oblezenie 27/27, oblezenie-remis 271/271, oblezenie-siege-lifted 16/16,
  post-capture-law 25/25, siege-ai 17/17, siege-defenders 12/12, map-siege 6/6,
  mapa-etykieta-stolicy 47/47, capital-sep 3/3 i 36/36, _tmp-siege 11/11 — zielone.
  Czerwone z parytetem na bazie (NIE regres, liczby identyczne jak w rundzie 1 i u Evaluatora):
  `administracja-stolica` 52/1, `barb-city-capture-cluster` 92/1.
  `eliminacja-lup-kwoty` — patrz zarzut 1.
- Zrzuty obejrzane: `dowody/05`, `dowody/06` (render przez esbuild+Playwright z FAKTYCZNEGO
  `src/ui/cityCaptureNotice.ts`, katalog tymczasowy z sufiksem PID poza drzewem repo).

## ZMIANY/COMMIT

`gra/src/main.ts`, `gra/src/ui/cityCaptureNotice.ts`, `gra/tools/miasto-zdobycie-raport-test.cjs`,
`dyspozycje/autobot/runs/R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1/{03-obrona-runda1.md,dowody/05,06}`.
Wszystko w allowliście. `gra/src/game/capital-capture.ts` nadal NIETKNIĘTY.

## BLOKADY

1. Zarzut 1 — `tools/eliminacja-lup-kwoty-test.cjs` poza allowlistą, a jego asercje są
   sprzeczne z GOAL 2/GOAL 5 pkt 4. Wymagana decyzja właściciela (allowlista albo wycofanie).

RUNDY: 1/5 (obrona — druga faza tej samej rundy)
NASTĘPNY KROK: Final Control (werdykt per zarzut 1–3) + decyzja właściciela w sprawie zarzutu 1.
DEPLOY/PUSH: NIE WYKONANO
