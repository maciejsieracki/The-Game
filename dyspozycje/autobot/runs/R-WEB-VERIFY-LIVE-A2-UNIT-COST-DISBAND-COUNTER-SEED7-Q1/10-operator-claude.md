# Raport Operatora: R-WEB-VERIFY-LIVE-A2-UNIT-COST-DISBAND-COUNTER-SEED7-Q1

STATUS: PASS-WITH-NOTES (Operator; bez integracji i deployu)
DOMAIN: GAME (POMIAR; zmiana gry tylko hak odczytu za `?civTest=1`)
TEMAT: R-WEB-VERIFY-LIVE-A2-UNIT-COST-DISBAND-COUNTER-SEED7-Q1
GOAL: licznik rozwiązań/strat jednostek, seed 7, mechanizm spadku jednostek AI przy tempie Normalnym (liczby, bez progu decyzyjnego).
BAZA: origin/main 2ae9a3b87 (kod gry bez zmian poza hakiem).
ZMIANY-COMMIT: patrz commit na gałęzi roboczej; allowlista: `gra/src/main.ts` (hak `unitFlowTurn` + `noteUnitLoss` przy 6 miejscach usunięcia), `gra/tools/ai-economy-measure-run.cjs` (`--unit-flow 1`), `gra/tools/ai-economy-measure-hook-test.cjs` (asercje unitFlow, mutacja), `gra/tools/ai-economy-measure-README.md`, `dyspozycje/analizy/POMIAR-KOSZTY-JEDNOSTEK-AI-2026-11-20.md` (§8), katalog runs (4× jsonl.gz, `analyze-unit-flow.cjs`, `analysis.json`, ten raport).

## 1. Miejsca znikania jednostki (plik:linia | warunek | skutek)

| Miejsce | Warunek | Skutek | Znacznik hooka |
|---|---|---|---|
| `gra/src/main.ts:43765` (+ tag 43753) | atrycja głodu: `hp<=0` po `applyArmyStarvationHpLoss` (`army-starvation.ts:75-86`) | usunięcie z `units` | `glod-armii` |
| `gra/src/main.ts:43986` (+ tag 43984) | głód oblężenia, `hp<=0` | usunięcie | `glod-oblezenie` |
| `gra/src/main.ts:44320` (+ tag 44308) | deficyt złota, `gold-deficit.ts:228-249` | usunięcie | `deficyt-zlota` |
| `gra/src/main.ts:7682` (tag 7681) | `disbandAiSupportUnit` (AI, wsparcie, nie wódz, nie w mieście własnym) | rozwiązanie, zwrot surowców | `rozwiazanie-ai` |
| `gra/src/main.ts:7978` (tag 7977) | rozwiązanie jednostki gracza (zwrot manpower/surowców) | usunięcie | `rozwiazanie-gracz` |
| `gra/src/main.ts:40080` (tag 40073) | `eliminateOwner`: wszystkie jednostki właściciela | `units.length=0` / usunięcie | `eliminacja-wlasciciela` |
| `gra/src/game/post-battle-map.ts:115-117, 194, 209, 215, 226, 666, 690` | po bitwie: poległe (`removeUnitById`), przegrana = unicestwienie armii (limit odwrotów) | usunięcie | brak (`zniknieteBezPrzyczyny`) |
| `gra/src/game/post-battle-map.ts:774` | zdobycie miasta: jednostki właściciela na hexie miasta | usunięcie | brak |
| `gra/src/main.ts:19115` | zmiana właściciela miasta: jednostki starego właściciela na hexie | usunięcie | brak |
| `gra/src/main.ts:34600, 34611` | hak pomiarowy `disbandPlayerUnits` (tylko `civTest`; gracz) | usunięcie (nie gra) | brak |
| `gra/src/main.ts:30811, 30072` | hooki testowe `removeUnit` / `killGeneral` (`civTest`) | usunięcie (nie gra) | brak |

