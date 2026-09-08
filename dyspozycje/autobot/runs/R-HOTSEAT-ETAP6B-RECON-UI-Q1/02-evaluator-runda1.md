# R-HOTSEAT-ETAP6B-RECON-UI-Q1 — Evaluator runda 1

**Metoda:** niezależny świeży `grep -n -E "ownerId\s*(===|!==)\s*0\b"` na `gra/src/main.ts`
(36530 linii, potwierdzone) i `gra/src/ui/*.ts` w tym samym worktree, plus `Read`/`sed`
punktowe każdego spornego miejsca (nie z pamięci, nie z raportu Operatora). Potwierdzone
zgodnie z raportem: 276 trafień main.ts, 14 w `ui/*.ts` (11 kod + 3 komentarze — dokładnie
te same linie V1-V11 co Operator), `switchActiveHuman` @ 10426, `function isMe` = 0
wystąpień, brak importu `human-owners.ts` w `ui/*.ts`, dokładna zgodność 20 zmiennych
`_last*`/KROK 5 (`main.ts:10531-10534`) z zerowaniem, klaster U9/H (`21528`/`21538`
canMerge/canSplit) zweryfikowany `Read` — poprawnie wykluczony jako input. Extra
`extraCityPanelConfig` (6857-7451, 6 trafień) i commit-diff (`git show --stat`, tylko
dokument recon) — zgodne z raportem.

## ZARZUTY

**1. [ISTOTNY] §4 — twierdzenie "żadna z 20 zmiennych `_last*` nie zawiera własnego
literału `ownerId`" jest fałszywe; pominięty trzeci write-site cache.**
Miejsce: `main.ts:29464` — `_lastLudnoscRate = cities.filter(c => c.ownerId === 0)...` —
wewnątrz `runWorldEndTurn()` (28957-33313), NIE wewnątrz `refreshLiveEmpireRatesUnsafe()`
(U2, 17232-17395) ani `updateHud()` (U1). To jest bezpośredni literał `ownerId === 0`
przypisujący DO zmiennej cache. Dodatkowo w tym samym bloku (`29405-29411`, `29608-29612`)
`runWorldEndTurn()` zasila `_lastPracaRate/_lastKultura/_lastPieniadzRate/_lastNaukaRate/
_lastKulturaRate/_lastBogactwoHandel/_lastBogactwoUtrzymanieBudynkow/Jednostek/Surowcow/
_lastBogactwoRate` przez `playerEcon = sumEconomyForPlayerCities(econ, cities)` (linia
29403) oraz `econ.upkeepByOwner.get(0)`/`econ.resourceUpkeepByOwner.get(0)` (`29578`,
`29611`) — sztywno zahardkodowane na właściciela 0, poza wszelką kontrolą U1/U2. Narusza
to konkluzję §4 "migracja funkcji zasilających (U1, U2) wystarczy" — jest TRZECI, w ogóle
nie zinwentaryzowany write-site, który po migracji U1/U2 na `isMe`/`ME()` nadal będzie co
turę nadpisywał cache twardo dla fotela 0, niezależnie od tego, kto jest dziś aktywnym
człowiekiem. Ma to znaczenie: cache po handoffie zerowany jest (Etap 5 KROK 5), ale
`runWorldEndTurn()` odpala się PRZED końcem tury aktywnego fotela i wpisuje dane fotela 0
— jeśli aktywny fotel to 1, cache przez resztę wyświetlania (do najbliższego zerowania)
pokazuje dane NIEWŁAŚCIWEGO gracza. Operator zweryfikował tylko punktowe przykłady
(`main.ts:4154,12563,17549,26499,35419`) — próbka ominęła cały blok `runWorldEndTurn`.

