# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 — obrona Operatora, runda 4 (odpowiedź na zarzuty Evaluatora r4, kandydat 7287d25f8)

STATUS: PASS-WITH-NOTES (obrona: zarzuty 3 i 4 przyjęte; zarzut 3 naprawiony w dokumencie; zarzut 1 przyjęty jako NIESPEŁNIONE kryterium, zarzut 2 przyjęty jako uwaga; zarzut 4 odrzucony z dowodem; zarzut 5 informacyjny)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1
GOAL: obrona zarzutów Evaluatora r4 (zrzuty bez linii z dispatchu, pomiar w konfiguracji `--gate-fix taxsplit`, sprzeczne sformułowania w raporcie r3, test haka statyczny, nierozstrzygnięty t57).
BAZA: kandydat Evaluatora 7287d25f8 (potomek origin/main 9cbadc54a).

ZMIANY/COMMIT:
- `dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1/10-operator-claude.md` — dopisana KOREKTA pod wierszem z wnioskiem o t57 (wycofuje „księga nie jest sprawcą” i „wyścig harnessu”).
- `dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1/30-obrona-claude.md` — ten raport.
- Kod gry (`gra/`) NIE zmieniony w tej rundzie. Bramki `gra/` NIE powtarzane w tej rundzie (brak zmiany kodu); wyniki bramek pozostają z rundy Evaluatora r4 (wg Evaluatora: tsc 0, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, resource-ledger 1030/0, skad-ui 18/0, skad-dom 13/0, hook-gate 6/0) — NIE_ZMIERZONE przeze mnie w tej rundzie.

## Zarzut 1 — zrzuty bez linii z dispatchu — PRZYJĘTY (kryterium NIESPEŁNIONE)

Zgadzam się z Evaluatorem. Dispatch (DODATEK 2, pkt 3; DODATEK 3, pkt 2) wymaga linii „+12 Warzelnia (Rzym)”, „+30 Umowa wymiany z <civ>”, „−20 Obywatele” w zrzutach. Dowód z `evidence/shots-live/shots.json`:
- 1920: sól `+225 Warzelnia (Rzym)`, `+190 Umowa wymiany z Ostia · Rzymianie · miasto-państwo`; ceramika `+278 Umowa wymiany…`, `+150 Garncarnia (Rzym)`, `−30 Spichlerz (zużycie zapasów)`, `−3 Obywatele`.
- Linie ujemne (`−30`, `−3`) pojawiają się tylko w ceramice. Linii `+12`, `+30`, `−20` NIE MA w żadnym zrzucie.
Scenariusz był zbudowany hakiem testowym `?civTest=1` (budynki, zrodzone miasto-państwo, umowa), co Operator r3 ujawnił. Dlatego kryterium GOAL 1 w tym brzmieniu jest NIESPEŁNIONE. Nie naprawiam tego w tej rundzie: DODATEK 4 nakazuje zachować GOAL 1 bez zmian, a poprawka wymaga nowego przebiegu `resource-ledger-shots-live.cjs` z innym scenariuszem (nowy build vite poza repo). Wniosek dla orkiestratora: GOAL 1 zaliczać jako zrzuty z prawdziwej gry o realnych wartościach (+225/+190/+278/+150/−30/−3), NIE jako zrzuty z liniami z dispatchu. Zrzuty `+12/+30/−20` wymagają osobnego tematu, jeśli właściciel ich chce.

## Zarzut 2 — pomiar w konfiguracji `--gate-fix taxsplit` — PRZYJĘTY (uwaga)

Potwierdzone: `evidence/perf-seq/driver.sh` wywołuje `endturn-gate-diag-measure.cjs ... --gate-fix taxsplit`. Powód: w domyślnej konfiguracji bramka NNS blokuje turę 1 (`evidence/endturn-gate-diag/def-on-seed4242.jsonl`: `noadvance` tylko w t1, 7×, prognoza −2, `blokada:true`), więc 100-turowy przebieg bez obejścia nie jest możliwy. Pomiar ON vs OFF używa tej samej konfiguracji, więc różnica ON/OFF jest porównywalna, ale NIE jest czasem tury w domyślnej grze.

Sprawdzenie wyników (surowe jsonl, `perf-toggle/cmp.py`, uruchomione przeze mnie, linia `pct mean` / `pct median`):

| para | ON średnia ms | OFF średnia ms | Δ średniej % | Δ mediany % |
|---|---|---|---|---|
| 1 | 7446 | 6948 | +7,16 | +32,76 |
| 2 | 6593 | 6891 | −4,33 | −0,33 |
| 3 | 6527 | 7011 | −6,90 | −1,72 |
| 4 | 7084 | 7239 | −2,15 | −2,48 |
| 5 | 6414 | 6333 | +1,27 | +12,13 |

Mediana Δ średniej = **−2,15%**; mediana Δ mediany = **−0,33%**. Próg 10% nie jest przekroczony. Rozrzut par jest duży (pary 1 i 5 mają wysoką Δ mediany), więc wniosek to: narzut księgi w tej konfiguracji nie przekracza 10%; nie jest to pomiar z dokładnością rzędu kilku procent. Pochodzenie buildu `dist` w driverze: NIE_ZMIERZONE w tej rundzie (poza repo).

## Zarzut 3 — sprzeczne sformułowania w `10-operator-claude.md` — PRZYJĘTY (naprawione)

