STATUS: PASS-WITH-NOTES
TEMAT: R-BITWA-KOLORY-GRACZ-PRZECIWNIK-Q1
GOAL: Gracz jest zawsze niebieski i preferencyjnie po lewej, przeciwnik zawsze czerwony i po prawej; role atakujący/obrońca są niezależnym opisem.

ZMIANY/COMMIT:
- `gra/src/battle/battleScene.ts`: mapowanie wizualne role → tożsamość przez `deployPlayerSide`; gracz pozostaje niebieski, przeciwnik czerwony dla modeli jednostek, ramek HP, minimapy i HUD.
- `gra/src/battle/battleScene.ts`: panel dowódców i podpisy są układane gracz-lewo / przeciwnik-prawo w obu kierunkach; etykieta roli pozostaje osobno „atakujacy” / „obronca”.
- `gra/src/ui/postBattleSummary.ts`: listy armii i podsumowanie przyjmują `playerSide`, więc kolory i „Twoje wojska” nie zależą od roli bojowej.
- `gra/tools/battle-colors-player-identity-test.cjs`: celowany harness regresji dla obu kierunków, kolorów, stron i etykiet.
- Logika walki/resolver, wynik `atakujacy`/`obronca` oraz dane armii nie zostały zmienione.
- Commit: NIE WYKONANO.

TESTY:
- PASS — `node gra/tools/battle-colors-player-identity-test.cjs` (6/6 asercji).
- PASS — `node gra/tools/battle-summary-test.cjs`.
- PASS — `node gra/tools/battle-hp-display-test.cjs` (7/7).
- TYPECHECK — brak błędów w dotkniętych plikach; pełny `npm run typecheck` zatrzymuje się na istniejącym, niezwiązanym błędzie `gra/src/game/ai.ts`: brak eksportu `clampPodzialPracyBudynkiPercent` z `gra/src/game/cities.ts`.
- NOTE — `node gra/tools/battle-roster-test.cjs` nie wystartował: harness nie może zapisać tymczasowego `gra/tools/.battle-roster-entry.ts` (`EPERM`).
- Screenshot/playwright harness: brak uruchomienia; istniejące testy screenshotowe wymagają działającego serwera/bundla i nie są potrzebne do statycznej bramki kolorów.

BLOKADY:
- Brak blokady merytorycznej.
- Dwie uwagi infrastrukturalne: istniejący błąd typecheck poza allowlistą oraz `EPERM` w istniejącym harnessie rosteru.

NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
