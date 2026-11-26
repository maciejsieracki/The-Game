# R-WEB-BUILDING-DEMOLISH-Q1 — obrona Operatora, RUNDA 3/5 (HAIKU 5.5)

STATUS: PASS-WITH-NOTES (zarzuty 1–4 przyjęte; poprawki w tej rundzie; dowód live zrobiony; NIE ZMIERZONO: patrz niżej)
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-DEMOLISH-Q1 (WYBURZ, #175; odp. 22C + 28a)
GOAL: gracz wyburza każdy swój budynek z panelu miasta za połowę surowców (w dół); podczas oblężenia miasta wyburzanie zablokowane (bez wyjątków dla Pałacu, cudów, murów, Mennicy); widoczny komunikat blokady.
BAZA/KANDYDAT: b837c8ac393666f17b1dbc74b6adde1f39ef3589 (origin/main), kod gra/ z rundy 3 (Operator), baza zarzutów: b8c6e72c2 (raport Evaluatora d544985b4).
ZMIANY-COMMIT: patrz sekcja „Zmiany” (pliki w allowliście; commit podpisany; SHA w polu sha).

## Odpowiedzi na zarzuty Evaluatora (d544985b4)

1. Test okablowania UI tylko regexem; strażnik w handlerze bez mutacji — PRZYJMUJĘ (częściowo rozwiązane).
   - Dodano w `gra/tools/building-demolish-siege-test.cjs` sekcję [7]: czerwona mutacja tekstu cityPanel.ts (usunięta linia strażnika handlera) → test wykrywa brak strażnika; strażnik obecny dokładnie raz.
   - Ograniczenie uczciwie: w node nie ma DOM, więc zachowanie kliknięcia sprawdza dopiero live (zarzut 3): wymuszony klik w zablokowany przycisk → `confirmCallsAfterClick: 0`.

2. onDemolishBuilding w main.ts cicho ignoruje blocked='siege' — PRZYJMUJĘ (naprawione).
   - `gra/src/main.ts` (oba miejsca onDemolishBuilding, l.~35519 i ~50418): `if (dm.blocked === 'siege') { showHintMessage(DEMOLISH_SIEGE_BLOCK_PL, 6000); return; }`; import `DEMOLISH_SIEGE_BLOCK_PL` z building-demolish.
   - Komunikat PL nie jest już tylko tooltipem: w `gra/src/ui/cityPanel.ts` przy każdym budynku w oblężonym mieście pojawia się widoczny tekst `bld-demolish-siege-note` = „Nie można wyburzać podczas oblężenia” (obok nieaktywnego przycisku „Wyburz”).
   - Test [7] pilnuje obu wywołań w main.ts (liczba = 2) i mutacją (usunięcie komunikatu → wykryte).
   - Ścieżka main.ts jest nieosiągalna z UI (przycisk nieaktywny, strażnik w handlerze), więc nie była testowana live — tylko źródłowo.

3. Brak dowodu live (zrzut oblężonego miasta, przycisk nieaktywny + komunikat) — PRZYJMUJĘ, ZMIERZONO w tej rundzie.
   - Build z kandydata (`node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>`, NIE npm run build), Chromium `/opt/pw-browsers/chromium` headless, `?civTest=1`, nowa gra, stolica z budynkami (stolarnia, mennica, palac) przez hak `__civTest.adminSetup`.
   - Oblężenie: realny hak `__ledgerRealPathDebug.startSiege(cityId, 1, 12)` (ustawia wojnę i `City.oblegane = true`, ta sama flaga co silnik).
   - Wynik (`zrzuty/wyburz-siege-live-r3.json`, liczby z surowego wyjścia):
     - przed oblężeniem: 3 przyciski „Wyburz”, `disabled: [false,false,false]`, brak podpowiedzi;
     - w oblężeniu: `disabled: [true,true,true]`, `title` = „Nie można wyburzać podczas oblężenia” (x3), `blockedTextVisibleInDom: true`;
     - wymuszony klik w zablokowany przycisk: `confirmCallsAfterClick: 0` (okno potwierdzenia nie pojawiło się);
     - `pageErrors: []`.
   - Zrzuty: `zrzuty/04-r3-przed-oblezeniem.png`, `zrzuty/05-r3-oblezenie-przycisk-zablokowany-komunikat.png` (na zrzucie widać szarą pozycję „Wyburz” przy Pałacu, Mennicy i Stolarni oraz tekst „Nie można wyburzać podczas oblężenia”).

4. Brak testu hotseat (blokada per miasto) — PRZYJMUJĘ, dodano test [8] w `building-demolish-siege-test.cjs`:
   - dwa miasta, dwóch ownerów (1 i 2); oblężone miasto gracza 2 → odmowa `blocked='siege'`, budynek stoi; miasto gracza 1 nieoblężone → wyburzenie działa, zwrot 25 drewna trafia do ownera miasta 1; predykat per miasto (false/true).
   - Live hotseat NIE ZMIERZONO (patrz niżej).

## Zmiany w tej rundzie (pliki allowlisty)
- `gra/src/main.ts`: import `DEMOLISH_SIEGE_BLOCK_PL`; w dwóch miejscach onDemolishBuilding obsługa `dm.blocked === 'siege'` (komunikat).
- `gra/src/ui/cityPanel.ts`: widoczna notatka `bld-demolish-siege-note` przy blokadzie (poza zmianą warunku przycisku bez zmian).
- `gra/tools/building-demolish-siege-test.cjs`: sekcja [7] (mutacje handlera i main.ts, komunikat) i sekcja [8] (hotseat).
- `dyspozycje/autobot/runs/R-WEB-BUILDING-DEMOLISH-Q1/30-obrona-claude.md` (ten raport; runda 2 zastąpiona, zachowana w historii gita).
- `dyspozycje/autobot/runs/R-WEB-BUILDING-DEMOLISH-Q1/zrzuty/` — nowe pliki: `04-r3-przed-oblezeniem.png`, `05-r3-oblezenie-przycisk-zablokowany-komunikat.png`, `wyburz-siege-live-r3.json`.
- Logika `gra/src/game/building-demolish.ts` NIEZMIENIONA w tej rundzie (predykat i guard z rundy 3 bez zmian).

## Bramki (liczby z surowego wyjścia tej sesji; `gra/node_modules` = symlink do innego worktree, usunięty przed commitem)
- `tsc --noEmit -p .`: exit 0 (po wszystkich edycjach gra/src, także po notatce cityPanel)
- `tools/building-demolish-siege-test.cjs`: RESULT 32 pass / 0 fail (po ostatniej zmianie; przed notatką cityPanel: 31/0)
- `tools/building-demolish-test.cjs` (regresja, nieruszana): RESULT 36 pass / 0 fail
- `tools/logic-test.cjs`: LOGIC OK (213/213)
- `tools/tech-tree-test.cjs`: 20 pass, 0 fail
- `tools/research-test.cjs`: ALL GREEN
- `tools/unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21)
- `tools/combat-test.cjs`: All sanity checks passed
- `tools/ai-test.cjs`: 297 passed, 0 failed (exit 0)
- `tools/mint-capital-only-test.cjs`: 8 PASS / 0 FAIL
- `tools/mint-orphan-test.cjs`: 28 PASS / 0 FAIL
- Uwaga: logic/tech-tree/research/unit-replace/combat/ai-test/mint-* uruchomiono PRZED ostatnią zmianą wyłącznie w `cityPanel.ts` (dodanie notatki UI, bez zmian logiki); tsc po niej: exit 0; `building-demolish-siege-test` i `building-demolish-test` po niej: zielone.

## Mutacje (czerwone) — wykryte przez test
- brak guarda w `demolishBuilding` (r3, sekcja [6]) → wykryte;
- odwrócony guard → wykryte;
- usunięty strażnik handlera w cityPanel.ts (nowa, sekcja [7]) → wykryte;
- usunięty komunikat w main.ts (nowa, sekcja [7]) → wykryte.

## Live (Chromium, headless) — ZMIERZONO
- Przebieg: `/tmp`-free, skrypt w scratchpad (nie w repo); build do scratchpad; plik `zrzuty/wyburz-siege-live-r3.json`.
- Potwierdzone: blokada przycisku + widoczny komunikat przy oblężeniu; klik nie otwiera potwierdzenia; brak błędów strony.

## NIE ZMIERZONO (jawnie)
- Odblokowanie po zakończeniu oblężenia (przycisk znowu aktywny) — nie testowano live.
- Hotseat na żywo (dwóch graczy, zmiana aktywnego gracza) — tylko test logiki [8].
- Ścieżka `onDemolishBuilding` z blocked='siege' w main.ts — nieosiągalna z UI, tylko źródłowo.
- Zwrot i Mennica live z rundy 2 — bez zmian w kodzie, wynik r2 (`zrzuty/wyburz-live.json`) nadal obowiązuje.
- Pytanie właściciela o wyjątki: rozstrzygnięte 28a (bez wyjątków) — implementacja zgodna.

## Dodatkowe spostrzeżenia (UWAGI-DLA-ORKIESTRATORA)
- Hak live `__ledgerRealPathDebug.startSiege` ustawia wojnę i oblężenie; nazwa jest myląca (to hak ledger), ale działa jako realna flaga miasta. Bez zmian w kodzie.
- Harness Chromium nie zgłosił SIGSEGV w tej rundzie (jeden przebieg, bez ponowień).
- Nic poza zakresem nie zostało zmienione.

NASTĘPNY KROK: Evaluator (r4) — sprawdzić mutacje sekcji [7] i [8] oraz zrzut 05; Final Control po PASS.
DEPLOY/PUSH: NIE WYKONANO
