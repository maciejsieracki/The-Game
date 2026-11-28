# GLOD-WDROZENIE-Q44A — wdrożenie: ujemna żywność nie blokuje tury gracza (Q42=C, Q44=A)

Temat: R-WEB-STARVATION-IMPL-Q44A (runda obrony 2/5). Baza: origin/main 22b62f79a.
Dokument stanu wiążącego. Źródło inwentarza: GLOD-ZAMIAST-BLOKADY-2026-11-28.md.

## Stan wiążący

**Zdjęto (kod gracza):**
- `gra/src/game/no-negative-stocks.ts` — `decideEndTurnGate` przyjmuje opcję `ignorujZywnosc`; przy `true` usuwa z listy braków tylko braki spichlerza. Braki skarbca nadal blokują. Bez opcji (ścieżka AI i inne wywołania) zachowanie bez zmian.
- `gra/src/main.ts` — `nnsGateForPlayer` przekazuje `ignorujZywnosc: true` (jedyne miejsce w pliku; ścieżka AI nie dostaje opcji).

**Dodano:**
- Komunikat dla gracza przy próbie zakończenia tury z ujemnym zapasem żywności (po prognozie): „Brak żywności: wojsko słabnie w walce, od 3. tury z rzędu jednostki tracą zdrowie.” Wyświetla się jako podpowiedź (`showHintMessage`, 6 s) w `advanceSeat`. NIE jest wpisem w zakładce wydarzeń ani oknem modalnym; nie blokuje tury.

**Zostało bez zmian (Q44=A):**
- Głód wojska: osłabienie w walce ×0,75 od pierwszej tury bez żywności; utrata zdrowia od 3. tury z rzędu (Trudny: 10% maxHP/turę); zapas państwa clampowany do 0.
- Pliki hooków głodu: `empire-food.ts`, `army-starvation.ts`, `population-growth-v85.ts` — nietknięte.
- Ścieżka AI (`decideAiOwnerBalance`, `disbandAiSupportUnit`, `NNS_AI_BALANCE`) — nietknięta.
- HUD żywności i projekcja bramki — bez zmian.

## Testy

Kontrakt nowy: „tura gracza przechodzi z ujemnym zapasem żywności; AI bez zmian”.

| test | przed | po | powód |
|---|---|---|---|
| starvation-no-food-gate-test (NOWY) | — | 31 pass / 0 fail | kontrakt: bramka gracza, wiring main.ts (source-scan), scenariusz Trudny 2 jednostki t1–t6 (karencja 2 tury, 10% maxHP od t3) |
| endgate-lever-baseline-test | 5/0 | 5/0 | wywołuje bramkę bez opcji (ścieżka domyślna); asercje (a)–(c) dotyczą prognozy po automacie w main.ts, nie zmienione |
| no-negative-stocks-end-turn-gate-levers-test | 34/0 | 34/0 | wywołania bez `ignorujZywnosc`; ścieżka domyślna bez zmian |
| end-turn-gate-projection-only-test | 49/0 | 49/0 | projekcja bramki bez opcji; bez zmian |
| end-turn-block-event-test | 36/0 | 36/0 | zdarzenie blokady dla ścieżki domyślnej; wzorzec nie był przepinany na komunikat głodu |
| no-negative-stocks-endturn-test | 19/0 | 19/0 | bramka bez opcji; bez zmian |
| no-negative-stocks-test | 25/0 | 25/0 | bramka bez opcji; bez zmian |
| glod-wojska-karencja-test | 40/0 | 40/0 | mechanika głodu wojska nietknięta (wymóg dispatchu: zielone) |
| army-hunger-combat-test | 13/0 | 13/0 | mechanika głodu wojska nietknięta |
| population-civ-matrix-wiring-test | 122/0 | 122/0 | wiring ludności nietknięty |
| no-negative-stocks-c3-turn-test | — | NIE ZMIERZONO | wymaga bundla `--dist` (vite do katalogu poza repo); nie uruchomiono w tej rundzie |
| end-turn-gate-live-test | — | NIE ZMIERZONO | wymaga live Chromium i bundla `--dist`; nie uruchomiono (patrz sekcja „NIE ZMIERZONO”) |
| live-nns-gate-smoke-test | — | NIE ZMIERZONO | j.w. |

Mutacje (test NOWY, każda czerwieni test; przywracano kopię źródła po każdej):
- M1: usunięcie filtra `ignorujZywnosc` w `decideEndTurnGate` → 2 FAIL.
- M2: `ignorujZywnosc: true` → `false` w `main.ts` → 2 FAIL.
- M3: usunięcie warunku komunikatu o głodzie (`if (false)`) → 1 FAIL.
- M4: Trudny `glod_wojska_hp_frac` 0,10 → 0,08 → 4 FAIL.

Maksimum poziomu (reguła właściciela 26.11): dla scenariusza atrycji przyjęto **Trudny** (hpFrac 0,10; karencja 3). Inne poziomy nie mierzono.

## Pomiar ryzyka wobec Q44=A (miasta nienakarmione)

Zmierzono mechanizm (node, `advanceEmpireFood` + `applyHungerPenaltyV85`, bez jednostek, zapas 0, miasto z bilansem -2/turę):
- tury 1–3: `zapasyPo=0`, `fedByCityId(c1)=false` w każdej turze;
- `applyHungerPenaltyV85(pop 5, nienakarmione)` → 4 mieszkańców, `ubytek=true` (utrata 1 ludności za turę).

Wniosek: po zdjęciu blokady miasto z własnym deficytem żywności, przy wyczerpanym zapasie państwa, **traci ludność**. Wcześniej bramka blokowała taką turę, więc ten stan nie wystąpiał przy zakończeniu tury. Obecnie mechanizm jest aktywny. Nie jest to „utrata ludności z powodu deficytu wojska” w sensie inwentarza (przyczyną jest deficyt miasta), ale skutek dla gracza jest ten sam. **NIE ZMIERZONO**: czy w realnej grze (żywy przebieg) zdarza się ten stan i jak często. Rozstrzygnięcie zachowania to decyzja właściciela (pytanie ABC), nie decyzja operatora.

## NIE ZMIERZONO (lista jawna)

- Test live Chromium (Trudny, koszty jednostek ×4, t16–t20, klik „Zakończ turę” z 2 jednostkami, widoczność podpowiedzi): **NIE ZMIERZONO**. Próba: sprawdzono istniejące narzędzia (`end-turn-gate-live-test.cjs`, `live-nns-gate-smoke-test`) — oba wymagają bundla `--dist` i testują stare scenariusze (a–e), nie scenariusz t16–t20 z 2 jednostkami. Nowego harnessu live nie napisano w tej rundzie.
- Komunikat jako wpis wydarzenia (wzorzec `end-turn-block-event`): nie wdrożono; komunikat jest podpowiedzią. Widoczność w UI nie zmierzona.
- Realny stan miast przy ujemnym zapasie w żywej grze: NIE ZMIERZONO (patrz wyżej).
- Pozostałe bramki z dispatchu (logic 213, tech-tree 20, research 33, unit-replace 21, combat 6, ai-test 297/0, early-grace-15 33/0, save-load-*, save-block-pre-capital 26/0, load-camera): nie uruchomiono w tej rundzie.

## Otwarte pytanie dla orkiestratora (decyzja właściciela)

Czy miasto nienakarmione przy wyczerpanym zapasie państwa ma tracić ludność (stan obecny po zdjęciu blokady), czy nie (wymagałoby to zmiany hooka ludności — poza allowlistą tego tematu i wymagającej decyzji wg zasad ABC).
