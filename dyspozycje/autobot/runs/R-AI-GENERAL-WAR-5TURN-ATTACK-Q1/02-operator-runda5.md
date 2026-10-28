# Raport Operatora — R-AI-GENERAL-WAR-5TURN-ATTACK-Q1 — runda 5

**Stan:** komplet dowodów Operatora dla zakresu r5; do osobnej oceny Evaluatora i Final Control. Nie jest to deklaracja gotowości do wydania.

**Baza:** `origin/main` / HEAD worktree `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`  
**Worktree/branch:** `/tmp/the-game-ai-five-turn-20261028`, `codex/R-AI-GENERAL-WAR-5TURN-ATTACK-Q1-r4`  
**Run:** R-AI-GENERAL-WAR-5TURN-ATTACK-Q1, runda 5/5.

## Wynik kryterium live

Poprzednia wada harnessu została usunięta: `ai-general-war-campaign-live-test.cjs` nie wywołuje `runCampaignPlannerTurn`. Każdy turn przechodzi przez produkcyjny `triggerPlayerEndTurn()` i czeka na zmianę `worldTurn` oraz `!endTurnInProgress()`; instrumentacja Vite tylko rejestruje komendy z rzeczywistego `decideAITurn` i wyniki produkcyjnego executora ruchu.

**Chromium live: 24 PASS / 0 FAIL, 42 s.** Mała mapa `Malenki`, seed `981042`, jeden rywal, zero city states. W testowym land-campaign fixture wszystkie heksy ustawiono na lądzie. Trzy syntetyczne jednostki testowe powstały przed pierwszym EOT; kolejka i spawn fizycznego Generała przechodzą przez rzeczywisty kod produkcyjny. Żaden testowy turn nie wywołuje planner hooka.

| Pełny EOT AI | worldTurn | Kampania po EOT | Atak | Zgrupowanie |
|---|---:|---|---:|---|
| Muster 1/5, z rekrutacją i spawnem fizycznego Generała | 1 → 2 | gathering 1/5 | 0 | 3 jednostki + fizyczny Generał na tym samym heksie |
| Muster 2/5 | 2 → 3 | gathering 2/5 | 0 | wszystkie 4 pozostają razem |
| Muster 3/5 | 3 → 4 | gathering 3/5 | 0 | wszystkie 4 pozostają razem |
| Muster 4/5 | 4 → 5 | gathering 4/5 | 0 | wszystkie 4 pozostają razem |
| Muster 5/5 | 5 → 6 | attacking 5/5 | 0 | wszystkie 4 pozostają razem |
| Atak 6/6 | 6 → 7 | attacking 5/5 | — | executor akceptuje 4/4 rozkazy, pozycje zmieniają 4/4 |

W szóstej turze wszystkie trzy jednostki oraz fizyczny Generał otrzymali rozkaz `move` na ten sam wybrany cel. Wszystkie cztery ruchy uzyskały `moved: true` z end-turn executora. Kampania przetrwała roundtrip metadanych save; test nie zgłosił błędów strony. Rzeczywisty kontrakt „pięć pełnych EOT bez ataku, szósty EOT rusza całą armię” przechodzi w tej konfiguracji.

## Testy

- `node tools/ai-general-war-campaign-live-test.cjs`: **24 PASS / 0 FAIL**, Chromium, 42 s.
- `node tools/ai-general-war-campaign-test.cjs`: **31 PASS / 0 FAIL**. Zawiera bliższy cel noPath i dalszy osiągalny lądem, wybór dalszego celu, śmierć Generała i reset rekrutacji, pokój i anulowanie kampanii, wspólny ruch 4/4 oraz jeden BFS dla zbioru celów.
- `node tools/army-consolidation-e2e-test.cjs`: **6 PASS / 0 FAIL**.
- `node tools/ai-ofensywa-wojna-epoki-test.cjs`: **7 PASS / 0 FAIL**.
- `npx tsc --noEmit --pretty false`: **exit 0**.
- `git diff --check`: **PASS**.

## Zakres i ograniczenia

Live test jawnie izoluje kampanię lądową: testowy fixture wymusza ląd na mapie. Dowód dotyczy więc wyboru najbliższego osiągalnego celu lądowego i rzeczywistego ruchu stosu w tym fixture. Nie testuje transportu morskiego ani jego priorytetu po odblokowaniu technologii; ta osobna poprawka pozostaje poza zakresem i nie jest tu deklarowana jako naprawiona. Trzy jednostki w live teście są syntetycznym składem testowym; sam Generał jest fizyczną jednostką utworzoną przez produkcyjną kolejkę rekrutacji.

Nie wykonano git add/commit/push/checkout/reset/stash, integracji ani deployu. Ostateczna akceptacja pozostaje po stronie Evaluatora i Final Control.

## SHA-256

```text
gra/tools/ai-general-war-campaign-live-test.cjs       627226c31c0e7470770021058b864e515a49ef1c1719daab532e6d993ba1bf1e
gra/tools/ai-general-war-campaign-live.vite.config.ts 1f16591c2b8948ca9dfe932150d62704e1b0d53f1c546c9ad93dc2c8861e0b27
gra/src/game/ai.ts                                    6329b51aa7caa5fae584c28e301bb71d1c0da8965817f6465adde45b7153c220
gra/src/game/ai-general-war-campaign.ts                a136283e3cd758eccba2d3ff89b8c67daa70bc344722b14970aad9abb995ecec
gra/src/main.ts                                        e14df45f263cdb62bc60fb9729f4d40a79c5458fe133c07dcf3ef7e8b8f1250c
gra/tools/ai-general-war-campaign-test.cjs            2eaeb8a02caab3fd6f1c77e19101befe766a7d8f95b31c53e3ae2c69c45663a1
dyspozycje/autobot/runs/R-AI-GENERAL-WAR-5TURN-ATTACK-Q1/00-dispatch-runda5.md
141e13fe58a044c48da5d00f6c08fb4fcd095129f89e63118e6852052485fe35
```