Potwierdzone: `10-operator-claude.md` wiersz 25 zawierał „księga nie jest sprawcą” i „wyścig harnessu”. Dopisano bezpośrednio pod tym wierszem blok KOREKTA, który wycofuje oba sformułowania i wskazuje obowiązujący wniosek (bramka NNS w turze 1 = dług harnessu; przyczyna t57 NIEROZSTRZYGNIĘTA). Wiersz oryginalny pozostaje jako zapis historyczny. Sprawdzenie: `grep -n "KOREKTA" 10-operator-claude.md`.

## Zarzut 4 — test haka `resource-ledger-hook-gate-test` jest statyczny — ODRZUCAM (jako wada)

Fakt: `gra/tools/resource-ledger-hook-gate-test.cjs` czyta tekst `gra/src/main.ts` (`fs.readFileSync(...'main.ts')`) i sprawdza H1–H5, w tym mutację H5 na kopii tekstu. To jest test jednostkowy w sensie dispatchu („test jednostkowy, że bez flagi hak nie istnieje”).
Dowód runtime, który Evaluator wskazał jako brakujący, istnieje w narzędziu zrzutów: `gra/tools/resource-ledger-shots-live.cjs` linia 46 odczytuje `typeof window.__ledgerTestDebug` i `typeof window.__nnsMeasureDebug` na stronie bez `?civTest=1`, a linia 48 przerywa przebieg, jeśli wartość nie jest `'undefined'`. Wynik w `evidence/shots-live/shots.json`: `"negativeControl": {"ledgerTestDebug": "undefined", "nnsMeasureDebug": "undefined"}` oraz `"hookPresentWithFlag": "function"`.
Nazwa testu w zestawie bramek jest zgodna z jego treścią (statyczna); nie twierdzę, że zestaw bramek zawiera runtime'owy test. Wniosek: nie ma luki w dowodzie, jest tylko doprecyzowanie, że w zestawie bramek jest test statyczny, a runtime'owy dowód leży w przebiegu zrzutów.

## Zarzut 5 — przyczyna timeoutu t57 nierozstrzygnięta — PRZYJĘTY jako informacja (bez zmiany kodu)

Zgadzam się: timeout z r3 w turze 57 NIE został odtworzony w żadnej konfiguracji (ON/OFF, seed 4242 i 777; 99 tur bez timeoutu w `evidence/endturn-gate-diag/` i `evidence/perf-seq/`). Przyczyna pozostaje NIEROZSTRZYGNIĘTA i tak jest opisana w korekcie. Dla #415/#417 obowiązuje WYŁĄCZNIE wniosek: bramka NNS w turze 1 przy domyślnych podatkach 30/60/10 to dług harnessu. Nie wnioskuję „nie księga”.

## Wpływ na GOAL 4 / GOAL 5

- GOAL 4: wniosek skorygowany (zob. zarzut 3). Diagnoza bramki NNS z dowodem (`def-on-seed4242.jsonl`) — zaakceptowana w r4 Evaluatora.
- GOAL 5 (stan `<details>`): bez zmian w tej rundzie, D6/D7 wg Evaluatora 12 passed, 1 failed po mutacji usunięcia `restoreSkadDetailsOpen` z `render()` (mutacja wykryta, czyli test działa).
- Zrzuty soli/ceramiki 1280 vs 1920 (pkt 2 DODATKU 3 r4): wybrano opcję (a) z dispatchu. Dowód: `sol-card-1280.png` i `sol-card-1920.png` mają ten sam md5 (`30e66b6e…`), a ceramika też ten sam md5 (`3d4256cb…`). Geometria z `shots.json`: karta 182 × 416 px w obu rozmiarach; panel `panelBody.w` = 403 px w obu; pozycje różnią się (`cardLeft` sol: 893 px przy 1280, 1533 px przy 1920; ceramika: 1083 px przy 1280, 1723 px przy 1920), czyli układ okna się różni, a sama karta jest elementem o stałej szerokości. Identyczne PNG karty są więc oczekiwane. Panele `panel-1280.png` i `panel-1920.png` różnią się wysokością (`panelBody.h` 735 vs 1015).

## Blokady

- Kryterium linii `+12 Warzelnia`, `+30 Umowa wymiany`, `−20 Obywatele` w zrzutach NIESPEŁNIONE (zarzut 1). Wymaga osobnego przebiegu zrzutów z innym scenariuszem.
- Pomiar wydajności w `--gate-fix taxsplit`, nie w domyślnej konfiguracji (zarzut 2).
- Przyczyna timeoutu t57 nierozstrzygnięta (zarzut 5).
- Pochodzenie buildu `dist` w driverze: NIE_ZMIERZONE.

## RUNDY

4/5 (ten sam ID; obrona r4). Ostatni werdykt Evaluatora r4: PASS-WITH-NOTES (kandydat 7287d25f8, raport `20-evaluator-claude.md`).

## NASTĘPNY KROK

Evaluator r4 ponownie (weryfikacja korekty w `10-operator-claude.md` i tego raportu), potem Final Control. Osobne tematy do rozważenia przez orkiestratora: (a) zrzuty z liniami `+12/+30/−20` (nowy scenariusz); (b) pomiar wydajności w domyślnej konfiguracji (wymaga obejścia bramki NNS w harnessie, #417).

## SHA / DEPLOY

Kod gry nie zmieniony. Commit tylko plików runs/<ID>/ (dwa pliki wymienione w ZMIANY/COMMIT). SHA końcowy: pole `sha` w wyniku.
DEPLOY/PUSH: NIE WYKONANO
