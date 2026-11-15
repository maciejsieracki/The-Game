# R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 — Obrona Operatora (runda 3 → odpowiedź na zarzuty Evaluatora r3)

STATUS: PASS-WITH-NOTES (zarzuty 1 i 3 PRZYJĘTE i zamknięte dowodem; zarzut 2 PRZYJĘTY jako NIE ZMIERZONO — kryterium (a) częstości nie spełnione, decyzja dla FC/orkiestratora)
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1
GOAL: bez zmian (ilość odbioru AI = nadwyżka gracza; uczciwość wyceny, cooldown 15, limit 1 oferty/AI bez zmian).
BAZA: f6507db65 (kandydat r3), detached. Obrona startuje od niego.
ZMIANY-COMMIT: patrz sekcja COMMIT na końcu.
RUNDY: 3/5 (Obrona HAIKU; Operator r3 SONNET wg DODATKU 3).

## Odpowiedź na zarzuty Evaluatora (każdy punkt: PRZYJMUJĘ z dowodem albo ODRZUCAM z cytatem)

### Zarzut 1 — scenariusze Kamień i Brąz nie różnią się epoką w chwili oferty — PRZYJMUJĘ (naprawione)
Przyczyna (ZMIERZONE):
- Hak `setOwnerEra` ustawiał tylko `ownerEraByOwner` / `player.era`. Produkcyjny sync badań (`syncOwnerEraFromResearch`, `reconcilePlayerEraFromResearch`) cofał to przy każdym EOT.
- Podłoga epoki: w tym playtest `gameStartEra()` = 2 (Brąz). Sync nie schodzi poniżej startu, więc ERA=1 (Kamień) nie dało się ustawić nawet z poprawnymi badaniami.
- Dowód sprzed poprawki (`evidence/r4/e2e-p20-e1-PRZED-poprawka-podlogi.log`): `[era-diag] podloga/start: {"p":{"gameStart":2,...},"ai":{"gameStart":2,"ownerStart":2,...}}` oraz `FAIL epoka w chwili oferty = ERA 1 (gracz 2, AI 2)`.

Poprawka (`gra/src/main.ts`, hak testowy):
- nowa funkcja `applyOwnerEraFixtureForTest(ownerId, era)`: ustawia podłogę (`testEraFloorOverride`, używane tylko gdy ustawione, w `gameStartEra`); dla AI: `ownerStartEraByOwner = era`, badania puste; dla gracza: `player.zbadane` = techy epok < era, potem `reconcilePlayerEraFromResearch()`.
- `setOwnerEra` (hak `__aiTradeWiringTestDebug`) deleguje do niej; dodano odczyt `ownerEra` i diagnostykę `eraFloorForTest`.
- `gra/tools/ai-trade-wiring-e2e-live-test.cjs`: nowa asercja po realnym EOT — epoka gracza i AI w chwili oferty == ERA (tylko gdy ERA>0).

Dowód po poprawce (ZMIERZONE, headless Chromium, `?civTest=1`, POP=20):
| Scenariusz | epoka w chwili oferty (gracz/AI) | e2e | probe (selekcja, przed EOT) | oferta na stole |
|---|---|---|---|---|
| Kamień (ERA=1) | 1 / 1 | 47 pass, 0 fail (`e2e-p20-e1-kamien.log`) | cegła 80 / żelazo 20 | cegła 70 / drewno 350 |
| Brąz (ERA=2) | 2 / 2 | 47 pass, 0 fail (`e2e-p20-e2-braz.log`) | cegła 200 / żelazo 50 | cegła 70 / drewno 350 |
- Różnica epok jest realna w selekcji (probe 80/20 vs 200/50), ale oferta na stole jest w obu przypadkach 70/350 (ilości po clampie per_turn). Ta sama para na stole nie jest błędem scenariusza — jest uczciwym wynikiem; zaznaczam, że w tym scenariuszu epoka nie zmienia OFERTY NA STOLE, tylko selekcję.
- Zrzuty okna przed przyjęciem: `evidence/r4/kamien-p20-e1-okno-przed-przyjeciem.png`, `evidence/r4/braz-p20-e2-okno-przed-przyjeciem.png`.
- Ograniczenie: poprawka działa tylko w hooku testowym; produkcyjna ścieżka gry (bez `civTest`) nie korzysta z `testEraFloorOverride` (domyślnie `null`).