**2. [ŚREDNI] Niespójne traktowanie granicy (b)/(c): komunikaty HUD osadzone w tickach
ekonomii/rebelii pominięte całkowicie, mimo że strukturalnie identyczne z flagowanym
`extraCityPanelConfig`.**
Miejsca: `main.ts:10091` (`if (showPlayerHints && u.ownerId === 0) { ... showHintMessage(...) }`),
`main.ts:29333`+`29379-29382` (`tick.ownerId===0` → `showHintMessage('Głód: utracono...')`),
analogiczny wzorzec przy `29787`/`29832` (bunt/niepokoje). Wszystkie trzy to bezpośrednie
bramkowanie WYŚWIETLENIA komunikatu (toastu) człowiekowi po `ownerId===0` — czysta
kategoria (b) UI wg definicji z dispatchu ("Panel/HUD/lista/tooltip pokazuje dane →
isMe/ME()"), analogicznie do `extraCityPanelConfig`, które Operator świadomie wyodrębnił
jako granicę (b)/(c) z uzasadnieniem. Tu identyczny wzorzec (UI-decyzja wewnątrz kodu
ekonomii/tury) nie został ani policzony w 78, ani wymieniony w granicznych 17 — po prostu
nieobecny w dokumencie. Osłabia to kompletność inwentaryzacji: co najmniej te 3+ miejsca
(prawdopodobnie więcej — `showHintMessage` ma 308 wystąpień w pliku, nie wszystkie
przeszukane pod kątem gałęzi `ownerId===0`) nie są rozliczone ani jako (b), ani jako
świadomie wykluczone.

## Ocena reszty

Klastry U1-U14/V1-V11, linie, rozliczenie „~75"→78, wykluczenie canMerge/canSplit
(21528/21538) jako klaster H Etapu 6a, `extraCityPanelConfig` (6857-7451, 6 trafień) i
11 funkcji-akcesorów jako granica (b)/(c) — wszystko zweryfikowane świeżo i zgodne z
kodem. Plan dowodu no-op (Chromium, brak wyjątku headless) — uzasadniony poprawnie,
kategoria jest w całości DOM-bound. Dokument nie dotyka `gra/` (`git show --stat`
potwierdza jeden plik, sam recon).

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6B-RECON-UI-Q1
GOAL: Recon-only (zero kodu) kategorii UI Etapu 6 — kompletna inwentaryzacja + rozliczenie z ~75 + plan no-op
MODEL+EFFORT: sonnet-5, effort medium/high (Evaluator, weryfikacja niezależna świeżym grepem/Read)
TESTY: Niezależny `grep -n -E "ownerId\s*(===|!==)\s*0\b"` main.ts (276) + ui/*.ts (14/11 kod),
`Read`/`sed` punktowy: `runWorldEndTurn` 28957-33313 (31 trafień, w tym write-site cache
pominięty w §4), `extraCityPanelConfig` 6792-7451 (6 trafień, zgodne), `canMerge`/`canSplit`
21520-21545 (zgodne), `_last*` deklaracje 10684-10790 (20 zmiennych, zgodne), KROK 5
10520-10540 (zgodne), `git show --stat HEAD` (docs-only, zgodne).
BLOKADY: brak formalnych (dokument nie narusza allowlisty/izolacji) — 2 zarzuty merytoryczne
do poprawy treści dokumentu (dopisanie/skorygowanie §4 i uzupełnienie granicznych pozycji
o komunikaty HUD w tickach), nie wymagają nowego grepu całości, tylko uzupełnienia analizy.
RUNDY: 1/5
ZARZUTY:
1. §4 fałszywe twierdzenie o braku literału `ownerId` w zmiennych `_last*` — pominięty
   write-site `runWorldEndTurn()` (main.ts:29403-29612), podważa konkluzję o
   wystarczalności migracji U1/U2 dla cache.
2. Niekompletne rozliczenie granicy (b)/(c): komunikaty HUD (`showHintMessage`) bramkowane
   `ownerId===0` wewnątrz ticków ekonomii/głodu/buntu (main.ts:10091, 29333/29379-29382,
   29787/29832) nieobecne w dokumencie — ani w 78, ani w granicznych 17.
NASTĘPNY KROK: Operator runda 2 — uzupełnić §4 (jawnie wskazać `runWorldEndTurn()` jako
dodatkowy write-site cache i skorygować konkluzję) oraz dopisać komunikaty HUD w tickach
jako pozycję graniczną (b)/(c) analogiczną do `extraCityPanelConfig`, z przeszukaniem
`showHintMessage` pod kątem gałęzi `ownerId===0`/`tick.ownerId===0`.
DEPLOY/PUSH: NIE WYKONANO
