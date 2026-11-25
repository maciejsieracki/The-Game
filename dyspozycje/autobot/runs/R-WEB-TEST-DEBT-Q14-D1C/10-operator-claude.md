STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D1C (6 czerwonych testów z D1 + pin Konnicy; ustalenie reguły, naprawa STARY-PIN, kandydaci błędów gry opisane)
GOAL: każdy z 7 punktów z dispatchu ma klasyfikację z dowodem; naprawione testy zielone solo z mutacją czerwoną; kandydaci BŁĄD-GRY opisani (odtworzenie + cytat reguły); bramki zielone.
BAZA: a0939760d657bdee5db36e2f586fce2c820f95dd (origin/main), worktree --detach.
ZMIANY-COMMIT: tylko gra/tools/*-test.cjs (allowlista) + ten raport. Zero zmian w gra/src i gra/data.
  - b07ecc093 unit-context-card-test.cjs (pkt 7)
  - 7bb603678 building-detail-card-entitycard-migration-test.cjs (pkt 1)
  - b043e673c civ-matrix-greece-test.cjs (pkt 2)
  - f4f928079 city-state-alliance-test.cjs (pkt 4)
  - SHA raportu: patrz pole sha w StructuredOutput (czubek tej pracy).
  - Brak zmian: autoimprove-pasture-irrigation-q2-test.cjs (pkt 3), cluster-plan-name-test.cjs (pkt 5), bramki-tmpdir-unikalnosc-test.cjs (pkt 6).

## Tabela 7 punktów

| # | test | przed (surowe) | klasyfikacja | co zrobiono | po (surowe) |
|---|---|---|---|---|---|
| 1 | building-detail-card-entitycard-migration-test.cjs | exit 1: 52 pass / 3 FAIL | STARY-PIN (3 asercje) | (a) „Praca (jednorazowo)”/„Przyrost za poziom”: słowo „Pracy” zastąpił chip ikony praca (commit 28d67d390, R-WEB-UI-RESOURCE-ICONS-YIELDS-WONDERS-Q1; buildingAdapter.ts `yieldValueFields('praca', …)`); asercja na „N pkt”, „+N pkt / poziom” i valueParts[0].id==='praca'. (b) „Uwagi”: sekcja USUNIĘTA z karty budynku (commit 31a621d69, R-KARTY-HISTORIA-INFRA-Q1 (2/17)); asercja odwrócona na `!viaSrc.includes('playerFacingNote(def.uwagi)')`. | exit 0: 56 pass / 0 fail. Mutacja odwrotna (asercja uwag z powrotem) → FAIL. |
| 2 | civ-matrix-greece-test.cjs | exit 1: PASS 323 / FAIL 6 | STARY-PIN (2 fixture) | (a) Agresja Rzymian: resolver używa dip_agresja_archetyp (0,75) jako bazy, offset difficulty z ai_agresywnosc (normal = 0), ZATWIERDZONE 2026-10-18 (docs/decyzje/R-PR141-CODEX-SEMANTICS-DECISIONS-20261018.md, Q3; kod: commit b4d37d9f8). Oczekiwanie 0,8 → 0,75; asercja rozróżnienia pól przepięta na „resolver == dip_agresja, != ai_agresywnosc/10”. (b) decideAIDiplomacy wojna: od R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1 wypowiedzenie wojny wymaga przewagi siły militarnej (ai.ts Priorytet 4, `aiMaPrzewageMilitarna`; brak danych = brak przewagi). Fixture dostaje silaMilitarnaAI 150 / silaMilitarnaPartner 100. Oczekiwania (war, powód willingnessWar) bez zmian. | PASS 329 / FAIL 0. Mutacja (oczekiwanie 0,8 + siła 90) → FAIL 5. |
| 3 | autoimprove-pasture-irrigation-q2-test.cjs | exit 1: 14 OK / 3 FAIL | BŁĄD-GRY (kandydat, test ZOSTAJE czerwony) | Bisect (szczegóły niżej). Brak zmian w teście. | exit 1: 14 OK / 3 FAIL (bez zmian). |
| 4 | city-state-alliance-test.cjs | exit 1: 73 / 1 | STARY-PIN (garnizon min. 1, FALA 857) | Scenariusz „7. strong”: przy dwóch strażnikach jeden jest stałym garnizonem miasta (R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1; getCityGarrisonUnitIds → csGarrisonUnitIds, ai.ts ~5975 `!csGarrisonUnitIds.has(unit.id)`), więc posiłek = 1, nie 2. Fixture dostaje trzeciego strażnika g3: zostają dwie nadwyżki; maxPerTurn=2 (strong) nadal pinowane; oczekiwanie 2 bez zmian. | 74 passed / 0 failed. Przed zmianą fixture'u: got 1 (dowód, że reguła garnizonu jest przyczyną). |
| 5 | cluster-plan-name-test.cjs | exit 1: 2 passed / 4 failed | NIE-ZMIERZONO (po POLAR A1) | Brak zmian. Sprawdzone: generator polarny NIE jest wdrożony w origin/main. Commity R-WEB-MAP-POLAR-ZERO-INVESTIGATE-Q1 (c611a62ea, 5c7a36b64, 82b7bba79) to analiza/werdykt A („40a29e4c6 zabiera pas polarny”), bez implementacji pasa. Wdrożenie = zadanie POLAR A1 (w toku, Obrona). Nie zgadywano fixture'u seed 202. | exit 1: 2 passed / 4 failed (bez zmian). |
| 6 | bramki-tmpdir-unikalnosc-test.cjs | exit 1: PASS=2 FAIL=1 (171 trafień) | NIE-ZMIERZONO (zakres) | Brak zmian. Skala: test skanuje 418 plików z tmpdir (z 1948 .cjs); 406 plików w gra/tools używa os.tmpdir(); 261 plików ma literalną nazwę `path.join(os.tmpdir(), '…')` (281 wystąpień wg grep). Naprawa = paczki po 20 plików, każda z własną bramką; poza zakresem tej rundy. | exit 1: PASS=2 FAIL=1 (171 trafień, bez zmian). |
| 7 | unit-context-card-test.cjs:152,167 | exit 0: 29 pass / 0 fail (pin 49) | STARY-PIN (fixture) | Pin 49 był na wymyślonych statach (atak 8, obrona 5, weapon 7, piercing 6, charge 10, hp 28, pancerz 4), które NIE są statami Konnicy z units.json. Fixture przepięty na realne staty Konnicy z units.json (meleeAttack 16, meleeDefence 10, armor 8, health 56, weaponDamage 14, piercing 12, chargeBonus 20, missile 0) → Atak 52, Obrona 46, Razem 98 (== units.json fieldPower 98, decyzja właściciela 2026-11-22, FALA 893). | exit 0: 29 pass / 0 fail. Mutacja (oczekiwanie 49) → FAIL. |

## Dowody dla pkt 3 (bisect BŁĄD-GRY)

Harness: gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs, produkcyjny pickAutoImprovements, ERA=2, 10 miast. Snapshoty gra/src + gra/data z `git archive` (PI_SRC_DIR).

- 9420ae1da (ostatnia zmiana testu Q2 r2, src wtedy zdrowe): `starved 0`, firstIrr 3, pool 300.
- 28f19d134^ (przed FALA 883 UPKEEPMULT): `starved 3`, firstPast 3, firstIrr 27, gapGrow farmNoPast 4 / farmNoIrr 59, pool 340.
- 28f19d134 (FALA 883): `starved 3` (identycznie jak 28f19d134^) → FALA 883 NIE jest przyczyną.
- Bisect po 1085 commitach z gra/src gra/data w zakresie 9420ae1da..28f19d134^ (rev-list, binarnie):
  - ostatni dobry: bdae76b7ea310cc15940d7a37a70cb3f78809519 (`starved 0`, pool 300).
  - pierwszy zły: 141a2bc56d6bd2ab527893ce02b7a2e9320a6db3 — „FALA 878: merge FC 464db707c…” (`starved 3`, pool 340).
  - Treść scalenia (diff do pierwszego rodzica): auto-improvements.ts, terrain-improvements.ts/.json, ai.ts, main.ts, improvement-tech.ts, map/improvement-build.ts, improvementAdapter.ts, diplomacy-value-catalog.ts, improvement-cost-params.json.
  - Sprawca w gałęzi: R-WEB-ECONOMY-IMPROVEMENT-COST-OWNER-ERA-AND-ORE-MINES-X2-Q1 (d3f6fcf78; obrona 1c1bb853b). `getImprovementMeta(key, playerEra)` skaluje `kosztPraca` wg epoki WŁAŚCICIELA (`scaleTerrainImprovementWorkCostForOwner`, flaga `kosztUlepszenWgEpokiWlasciciela !== false`, czyli domyślnie ON). Mnożnik epoki: era ≤1 → 0,5; era 2 → 1. Farma (epoka 1, koszt 20) w epoce 2 kosztuje więcej niż przed zmianą; stadnina i irygacja (epoka 2) bez zmiany mnożnika.
- Minimalne odtworzenie: `cd gra && PI_SRC_DIR=<gra/src z bdae76b7e> node tools/autoimprove-pasture-irrigation-q2-bisect.cjs` → starved 0; ten sam komplet z `141a2bc56` → starved 3.
- Reguła: kryterium R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2 (test (e): po wyczerpaniu farm trzoda i irygacja startują w fazie wzrostu, bez głodzenia). Koszt wg epoki: decyzja FALA 878 (R-WEB-ECONOMY-IMPROVEMENT-COST-OWNER-ERA-AND-ORE-MINES-X2-Q1).
- Ocena: zmiana kosztów przez zatwierdzoną regułę kosztu epoki zmniejsza tempo farm/trzody/irygacji w fazie wzrostu. Czy to błąd gry (regres kryterium Q2), czy skutek zatwierdzonej reguły wymagający wyjątku dla ulepszeń żywnościowych — NIE rozstrzygnięto. Test zostaje czerwony.
- Wpływ FAL 883/890 (z dispatchu): FALA 883 wykluczona (pkt wyżej). FALA 890 nie była badana osobno (leży po 141a2bc56 w historii; sprawca już znaleziony przed nią).

## Dowody dla pkt 5
- `git log origin/main --grep=POLAR`: commity R-WEB-MAP-POLAR-ZERO-INVESTIGATE-Q1 (analiza, werdykt A) i AI-polar (81a8e76a7, 6981e6ab4, 56c4552d9 — AI unika polarnych miast). Brak commita wdrażającego pas polarny w generatorze.
- Wynik testu: 2 passed / 4 failed (exit 1). Nie zgadywano fixture'u seed 202.

## Bramki (surowe wyjście, po zmianach; node_modules gra/ zainstalowane npm ci, usunięte po bramkach)
- `npx tsc --noEmit` → exit 0 (bez błędów)
- logic-test → `LOGIC OK (213/213)`, exit 0
- tech-tree-test → `tech-tree-test: 20 pass, 0 fail`, exit 0
- research-test → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0 (linia `ALL GREEN` też na wyjściu)
- unit-replace-test → 21 × [OK], FAIL=0, exit 0
- combat-test → `All sanity checks passed.`, exit 0
- ai-test → `ai-test: 297 passed, 0 failed`, exit 0
- era-war-pairing-alliance-test → `era-war-pairing-alliance-test: 19 pass, 0 fail`, exit 0
- ai-ai-alliance-surcharge-test → `RESULT: ALL GREEN (live + mutants detected)`, exit 0

## UWAGI-DLA-ORKIESTRATORA
1. KANDYDAT BŁĄD-GRY (pkt 3, pasture/irrigation): R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-OWNER-ERA-COST-Q1 (propozycja nazwy). Sprawca: FALA 878 / d3f6fcf78 + 1c1bb853b (koszt wg epoki właściciela dla wszystkich ulepszeń, także żywnościowych). Dowód: bisect powyżej. Do decyzji: wyjątek dla ulepszeń żywnościowych vs akceptacja spowolnienia farm/trzody.
2. NIE-ZMIERZONO (pkt 5): po wdrożeniu POLAR A1 ponownie uruchomić cluster-plan-name-test (seed 202).
3. NIE-ZMIERZONO (pkt 6): 171 trafień bramki tmpdir, ~261 plików z literalną nazwą; do zrobienia w paczkach po 20 plików (osobny temat higieny).
4. Uwaga procesowa (błąd wykonawcy, nie gry): jedno polecenie `git log -S` bez ścieżki (szukanie frazy „+${building.przyrostKosztu} pkt” po całym repo) przekroczyło 120 s i zostało ubite (pkill). Żadne wyniki z niego nie zostały użyte. Pozostałe `-S` ograniczono do ścieżek.
5. Test pkt 7 miał pin oparty na wymyślonych statach; od tej pory wzorzec: fixture = staty z units.json.

## RUNDY
1/5. Jedna runda; brak FAIL do poprawy przez Obronę.

## NASTĘPNY KROK
Orkiestrator: (a) przejrzeć commity b07ecc093, 7bb603678, b043e673c, f4f928079 (tylko tools/*-test.cjs) i raport; (b) decyzja właściciela o kandydacie z pkt 3 (wyjątek dla żywności vs akceptacja); (c) pkt 5 po POLAR A1; (d) pkt 6 jako osobny temat higieny.

DEPLOY/PUSH: NIE WYKONANO