### Zarzut 2 — brak pomiaru częstości ofert (3×150×3) — PRZYJMUJĘ jako NIE ZMIERZONO
- Nie wykonano pomiaru częstości w tej rundzie. Powód: `measure-ai-trade-offer-frequency*.cjs` zawiesza się w turze 10 także na bazie (DODATEK 2 pkt 5 — zakaz naprawy w tym temacie), a pełny przebieg 3×150×3 nie został uruchomiony.
- Kryterium (a) z dispatchu NIE jest spełnione. Nie podaję żadnej liczby „oferty/100 tur”. Cel 3–6 nie został oceniony.
- Pomiar ilości (zamiast częstości) z poprzedniej rundy nie jest dowodem częstości; nie przedstawiam go jako takiego.
- Decyzja dla FC/orkiestratora: czy temat idzie dalej bez pomiaru częstości (uczciwy NIE_OSIĄGNIĘTO dla (a)) czy wymaga osobnego tematu z naprawionym harnessem.

### Zarzut 3 — test behawioralny na atrapie wyceny — PRZYJMUJĘ (naprawione)
- `gra/tools/ai-trade-need-from-surplus-test.cjs` przepisany: wycena `diplomacyPnSurowiecIlosc`, bramka `handelFairnessGate(…, AI_PROPOSER_FAIRNESS_REL_TOTAL, 1) && givePn <= receivePn` (jak w `main.ts`), `evaluateProposal` (realny). Brak `resolvePayloadPn: () => ({…})`.
- Wynik: `ai-trade-need-from-surplus-test: 12 passed, 0 failed` (A: 1000→odbiór 100, 400→40, 100→10; A4 każda wybrana oferta przechodzi realną bramkę i evaluateProposal; A5; B; C; D: realGate odrzuca 10 vs 1000).
- Mutacja (stary sufit z `f1886bacf` przywrócony w `ai-trade-proposal.ts`, potem cofnięty — `git status` czysty w pliku silnika): `10 passed, 2 failed` (czerwone asercje dotyczą zależności od nadwyżki).
- Odkrycie (ZMIERZONE): przy zapasie AI drewna 5030 (rezerwa 2000) ilość wiąże ZAPAS AI, nie nadwyżka gracza (give 200 / recv 10 dla nadwyżki 1000, 400 i 100). Dlatego sekcja A używa zapasu AI 1 000 000, żeby izolować nadwyżkę gracza; sekcja A5 pokrywa przypadek ograniczonego AI.
- Zarzut „asercja mutacyjna wyłapuje tylko stary sufit 10”: test A2 (monotoniczność) i A4 (uczciwość wybranej pary) wymuszają zależność od nadwyżki; przypadek „brak nadwyżki ⇒ brak oferty” jest w B1/B2 na realnej wycenie.

### Uwaga U2 — koszt pętli — ZMIERZONE częściowo
- `probeBarter` w headless Chromium (POP=20, ERA=1, jedna AI, jedno wywołanie): BIG=20000 → 763 ms; BIG=100000 → 2681 ms (`evidence/r4/probe-cost-big20000.json`, `probe-cost-big100000.json`).
- Wynik pary (cegła 80 / żelazo 20) NIE zmienia się przy 20000 i 100000 — zapas gracza nie jest tu wiążący.
- NIE ZMIERZONO: liczba wywołań selekcji na turę (cooldown ogranicza), realny maksymalny zapas gracza w grze, koszt przy 1 000 000 (poprzedni pomiar 44 s nie odtworzony).
- Limit wydajnościowy NIE został dodany (dispatch dopuszcza pomiar albo limit; brak dowodu, że jest potrzebny).

### Uwaga U1 — osłabione asercje dla POP>0 — NIE ZMIENIANE w tej rundzie
- Asercje z poprzedniej rundy (para `curGive !== curRecv`, teksty okna) zostają bez zmian. Nie podnoszę ich do ścisłych w tej rundzie.

### Uwagi produktowe (bez zmian, DO POTWIERDZENIA przez właściciela, wariant A)
- Przy 20 obywatelach AI może prosić o wiele sztuk (w teście do 2000 drewna przy zapasie AI 1 000 000 i nadwyżce gracza 1000). Limit gameplayowy NIE dodany (wariant A). Warianty B/C — w ABC.