## 2. Wyniki (surowe liczby z JSONL, owner ≠ 0, wspólni właściciele żywi w obu biegach)

- Jednostki AI t90: 4242 Niski 499 vs Normalny 315 (−36,9%); seed 7 Niski 467 vs Normalny 334 (−28,5%). t30/t60 w §8.1 dokumentu.
- Przepływ 2–90 (`noweId` / rozwiązane-AI / bez przyczyny): 4242 Niski 508/5/14, Normalny 333/14/15; seed 7 Niski 484/14/14, Normalny 357/21/14.
- Zero usunięć z przyczyną `glod-armii`, `glod-oblezenie`, `deficyt-zlota` we wszystkich biegach.
- Utrzymanie per epoka (Pieniądz/Żywność/surowce, średnia na właściciela-turę) i głód: w §8.4 dokumentu (np. epoka 2, t2–90: Normalny 56,2/55,6/39,8 i 58 tur z głodem na 4242; Niski 41,3/40,5/28,6 i 1 tura).

Mechanizm: różnica stanu (niski − normalny) w t90 to 185 (4242) i 134 (7); różnica nowych id 175 i 127 (≈95%). Główna przyczyna to mniej nowych jednostek przy Normalnym (rekrutacja), nie rozpad armii. Spadek ≥30% w t90 wystąpił na 4242 (−36,9%), na 7 wyniósł −28,5% (poniżej progu z dispatchu).

## 3. Zastrzeżenia (NIE ZMIERZONO tam, gdzie nie zmierzono)

- `noweId` to każde nowe id, nie wyłącznie rekrutacja; powód mniejszej liczby nowych jednostek (koszt ×2 vs popyt) NIE ZMIERZONO.
- Walka nie jest odróżniona od innych usunięć bez znacznika (`zniknieteBezPrzyczyny`); owner 0 w tej kategorii zawiera ruchy harnessu (`disbandPlayerUnits`), wykluczone z liczb AI.
- Wpływ głodu na HP (atrycja) nie był liczony; zero usunięć z głodu oznacza tylko brak `hp<=0` w tych biegach.
- Biegi wznawiane z zapisu slotu (Chromium SIGSEGV przy wczytaniu; powtarzane próby z kopią profilu, jeden Chromium naraz); porównanie na wspólnych właścicielach mimo rozjazdu liczby żywych między biegami.

## 4. Testy i bramki (surowe wyniki)

- `tsc --noEmit` (gra/): exit 0.
- `logic-test.cjs`: LOGIC OK (213/213); `tech-tree-test.cjs`: 20 pass, 0 fail; `research-test.cjs`: 33/0; `unit-replace-test.cjs`: 21/21; `army-hunger-combat-test.cjs`: 13 pass 0 fail; `combat-test.cjs`: 6/6.
- `ai-economy-measure-hook-test.cjs --dist <poza repo> --mutant-dist <kopia z przemianowanym polem>`: PODSUMOWANIE 32/32 zielone (w tym unitFlow: linia bazowa, rozwiązanie gracza → `rozwiazanie-gracz`=1, kontrola negatywna zero zdarzeń, mutacje czerwone).
- Bundle: `vite build --outDir /tmp/claude-0/.../scratchpad/dist-a2` (poza repo), `✓ built in 24.26s`.

## 5. Uwagi dla orkiestratora

- Worktree zawierał niezacommitowany WIP hooka i runnera z poprzedniej próby tego samego tematu; zweryfikowany (tsc, testy, mutacja) i włączony do commita.
- Runy: 4× 90 tur, każdy w kawałkach (`--stop-at` 30/50/70/90), bez run_in_background; resume z kopią profilu.

NASTĘPNY KROK: integracja orkiestratora (FC wg obiegu; Operator nie integruje).
RUNDY: 1/5 (wynik PASS-WITH-NOTES).
BLOKADY: brak blokad formalnych; NIE ZMIERZONO pozycje z §3.
DEPLOY-PUSH: NIE WYKONANO
