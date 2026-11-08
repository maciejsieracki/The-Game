STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-HUD-NUMBER-ABBREV-Q1
GOAL: Skracanie liczb >= 1000 do „k"/„M" z jednym miejscem po przecinku (PL) w pasku zasobów i oczywistych miejscach HUD, jedną wspólną funkcją, z pełną wartością w title/aria-label.

ZMIANY/COMMIT: 62884e25f (commit zawiera też ten raport). Pliki (allowlista, jawny git add):
- NOWY gra/src/ui/formatCompactNumber.ts: `formatCompactNumber`, `formatCompactSigned`, `formatFullNumber`, `exactCompactNote`. Half-up na |n|, awans „1000k" -> „1M" (999 950 -> „1M"), < 1000 bez zmian, NaN/±Inf/undefined/null -> „0" (ZAŁOŻENIE: ten sam fallback co `formatLiczbaPl`).
- gra/src/ui/hud.ts: żetony Skarbiec/Praca/Spichlerz/Nauka/Armia/Miasta/Obywatele/Kultura/Religia/Handel przez `cn()`; usunięte nieużywane `formatFoodHudLabel`; `ensureStyles` dostał `export` (wyłącznie dla bramki pomiaru układu, zero zmiany zachowania).
- gra/src/ui/hudChip6c.ts: opcja `exact` -> dopisek „Dokładnie: 20 860 (+1 257)" w `title` i `aria-label` (tylko gdy coś skrócono).
- gra/src/ui/cityPanel.ts: „Rekruci: dostępne" (panel Rekrutacja) -> „71,7k" + pełna liczba w title/aria-label.
- gra/src/ui/empireDetailPanel.ts: `formatRawCount` od 1000 -> skrót (Skarbiec/Manpower w panelu masowej rekrutacji).
- gra/src/ui/diplomacyTradeBasket.ts: lokalny `formatCompactQty` deleguje do wspólnej funkcji (usunięta duplikacja; zapis „1,2k" zamiast „1.2k").
- NOWY gra/tools/hud-number-abbrev-test.cjs.
- Dowody: dyspozycje/autobot/runs/R-WEB-HUD-NUMBER-ABBREV-Q1/ (gate-*.txt, regresja-po-lista.txt, po-/przed-{360,1920}.png).

TESTY:
- hud-number-abbrev-test.cjs: EXIT=0 (gate-abbrev-test.txt). Tabela graniczna (0, 999, 1000, 1049, 1050, 1250, 20860, 99949, 99950, 999499, 999500, 999950, 1250000, ujemne, NaN/Infinity/undefined/null), wiring statyczny, prawdziwy `renderBarD1B` w Chromium z realnym CSS: Skarbiec „204"/„+1,3k", Praca „3k"/„+1,2k", Spichlerz „20,9k"/„+1,3k", Nauka „2,4k"/„+1,4k"; title/aria zawierają „Dokładnie: 20 860 (+1 257)".
- Mutacje łamią test: floor zamiast round (FAIL 15), brak awansu jednostki (FAIL 7), utrata znaku (FAIL 4), zły fallback (FAIL 8).
- Układ: 1920 px pasek lewy PO 779 px vs PRZED (pełne liczby) 809 px; 360 px identycznie (maxRight 885 = istniejące zachowanie paska, poza zakresem). Brak poziomego scrolla strony (sw = szerokość okna).
- tsc `node ./node_modules/typescript/bin/tsc --noEmit` EXIT=0 (gate-tsc.txt).
- Regresje HUD/zasobów/rekrutacji/formatów/handlu/empire/manpower (61 testów `tools/*hud*`, `*resource*`, `*recruit*`, `*topbar*`, `*format*`, `*trade-basket*`, `*empire-detail*`, `*empire-mass*`, manpower-test) PO: 61/61 EXIT=0 (regresja-po-lista.txt). PRZED: NIE_URUCHOMIONO (PO bez porażek, więc brak testów do porównania/aktualizacji; żaden test nie wymagał zmiany).

BLOKADY: brak. Uwagi (NIE zmienione, poza allowlistą `gra/src/ui/*`):
- `formatPopulationAbs`/`formatManpower` w gra/src/game/manpower.ts:890 nadal daje „tys."/„mln" (karty jednostek, etykieta „Rekruci" w HUD z main.ts:17771/20299, panel miasta). Zmiana wymaga rozszerzenia allowlisty (osobny temat).
- `buildChipDeltaStockHtml` (gra/src/game/empire-hud-totals.ts:90) — trzeci element „(N)" zapasu w chipach paska miasta, poza allowlistą; wartości „big" per-miasto w cityPanel.ts nieskrócone (rzadko > 1000).
- renderBarLegacy w hud.ts nietknięty (NIE_ZMIERZONO, czy w użyciu).
- Znaczniki na mapie (render/*) i karty liczebności armii: nie zmieniane (brak wspólnej funkcji formatującej w ui/).
- WIADOMOŚĆ WŁAŚCICIELA w kontekście zadania (kolejność kolejek rekrutacji wg epok) — adresowana do orkiestratora, NIE wykonana (poza dispatchem R-WEB-HUD-NUMBER-ABBREV-Q1). Do osobnego tematu.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ten sam temat ID), kontrola zrzutów i nowych miejsc użycia.
DEPLOY/PUSH: NIE WYKONANO