## TESTY (surowe wyniki, ta runda)
- `npx tsc --noEmit` (gra/): exit 0 (po zmianach w `main.ts`).
- `logic-test`: LOGIC OK (213/213), exit 0.
- `tech-tree-test`: 20 pass, 0 fail, exit 0.
- `research-test`: PASSED 33 / FAILED 0, exit 0.
- `combat-test`: 6/6 pass, exit 0.
- `unit-power-test`: 6 pass, 0 fail, exit 0.
- `unit-replace-test`: exit 0 (pozostałe warianty `unit-replace-full-cost/army-multi-select/promotion-table` NIE uruchomione w tej rundzie — NIE ZMIERZONO).
- `ai-trade-need-from-surplus-test`: 12 passed, 0 failed, exit 0.
- `ai-trade-proposal-to-player-test`: 25 assertions passed, exit 0.
- `ai-trade-proposal-branch-test`: 10 passed, 0 failed, exit 0.
- `ai-trade-offer-frequency-up-test`: 28 pass, 0 fail, exit 0.
- `ai-trade-oneshot-overpay-limit-test`: CZERWONY, exit 1: `FAIL: main.ts enqueue filter calls aiOneshotHandelOverpaysPlayer(...)` — dług bazowy #379 (asercja tekstowa na main.ts), nie zmieniany tym tematem.
- `ai-trade-wiring-e2e-live-test` (Chromium, realny endTurn): Kamień POP=20 ERA=1 → 47 pass / 0 fail; Brąz POP=20 ERA=2 → 47 pass / 0 fail. Wariant POP=0 (domyślny) NIE uruchomiony po zmianie hooka — NIE ZMIERZONO w tej rundzie (hak `setOwnerEra` wołany tylko gdy ERA>0).
- `git diff --check`: sprawdzone przed commitem (patrz sekcja COMMIT).
- Dysk przy starcie: 6,1 GB wolne (dispatch wymagał ≥ 8 GB dla r3 — niespełnione, odnotowane; zużycie w trakcie: `npm ci` w worktree + bundle poza repo).

## BLOKADY
- Zarzut 2: częstość ofert NIE ZMIERZONA (harness w turze 10; zakaz naprawy w tym temacie).
- Dług #379 (oneshot-overpay-limit) czerwony na bazie i kandydacie.
- Wariant POP=0 e2e i pozostałe warianty unit-replace NIE uruchomione w tej rundzie.

## RUNDY
3/5. Ostatni werdykt Evaluatora: PASS-WITH-NOTES (zarzuty 1–3). Decyzja wymagana: TAK — (a) częstość ofert (zarzut 2) albo uczciwe NIE_OSIĄGNIĘTO dla kryterium (a); (b) wariant A (limit odbioru) DO POTWIERDZENIA przez właściciela.

## NASTĘPNY KROK
Final Control r3: zweryfikować poprawki zarzutów 1 i 3 (commit poniżej), zdecydować o kryterium (a).

## UWAGI-DLA-ORKIESTRATORA
- Hak `applyOwnerEraFixtureForTest` i `testEraFloorOverride` w `gra/src/main.ts` — minimalne wpięcie testowe (uzasadnienie: zarzut 1). Produkcja bez zmian, gdy hak nieużywany.
- Odkryte: `gameStartEra()` w playtest mapa = 2 (Brąz). Każdy przyszły scenariusz „Kamień” w tym trybie musi używać podłogi testowej, inaczej cicho wyjdzie Brąz.
- Wykryte: przy zapasie AI drewna 5030 (rezerwa 2000) ilość wiąże zapas AI, nie nadwyżka gracza. To zachowanie silnika, nie błąd testu; zgłaszam do wiadomości FC.
- Nieprzeczytane zarzuty (rozjazd podgląd↔bramka FC r2): zamknięte przez Evaluatora (błąd diagnostyki testu), nie ponownie otwierane.
- Dług REPIN Rust (ai-params / selekcja) bez zmian.

## COMMIT
- Kod i testy: `gra/src/main.ts`, `gra/tools/ai-trade-need-from-surplus-test.cjs`, `gra/tools/ai-trade-wiring-e2e-live-test.cjs`.
- Raport i dowody: `dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1/30-obrona-claude.md`, `…/evidence/r4/*`.

DEPLOY/PUSH: NIE WYKONANO
